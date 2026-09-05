from typing import List, Dict, Any
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User, Problem, Badge, UserSkill, UserBadge, Submission, DailyChallenge
from datetime import datetime, timezone, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

INITIAL_BADGES = [
    {
        "slug": "first_blood",
        "name": "First Blood",
        "description": "Solved your very first algorithmic coding challenge.",
        "icon": "Zap",
        "category": "Milestone",
        "xp_reward": 50
    },
    {
        "slug": "array_explorer",
        "name": "Array Explorer",
        "description": "Solved multiple array manipulation challenges with high accuracy.",
        "icon": "Layers",
        "category": "Topic",
        "xp_reward": 100
    },
    {
        "slug": "string_wizard",
        "name": "String Wizard",
        "description": "Mastered string parsing and anagram algorithms.",
        "icon": "Sparkles",
        "category": "Topic",
        "xp_reward": 100
    },
    {
        "slug": "consistency_champion",
        "name": "Consistency Champion",
        "description": "Maintained an active coding streak on CodeMentor AI.",
        "icon": "Flame",
        "category": "Streak",
        "xp_reward": 150
    },
    {
        "slug": "speed_demon",
        "name": "Speed Demon",
        "description": "Executed an optimal solution in lightning-fast runtime.",
        "icon": "Rocket",
        "category": "Speed",
        "xp_reward": 75
    },
    {
        "slug": "dp_conqueror",
        "name": "DP Conqueror",
        "description": "Conquered a non-trivial Dynamic Programming problem.",
        "icon": "Award",
        "category": "Mastery",
        "xp_reward": 200
    }
]

INITIAL_PROBLEMS = [
    # 1. Arrays - Easy
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "topic": "Arrays",
        "difficulty": "Easy",
        "description": "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
        "input_format": "First line: space-separated integers for `nums`. Second line: integer `target`.",
        "output_format": "Print two space-separated indices representing the answer.",
        "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
        "examples": [
            {"input": "2 7 11 15\n9", "output": "0 1", "explanation": "nums[0] + nums[1] == 2 + 7 == 9, so we return 0 1."},
            {"input": "3 2 4\n6", "output": "1 2", "explanation": "nums[1] + nums[2] == 2 + 4 == 6, so we return 1 2."}
        ],
        "test_cases": [
            {"input": "2 7 11 15\n9", "expected_output": "0 1", "is_hidden": False},
            {"input": "3 2 4\n6", "expected_output": "1 2", "is_hidden": False},
            {"input": "3 3\n6", "expected_output": "0 1", "is_hidden": True},
            {"input": "1 5 8 12 14\n13", "expected_output": "1 2", "is_hidden": True},
            {"input": "-1 -2 -3 -4 -5\n-8", "expected_output": "2 4", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef two_sum(nums, target):\n    # Write your solution here\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return f\"{seen[diff]} {i}\"\n        seen[n] = i\n    return \"\"\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    if lines:\n        nums = list(map(int, lines[0].split()))\n        target = int(lines[1])\n        print(two_sum(nums, target))\n",
            "java": "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String[] parts = sc.nextLine().trim().split(\"\\\\s+\");\n        int[] nums = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);\n        int target = sc.nextInt();\n        \n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int diff = target - nums[i];\n            if (map.containsKey(diff)) {\n                System.out.println(map.get(diff) + \" \" + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <unordered_map>\n\nusing namespace std;\n\nint main() {\n    string line;\n    if (!getline(cin, line)) return 0;\n    stringstream ss(line);\n    vector<int> nums;\n    int val;\n    while (ss >> val) nums.push_back(val);\n    int target;\n    if (cin >> target) {\n        unordered_map<int, int> seen;\n        for (int i = 0; i < (int)nums.size(); ++i) {\n            int diff = target - nums[i];\n            if (seen.count(diff)) {\n                cout << seen[diff] << \" \" << i << endl;\n                return 0;\n            }\n            seen[nums[i]] = i;\n        }\n    }\n    return 0;\n}\n",
            "c": "#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int nums[10000];\n    int n = 0;\n    char ch;\n    while (scanf(\"%d%c\", &nums[n++], &ch) == 2) {\n        if (ch == '\\n') break;\n    }\n    int target;\n    if (scanf(\"%d\", &target) == 1) {\n        for (int i = 0; i < n; i++) {\n            for (int j = i + 1; j < n; j++) {\n                if (nums[i] + nums[j] == target) {\n                    printf(\"%d %d\\n\", i, j);\n                    return 0;\n                }\n            }\n        }\n    }\n    return 0;\n}\n"
        },
        "hints": [
            "A brute force nested loop takes O(n²) time. Can you do it in a single pass with extra space?",
            "Use a Hash Table to keep track of values you have already seen and their indices."
        ]
    },
    # 2. Arrays - Medium
    {
        "slug": "container-with-most-water",
        "title": "Container With Most Water",
        "topic": "Arrays",
        "difficulty": "Medium",
        "description": "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.",
        "input_format": "Single line: space-separated integers representing array `height`.",
        "output_format": "Print a single integer: maximum area.",
        "constraints": "2 <= height.length <= 10^5\n0 <= height[i] <= 10^4",
        "examples": [
            {"input": "1 8 6 2 5 4 8 3 7", "output": "49", "explanation": "The maximum area is obtained between line at index 1 (height 8) and index 8 (height 7): min(8, 7) * (8 - 1) = 49."}
        ],
        "test_cases": [
            {"input": "1 8 6 2 5 4 8 3 7", "expected_output": "49", "is_hidden": False},
            {"input": "1 1", "expected_output": "1", "is_hidden": False},
            {"input": "4 3 2 1 4", "expected_output": "16", "is_hidden": True},
            {"input": "1 2 1", "expected_output": "2", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef max_area(height):\n    left, right = 0, len(height) - 1\n    best = 0\n    while left < right:\n        w = right - left\n        h = min(height[left], height[right])\n        best = max(best, w * h)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return best\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        arr = list(map(int, raw.split()))\n        print(max_area(arr))\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> h;\n    int val;\n    while (cin >> val) h.push_back(val);\n    int l = 0, r = (int)h.size() - 1, mx = 0;\n    while (l < r) {\n        mx = max(mx, min(h[l], h[r]) * (r - l));\n        if (h[l] < h[r]) l++;\n        else r--;\n    }\n    cout << mx << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while (sc.hasNextInt()) list.add(sc.nextInt());\n        int l = 0, r = list.size() - 1, maxArea = 0;\n        while (l < r) {\n            maxArea = Math.max(maxArea, Math.min(list.get(l), list.get(r)) * (r - l));\n            if (list.get(l) < list.get(r)) l++;\n            else r--;\n        }\n        System.out.println(maxArea);\n    }\n}\n",
            "c": "#include <stdio.h>\nint main() {\n    int h[100000], n = 0;\n    while (scanf(\"%d\", &h[n]) == 1) n++;\n    int l = 0, r = n - 1, max_a = 0;\n    while (l < r) {\n        int cur_h = h[l] < h[r] ? h[l] : h[r];\n        int area = cur_h * (r - l);\n        if (area > max_a) max_a = area;\n        if (h[l] < h[r]) l++; else r--;\n    }\n    printf(\"%d\\n\", max_a);\n    return 0;\n}\n"
        },
        "hints": [
            "Use the Two-Pointer technique starting at both extremities.",
            "Always move the pointer that points to the shorter line to seek a potentially taller boundary."
        ]
    },
    # 3. Strings - Easy
    {
        "slug": "valid-palindrome",
        "title": "Valid Palindrome",
        "topic": "Strings",
        "difficulty": "Easy",
        "description": "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, print `true` if it is a palindrome, or `false` otherwise.",
        "input_format": "Single line: string `s`.",
        "output_format": "Print `true` or `false`.",
        "constraints": "1 <= s.length <= 2 * 10^5\n`s` consists only of printable ASCII characters.",
        "examples": [
            {"input": "A man, a plan, a canal: Panama", "output": "true", "explanation": "\"amanaplanacanalpanama\" is a palindrome."},
            {"input": "race a car", "output": "false", "explanation": "\"raceacar\" is not a palindrome."}
        ],
        "test_cases": [
            {"input": "A man, a plan, a canal: Panama", "expected_output": "true", "is_hidden": False},
            {"input": "race a car", "expected_output": "false", "is_hidden": False},
            {"input": " ", "expected_output": "true", "is_hidden": True},
            {"input": "0P", "expected_output": "false", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef is_palindrome(s):\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return str(filtered == filtered[::-1]).lower()\n\nif __name__ == '__main__':\n    text = sys.stdin.read().rstrip('\\r\\n')\n    print(is_palindrome(text))\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    int l = 0, r = (int)s.length() - 1;\n    while (l < r) {\n        while (l < r && !isalnum(s[l])) l++;\n        while (l < r && !isalnum(s[r])) r--;\n        if (tolower(s[l]) != tolower(s[r])) {\n            cout << \"false\" << endl;\n            return 0;\n        }\n        l++; r--;\n    }\n    cout << \"true\" << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n        int l = 0, r = s.length() - 1;\n        while (l < r) {\n            while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;\n            while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;\n            if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) {\n                System.out.println(\"false\");\n                return;\n            }\n            l++; r--;\n        }\n        System.out.println(\"true\");\n    }\n}\n",
            "c": "#include <stdio.h>\n#include <string.h>\n#include <ctype.h>\nint main() {\n    char s[200005];\n    if (!fgets(s, sizeof(s), stdin)) return 0;\n    int l = 0, r = strlen(s) - 1;\n    while (l < r) {\n        while (l < r && !isalnum(s[l])) l++;\n        while (l < r && !isalnum(s[r])) r--;\n        if (tolower(s[l]) != tolower(s[r])) {\n            printf(\"false\\n\");\n            return 0;\n        }\n        l++; r--;\n    }\n    printf(\"true\\n\");\n    return 0;\n}\n"
        },
        "hints": [
            "Filter or skip non-alphanumeric characters.",
            "Use two pointers from both ends comparing lowercase equivalents."
        ]
    },
    # 4. Strings - Medium
    {
        "slug": "longest-substring-without-repeating-characters",
        "title": "Longest Substring Without Repeating Characters",
        "topic": "Strings",
        "difficulty": "Medium",
        "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
        "input_format": "Single line: string `s`.",
        "output_format": "Print single integer: length of longest unique substring.",
        "constraints": "0 <= s.length <= 5 * 10^4",
        "examples": [
            {"input": "abcabcbb", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."},
            {"input": "bbbbb", "output": "1", "explanation": "The answer is \"b\", with the length of 1."}
        ],
        "test_cases": [
            {"input": "abcabcbb", "expected_output": "3", "is_hidden": False},
            {"input": "bbbbb", "expected_output": "1", "is_hidden": False},
            {"input": "pwwkew", "expected_output": "3", "is_hidden": False},
            {"input": "", "expected_output": "0", "is_hidden": True},
            {"input": "dvdf", "expected_output": "3", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef length_of_longest_substring(s):\n    char_index = {}\n    left = 0\n    max_len = 0\n    for right, ch in enumerate(s):\n        if ch in char_index and char_index[ch] >= left:\n            left = char_index[ch] + 1\n        char_index[ch] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\nif __name__ == '__main__':\n    s = sys.stdin.read().rstrip('\\r\\n')\n    print(length_of_longest_substring(s))\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    unordered_map<char, int> seen;\n    int l = 0, ans = 0;\n    for (int r = 0; r < (int)s.length(); r++) {\n        if (seen.count(s[r]) && seen[s[r]] >= l) {\n            l = seen[s[r]] + 1;\n        }\n        seen[s[r]] = r;\n        ans = max(ans, r - l + 1);\n    }\n    cout << ans << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.hasNextLine() ? sc.nextLine() : \"\";\n        Map<Character, Integer> seen = new HashMap<>();\n        int l = 0, ans = 0;\n        for (int r = 0; r < s.length(); r++) {\n            char c = s.charAt(r);\n            if (seen.containsKey(c) && seen.get(c) >= l) {\n                l = seen.get(c) + 1;\n            }\n            seen.put(c, r);\n            ans = Math.max(ans, r - l + 1);\n        }\n        System.out.println(ans);\n    }\n}\n",
            "c": "#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[50005];\n    if (!fgets(s, sizeof(s), stdin)) { printf(\"0\\n\"); return 0; }\n    int len = strlen(s);\n    if (len > 0 && s[len-1] == '\\n') s[--len] = '\\0';\n    int last[256];\n    for (int i = 0; i < 256; i++) last[i] = -1;\n    int l = 0, max_len = 0;\n    for (int r = 0; r < len; r++) {\n        unsigned char c = (unsigned char)s[r];\n        if (last[c] >= l) l = last[c] + 1;\n        last[c] = r;\n        int cur = r - l + 1;\n        if (cur > max_len) max_len = cur;\n    }\n    printf(\"%d\\n\", max_len);\n    return 0;\n}\n"
        },
        "hints": [
            "Use a sliding window with two pointers: `left` and `right`.",
            "Record the last observed index of each character to shift `left` forward in O(1)."
        ]
    },
    # 5. Linked Lists - Easy
    {
        "slug": "reverse-linked-list",
        "title": "Reverse Linked List",
        "topic": "Linked Lists",
        "difficulty": "Easy",
        "description": "Given the values of a singly linked list, reverse the list and return the reversed node values.",
        "input_format": "Single line: space-separated integers representing node values.",
        "output_format": "Print the reversed values separated by spaces.",
        "constraints": "The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000",
        "examples": [
            {"input": "1 2 3 4 5", "output": "5 4 3 2 1", "explanation": "Reversing 1->2->3->4->5 gives 5->4->3->2->1."}
        ],
        "test_cases": [
            {"input": "1 2 3 4 5", "expected_output": "5 4 3 2 1", "is_hidden": False},
            {"input": "1 2", "expected_output": "2 1", "is_hidden": False},
            {"input": "42", "expected_output": "42", "is_hidden": True},
            {"input": "9 8 7 6", "expected_output": "6 7 8 9", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef solve():\n    raw = sys.stdin.read().strip()\n    if not raw:\n        return\n    vals = raw.split()\n    print(\" \".join(reversed(vals)))\n\nif __name__ == '__main__':\n    solve()\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> vals;\n    int v;\n    while (cin >> v) vals.push_back(v);\n    for (int i = (int)vals.size() - 1; i >= 0; i--) {\n        cout << vals[i] << (i == 0 ? \"\" : \" \");\n    }\n    cout << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> list = new ArrayList<>();\n        while (sc.hasNextInt()) list.add(sc.nextInt());\n        Collections.reverse(list);\n        for (int i = 0; i < list.size(); i++) {\n            System.out.print(list.get(i) + (i == list.size() - 1 ? \"\" : \" \"));\n        }\n        System.out.println();\n    }\n}\n",
            "c": "#include <stdio.h>\nint main() {\n    int arr[5005], n = 0;\n    while (scanf(\"%d\", &arr[n]) == 1) n++;\n    for (int i = n - 1; i >= 0; i--) {\n        printf(\"%d%s\", arr[i], i == 0 ? \"\" : \" \");\n    }\n    printf(\"\\n\");\n    return 0;\n}\n"
        },
        "hints": [
            "Keep three pointers: `prev`, `curr`, and `next_node`.",
            "Iterate through the list, re-pointing `curr.next = prev`."
        ]
    },
    # 6. Stacks - Easy
    {
        "slug": "valid-parentheses",
        "title": "Valid Parentheses",
        "topic": "Stacks",
        "difficulty": "Easy",
        "description": "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        "input_format": "Single line: string `s`.",
        "output_format": "Print `true` or `false`.",
        "constraints": "1 <= s.length <= 10^4\n`s` consists of parentheses only `'()[]{}'`.",
        "examples": [
            {"input": "()[]{}", "output": "true", "explanation": "All bracket pairs match in order."},
            {"input": "(]", "output": "false", "explanation": "Parenthesis does not match square bracket."}
        ],
        "test_cases": [
            {"input": "()[]{}", "expected_output": "true", "is_hidden": False},
            {"input": "(]", "expected_output": "false", "is_hidden": False},
            {"input": "([)]", "expected_output": "false", "is_hidden": True},
            {"input": "{[]}", "expected_output": "true", "is_hidden": True},
            {"input": "]", "expected_output": "false", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef is_valid(s):\n    stack = []\n    mapping = {')': '(', '}': '{', ']': '['}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return 'false'\n        else:\n            stack.append(char)\n    return 'true' if not stack else 'false'\n\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    print(is_valid(s))\n",
            "cpp": "#include <iostream>\n#include <string>\n#include <stack>\nusing namespace std;\n\nint main() {\n    string s;\n    if (!(cin >> s)) return 0;\n    stack<char> st;\n    for (char c : s) {\n        if (c == '(' || c == '{' || c == '[') st.push(c);\n        else {\n            if (st.empty()) { cout << \"false\" << endl; return 0; }\n            char top = st.top(); st.pop();\n            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {\n                cout << \"false\" << endl;\n                return 0;\n            }\n        }\n    }\n    cout << (st.empty() ? \"true\" : \"false\") << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        Deque<Character> stack = new ArrayDeque<>();\n        for (char c : s.toCharArray()) {\n            if (c == '(' || c == '{' || c == '[') stack.push(c);\n            else {\n                if (stack.isEmpty()) { System.out.println(\"false\"); return; }\n                char top = stack.pop();\n                if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) {\n                    System.out.println(\"false\");\n                    return;\n                }\n            }\n        }\n        System.out.println(stack.isEmpty() ? \"true\" : \"false\");\n    }\n}\n",
            "c": "#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[10005], st[10005];\n    if (scanf(\"%s\", s) != 1) return 0;\n    int top = 0;\n    for (int i = 0; s[i]; i++) {\n        char c = s[i];\n        if (c == '(' || c == '{' || c == '[') st[top++] = c;\n        else {\n            if (top == 0) { printf(\"false\\n\"); return 0; }\n            char t = st[--top];\n            if ((c == ')' && t != '(') || (c == '}' && t != '{') || (c == ']' && t != '[')) {\n                printf(\"false\\n\"); return 0;\n            }\n        }\n    }\n    printf(\"%s\\n\", top == 0 ? \"true\" : \"false\");\n    return 0;\n}\n"
        },
        "hints": [
            "Push opening brackets onto a LIFO stack.",
            "When encountering a closing bracket, check if the stack top matches."
        ]
    },
    # 7. Queues - Easy
    {
        "slug": "implement-queue-using-stacks",
        "title": "Implement Queue using Stacks",
        "topic": "Queues",
        "difficulty": "Easy",
        "description": "Implement a first in first out (FIFO) queue using only two stacks.\n\nInput commands:\n`push x`: Pushes element x to back of queue.\n`pop`: Removes element from front of queue and prints it.\n`peek`: Prints element at front of queue.\n`empty`: Prints `true` if queue is empty, `false` otherwise.",
        "input_format": "Sequence of commands, one per line.",
        "output_format": "Print the outputs for each `pop`, `peek`, and `empty` query.",
        "constraints": "At most 100 calls will be made to push, pop, peek, and empty.",
        "examples": [
            {"input": "push 1\npush 2\npeek\npop\nempty", "output": "1\n1\nfalse", "explanation": "peek gives 1, pop returns 1, queue still contains 2 so empty is false."}
        ],
        "test_cases": [
            {"input": "push 1\npush 2\npeek\npop\nempty", "expected_output": "1\n1\nfalse", "is_hidden": False},
            {"input": "push 10\npop\nempty", "expected_output": "10\ntrue", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef main():\n    in_stack = []\n    out_stack = []\n    \n    def transfer():\n        if not out_stack:\n            while in_stack:\n                out_stack.append(in_stack.pop())\n\n    for line in sys.stdin.read().strip().splitlines():\n        parts = line.split()\n        cmd = parts[0]\n        if cmd == 'push':\n            in_stack.append(int(parts[1]))\n        elif cmd == 'pop':\n            transfer()\n            print(out_stack.pop())\n        elif cmd == 'peek':\n            transfer()\n            print(out_stack[-1])\n        elif cmd == 'empty':\n            is_empty = not in_stack and not out_stack\n            print(str(is_empty).lower())\n\nif __name__ == '__main__':\n    main()\n",
            "cpp": "#include <iostream>\n#include <stack>\n#include <string>\nusing namespace std;\n\nint main() {\n    stack<int> in_s, out_s;\n    auto transfer = [&]() {\n        if (out_s.empty()) {\n            while (!in_s.empty()) {\n                out_s.push(in_s.top());\n                in_s.pop();\n            }\n        }\n    };\n    string cmd;\n    while (cin >> cmd) {\n        if (cmd == \"push\") {\n            int x; cin >> x;\n            in_s.push(x);\n        } else if (cmd == \"pop\") {\n            transfer();\n            cout << out_s.top() << endl;\n            out_s.pop();\n        } else if (cmd == \"peek\") {\n            transfer();\n            cout << out_s.top() << endl;\n        } else if (cmd == \"empty\") {\n            cout << (in_s.empty() && out_s.empty() ? \"true\" : \"false\") << endl;\n        }\n    }\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Deque<Integer> inS = new ArrayDeque<>();\n        Deque<Integer> outS = new ArrayDeque<>();\n        while (sc.hasNext()) {\n            String cmd = sc.next();\n            if (cmd.equals(\"push\")) {\n                inS.push(sc.nextInt());\n            } else if (cmd.equals(\"pop\")) {\n                if (outS.isEmpty()) while (!inS.isEmpty()) outS.push(inS.pop());\n                System.out.println(outS.pop());\n            } else if (cmd.equals(\"peek\")) {\n                if (outS.isEmpty()) while (!inS.isEmpty()) outS.push(inS.pop());\n                System.out.println(outS.peek());\n            } else if (cmd.equals(\"empty\")) {\n                System.out.println(inS.isEmpty() && outS.isEmpty() ? \"true\" : \"false\");\n            }\n        }\n    }\n}\n",
            "c": "#include <stdio.h>\n#include <string.h>\nint main() {\n    int in_s[500], in_top = 0;\n    int out_s[500], out_top = 0;\n    char cmd[20];\n    while (scanf(\"%s\", cmd) == 1) {\n        if (strcmp(cmd, \"push\") == 0) {\n            int x; scanf(\"%d\", &x);\n            in_s[in_top++] = x;\n        } else if (strcmp(cmd, \"pop\") == 0) {\n            if (out_top == 0) while (in_top > 0) out_s[out_top++] = in_s[--in_top];\n            printf(\"%d\\n\", out_s[--out_top]);\n        } else if (strcmp(cmd, \"peek\") == 0) {\n            if (out_top == 0) while (in_top > 0) out_s[out_top++] = in_s[--in_top];\n            printf(\"%d\\n\", out_s[out_top - 1]);\n        } else if (strcmp(cmd, \"empty\") == 0) {\n            printf(\"%s\\n\", (in_top == 0 && out_top == 0) ? \"true\" : \"false\");\n        }\n    }\n    return 0;\n}\n"
        },
        "hints": [
            "Use one stack for enqueueing (`push`) and another for dequeueing (`pop`/`peek`).",
            "Transfer elements from input stack to output stack only when output stack is empty."
        ]
    },
    # 8. Recursion - Easy
    {
        "slug": "climbing-stairs",
        "title": "Climbing Stairs",
        "topic": "Recursion",
        "difficulty": "Easy",
        "description": "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        "input_format": "Single line: integer `n`.",
        "output_format": "Print integer: number of distinct ways.",
        "constraints": "1 <= n <= 45",
        "examples": [
            {"input": "2", "output": "2", "explanation": "There are two ways: 1 step + 1 step, or 2 steps."},
            {"input": "3", "output": "3", "explanation": "Three ways: 1+1+1, 1+2, or 2+1."}
        ],
        "test_cases": [
            {"input": "2", "expected_output": "2", "is_hidden": False},
            {"input": "3", "expected_output": "3", "is_hidden": False},
            {"input": "5", "expected_output": "8", "is_hidden": True},
            {"input": "10", "expected_output": "89", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef climb_stairs(n):\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        print(climb_stairs(int(raw)))\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        if (n <= 2) { cout << n << endl; return 0; }\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        cout << b << endl;\n    }\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        if (n <= 2) { System.out.println(n); return; }\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b;\n            a = b;\n            b = c;\n        }\n        System.out.println(b);\n    }\n}\n",
            "c": "#include <stdio.h>\nint main() {\n    int n;\n    if (scanf(\"%d\", &n) == 1) {\n        if (n <= 2) { printf(\"%d\\n\", n); return 0; }\n        int a = 1, b = 2;\n        for (int i = 3; i <= n; i++) {\n            int c = a + b; a = b; b = c;\n        }\n        printf(\"%d\\n\", b);\n    }\n    return 0;\n}\n"
        },
        "hints": [
            "To reach step `n`, you must come from either step `n-1` or step `n-2`.",
            "This matches the recurrence relation of the Fibonacci sequence."
        ]
    },
    # 9. Trees - Easy
    {
        "slug": "maximum-depth-of-binary-tree",
        "title": "Maximum Depth of Binary Tree",
        "topic": "Trees",
        "difficulty": "Easy",
        "description": "Given a binary tree represented as level-order node values (using `null` for missing nodes), find its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
        "input_format": "Single line: space-separated values representing level-order traversal.",
        "output_format": "Print single integer: maximum depth.",
        "constraints": "The number of nodes in the tree is in the range [0, 10^4].",
        "examples": [
            {"input": "3 9 20 null null 15 7", "output": "3", "explanation": "The tree depth is 3 nodes (root 3 -> 20 -> 15/7)."}
        ],
        "test_cases": [
            {"input": "3 9 20 null null 15 7", "expected_output": "3", "is_hidden": False},
            {"input": "1 null 2", "expected_output": "2", "is_hidden": False},
            {"input": "", "expected_output": "0", "is_hidden": True},
            {"input": "1", "expected_output": "1", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\nimport math\n\ndef max_depth(tokens):\n    if not tokens or tokens == ['']:\n        return 0\n    # Count effective depth from level order\n    n = len(tokens)\n    return int(math.floor(math.log2(n))) + 1 if n > 0 else 0\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if not raw:\n        print(0)\n    else:\n        tokens = raw.split()\n        # Simple tree builder\n        if tokens[0] == 'null':\n            print(0)\n        else:\n            # BFS level calculation\n            from collections import deque\n            q = deque([(0, 1)]) # (index, depth)\n            max_d = 1\n            while q:\n                idx, d = q.popleft()\n                max_d = max(max_d, d)\n                l = 2 * idx + 1\n                r = 2 * idx + 2\n                if l < len(tokens) and tokens[l] != 'null':\n                    q.append((l, d + 1))\n                if r < len(tokens) and tokens[r] != 'null':\n                    q.append((r, d + 1))\n            print(max_d)\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <string>\n#include <queue>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<string> tokens;\n    string s;\n    while (cin >> s) tokens.push_back(s);\n    if (tokens.empty() || tokens[0] == \"null\") { cout << 0 << endl; return 0; }\n    queue<pair<int, int>> q;\n    q.push({0, 1});\n    int max_d = 1;\n    while (!q.empty()) {\n        auto [idx, d] = q.front(); q.pop();\n        max_d = max(max_d, d);\n        int l = 2 * idx + 1, r = 2 * idx + 2;\n        if (l < (int)tokens.size() && tokens[l] != \"null\") q.push({l, d + 1});\n        if (r < (int)tokens.size() && tokens[r] != \"null\") q.push({r, d + 1});\n    }\n    cout << max_d << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<String> tokens = new ArrayList<>();\n        while (sc.hasNext()) tokens.add(sc.next());\n        if (tokens.isEmpty() || tokens.get(0).equals(\"null\")) { System.out.println(0); return; }\n        Queue<int[]> q = new LinkedList<>();\n        q.add(new int[]{0, 1});\n        int maxD = 1;\n        while (!q.isEmpty()) {\n            int[] cur = q.poll();\n            int idx = cur[0], d = cur[1];\n            maxD = Math.max(maxD, d);\n            int l = 2 * idx + 1, r = 2 * idx + 2;\n            if (l < tokens.size() && !tokens.get(l).equals(\"null\")) q.add(new int[]{l, d + 1});\n            if (r < tokens.size() && !tokens.get(r).equals(\"null\")) q.add(new int[]{r, d + 1});\n        }\n        System.out.println(maxD);\n    }\n}\n",
            "c": "#include <stdio.h>\n#include <string.h>\nint main() {\n    char tokens[1000][20];\n    int n = 0;\n    while (scanf(\"%s\", tokens[n]) == 1) n++;\n    if (n == 0 || strcmp(tokens[0], \"null\") == 0) { printf(\"0\\n\"); return 0; }\n    int q_idx[1000], q_depth[1000];\n    int head = 0, tail = 0;\n    q_idx[tail] = 0; q_depth[tail++] = 1;\n    int max_d = 1;\n    while (head < tail) {\n        int idx = q_idx[head]; int d = q_depth[head++];\n        if (d > max_d) max_d = d;\n        int l = 2 * idx + 1, r = 2 * idx + 2;\n        if (l < n && strcmp(tokens[l], \"null\") != 0) {\n            q_idx[tail] = l; q_depth[tail++] = d + 1;\n        }\n        if (r < n && strcmp(tokens[r], \"null\") != 0) {\n            q_idx[tail] = r; q_depth[tail++] = d + 1;\n        }\n    }\n    printf(\"%d\\n\", max_d);\n    return 0;\n}\n"
        },
        "hints": [
            "Use Depth-First Search (DFS): `max_depth = 1 + max(left, right)`.",
            "Alternatively, use Breadth-First Search (BFS) counting level by level."
        ]
    },
    # 10. Graphs - Medium
    {
        "slug": "number-of-islands",
        "title": "Number of Islands",
        "topic": "Graphs",
        "difficulty": "Medium",
        "description": "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
        "input_format": "First line: space-separated integers `m` and `n`. Following `m` lines: space-separated 1s and 0s.",
        "output_format": "Print single integer: total number of islands.",
        "constraints": "m == grid.length\nn == grid[i].length\n1 <= m, n <= 300",
        "examples": [
            {
                "input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
                "output": "1",
                "explanation": "All land cells are connected into a single island."
            }
        ],
        "test_cases": [
            {
                "input": "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
                "expected_output": "1",
                "is_hidden": False
            },
            {
                "input": "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
                "expected_output": "3",
                "is_hidden": False
            }
        ],
        "starter_codes": {
            "python": "import sys\n\ndef num_islands(grid):\n    if not grid: return 0\n    m, n = len(grid), len(grid[0])\n    count = 0\n    def dfs(r, c):\n        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1':\n            return\n        grid[r][c] = '0'\n        dfs(r + 1, c)\n        dfs(r - 1, c)\n        dfs(r, c + 1)\n        dfs(r, c - 1)\n    for r in range(m):\n        for c in range(n):\n            if grid[r][c] == '1':\n                count += 1\n                dfs(r, c)\n    return count\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    if lines:\n        m, n = map(int, lines[0].split())\n        grid = [lines[i+1].split() for i in range(m)]\n        print(num_islands(grid))\n",
            "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid dfs(vector<vector<char>>& g, int r, int c) {\n    if (r < 0 || r >= (int)g.size() || c < 0 || c >= (int)g[0].size() || g[r][c] != '1') return;\n    g[r][c] = '0';\n    dfs(g, r+1, c); dfs(g, r-1, c); dfs(g, r, c+1); dfs(g, r, c-1);\n}\n\nint main() {\n    int m, n;\n    if (!(cin >> m >> n)) return 0;\n    vector<vector<char>> g(m, vector<char>(n));\n    for (int i = 0; i < m; i++)\n        for (int j = 0; j < n; j++)\n            cin >> g[i][j];\n    int cnt = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (g[i][j] == '1') { cnt++; dfs(g, i, j); }\n        }\n    }\n    cout << cnt << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    static void dfs(char[][] g, int r, int c) {\n        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return;\n        g[r][c] = '0';\n        dfs(g, r+1, c); dfs(g, r-1, c); dfs(g, r, c+1); dfs(g, r, c-1);\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int m = sc.nextInt(), n = sc.nextInt();\n        char[][] g = new char[m][n];\n        for (int i = 0; i < m; i++)\n            for (int j = 0; j < n; j++)\n                g[i][j] = sc.next().charAt(0);\n        int cnt = 0;\n        for (int i = 0; i < m; i++) {\n            for (int j = 0; j < n; j++) {\n                if (g[i][j] == '1') { cnt++; dfs(g, i, j); }\n            }\n        }\n        System.out.println(cnt);\n    }\n}\n",
            "c": "#include <stdio.h>\nchar g[300][300];\nint m, n;\nvoid dfs(int r, int c) {\n    if (r < 0 || r >= m || c < 0 || c >= n || g[r][c] != '1') return;\n    g[r][c] = '0';\n    dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1);\n}\nint main() {\n    if (scanf(\"%d %d\", &m, &n) != 2) return 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            scanf(\" %c\", &g[i][j]);\n        }\n    }\n    int cnt = 0;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (g[i][j] == '1') { cnt++; dfs(i, j); }\n        }\n    }\n    printf(\"%d\\n\", cnt);\n    return 0;\n}\n"
        },
        "hints": [
            "Traverse every cell in the grid; when hitting a '1', trigger a Flood Fill (DFS/BFS).",
            "Sink visited land cells to '0' to avoid visiting them again."
        ]
    },
    # 11. Dynamic Programming - Medium
    {
        "slug": "coin-change",
        "title": "Coin Change",
        "topic": "Dynamic Programming",
        "difficulty": "Medium",
        "description": "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
        "input_format": "First line: space-separated integers for `coins`. Second line: integer `amount`.",
        "output_format": "Print single integer: minimum coins required, or -1.",
        "constraints": "1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
        "examples": [
            {"input": "1 2 5\n11", "output": "3", "explanation": "11 = 5 + 5 + 1 (3 coins total)."}
        ],
        "test_cases": [
            {"input": "1 2 5\n11", "expected_output": "3", "is_hidden": False},
            {"input": "2\n3", "expected_output": "-1", "is_hidden": False},
            {"input": "1\n0", "expected_output": "0", "is_hidden": True},
            {"input": "1 5 10 25\n30", "expected_output": "2", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\n\ndef coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for a in range(1, amount + 1):\n        for c in coins:\n            if a - c >= 0:\n                dp[a] = min(dp[a], dp[a - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    if lines:\n        coins = list(map(int, lines[0].split()))\n        amount = int(lines[1])\n        print(coin_change(coins, amount))\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string line;\n    if (!getline(cin, line)) return 0;\n    stringstream ss(line);\n    vector<int> coins;\n    int val;\n    while (ss >> val) coins.push_back(val);\n    int amount;\n    if (cin >> amount) {\n        vector<int> dp(amount + 1, 1e9);\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++) {\n            for (int c : coins) {\n                if (a - c >= 0) dp[a] = min(dp[a], dp[a - c] + 1);\n            }\n        }\n        cout << (dp[amount] >= 1e9 ? -1 : dp[amount]) << endl;\n    }\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) return;\n        String[] parts = sc.nextLine().trim().split(\"\\\\s+\");\n        int[] coins = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) coins[i] = Integer.parseInt(parts[i]);\n        int amount = sc.nextInt();\n        int[] dp = new int[amount + 1];\n        Arrays.fill(dp, (int)1e9);\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++) {\n            for (int c : coins) {\n                if (a - c >= 0) dp[a] = Math.min(dp[a], dp[a - c] + 1);\n            }\n        }\n        System.out.println(dp[amount] >= 1e9 ? -1 : dp[amount]);\n    }\n}\n",
            "c": "#include <stdio.h>\nint main() {\n    int coins[50], n = 0;\n    char ch;\n    while (scanf(\"%d%c\", &coins[n++], &ch) == 2) if (ch == '\\n') break;\n    int amount;\n    if (scanf(\"%d\", &amount) == 1) {\n        int dp[10005];\n        for (int i = 0; i <= amount; i++) dp[i] = 1000000000;\n        dp[0] = 0;\n        for (int a = 1; a <= amount; a++) {\n            for (int i = 0; i < n; i++) {\n                if (a - coins[i] >= 0 && dp[a - coins[i]] + 1 < dp[a]) {\n                    dp[a] = dp[a - coins[i]] + 1;\n                }\n            }\n        }\n        printf(\"%d\\n\", dp[amount] >= 1000000000 ? -1 : dp[amount]);\n    }\n    return 0;\n}\n"
        },
        "hints": [
            "Let `dp[i]` be the fewest coins to make amount `i`.",
            "Recurrence: `dp[i] = min(dp[i], dp[i - coin] + 1)` for all coins where `i >= coin`."
        ]
    },
    # 12. Dynamic Programming - Hard
    {
        "slug": "longest-increasing-subsequence",
        "title": "Longest Increasing Subsequence",
        "topic": "Dynamic Programming",
        "difficulty": "Hard",
        "description": "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nA subsequence is an array that can be derived from another array by deleting some or no elements without changing the order of the remaining elements.",
        "input_format": "Single line: space-separated integers for `nums`.",
        "output_format": "Print single integer: length of LIS.",
        "constraints": "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
        "examples": [
            {"input": "10 9 2 5 3 7 101 18", "output": "4", "explanation": "The longest increasing subsequence is [2, 3, 7, 101], therefore the length is 4."}
        ],
        "test_cases": [
            {"input": "10 9 2 5 3 7 101 18", "expected_output": "4", "is_hidden": False},
            {"input": "0 1 0 3 2 3", "expected_output": "4", "is_hidden": False},
            {"input": "7 7 7 7 7", "expected_output": "1", "is_hidden": True}
        ],
        "starter_codes": {
            "python": "import sys\nimport bisect\n\ndef length_of_lis(nums):\n    tails = []\n    for x in nums:\n        idx = bisect.bisect_left(tails, x)\n        if idx == len(tails):\n            tails.append(x)\n        else:\n            tails[idx] = x\n    return len(tails)\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    if raw:\n        arr = list(map(int, raw.split()))\n        print(length_of_lis(arr))\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    vector<int> nums;\n    int val;\n    while (cin >> val) nums.push_back(val);\n    vector<int> tails;\n    for (int x : nums) {\n        auto it = lower_bound(tails.begin(), tails.end(), x);\n        if (it == tails.end()) tails.push_back(x);\n        else *it = x;\n    }\n    cout << tails.size() << endl;\n    return 0;\n}\n",
            "java": "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        List<Integer> nums = new ArrayList<>();\n        while (sc.hasNextInt()) nums.add(sc.nextInt());\n        List<Integer> tails = new ArrayList<>();\n        for (int x : nums) {\n            int idx = Collections.binarySearch(tails, x);\n            if (idx < 0) idx = -(idx + 1);\n            if (idx == tails.size()) tails.add(x);\n            else tails.set(idx, x);\n        }\n        System.out.println(tails.size());\n    }\n}\n",
            "c": "#include <stdio.h>\nint main() {\n    int nums[2505], n = 0;\n    while (scanf(\"%d\", &nums[n]) == 1) n++;\n    int dp[2505], max_len = 0;\n    for (int i = 0; i < n; i++) {\n        dp[i] = 1;\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;\n        }\n        if (dp[i] > max_len) max_len = dp[i];\n    }\n    printf(\"%d\\n\", max_len);\n    return 0;\n}\n"
        },
        "hints": [
            "An O(n²) approach uses dynamic programming: `dp[i] = max(dp[j] + 1)` where `j < i` and `nums[j] < nums[i]`.",
            "Can you optimize to O(n log n) using patience sorting with binary search?"
        ]
    }
]

async def seed_database(db: AsyncSession):
    """Populates badges, problems, daily challenge, and default demo users."""
    # 1. Seed Badges
    existing_badge = await db.execute(select(Badge).limit(1))
    if not existing_badge.scalar_one_or_none():
        for b_data in INITIAL_BADGES:
            db.add(Badge(**b_data))
        await db.commit()

    # 2. Seed Problems
    existing_prob = await db.execute(select(Problem).limit(1))
    if not existing_prob.scalar_one_or_none():
        for p_data in INITIAL_PROBLEMS:
            db.add(Problem(**p_data))
        await db.commit()

    # 3. Seed Users (Demo Learner and Admin)
    user_res = await db.execute(select(User).where(User.username == "codeninja"))
    demo_user = user_res.scalar_one_or_none()
    if not demo_user:
        demo_user = User(
            username="codeninja",
            email="demo@codementor.ai",
            hashed_password=pwd_context.hash("password123"),
            role="user",
            skill_level="Intermediate",
            xp=420,
            level=2,
            streak=4,
            last_active_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        )
        db.add(demo_user)
        await db.commit()
        await db.refresh(demo_user)

        # Seed pre-existing submissions & skills for demo user
        probs = (await db.execute(select(Problem))).scalars().all()
        prob_map = {p.slug: p for p in probs}

        if "two-sum" in prob_map:
            ts = prob_map["two-sum"]
            sub1 = Submission(
                user_id=demo_user.id,
                problem_id=ts.id,
                code=ts.starter_codes.get("python", ""),
                language="python",
                status="Accepted",
                runtime_ms=45.0,
                memory_kb=256.0,
                passed_tests=5,
                total_tests=5,
                ai_feedback={
                    "score": 92,
                    "logic_explanation": "Iterates through nums using a hash map to look up the difference in O(1) time.",
                    "time_complexity": "O(n) - Single pass through nums with O(1) dictionary lookups.",
                    "space_complexity": "O(n) - Auxiliary dictionary stores at most n elements.",
                    "bugs_identified": [],
                    "improvements": ["Consider type hinting for function arguments."],
                    "better_approach": "Already optimal O(n) time and O(n) space.",
                    "hints": ["Review how this hash map lookup pattern generalizes to 3Sum."]
                }
            )
            db.add(sub1)

            # Add skill for Arrays
            db.add(UserSkill(
                user_id=demo_user.id,
                topic="Arrays",
                score=85.0,
                problems_solved=1,
                total_attempts=1
            ))

        if "valid-palindrome" in prob_map:
            vp = prob_map["valid-palindrome"]
            sub2 = Submission(
                user_id=demo_user.id,
                problem_id=vp.id,
                code=vp.starter_codes.get("python", ""),
                language="python",
                status="Accepted",
                runtime_ms=38.0,
                memory_kb=256.0,
                passed_tests=4,
                total_tests=4,
                ai_feedback={
                    "score": 88,
                    "logic_explanation": "Filters alphanumeric characters and checks symmetry via string slicing.",
                    "time_complexity": "O(n) - Linear pass to filter and reverse.",
                    "space_complexity": "O(n) - Extra list allocated for filtered characters.",
                    "bugs_identified": [],
                    "improvements": ["Try solving using two pointers to achieve O(1) auxiliary space."],
                    "better_approach": "Two pointers from left and right skipping non-alphanumeric chars in-place.",
                    "hints": ["Can you advance pointers directly on the original string?"]
                }
            )
            db.add(sub2)

            db.add(UserSkill(
                user_id=demo_user.id,
                topic="Strings",
                score=75.0,
                problems_solved=1,
                total_attempts=1
            ))

        # Add initial badges for demo user
        badges = (await db.execute(select(Badge))).scalars().all()
        for b in badges[:2]:
            db.add(UserBadge(user_id=demo_user.id, badge_id=b.id))

        await db.commit()

    # Seed Admin User
    admin_res = await db.execute(select(User).where(User.username == "admin"))
    if not admin_res.scalar_one_or_none():
        admin_user = User(
            username="admin",
            email="admin@codementor.ai",
            hashed_password=pwd_context.hash("admin123"),
            role="admin",
            skill_level="Advanced",
            xp=1500,
            level=6,
            streak=12,
            last_active_date=datetime.now(timezone.utc).strftime("%Y-%m-%d")
        )
        db.add(admin_user)
        await db.commit()

    # Seed Daily Challenge
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    daily_res = await db.execute(select(DailyChallenge).where(DailyChallenge.date == today_str))
    if not daily_res.scalar_one_or_none():
        prob = (await db.execute(select(Problem).order_by(Problem.id))).scalars().first()
        if prob:
            db.add(DailyChallenge(problem_id=prob.id, date=today_str, bonus_xp=100))
            await db.commit()
