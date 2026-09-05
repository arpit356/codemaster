import httpx
import asyncio
import tempfile
import sys
import os
import time
from typing import List, Dict, Any, Tuple
from app.config import settings

LANGUAGE_MAP = {
    "python": {"language": "python", "version": "3.10.0", "filename": "solution.py"},
    "java": {"language": "java", "version": "15.0.2", "filename": "Main.java"},
    "cpp": {"language": "c++", "version": "10.2.0", "filename": "main.cpp"},
    "c": {"language": "c", "version": "10.2.0", "filename": "main.c"},
}

def normalize_output(text: str) -> str:
    """Strip trailing spaces and standardise line endings."""
    if not text:
        return ""
    return "\n".join(line.rstrip() for line in text.strip().splitlines())

class CodeExecutor:
    @staticmethod
    async def execute_piston(
        code: str,
        language: str,
        stdin: str = "",
        timeout: float = 8.0
    ) -> Dict[str, Any]:
        """Executes code via the remote Piston Sandbox API."""
        lang_config = LANGUAGE_MAP.get(language.lower(), LANGUAGE_MAP["python"])
        payload = {
            "language": lang_config["language"],
            "version": lang_config["version"],
            "files": [{"name": lang_config["filename"], "content": code}],
            "stdin": stdin,
            "run_timeout": 5000,  # 5 seconds in ms
            "compile_timeout": 8000,
        }

        start_time = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(f"{settings.PISTON_API_URL}/execute", json=payload)
                elapsed_ms = (time.perf_counter() - start_time) * 1000

                if response.status_code == 200:
                    data = response.json()
                    run_result = data.get("run", {})
                    compile_result = data.get("compile", {})

                    # Check for compilation errors
                    if compile_result and compile_result.get("code", 0) != 0:
                        return {
                            "status": "Compile Error",
                            "stdout": "",
                            "stderr": compile_result.get("stderr") or compile_result.get("output", ""),
                            "runtime_ms": round(elapsed_ms, 2),
                            "memory_kb": 0.0,
                            "exit_code": compile_result.get("code", 1),
                        }

                    exit_code = run_result.get("code", 0)
                    stdout = run_result.get("stdout", "")
                    stderr = run_result.get("stderr", "")

                    if run_result.get("signal") == "SIGKILL" or "Time Limit Exceeded" in stderr:
                        status = "Time Limit Exceeded"
                    elif exit_code != 0:
                        status = "Runtime Error"
                    else:
                        status = "Success"

                    return {
                        "status": status,
                        "stdout": stdout,
                        "stderr": stderr,
                        "runtime_ms": round(elapsed_ms, 2),
                        "memory_kb": 256.0,  # Estimated baseline
                        "exit_code": exit_code,
                    }
                else:
                    # Fallback to local python executor if language is python
                    if language.lower() == "python":
                        return await CodeExecutor.execute_local_python(code, stdin)
                    return {
                        "status": "API Error",
                        "stdout": "",
                        "stderr": f"Piston service returned status {response.status_code}. Untrusted remote execution unavailable.",
                        "runtime_ms": round(elapsed_ms, 2),
                        "memory_kb": 0.0,
                        "exit_code": 1,
                    }
        except Exception as e:
            # Fallback to local python executor if language is python
            if language.lower() == "python":
                return await CodeExecutor.execute_local_python(code, stdin)
            return {
                "status": "Execution Error",
                "stdout": "",
                "stderr": f"Error contacting execution sandbox: {str(e)}",
                "runtime_ms": 0.0,
                "memory_kb": 0.0,
                "exit_code": 1,
            }

    @staticmethod
    async def execute_local_python(code: str, stdin: str = "") -> Dict[str, Any]:
        """Local isolated subprocess fallback for Python execution with timeout."""
        with tempfile.TemporaryDirectory() as tmpdir:
            file_path = os.path.join(tmpdir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)

            start_time = time.perf_counter()
            try:
                proc = await asyncio.create_subprocess_exec(
                    sys.executable,
                    file_path,
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=tmpdir,
                )
                stdout_b, stderr_b = await asyncio.wait_for(
                    proc.communicate(input=stdin.encode("utf-8")),
                    timeout=5.0
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                stdout = stdout_b.decode("utf-8", errors="replace")
                stderr = stderr_b.decode("utf-8", errors="replace")

                status = "Success" if proc.returncode == 0 else "Runtime Error"
                return {
                    "status": status,
                    "stdout": stdout,
                    "stderr": stderr,
                    "runtime_ms": round(elapsed_ms, 2),
                    "memory_kb": 512.0,
                    "exit_code": proc.returncode or 0,
                }
            except asyncio.TimeoutError:
                return {
                    "status": "Time Limit Exceeded",
                    "stdout": "",
                    "stderr": "Execution timed out (limit: 5.0 seconds).",
                    "runtime_ms": 5000.0,
                    "memory_kb": 0.0,
                    "exit_code": 124,
                }
            except Exception as e:
                return {
                    "status": "Error",
                    "stdout": "",
                    "stderr": str(e),
                    "runtime_ms": 0.0,
                    "memory_kb": 0.0,
                    "exit_code": 1,
                }

    @classmethod
    async def run_test_cases(
        cls,
        code: str,
        language: str,
        test_cases: List[Dict[str, Any]],
        stop_on_first_failure: bool = False
    ) -> Tuple[str, List[Dict[str, Any]], float, float]:
        """
        Runs code against multiple test cases.
        Returns overall status, list of per-test results, max runtime_ms, and avg memory_kb.
        """
        results = []
        overall_status = "Accepted"
        total_runtime = 0.0
        max_runtime = 0.0

        for idx, tc in enumerate(test_cases):
            tc_input = str(tc.get("input", ""))
            tc_expected = normalize_output(str(tc.get("expected_output", "")))

            exec_result = await cls.execute_piston(code, language, stdin=tc_input)
            actual_output = normalize_output(exec_result["stdout"])
            run_ms = exec_result["runtime_ms"]
            max_runtime = max(max_runtime, run_ms)
            total_runtime += run_ms

            passed = False
            status = exec_result["status"]

            if status == "Success":
                if actual_output == tc_expected:
                    passed = True
                    status = "Accepted"
                else:
                    passed = False
                    status = "Wrong Answer"
                    if overall_status == "Accepted":
                        overall_status = "Wrong Answer"
            else:
                passed = False
                if overall_status == "Accepted":
                    overall_status = status

            results.append({
                "test_case_index": idx + 1,
                "input": tc_input if not tc.get("is_hidden") else "[Hidden Test Case]",
                "expected_output": tc_expected if not tc.get("is_hidden") else "[Hidden]",
                "actual_output": actual_output if not tc.get("is_hidden") else ("[Hidden]" if passed else actual_output[:100]),
                "passed": passed,
                "status": status,
                "runtime_ms": run_ms,
                "error_message": exec_result.get("stderr") if not passed else None,
            })

            if not passed and stop_on_first_failure:
                break

        return overall_status, results, round(max_runtime, 2), 256.0
