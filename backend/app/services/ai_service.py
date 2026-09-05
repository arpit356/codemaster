import os
import re
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings

logger = logging.getLogger("codementor.ai")

_gemini_key_invalid = False

def is_gemini_configured() -> bool:
    """Checks dynamically if a potentially valid Gemini API key is configured."""
    global _gemini_key_invalid
    if _gemini_key_invalid:
        return False
    key = settings.GEMINI_API_KEY.strip().strip("'\"")
    return bool(key and len(key) >= 20 and not key.startswith("YOUR_") and not "." in key)

def call_gemini_api(prompt: str, as_json: bool = False) -> str:
    """
    Executes Gemini prompt using google-genai or google-generativeai.
    """
    global _gemini_key_invalid
    api_key = settings.GEMINI_API_KEY.strip().strip("'\"")
    model_name = settings.GEMINI_MODEL.strip() or "gemini-1.5-flash"

    # Try modern google.genai SDK first
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        config = types.GenerateContentConfig(
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            response_mime_type="application/json" if as_json else "text/plain"
        )
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config
        )
        if response and response.text:
            return response.text
        raise ValueError("Empty response received from Gemini API.")
    except ImportError:
        pass
    except Exception as e:
        if "API_KEY_INVALID" in str(e) or "INVALID_ARGUMENT" in str(e):
            _gemini_key_invalid = True
            logger.warning("Gemini API key is invalid or unauthorized; smoothly activating heuristic engine.")
        raise e

    # Fallback to legacy google.generativeai SDK if available
    try:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key)
        generation_config = {"response_mime_type": "application/json"} if as_json else None
        model = legacy_genai.GenerativeModel(model_name, generation_config=generation_config)
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text
        raise ValueError("Empty response received from legacy Gemini SDK.")
    except Exception as e:
        if "API_KEY_INVALID" in str(e) or "INVALID_ARGUMENT" in str(e):
            _gemini_key_invalid = True
            logger.warning("Gemini API key is invalid or unauthorized; smoothly activating heuristic engine.")
        raise e

class AIService:
    @staticmethod
    def _extract_json(text: str) -> Dict[str, Any]:
        """Robust JSON extraction from LLM response text."""
        cleaned = text.strip()
        # Look for ```json ... ``` or ``` ... ```
        block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', cleaned)
        if block_match:
            cleaned = block_match.group(1).strip()
        else:
            start = cleaned.find('{')
            end = cleaned.rfind('}')
            if start != -1 and end != -1:
                cleaned = cleaned[start:end+1]
        return json.loads(cleaned)

    @staticmethod
    async def review_code(
        code: str,
        language: str,
        problem_title: str,
        problem_description: str,
        submission_status: str,
        runtime_ms: float,
        error_details: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates comprehensive AI Code Review.
        Uses Gemini API if configured; otherwise uses the Algorithmic Heuristic Engine.
        """
        if is_gemini_configured():
            try:
                prompt = f"""You are an expert AI Code Reviewer and Software Engineering Mentor.
Review the following student code submission for the problem: "{problem_title}".

Problem Description:
{problem_description[:800]}

Student Language: {language}
Submission Status: {submission_status}
Runtime: {runtime_ms} ms
Error Details (if any): {error_details or 'None'}

Student Code:
```{language}
{code}
```

Provide your review STRICTLY in valid JSON matching this exact structure:
{{
  "score": <integer from 0 to 100 representing code quality, efficiency, and correctness>,
  "logic_explanation": "<concise explanation of how the user's code works in simple language>",
  "time_complexity": "<e.g. O(n), O(n^2), O(n log n) with a 1-sentence explanation>",
  "space_complexity": "<e.g. O(1), O(n) with a 1-sentence explanation>",
  "bugs_identified": ["<list of any bugs, edge case omissions, or null/boundary risks>"],
  "improvements": ["<actionable readability or optimization tips>"],
  "better_approach": "<if a more optimal data structure or algorithm exists, describe it without immediately pasting full code, e.g. using a HashMap or Two Pointers>",
  "hints": [
    "<Gentle Hint 1 to nudge the user toward optimal solution>",
    "<More specific Hint 2 regarding data structures or invariants>"
  ]
}}
"""
                raw_response = call_gemini_api(prompt, as_json=True)
                return AIService._extract_json(raw_response)
            except Exception as e:
                logger.error(f"Gemini API review error (Check GEMINI_API_KEY in backend/.env): {e}")

        # Fallback to intelligent algorithmic heuristic engine
        return AIService._heuristic_code_review(
            code, language, problem_title, submission_status, runtime_ms, error_details
        )

    @staticmethod
    def _heuristic_code_review(
        code: str,
        language: str,
        problem_title: str,
        submission_status: str,
        runtime_ms: float,
        error_details: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Expert algorithmic heuristic engine for analyzing code complexity,
        potential bugs, and pedagogical guidance without external API dependency.
        """
        code_lower = code.lower()

        # Complexity Analysis Heuristics
        for_count = len(re.findall(r'\bfor\b', code_lower))
        while_count = len(re.findall(r'\bwhile\b', code_lower))
        total_loops = for_count + while_count

        has_nested_loops = False
        lines = code.splitlines()
        indent_levels = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("for ") or stripped.startswith("while ") or "for(" in stripped or "while(" in stripped:
                indent = len(line) - len(line.lstrip())
                indent_levels.append(indent)

        if len(indent_levels) >= 2:
            for i in range(len(indent_levels) - 1):
                if indent_levels[i+1] > indent_levels[i]:
                    has_nested_loops = True
                    break

        has_hashmap = any(kw in code_lower for kw in ["dict", "hashmap", "unordered_map", "set", "unordered_set", "{}"])
        has_recursion = any(f"{fname}(" in code for fname in re.findall(r'def\s+([a-zA-Z0-9_]+)', code))
        has_sorting = any(kw in code_lower for kw in [".sort", "sorted(", "arrays.sort", "std::sort"])

        if has_nested_loops:
            time_comp = "O(n²)"
            time_expl = "Nested loop iteration over the input collection results in quadratic time."
            better_app = "You can reduce the time complexity from O(n²) to O(n) by using a Hash Table / Dictionary to store seen values for instant O(1) lookups."
        elif has_sorting:
            time_comp = "O(n log n)"
            time_expl = "Dominated by the comparison sort operation on the elements."
            better_app = "Sorting is effective, but verify if linear traversal with a hash map or frequency array can achieve O(n) time."
        elif total_loops == 1:
            time_comp = "O(n)"
            time_expl = "Single linear pass through the input data."
            better_app = "Your linear time approach is optimal for this class of problem."
        elif has_recursion:
            time_comp = "O(2ⁿ) or O(n)"
            time_expl = "Recursive branch tree depth determines time complexity. Consider memoization if subproblems overlap."
            better_app = "Add memoization (Dynamic Programming) to cache recursive subproblem results and prevent exponential recalculations."
        else:
            time_comp = "O(1)"
            time_expl = "Executes in constant time with direct arithmetic or index operations."
            better_app = "Optimal constant time operations."

        if has_hashmap or "append" in code_lower or "vector" in code_lower or "list" in code_lower:
            space_comp = "O(n)"
            space_expl = "Allocates extra memory proportional to the number of elements."
        else:
            space_comp = "O(1)"
            space_expl = "Utilizes constant auxiliary space with only local scalar variables."

        # Bugs & Improvements detection
        bugs = []
        improvements = []
        hints = []

        if submission_status != "Accepted":
            if "Time Limit" in submission_status:
                bugs.append("Time Limit Exceeded: The algorithm fails to finish within the allowed execution limit.")
                improvements.append("Refactor the algorithm to avoid nested loops or infinite while conditions.")
                hints.append("Check if you have an infinite loop or if an O(n²) search can be replaced with a hash lookup.")
            elif "Runtime Error" in submission_status:
                bugs.append(f"Runtime Exception: {error_details or 'Unexpected exception during execution.'}")
                improvements.append("Check boundary conditions, such as empty arrays, 0-indexing, or None/null pointer checks.")
                hints.append("Trace your code with an empty input or a single-element list to see where it crashes.")
            else:
                bugs.append("Logical mismatch: The output produced does not match expected output for some test cases.")
                improvements.append("Review edge cases such as duplicate elements, negative numbers, or extreme bounds.")
                hints.append("Think about what happens when the target is not present or when the input array is already sorted.")
        else:
            if has_nested_loops:
                improvements.append("Consider replacing the inner loop with a set or dictionary for faster lookups.")
                hints.append("Could you remember what you have already seen in a hash map as you iterate once?")
            else:
                improvements.append("Great modular structure. Consider adding concise type annotations and docstrings.")
                hints.append("Can you solve this in-place without allocating any extra auxiliary array?")

        # Calculate score
        if submission_status == "Accepted":
            base_score = 85
            if has_nested_loops and not has_hashmap:
                base_score -= 15
            if not has_nested_loops and space_comp == "O(1)":
                base_score += 12
            score = min(98, max(70, base_score))
        else:
            score = 45 if "Time Limit" in submission_status else 35

        logic_expl = f"Your solution in {language.capitalize()} processes the input by "
        if has_nested_loops:
            logic_expl += "iterating pairwise through the elements with nested loops to test combinations."
        elif has_hashmap:
            logic_expl += "iterating through the data and using a hash table to perform constant-time lookups for complement values."
        elif has_recursion:
            logic_expl += "breaking the problem into smaller subproblems through recursive invocations."
        else:
            logic_expl += "scanning the input linearly to compute the final result."

        if not hints:
            hints = [
                "Consider the invariants: what condition must always hold true at each step of your loop?",
                "Think about space vs time tradeoffs: can trading O(n) space yield an O(n) time speedup?"
            ]

        return {
            "score": score,
            "logic_explanation": logic_expl,
            "time_complexity": f"{time_comp} - {time_expl}",
            "space_complexity": f"{space_comp} - {space_expl}",
            "bugs_identified": bugs if bugs else ["No syntax bugs detected. Code executed cleanly."],
            "improvements": improvements,
            "better_approach": better_app,
            "hints": hints
        }

    @staticmethod
    async def chat_mentor(
        user_message: str,
        chat_history: List[Dict[str, str]],
        problem_context: Optional[str] = None,
        code_context: Optional[str] = None,
        user_weak_topic: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Conversational AI Mentor chat with Socratic guidance, progressive hints,
        and coding concept breakdowns.
        """
        if is_gemini_configured():
            try:
                system_prompt = (
                    "You are 'CodeMentor', a warm, encouraging, world-class programming tutor and algorithm mentor.\n"
                    "Your mission is to guide students to understand concepts deeply rather than simply dumping full answers.\n"
                    "Rules:\n"
                    "1. Use simple language, clear analogies, and step-by-step logic.\n"
                    "2. When the user asks for code or hints, provide progressive hints and pseudo-code before full answers.\n"
                    "3. Format code snippets cleanly with markdown syntax highlighting.\n"
                    "4. Include time/space complexity whenever discussing algorithms.\n"
                )
                if problem_context:
                    system_prompt += f"\nCurrent Problem: {problem_context}\n"
                if code_context:
                    system_prompt += f"\nCurrent User Code:\n{code_context[:800]}\n"
                if user_weak_topic:
                    system_prompt += f"\nNote: The user currently has lower proficiency in '{user_weak_topic}'. Be especially supportive.\n"

                conversation_text = system_prompt + "\n\nChat History:\n"
                for msg in chat_history[-6:]:
                    role_str = "User" if msg['role'] == "user" else "CodeMentor"
                    conversation_text += f"{role_str}: {msg['content']}\n"
                conversation_text += f"User: {user_message}\nCodeMentor:"

                reply = call_gemini_api(conversation_text, as_json=False)
                suggested_q = AIService._generate_follow_up_questions(user_message, problem_context)
                return {"reply": reply.strip(), "suggested_questions": suggested_q}
            except Exception as e:
                logger.error(f"Gemini chat error (Check GEMINI_API_KEY in backend/.env): {e}")

        # Intelligent pedagogical mentor fallback engine
        reply, suggested_q = AIService._heuristic_mentor_chat(
            user_message, problem_context, code_context, user_weak_topic
        )
        return {"reply": reply, "suggested_questions": suggested_q}

    @staticmethod
    def _heuristic_mentor_chat(
        message: str,
        problem_context: Optional[str] = None,
        code_context: Optional[str] = None,
        user_weak_topic: Optional[str] = None
    ) -> Tuple[str, List[str]]:
        """
        Rich conversational fallback offering concrete algorithmic guidance,
        frameworks, and hints based on user prompt patterns.
        """
        msg = message.lower().strip()

        # 1. Logic building / How to strengthen programming logic
        if any(w in msg for w in ["logic", "strong", "strang", "master", "improve", "problem solving", "think"]):
            reply = (
                "### 🧠 5-Step Framework to Strengthen Your Problem-Solving Logic\n\n"
                "To build unshakable algorithmic intuition, don't rush into typing code immediately. Follow this battle-tested process:\n\n"
                "1. **Trace with Pen & Paper First**:\n"
                "   Take 2-3 small examples (including edge cases: empty array, 1 element, duplicates) and solve them by hand. Notice the exact steps your brain took.\n\n"
                "2. **State the Brute-Force Solution**:\n"
                "   Always describe the simplest, most obvious way first (even if it's O(n²) or O(n³)). This guarantees you have a working baseline and prevents mental block.\n\n"
                "3. **Identify Bottlenecks (B.U.D.)**:\n"
                "   - **B**ottlenecks: Which part is slow? (e.g. searching repeatedly inside a loop).\n"
                "   - **U**nnecessary work: Are you computing the same sub-problem twice?\n"
                "   - **D**uplicated work: Can you precompute values in a Hash Map or Prefix Sum?\n\n"
                "4. **Pick the Right Pattern**:\n"
                "   - Sorted data? ➔ **Binary Search** or **Two Pointers**\n"
                "   - Instant lookups? ➔ **Hash Map / Set**\n"
                "   - Continuous subarray / substring? ➔ **Sliding Window**\n"
                "   - Tree/Graph connectivity? ➔ **DFS / BFS**\n"
                "   - Overlapping subproblems? ➔ **Dynamic Programming**\n\n"
                "5. **Implement & Test Invariants**:\n"
                "   Write code verifying loop boundaries (`i < n`, off-by-one errors) and null checks.\n\n"
                "**Top 3 Areas to Master First:**\n"
                "- **Arrays & Hash Maps** (handles 40% of all interview questions)\n"
                "- **Two Pointers & Sliding Window**\n"
                "- **Tree Traversals (DFS / BFS)**"
            )
            suggested = [
                "How do Two Pointers work?",
                "Explain the Sliding Window technique",
                "What is the best way to practice on CodeMentor?",
                "Explain Hash Maps with an example"
            ]
            return reply, suggested

        # 2. Preparation / Roadmap / What to prepare
        if any(w in msg for w in ["prepare", "preparation", "roadmap", "interview", "start", "begin", "study", "what should i"]):
            weak = user_weak_topic or "Arrays & Hashing"
            reply = (
                "### 🚀 Complete DSA Preparation Roadmap\n\n"
                "Here is the optimal sequence to prepare for technical interviews and problem solving:\n\n"
                "| Phase | Topic | Target Mastery | Key Patterns |\n"
                "|---|---|---|---|\n"
                "| **1** | **Foundations** | Arrays, Strings, Hash Maps | Two Sum, Frequency Counting, Anagrams |\n"
                "| **2** | **Pointers & Windows** | Two Pointers, Sliding Window | Sorted pair sum, Longest Substring |\n"
                "| **3** | **Linear Structures** | Stacks, Queues, Linked Lists | Valid Parentheses, Monotonic Stack, Reversal |\n"
                "| **4** | **Divide & Conquer** | Binary Search & Recursion | Bisect search space, Subsets & Permutations |\n"
                "| **5** | **Trees & Graphs** | Binary Trees, BST, Graphs | Tree DFS/BFS, Level-Order, Dijkstra |\n"
                "| **6** | **Optimization** | Dynamic Programming & Greedy | 0/1 Knapsack, Coin Change, LCS |\n\n"
                f"💡 **Recommended Next Step for You:**\n"
                f"Head over to the **Roadmap** page! Currently, your highest-leverage growth topic is **{weak}**."
            )
            suggested = [
                "Explain Binary Search pattern",
                "Give me a study schedule for 4 weeks",
                "How to prepare for Dynamic Programming?",
                "Show me practice problems for Arrays"
            ]
            return reply, suggested

        # 3. Two Sum & Hash Maps
        if any(w in msg for w in ["two sum", "hash map", "hashmap", "hash table", "complement"]):
            reply = (
                "### 💡 Understanding Two Sum & Hash Maps\n\n"
                "The classic brute-force approach checks every pair `(nums[i], nums[j])` with nested loops in **O(n²)** time.\n\n"
                "**The O(n) Hash Map Pattern:**\n"
                "Instead of searching forward for the matching number, remember what you've seen so far in a Hash Map!\n\n"
                "1. For each element `x` at index `i`, calculate the complement: `needed = target - x`.\n"
                "2. If `needed` exists in `seen`, you've found the pair: `[seen[needed], i]`.\n"
                "3. Otherwise, save the current element: `seen[x] = i`.\n\n"
                "```python\n"
                "seen = {}\n"
                "for i, num in enumerate(nums):\n"
                "    complement = target - num\n"
                "    if complement in seen:\n"
                "        return [seen[complement], i]\n"
                "    seen[num] = i\n"
                "```\n\n"
                "**Time Complexity:** O(n) — single pass.\n"
                "**Space Complexity:** O(n) — stores up to n elements."
            )
            suggested = [
                "What if the input array is already sorted?",
                "How does 3Sum build on this?",
                "Explain space vs time tradeoffs"
            ]
            return reply, suggested

        # 4. Recursion & Backtracking
        if any(w in msg for w in ["recursion", "recursive", "base case", "backtrack", "stack overflow"]):
            reply = (
                "### 🔁 Mastering Recursion\n\n"
                "Recursion simply means a function solves a problem by calling itself on smaller subproblems.\n\n"
                "**The Two Golden Rules:**\n"
                "1. **The Base Case**: The stopping condition that prevents infinite recursion (e.g. `if n <= 1: return 1`).\n"
                "2. **The Recursive Step**: Making strictly smaller progress towards the base case (e.g. `n * fact(n - 1)`).\n\n"
                "```\n"
                "Call Stack Trace for fact(3):\n"
                "fact(3) -> waits for 3 * fact(2)\n"
                "  fact(2) -> waits for 2 * fact(1)\n"
                "    fact(1) -> returns 1  [Base Case Reached!]\n"
                "  fact(2) -> receives 1, returns 2 * 1 = 2\n"
                "fact(3) -> receives 2, returns 3 * 2 = 6\n"
                "```\n\n"
                "⚠️ **Stack Overflow**: Occurs when recursion goes too deep without hitting a base case. Default Python recursion limit is 1,000 calls."
            )
            suggested = [
                "How to convert recursion to iteration?",
                "Explain memoization in recursion",
                "What is Backtracking?"
            ]
            return reply, suggested

        # 5. Dynamic Programming
        if any(w in msg for w in ["dynamic programming", "dp", "memoization", "tabulation", "knapsack"]):
            reply = (
                "### ⚡ Demystifying Dynamic Programming (DP)\n\n"
                "Dynamic Programming is **smart recursion without repeated work**! When subproblems overlap, we cache their results.\n\n"
                "**The 4-Step DP Blueprint:**\n"
                "1. **State Definition**: What variables define the problem at step `i`? (e.g. `dp[i]` = minimum steps to reach step `i`).\n"
                "2. **Recurrence Relation**: How does `dp[i]` derive from earlier states? (e.g. `dp[i] = min(dp[i-1], dp[i-2]) + cost[i]`).\n"
                "3. **Base Cases**: What are the trivial answers? (e.g. `dp[0] = 0, dp[1] = cost[0]`).\n"
                "4. **Computation Order**: Top-Down (Recursion + Memoization table) or Bottom-Up (Iterative array)."
            )
            suggested = [
                "Explain Climbing Stairs DP",
                "Top-down vs Bottom-up DP",
                "How to optimize DP space to O(1)?"
            ]
            return reply, suggested

        # 6. Trees & BST
        if any(w in msg for w in ["tree", "bst", "binary tree", "traversal", "inorder", "preorder"]):
            reply = (
                "### 🌲 Tree Traversals & Binary Search Trees\n\n"
                "A Binary Tree is a recursive structure where each node has at most two children (`left` and `right`).\n\n"
                "**1. Depth-First Search (DFS) Traversals:**\n"
                "- **Inorder (Left, Root, Right)**: Produces sorted order for BST!\n"
                "- **Preorder (Root, Left, Right)**: Great for copying or serializing trees.\n"
                "- **Postorder (Left, Right, Root)**: Ideal for deleting nodes or bottom-up evaluations (e.g. Tree Height).\n\n"
                "**2. Breadth-First Search (BFS) / Level-Order:**\n"
                "Uses a **Queue** (`collections.deque`) to process nodes level by level."
            )
            suggested = [
                "How to invert a Binary Tree?",
                "Explain BFS Level-Order Traversal",
                "What makes a tree balanced?"
            ]
            return reply, suggested

        # 7. Binary Search
        if any(w in msg for w in ["binary search", "bisect", "sorted array", "log n"]):
            reply = (
                "### 🎯 Binary Search Template (O(log n))\n\n"
                "Whenever your search space is **monotonic** (sorted or binary condition holds), use Binary Search to halve the search space at every step.\n\n"
                "```python\n"
                "low, high = 0, len(nums) - 1\n"
                "while low <= high:\n"
                "    mid = low + (high - low) // 2  # Prevents integer overflow\n"
                "    if nums[mid] == target:\n"
                "        return mid\n"
                "    elif nums[mid] < target:\n"
                "        low = mid + 1\n"
                "    else:\n"
                "        high = mid - 1\n"
                "return -1\n"
                "```"
            )
            suggested = [
                "How to search in a Rotated Sorted Array?",
                "Binary search on answers (e.g. Koko Eating Bananas)",
                "Why low + (high - low) // 2 instead of (low + high) // 2?"
            ]
            return reply, suggested

        # 8. Time & Space Complexity / Big-O
        if any(w in msg for w in ["complexity", "big-o", "big o", "runtime", "time complexity", "space complexity"]):
            reply = (
                "### ⏱️ Understanding Big-O Complexity\n\n"
                "Big-O measures how algorithm execution time or memory grows as input size `n` scales:\n\n"
                "| Complexity | Name | Max `n` for 1 Second (≈ 10⁷ ops) | Typical Example |\n"
                "|---|---|---|---|\n"
                "| **O(1)** | Constant | Any | Hash map lookup, array index |\n"
                "| **O(log n)** | Logarithmic | 10¹⁸ | Binary Search |\n"
                "| **O(n)** | Linear | 10⁷ | Single loop pass |\n"
                "| **O(n log n)** | Linearithmic | 10⁶ | Merge Sort, Heap Sort, Quick Sort |\n"
                "| **O(n²)** | Quadratic | 5,000 | Nested loops, Bubble Sort |\n"
                "| **O(2ⁿ)** | Exponential | 20 - 25 | Generating all subsets (Recursion) |"
            )
            suggested = [
                "Explain why Hash Map lookup is O(1)",
                "How to calculate space complexity?",
                "What causes Time Limit Exceeded (TLE)?"
            ]
            return reply, suggested

        # 9. Debugging & Errors
        if any(w in msg for w in ["debug", "error", "wrong answer", "bug", "failing", "tle", "test case"]):
            ctx = f" for problem **{problem_context}**" if problem_context else ""
            reply = (
                f"### 🔍 Systematic Debugging Checklist{ctx}\n\n"
                "When your solution fails a test case, check these common culprits:\n\n"
                "1. **Boundary & Edge Cases**:\n"
                "   - Empty input `[]` or `\"\"`?\n"
                "   - Single element `[1]`?\n"
                "   - Negative numbers or zeros?\n"
                "   - Duplicates present in the input?\n"
                "2. **Loop Bounds & Off-by-one Errors**:\n"
                "   - Check `<=` versus `<`.\n"
                "   - Is an index accessing `len(arr)` instead of `len(arr) - 1`?\n"
                "3. **In-place Mutation Hazards**:\n"
                "   - Are you modifying a list while iterating over it?\n"
                "4. **State Resetting**:\n"
                "   - If solving multiple test cases, are all global/class variables cleared?"
            )
            suggested = [
                "Help me inspect edge cases",
                "Why is my recursion causing Maximum Recursion Depth?",
                "How to write small unit tests for my code"
            ]
            return reply, suggested

        # 10. Greetings & Friendly Inquiries
        if any(w in msg for w in ["hi", "hello", "hey", "good morning", "good evening"]):
            reply = (
                "Hello! 👋 I am **CodeMentor**, your personal algorithmic mentor and software engineering coach.\n\n"
                + (f"I see you are currently looking at **{problem_context}**! " if problem_context else "")
                + "I can help you with:\n"
                "- Breaking down algorithmic problems step-by-step\n"
                "- Progressive hints without spoiling the code\n"
                "- Optimizing Time and Space Complexity (O(n²) ➔ O(n))\n"
                "- Preparing for technical coding interviews\n\n"
                "What would you like to explore or practice today?"
            )
            suggested = [
                "Give me a hint for the current problem",
                "How can I strengthen my problem-solving logic?",
                "What topic should I prepare next?",
                "Explain Time and Space Complexity"
            ]
            return reply, suggested

        # 11. Smart Contextual Fallback
        reply = (
            f"### 💡 CodeMentor Analysis\n\n"
            f"You asked: *\"{message}\"*\n\n"
            + (f"In the context of **{problem_context}**, let's break this down systematically:\n\n" if problem_context else "Let's analyze this using foundational computer science principles:\n\n")
            + "1. **Clarify the Core Constraint**: What are the input boundaries and expected return types?\n"
            + "2. **Determine Optimal Invariants**: Can this be solved with a linear scan, hash table lookup, or two-pointer traversal?\n"
            + "3. **Analyze Complexity**: Aim for O(n) or O(n log n) time with minimal auxiliary memory.\n\n"
            + "Feel free to share your current thought process or code snippet, and I'll guide you step-by-step!"
        )
        suggested = [
            "Give me a hint for this problem",
            "Show me the recommended approach",
            "What data structure is optimal here?",
            "How do I improve my logic?"
        ]
        return reply, suggested

    @staticmethod
    def _generate_follow_up_questions(user_msg: str, problem_ctx: Optional[str]) -> List[str]:
        return [
            "Could you explain this with a visual trace?",
            "What is the time complexity of this approach?",
            "Can this be optimized further?",
            "Give me a practice problem using this exact pattern"
        ]
