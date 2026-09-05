"""
code_analysis_service.py
────────────────────────
Two-tier real-time code analysis engine for CodeMentor AI.

Tier 1  – LocalSyntaxAnalyzer  (pure Python, zero latency)
           Runs bracket balance, keyword checks, style rules, etc.

Tier 2  – AIAnalysisService    (Gemini API, called after 1.5s debounce)
           Full scoring, mentor tips, personalized recommendations.

ScoringEngine combines both tiers into a single SkillScores object.
"""

import re
import math
import logging
from typing import Dict, List, Any, Optional, Tuple

from app.config import settings

logger = logging.getLogger("codementor.analysis")

# ─────────────────────────────────────────────────────────────────────────────
# Language Profiles
# ─────────────────────────────────────────────────────────────────────────────

LANGUAGE_PROFILES: Dict[str, Dict[str, Any]] = {
    "python": {
        "needs_semicolons": False,
        "needs_braces":     False,
        "keywords":         ["def", "class", "if", "else", "elif", "for", "while", "return",
                             "import", "from", "try", "except", "with", "lambda", "yield",
                             "pass", "break", "continue", "in", "not", "and", "or", "True",
                             "False", "None", "print", "len", "range"],
        "comment_prefix":   "#",
        "indent_char":      "    ",   # 4 spaces
        "file_ext":         ".py",
    },
    "java": {
        "needs_semicolons": True,
        "needs_braces":     True,
        "keywords":         ["public", "private", "protected", "class", "interface", "extends",
                             "implements", "static", "void", "int", "long", "double", "boolean",
                             "String", "new", "return", "if", "else", "for", "while", "do",
                             "switch", "case", "break", "continue", "try", "catch", "finally",
                             "throw", "throws", "import", "package", "null", "true", "false"],
        "comment_prefix":   "//",
        "indent_char":      "    ",
        "file_ext":         ".java",
    },
    "cpp": {
        "needs_semicolons": True,
        "needs_braces":     True,
        "keywords":         ["int", "double", "float", "char", "bool", "void", "long", "short",
                             "unsigned", "signed", "const", "static", "inline", "struct", "class",
                             "return", "if", "else", "for", "while", "do", "switch", "case",
                             "break", "continue", "include", "using", "namespace", "std", "cout",
                             "cin", "endl", "vector", "string", "auto", "nullptr", "true", "false"],
        "comment_prefix":   "//",
        "indent_char":      "    ",
        "file_ext":         ".cpp",
    },
    "c": {
        "needs_semicolons": True,
        "needs_braces":     True,
        "keywords":         ["int", "double", "float", "char", "void", "long", "short", "unsigned",
                             "signed", "const", "static", "struct", "return", "if", "else", "for",
                             "while", "do", "switch", "case", "break", "continue", "include",
                             "printf", "scanf", "malloc", "free", "NULL", "sizeof"],
        "comment_prefix":   "//",
        "indent_char":      "    ",
        "file_ext":         ".c",
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Mistake dataclass
# ─────────────────────────────────────────────────────────────────────────────

class AnalysisMistake:
    def __init__(
        self,
        category: str,
        message: str,
        explanation: str,
        line_number: Optional[int] = None,
        severity: str = "warning",
    ):
        self.category = category        # syntax | logical | runtime | style | structure
        self.message = message
        self.explanation = explanation
        self.line_number = line_number
        self.severity = severity        # error | warning | info
        self.frequency = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category":    self.category,
            "message":     self.message,
            "explanation": self.explanation,
            "line_number": self.line_number,
            "severity":    self.severity,
            "frequency":   self.frequency,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Local Syntax Analyzer  (Tier-1, instant, no API)
# ─────────────────────────────────────────────────────────────────────────────

class LocalSyntaxAnalyzer:
    """
    Performs fast, regex-based static analysis for a given language.
    Returns a list of AnalysisMistake objects and a raw syntax score (0-100).
    """

    def analyze(
        self,
        code: str,
        language: str,
    ) -> Tuple[List[AnalysisMistake], float]:
        if not code or not code.strip():
            return [], 100.0

        profile = LANGUAGE_PROFILES.get(language, LANGUAGE_PROFILES["python"])
        mistakes: List[AnalysisMistake] = []
        lines = code.split("\n")
        penalty = 0

        # 1. Bracket balance check
        bracket_mistakes = self._check_brackets(code)
        mistakes.extend(bracket_mistakes)
        penalty += len(bracket_mistakes) * 12

        # 2. Semicolons (Java / C / C++ only)
        if profile["needs_semicolons"]:
            semi_mistakes = self._check_semicolons(lines, language)
            mistakes.extend(semi_mistakes)
            penalty += len(semi_mistakes) * 8

        # 3. Python indentation
        if language == "python":
            indent_mistakes = self._check_python_indentation(lines)
            mistakes.extend(indent_mistakes)
            penalty += len(indent_mistakes) * 6

        # 4. Empty function / class bodies
        body_mistakes = self._check_empty_bodies(lines, language)
        mistakes.extend(body_mistakes)
        penalty += len(body_mistakes) * 5

        # 5. Style: very long lines
        long_line_mistakes = self._check_long_lines(lines)
        mistakes.extend(long_line_mistakes)
        penalty += len(long_line_mistakes) * 3

        # 6. Dead code: unreachable after return
        dead_mistakes = self._check_dead_code(lines, language)
        mistakes.extend(dead_mistakes)
        penalty += len(dead_mistakes) * 4

        # 7. Unused variable heuristic (basic)
        unused_mistakes = self._check_unused_variables(code, language)
        mistakes.extend(unused_mistakes)
        penalty += len(unused_mistakes) * 3

        syntax_score = max(0.0, 100.0 - penalty)
        return mistakes, syntax_score

    # ── internal checkers ────────────────────────────────────────────────────

    def _check_brackets(self, code: str) -> List[AnalysisMistake]:
        mistakes = []
        stack = []
        pair = {")": "(", "]": "[", "}": "{"}
        open_set = set("([{")
        close_set = set(")]}")
        in_string = False
        string_char = ""
        line_num = 1

        for ch in code:
            if ch == "\n":
                line_num += 1
                continue
            if in_string:
                if ch == string_char:
                    in_string = False
                continue
            if ch in ('"', "'"):
                in_string = True
                string_char = ch
                continue
            if ch in open_set:
                stack.append((ch, line_num))
            elif ch in close_set:
                if not stack or stack[-1][0] != pair[ch]:
                    mistakes.append(AnalysisMistake(
                        category="syntax",
                        message=f"Unmatched closing bracket '{ch}'",
                        explanation=(
                            f"Found a closing '{ch}' on line {line_num} that doesn't match "
                            f"any opening bracket. Check your bracket pairs carefully."
                        ),
                        line_number=line_num,
                        severity="error",
                    ))
                else:
                    stack.pop()

        for (ch, ln) in stack:
            mistakes.append(AnalysisMistake(
                category="syntax",
                message=f"Unclosed opening bracket '{ch}'",
                explanation=(
                    f"An opening '{ch}' on line {ln} was never closed. "
                    f"Every opening bracket must have a matching closing bracket."
                ),
                line_number=ln,
                severity="error",
            ))
        return mistakes

    def _check_semicolons(self, lines: List[str], language: str) -> List[AnalysisMistake]:
        """Checks for missing semicolons at end of statements (Java/C/C++)."""
        mistakes = []
        # Lines that should end with semicolons — NOT control flow, NOT comments, NOT opening braces
        skip_patterns = re.compile(
            r"^\s*(//|/\*|\*|if\b|else\b|for\b|while\b|do\b|class\b|"
            r"public\b|private\b|protected\b|#|namespace\b|switch\b|try\b|"
            r"catch\b|finally\b|}\s*$|{\s*$|$)"
        )
        stmt_pattern = re.compile(r"[^;{}]\s*$")

        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or skip_patterns.match(stripped):
                continue
            # If line has content, doesn't end with ; { } and isn't a comment
            if stmt_pattern.search(stripped) and not stripped.startswith("//"):
                # Heuristic: only flag lines that look like statements
                if re.search(r'[a-zA-Z0-9_\)\]"\']\s*$', stripped):
                    if not stripped.endswith(("{", "}", "\\", ",")):
                        mistakes.append(AnalysisMistake(
                            category="syntax",
                            message="Possible missing semicolon",
                            explanation=(
                                f"Line {i} looks like a statement but doesn't end with a semicolon. "
                                f"In {language.upper()}, most statements must end with ';'."
                            ),
                            line_number=i,
                            severity="warning",
                        ))
        return mistakes[:4]   # cap at 4 to avoid noise

    def _check_python_indentation(self, lines: List[str]) -> List[AnalysisMistake]:
        mistakes = []
        for i, line in enumerate(lines[1:], 2):
            if line and line[0] == "\t":
                mistakes.append(AnalysisMistake(
                    category="style",
                    message="Tab character used for indentation",
                    explanation=(
                        f"Line {i} uses a tab (\\t) for indentation. Python PEP-8 recommends "
                        f"4 spaces instead of tabs. Mix of tabs and spaces causes IndentationError."
                    ),
                    line_number=i,
                    severity="warning",
                ))
        return mistakes[:2]

    def _check_empty_bodies(self, lines: List[str], language: str) -> List[AnalysisMistake]:
        mistakes = []
        for i in range(len(lines) - 1):
            stripped = lines[i].strip()
            next_stripped = lines[i + 1].strip() if i + 1 < len(lines) else ""
            # Python: def/class with next line being empty or just pass
            if language == "python":
                if re.match(r"^def\s+\w+.*:", stripped):
                    if not next_stripped or next_stripped == "pass":
                        mistakes.append(AnalysisMistake(
                            category="structure",
                            message="Function body appears empty",
                            explanation=(
                                f"The function defined on line {i+1} has an empty body. "
                                f"Add your logic or a 'pass' placeholder with a TODO comment."
                            ),
                            line_number=i + 1,
                            severity="info",
                        ))
        return mistakes[:2]

    def _check_long_lines(self, lines: List[str]) -> List[AnalysisMistake]:
        mistakes = []
        for i, line in enumerate(lines, 1):
            if len(line) > 120:
                mistakes.append(AnalysisMistake(
                    category="style",
                    message=f"Line {i} is very long ({len(line)} chars)",
                    explanation=(
                        f"Line {i} has {len(line)} characters, which exceeds the 120-character limit. "
                        f"Long lines reduce readability. Consider breaking it into multiple lines."
                    ),
                    line_number=i,
                    severity="info",
                ))
        return mistakes[:2]

    def _check_dead_code(self, lines: List[str], language: str) -> List[AnalysisMistake]:
        mistakes = []
        prev_return = False
        indent_of_return = 0
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            indent = len(line) - len(line.lstrip())
            if prev_return and stripped and indent >= indent_of_return and not stripped.startswith(("}", "#", "//")):
                mistakes.append(AnalysisMistake(
                    category="logical",
                    message="Unreachable code detected",
                    explanation=(
                        f"Line {i} appears to be unreachable because a 'return' statement was "
                        f"already encountered at the same or outer indentation level. "
                        f"This code will never execute."
                    ),
                    line_number=i,
                    severity="warning",
                ))
                prev_return = False
            if re.match(r"^\s*return\b", line):
                prev_return = True
                indent_of_return = indent
            elif stripped and indent < indent_of_return:
                prev_return = False
        return mistakes[:2]

    def _check_unused_variables(self, code: str, language: str) -> List[AnalysisMistake]:
        """Basic heuristic: variables assigned but never used again."""
        mistakes = []
        if language == "python":
            assignments = re.findall(r"^\s*([a-z_][a-zA-Z0-9_]*)\s*=\s*", code, re.MULTILINE)
            for var in set(assignments):
                uses = len(re.findall(r"\b" + re.escape(var) + r"\b", code))
                if uses == 1:  # only the assignment itself
                    mistakes.append(AnalysisMistake(
                        category="style",
                        message=f"Variable '{var}' assigned but never used",
                        explanation=(
                            f"You assigned a value to '{var}' but never used it. "
                            f"Removing unused variables keeps your code clean and readable."
                        ),
                        severity="info",
                    ))
        return mistakes[:2]


# ─────────────────────────────────────────────────────────────────────────────
# Scoring Engine
# ─────────────────────────────────────────────────────────────────────────────

class ScoringEngine:
    """
    Computes weighted skill scores from code metrics.

    Weights:
        Syntax Proficiency  : 25%
        Code Quality        : 20%
        Problem-Solving     : 30%
        Code Efficiency     : 15%
        Consistency         : 10%
    """

    WEIGHTS = {
        "syntax":           0.25,
        "quality":          0.20,
        "problem_solving":  0.30,
        "efficiency":       0.15,
        "consistency":      0.10,
    }

    LEVEL_THRESHOLDS = [
        (85, "Expert"),
        (70, "Advanced"),
        (50, "Intermediate"),
        (0,  "Beginner"),
    ]

    @staticmethod
    def _code_quality_score(code: str, language: str) -> float:
        """Heuristic quality score based on naming, comments, structure."""
        if not code.strip():
            return 50.0

        score = 80.0
        lines = code.split("\n")
        non_empty = [l for l in lines if l.strip()]

        # Reward comments
        profile = LANGUAGE_PROFILES.get(language, LANGUAGE_PROFILES["python"])
        comment_lines = sum(1 for l in non_empty if l.strip().startswith(profile["comment_prefix"]))
        comment_ratio = comment_lines / max(len(non_empty), 1)
        score += min(comment_ratio * 30, 10)   # up to +10 for comments

        # Penalize single-letter variables (except common loop vars)
        bad_names = re.findall(r"\b([a-zA-Z])\s*=", code)
        bad_names = [n for n in bad_names if n not in ("i", "j", "k", "n", "m", "x", "y")]
        score -= min(len(bad_names) * 3, 15)

        # Reward function/class definitions (modular code)
        funcs = len(re.findall(r"(def |function |void |int |class )\s+\w+", code))
        score += min(funcs * 3, 12)

        # Penalize print/debug statements left in
        debug_count = len(re.findall(r"print\s*\(|console\.log\s*\(|System\.out\.print", code))
        score -= min(debug_count * 2, 8)

        return max(0.0, min(100.0, score))

    @staticmethod
    def _efficiency_score(code: str, language: str) -> float:
        """Estimates code efficiency based on complexity heuristics."""
        if not code.strip():
            return 60.0

        score = 75.0
        lines = code.split("\n")

        # Nested loops penalty
        nesting = 0
        max_nesting = 0
        for line in lines:
            stripped = line.strip()
            if re.match(r"(for|while)\b", stripped):
                nesting += 1
                max_nesting = max(max_nesting, nesting)
            elif stripped == "}" or (language == "python" and stripped == ""):
                nesting = max(0, nesting - 1)

        if max_nesting >= 3:
            score -= 20  # O(n³) or worse
        elif max_nesting == 2:
            score -= 8   # O(n²)

        # Global variable penalty
        globals_count = len(re.findall(r"^[a-zA-Z_]\w*\s*=", code, re.MULTILINE))
        score -= min(globals_count * 2, 10)

        # Reward early return / guard clause patterns
        early_returns = len(re.findall(r"^\s*if\s+.*:\s*$", code, re.MULTILINE))
        score += min(early_returns * 2, 8)

        return max(0.0, min(100.0, score))

    @staticmethod
    def _problem_solving_score(
        code: str,
        language: str,
        has_problem_context: bool,
    ) -> float:
        """
        Estimates problem-solving score from code structure.
        Without problem context (playground), uses structural heuristics.
        """
        if not code.strip():
            return 50.0

        score = 65.0
        lines = [l for l in code.split("\n") if l.strip()]

        # Code volume (more non-trivial code → more structured thought)
        loc = len(lines)
        if loc > 5:
            score += min((loc - 5) * 1.5, 20)

        # Has explicit algorithm patterns
        algo_patterns = [
            r"two[\s_]pointer", r"binary[\s_]search", r"dynamic[\s_]programming",
            r"memoization", r"recursion", r"bfs|dfs", r"hash[\s_]map", r"sort\(",
            r"heapq|priority_queue", r"stack|queue|deque",
        ]
        for pat in algo_patterns:
            if re.search(pat, code, re.IGNORECASE):
                score += 4

        score = min(score, 95.0)

        # If no problem context, cap at 75 (can't verify correctness)
        if not has_problem_context:
            score = min(score, 75.0)

        return max(0.0, score)

    @classmethod
    def compute(
        cls,
        syntax_score: float,
        code: str,
        language: str,
        has_problem_context: bool,
        previous_scores: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        quality   = cls._code_quality_score(code, language)
        efficiency = cls._efficiency_score(code, language)
        ps        = cls._problem_solving_score(code, language, has_problem_context)

        # Consistency (improvement trend)
        consistency = 65.0
        if previous_scores:
            prev_overall = previous_scores.get("overall", 65.0)
            current_avg = (syntax_score + quality + ps + efficiency) / 4
            delta = current_avg - prev_overall
            consistency = max(40.0, min(100.0, 65.0 + delta * 2))

        overall = (
            syntax_score * cls.WEIGHTS["syntax"] +
            quality      * cls.WEIGHTS["quality"] +
            ps           * cls.WEIGHTS["problem_solving"] +
            efficiency   * cls.WEIGHTS["efficiency"] +
            consistency  * cls.WEIGHTS["consistency"]
        )
        overall = round(min(100.0, max(0.0, overall)), 1)

        coding_level = "Beginner"
        for threshold, lvl in cls.LEVEL_THRESHOLDS:
            if overall >= threshold:
                coding_level = lvl
                break

        return {
            "overall":         overall,
            "syntax":          round(syntax_score, 1),
            "quality":         round(quality, 1),
            "problem_solving": round(ps, 1),
            "efficiency":      round(efficiency, 1),
            "consistency":     round(consistency, 1),
            "coding_level":    coding_level,
        }


# ─────────────────────────────────────────────────────────────────────────────
# AI Analysis Service  (Tier-2, Gemini)
# ─────────────────────────────────────────────────────────────────────────────

def _is_ai_available() -> bool:
    key = settings.GEMINI_API_KEY.strip().strip("'\"")
    return bool(key and len(key) >= 20 and not key.startswith("YOUR_"))


def _call_ai(prompt: str) -> Optional[str]:
    try:
        from app.services.ai_service import call_gemini_api
        return call_gemini_api(prompt, as_json=True)
    except Exception as e:
        logger.warning(f"AI analysis call failed: {e}")
        return None


async def analyze_code_with_ai(
    code: str,
    language: str,
    local_mistakes: List[AnalysisMistake],
    scores: Dict[str, Any],
    problem_title: Optional[str],
    problem_topic: Optional[str],
) -> Dict[str, Any]:
    """
    Calls Gemini to produce mentor tips, recommendations, and analysis summary.
    Returns a dict with keys: ai_tips, recommendations, analysis_summary.
    Falls back to rule-based output if AI unavailable.
    """

    fallback = _build_fallback_ai_response(scores, local_mistakes, language)

    if not _is_ai_available() or len(code.strip()) < 20:
        return fallback

    problem_ctx = (
        f"Problem: '{problem_title}' (Topic: {problem_topic})"
        if problem_title else "Mode: Free Playground (no specific problem)"
    )

    mistake_summary = "\n".join(
        f"- [{m.category.upper()}] {m.message}" for m in local_mistakes[:5]
    ) or "No local syntax issues detected."

    prompt = f"""You are an expert coding mentor AI for a platform called CodeMentor AI.
Analyze this {language.upper()} code snippet and return JSON only.

{problem_ctx}
Current Scores: Overall={scores['overall']}/100, Syntax={scores['syntax']}/100, Quality={scores['quality']}/100

Code:
```{language}
{code[:1500]}
```

Local analysis found these issues:
{mistake_summary}

Return a JSON object with exactly these keys:
{{
  "ai_tips": [
    {{"title": "short tip title", "body": "1-2 sentence helpful explanation", "type": "improvement|warning|praise|recommendation"}},
    ...up to 3 tips
  ],
  "recommendations": [
    "short actionable recommendation string",
    ...up to 4 items
  ],
  "analysis_summary": "One sentence natural language assessment of the user's current code quality and skill."
}}

Rules:
- Act as a mentor, not a solution provider. Give hints, not answers.
- Be encouraging but honest.
- Adapt to the language ({language}).
- Keep each tip body under 80 words.
- Keep analysis_summary under 25 words.
"""

    raw = _call_ai(prompt)
    if not raw:
        return fallback

    try:
        import json
        import re
        # Extract JSON from response
        match = re.search(r"\{[\s\S]*\}", raw)
        if not match:
            return fallback
        data = json.loads(match.group())
        return {
            "ai_tips":          data.get("ai_tips", fallback["ai_tips"]),
            "recommendations":  data.get("recommendations", fallback["recommendations"]),
            "analysis_summary": data.get("analysis_summary", fallback["analysis_summary"]),
        }
    except Exception as e:
        logger.warning(f"Failed to parse AI analysis response: {e}")
        return fallback


def _build_fallback_ai_response(
    scores: Dict[str, Any],
    mistakes: List[AnalysisMistake],
    language: str,
) -> Dict[str, Any]:
    """Rule-based fallback tips when AI is unavailable."""
    tips = []
    recs = []

    overall = scores.get("overall", 60)
    syntax  = scores.get("syntax", 60)
    quality = scores.get("quality", 60)

    if overall >= 80:
        tips.append({
            "title": "Great code structure!",
            "body": "Your code shows solid organization. Consider adding edge case handling to make it production-ready.",
            "type": "praise",
        })
    elif overall >= 60:
        tips.append({
            "title": "Making good progress",
            "body": "Your approach is on the right track. Focus on cleaning up any syntax warnings to improve your score.",
            "type": "improvement",
        })
    else:
        tips.append({
            "title": "Keep practicing!",
            "body": "Every expert was once a beginner. Focus on getting the basic syntax right first, then work on logic.",
            "type": "recommendation",
        })

    if syntax < 70:
        recs.append(f"Review {language.upper()} syntax fundamentals — check bracket matching and statement endings")

    if quality < 65:
        recs.append("Add descriptive variable names and comments to improve code readability")

    if scores.get("efficiency", 60) < 65:
        recs.append("Look for opportunities to reduce nested loops and optimize time complexity")

    recs.append("Practice 2-3 problems in your weakest topic area today")

    # Error-specific tips
    syntax_errors = [m for m in mistakes if m.severity == "error"]
    if syntax_errors:
        tips.append({
            "title": f"Fix syntax error: {syntax_errors[0].message}",
            "body": syntax_errors[0].explanation,
            "type": "warning",
        })

    level = scores.get("coding_level", "Beginner")
    summary_map = {
        "Expert":       "Excellent code quality — you're writing at an expert level.",
        "Advanced":     "Strong code structure with minor areas for improvement.",
        "Intermediate": "Good progress — refine your syntax and code organization.",
        "Beginner":     "Keep going! Focus on syntax accuracy and clear code structure.",
    }

    return {
        "ai_tips":          tips[:3],
        "recommendations":  recs[:4],
        "analysis_summary": summary_map.get(level, "Analyzing your code..."),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────────────────────────────────────

async def perform_realtime_analysis(
    code: str,
    language: str,
    session_id: str,
    problem_id: Optional[int] = None,
    problem_title: Optional[str] = None,
    problem_topic: Optional[str] = None,
    previous_scores: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Full analysis pipeline. Called by the router.
    Returns a dict matching CodeAnalysisResponse schema.
    """

    if not code or len(code.strip()) < 5:
        empty_scores = {"overall": 0, "syntax": 0, "quality": 0,
                        "problem_solving": 0, "efficiency": 0, "coding_level": "Beginner"}
        return {
            "session_id":       session_id,
            "scores":           empty_scores,
            "mistakes":         [],
            "ai_tips":          [],
            "recommendations":  ["Start writing code to see live analysis!"],
            "analysis_summary": "Waiting for code input...",
            "is_empty":         True,
        }

    lang = language.lower()
    if lang not in LANGUAGE_PROFILES:
        lang = "python"

    # Tier 1: Local analysis (instant)
    analyzer = LocalSyntaxAnalyzer()
    local_mistakes, syntax_score = analyzer.analyze(code, lang)

    # Scoring engine
    has_problem = problem_id is not None or problem_title is not None
    scores = ScoringEngine.compute(
        syntax_score=syntax_score,
        code=code,
        language=lang,
        has_problem_context=has_problem,
        previous_scores=previous_scores,
    )

    # Tier 2: AI analysis
    ai_result = await analyze_code_with_ai(
        code=code,
        language=lang,
        local_mistakes=local_mistakes,
        scores=scores,
        problem_title=problem_title,
        problem_topic=problem_topic,
    )

    return {
        "session_id":       session_id,
        "scores":           scores,
        "mistakes":         [m.to_dict() for m in local_mistakes],
        "ai_tips":          ai_result["ai_tips"],
        "recommendations":  ai_result["recommendations"],
        "analysis_summary": ai_result["analysis_summary"],
        "is_empty":         False,
    }
