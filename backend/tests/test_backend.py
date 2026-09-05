import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base, AsyncSessionLocal
from app.seed_data import seed_database

@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        await seed_database(db)
    yield

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "CodeMentor AI"
    assert data["status"] == "online"

@pytest.mark.asyncio
async def test_demo_login_and_problems():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test Demo User Login
        login_res = await ac.post("/api/v1/auth/demo-login", json={"role": "user"})
        assert login_res.status_code == 200
        token_data = login_res.json()
        assert "access_token" in token_data
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Test Get Problems List
        prob_res = await ac.get("/api/v1/problems", headers=headers)
        assert prob_res.status_code == 200
        problems = prob_res.json()
        assert len(problems) >= 10

        # 3. Test Get Problem Details
        two_sum_res = await ac.get("/api/v1/problems/two-sum", headers=headers)
        assert two_sum_res.status_code == 200
        ts_data = two_sum_res.json()
        assert ts_data["title"] == "Two Sum"
        assert len(ts_data["test_cases"]) > 0

        # 4. Test Skill Assessment
        assess_res = await ac.get("/api/v1/assessment/overview", headers=headers)
        assert assess_res.status_code == 200
        overview = assess_res.json()
        assert "overall_score" in overview
        assert len(overview["topic_scores"]) == 9

        # 5. Test Personalized Roadmap
        roadmap_res = await ac.get("/api/v1/assessment/roadmap", headers=headers)
        assert roadmap_res.status_code == 200
        roadmap = roadmap_res.json()
        assert "nodes" in roadmap
        assert len(roadmap["nodes"]) > 0

        # 6. Test Mentor Chat
        chat_res = await ac.post(
            "/api/v1/mentor/chat",
            headers=headers,
            json={"message": "Explain how Two Sum works with a Hash Map", "problem_context": "Two Sum"}
        )
        assert chat_res.status_code == 200
        chat_data = chat_res.json()
        assert "reply" in chat_data
        assert len(chat_data["reply"]) > 20

@pytest.mark.asyncio
async def test_code_execution_and_submission():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Login demo user
        login_res = await ac.post("/api/v1/auth/demo-login", json={"role": "user"})
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch problem Two Sum
        two_sum_res = await ac.get("/api/v1/problems/two-sum", headers=headers)
        prob_id = two_sum_res.json()["id"]

        # 1. Test Run Code (Samples)
        py_solution = (
            "import sys\n"
            "def two_sum(nums, target):\n"
            "    seen = {}\n"
            "    for i, n in enumerate(nums):\n"
            "        diff = target - n\n"
            "        if diff in seen:\n"
            "            return f'{seen[diff]} {i}'\n"
            "        seen[n] = i\n"
            "    return ''\n\n"
            "lines = sys.stdin.read().strip().splitlines()\n"
            "if lines:\n"
            "    nums = list(map(int, lines[0].split()))\n"
            "    target = int(lines[1])\n"
            "    print(two_sum(nums, target))\n"
        )

        run_res = await ac.post(
            "/api/v1/submissions/run",
            json={"code": py_solution, "language": "python", "problem_id": prob_id}
        )
        assert run_res.status_code == 200
        run_data = run_res.json()
        assert run_data["status"] in ["Accepted", "Success"]

        # 2. Test Submit Code
        sub_res = await ac.post(
            "/api/v1/submissions/submit",
            headers=headers,
            json={"problem_id": prob_id, "code": py_solution, "language": "python"}
        )
        assert sub_res.status_code == 200
        sub_data = sub_res.json()
        assert sub_data["status"] == "Accepted"
        assert sub_data["passed_tests"] == sub_data["total_tests"]
        assert "ai_feedback" in sub_data
        assert sub_data["ai_feedback"] is not None
        assert "time_complexity" in sub_data["ai_feedback"]
