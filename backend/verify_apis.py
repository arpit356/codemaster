import urllib.request
import json

def test_api():
    login_data = json.dumps({'username': 'codeninja', 'password': 'password123'}).encode()
    login_req = urllib.request.Request(
        'http://localhost:8000/api/v1/auth/login',
        data=login_data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(login_req) as resp:
        token = json.loads(resp.read().decode())['access_token']
        print('1. Auth login: OK')

    # Test submission
    sub_data = json.dumps({
        'problem_id': 1,
        'code': 'import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1])\n    m = {}\n    for i, n in enumerate(nums):\n        if target - n in m:\n            print(f"{m[target-n]} {i}")\n            break\n        m[n] = i\n',
        'language': 'python'
    }).encode()

    sub_req = urllib.request.Request(
        'http://localhost:8000/api/v1/submissions/submit',
        data=sub_data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(sub_req) as resp:
        res = json.loads(resp.read().decode())
        print('2. Submit problem: Status =', res['status'])
        print('   AI Feedback =', res['ai_feedback']['logic_explanation'][:60], '...')

    # Test mentor chat
    chat_data = json.dumps({'message': 'Explain dynamic programming in simple words'}).encode()
    chat_req = urllib.request.Request(
        'http://localhost:8000/api/v1/mentor/chat',
        data=chat_data,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}
    )
    with urllib.request.urlopen(chat_req) as resp:
        chat_res = json.loads(resp.read().decode())
        print('3. AI Mentor chat: Reply length =', len(chat_res['reply']))

    print('\nALL CORE API PIPELINES FUNCTIONING!')

if __name__ == '__main__':
    test_api()
