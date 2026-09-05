import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def post(url, data=None, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        data=json.dumps(data).encode('utf-8') if data is not None else None,
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        }
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def get(url, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{url}",
        headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode('utf-8'))

def run_tests():
    print("=== [1/9] Testing Demo User Authentication ===")
    status, auth_data = post("/auth/demo-login", {"role": "user"})
    assert status == 200 and "access_token" in auth_data
    token = auth_data["access_token"]
    user = auth_data["user"]
    print(f"[OK] Authenticated as: {user['username']} (Role: {user['role']}, Level: {user['level']})")

    print("\n=== [2/9] Testing Problem Library & Topics ===")
    status, problems = get("/problems", token=token)
    assert status == 200 and len(problems) >= 10
    print(f"[OK] Retrieved {len(problems)} problems across all topics.")

    status, topics = get("/problems/topics", token=token)
    assert status == 200 and len(topics) == 9
    print(f"[OK] Retrieved topic progress for {len(topics)} topics: {[t['topic'] for t in topics]}")

    print("\n=== [3/9] Testing Two Sum Problem Retrieval ===")
    status, ts = get("/problems/two-sum", token=token)
    assert status == 200 and ts["slug"] == "two-sum"
    print(f"[OK] Retrieved problem: {ts['title']} ({ts['difficulty']} - {ts['topic']})")
    print(f"[OK] Constraints: {ts['constraints'][:40]}...")

    print("\n=== [4/9] Testing Code Execution & Sample Testing ===")
    py_code = ts["starter_codes"]["python"]
    status, run_out = post("/submissions/run", {"code": py_code, "language": "python", "problem_id": ts["id"]})
    assert status == 200
    print(f"[OK] Run Code Status: {run_out['status']}, Runtime: {run_out['runtime_ms']}ms")

    print("\n=== [5/9] Testing Solution Submission & AI Review ===")
    status, sub_out = post("/submissions/submit", {"problem_id": ts["id"], "code": py_code, "language": "python"}, token=token)
    assert status == 200 and sub_out["status"] == "Accepted"
    ai = sub_out["ai_feedback"]
    print(f"[OK] Submission Result: {sub_out['status']} ({sub_out['passed_tests']}/{sub_out['total_tests']} tests passed)")
    print(f"[OK] AI Score Rating: {ai['score']}/100")
    print(f"[OK] AI Time Complexity: {ai['time_complexity']}")
    print(f"[OK] AI Space Complexity: {ai['space_complexity']}")
    print(f"[OK] AI Hints: {ai['hints'][0]}")

    print("\n=== [6/9] Testing Automated Skill Assessment ===")
    status, assess = get("/assessment/overview", token=token)
    assert status == 200
    print(f"[OK] Overall Skill Score: {assess['overall_score']}%")
    print(f"[OK] Strongest Topic: {assess['strongest_topic']}")
    print(f"[OK] Weakest Topic: {assess['weakest_topic']}")
    print(f"[OK] Radar data computed for {len(assess['topic_scores'])} topics.")

    print("\n=== [7/9] Testing Personalized Learning Roadmap ===")
    status, roadmap = get("/assessment/roadmap", token=token)
    assert status == 200
    print(f"[OK] Current Level: {roadmap['current_level']}, Completion: {roadmap['completion_percentage']}%")
    print(f"[OK] Milestone Stages: {len(roadmap['nodes'])} nodes.")

    print("\n=== [8/9] Testing AI Coding Mentor Chat ===")
    status, chat = post(
        "/mentor/chat",
        {"message": "Can you explain why Two Sum is optimized by a Hash Map?", "problem_context": "Two Sum"},
        token=token
    )
    assert status == 200
    print(f"[OK] CodeMentor Response received ({len(chat['reply'])} chars):")
    print(f"  Preview: {chat['reply'][:140].encode('ascii', 'ignore').decode()}...")

    print("\n=== [9/9] Testing Gamification & Admin Dashboard ===")
    status, lb = get("/gamification/leaderboard")
    assert status == 200 and len(lb) > 0
    print(f"[OK] Leaderboard retrieved: Top coder is '{lb[0]['username']}' with {lb[0]['xp']} XP.")

    status, admin_auth = post("/auth/demo-login", {"role": "admin"})
    admin_token = admin_auth["access_token"]
    status, stats = get("/admin/stats", token=admin_token)
    assert status == 200
    print(f"[OK] Admin Telemetry: {stats['total_users']} users, {stats['total_problems']} problems, {stats['total_submissions']} submissions.")

    print("\n*** ALL 9 FULL-STACK INTEGRATION MILESTONES VERIFIED SUCCESSFULLY! ***")

if __name__ == "__main__":
    run_tests()
