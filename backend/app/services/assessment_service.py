from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models import User, Problem, Submission, UserSkill, Badge, UserBadge
from datetime import datetime, timezone

ALL_TOPICS = [
    "Arrays",
    "Strings",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Recursion",
    "Trees",
    "Graphs",
    "Dynamic Programming"
]

ROADMAP_STAGES = [
    {"id": "stage-basics", "title": "Programming Basics", "topic": "Arrays", "difficulty": "Easy", "description": "Master algorithmic primitives, arrays, index manipulation, and conditionals."},
    {"id": "stage-arrays", "title": "Arrays & Two Pointers", "topic": "Arrays", "difficulty": "Medium", "description": "In-place modifications, frequency counts, prefix sums, and sliding windows."},
    {"id": "stage-strings", "title": "Strings & Pattern Matching", "topic": "Strings", "difficulty": "Easy", "description": "Character hashing, anagrams, palindrome palindromic substrings, and parsing."},
    {"id": "stage-recursion", "title": "Recursion & Backtracking", "topic": "Recursion", "difficulty": "Medium", "description": "Call stack frames, base cases, permutations, and subsets."},
    {"id": "stage-linkedlists", "title": "Linked Lists & Pointers", "topic": "Linked Lists", "difficulty": "Medium", "description": "Fast/slow pointers, node reversals, cycles, and dummy head nodes."},
    {"id": "stage-stacksqueues", "title": "Stacks & Queues", "topic": "Stacks", "difficulty": "Medium", "description": "LIFO/FIFO invariants, monotonic stacks, and parenthetical matching."},
    {"id": "stage-trees", "title": "Trees & Binary Search Trees", "topic": "Trees", "difficulty": "Medium", "description": "Inorder/Preorder/Postorder DFS, Level-order BFS, and tree balancing."},
    {"id": "stage-graphs", "title": "Graphs & Traversals", "topic": "Graphs", "difficulty": "Hard", "description": "Adjacency representations, Dijkstra, topological sort, and cycles."},
    {"id": "stage-dp", "title": "Dynamic Programming", "topic": "Dynamic Programming", "difficulty": "Hard", "description": "State transition matrices, 1D/2D memoization, and optimal substructure."}
]

DIFFICULTY_WEIGHTS = {
    "Easy": 1.0,
    "Medium": 2.2,
    "Hard": 3.8
}

class AssessmentService:
    @staticmethod
    async def update_user_skills(db: AsyncSession, user_id: int, topic: str):
        """
        Recalculates user's skill score in a given topic based on:
        - Problems solved in topic
        - Solved difficulty levels
        - Success rate (accepted / attempts)
        - Attempts per problem
        """
        # Fetch all submissions by this user for problems in this topic
        stmt = (
            select(Submission, Problem)
            .join(Problem, Submission.problem_id == Problem.id)
            .where(and_(Submission.user_id == user_id, Problem.topic == topic))
        )
        result = await db.execute(stmt)
        submissions = result.all()

        if not submissions:
            return

        total_attempts = len(submissions)
        accepted_subs = [s for s, p in submissions if s.status == "Accepted"]
        solved_problem_ids = set(p.id for s, p in submissions if s.status == "Accepted")
        problems_solved_count = len(solved_problem_ids)

        # Calculate weighted score
        # 1. Base difficulty points for solved problems
        weighted_points = 0.0
        max_possible_points = 30.0  # reference benchmark

        for s, p in submissions:
            if s.status == "Accepted" and p.id in solved_problem_ids:
                weight = DIFFICULTY_WEIGHTS.get(p.difficulty, 1.0)
                weighted_points += (weight * 10.0)
                # Count once per problem
                solved_problem_ids.remove(p.id)

        # 2. Acceptance accuracy multiplier (0.5 to 1.0)
        accuracy = (len(accepted_subs) / total_attempts) if total_attempts > 0 else 1.0
        accuracy_multiplier = 0.6 + (0.4 * accuracy)

        calculated_score = min(100.0, (weighted_points / max_possible_points) * 100.0 * accuracy_multiplier)
        calculated_score = round(max(0.0, calculated_score), 1)

        # Update or create UserSkill record
        skill_stmt = select(UserSkill).where(and_(UserSkill.user_id == user_id, UserSkill.topic == topic))
        skill_res = await db.execute(skill_stmt)
        user_skill = skill_res.scalar_one_or_none()

        if not user_skill:
            user_skill = UserSkill(
                user_id=user_id,
                topic=topic,
                score=calculated_score,
                problems_solved=problems_solved_count,
                total_attempts=total_attempts
            )
            db.add(user_skill)
        else:
            user_skill.score = calculated_score
            user_skill.problems_solved = problems_solved_count
            user_skill.total_attempts = total_attempts

        await db.commit()

    @staticmethod
    async def get_user_assessment_overview(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """
        Gathers comprehensive skill assessment data across all 9 topics,
        finding strongest, weakest, and solved problem difficulty counts.
        """
        # Fetch user skills
        skill_stmt = select(UserSkill).where(UserSkill.user_id == user_id)
        skill_res = await db.execute(skill_stmt)
        skills_map = {s.topic: s for s in skill_res.scalars().all()}

        # Build topic scores list
        topic_scores = []
        for topic in ALL_TOPICS:
            if topic in skills_map:
                sk = skills_map[topic]
                score = sk.score
                solved = sk.problems_solved
                attempts = sk.total_attempts
            else:
                score = 0.0
                solved = 0
                attempts = 0

            status = "Mastered" if score >= 80 else ("Proficient" if score >= 60 else ("Developing" if score >= 35 else "Novice"))
            topic_scores.append({
                "topic": topic,
                "score": score,
                "problems_solved": solved,
                "total_attempts": attempts,
                "status": status
            })

        # Calculate overall score
        active_scores = [t["score"] for t in topic_scores if t["problems_solved"] > 0]
        overall_score = round(sum(active_scores) / len(active_scores), 1) if active_scores else 0.0

        # Solved counts by difficulty
        solved_sub_stmt = (
            select(Problem.difficulty, func.count(func.distinct(Problem.id)))
            .join(Submission, Submission.problem_id == Problem.id)
            .where(and_(Submission.user_id == user_id, Submission.status == "Accepted"))
            .group_by(Problem.difficulty)
        )
        diff_res = await db.execute(solved_sub_stmt)
        diff_dict = {"Easy": 0, "Medium": 0, "Hard": 0}
        total_solved = 0
        for diff, count in diff_res.all():
            diff_dict[diff] = count
            total_solved += count

        # Identify strongest and weakest topic
        sorted_by_score = sorted(topic_scores, key=lambda x: (x["score"], x["problems_solved"]))
        weakest = sorted_by_score[0]["topic"] if sorted_by_score else "Recursion"
        
        # Strongest is the highest scored with at least 1 attempt, or top element
        attempted = [t for t in sorted_by_score if t["total_attempts"] > 0]
        strongest = attempted[-1]["topic"] if attempted else "Arrays"

        return {
            "overall_score": overall_score,
            "total_solved": total_solved,
            "solved_by_difficulty": diff_dict,
            "strongest_topic": strongest,
            "weakest_topic": weakest,
            "topic_scores": topic_scores,
            "recent_trend": "+12% efficiency improvement this week" if total_solved > 0 else "Ready to assess skills"
        }

    @staticmethod
    async def get_personalized_roadmap(db: AsyncSession, user_id: int) -> Dict[str, Any]:
        """
        Constructs an adaptive, personalized learning path.
        Automatically recommends review / beginner reinforcement if a topic is weak.
        """
        overview = await AssessmentService.get_user_assessment_overview(db, user_id)
        topic_scores_map = {t["topic"]: t for t in overview["topic_scores"]}
        
        # User level
        total_solved = overview["total_solved"]
        if total_solved >= 10:
            current_level = "Advanced"
        elif total_solved >= 4:
            current_level = "Intermediate"
        else:
            current_level = "Beginner"

        # Fetch solved problems for user
        solved_stmt = (
            select(Problem.id)
            .join(Submission, Submission.problem_id == Problem.id)
            .where(and_(Submission.user_id == user_id, Submission.status == "Accepted"))
        )
        solved_ids = set((await db.execute(solved_stmt)).scalars().all())

        nodes = []
        completed_nodes = 0
        prev_completed = True

        for idx, stage in enumerate(ROADMAP_STAGES):
            topic = stage["topic"]
            sk = topic_scores_map.get(topic, {"score": 0.0, "problems_solved": 0, "total_attempts": 0})
            score = sk["score"]
            solved_count = sk["problems_solved"]
            attempts = sk["total_attempts"]

            # Fetch matching problems for this stage
            prob_stmt = select(Problem).where(and_(Problem.topic == topic, Problem.difficulty == stage["difficulty"])).limit(3)
            prob_res = await db.execute(prob_stmt)
            stage_problems = prob_res.scalars().all()

            prob_list = []
            for p in stage_problems:
                prob_list.append({
                    "id": p.id,
                    "slug": p.slug,
                    "title": p.title,
                    "difficulty": p.difficulty,
                    "topic": p.topic,
                    "acceptance_rate": p.acceptance_rate,
                    "is_solved": p.id in solved_ids
                })

            # Determine node status
            remediation_note = None
            if score >= 70 or solved_count >= 2:
                status = "completed"
                completed_nodes += 1
                prev_completed = True
            elif attempts > 0 and score < 45:
                # Weak topic alert!
                status = "recommended_review"
                remediation_note = f"Score is currently {score}%. We recommend practicing foundational {stage['difficulty']} exercises before advancing."
                prev_completed = False
            elif prev_completed:
                status = "in_progress"
                prev_completed = False
            else:
                status = "locked"

            nodes.append({
                "id": stage["id"],
                "title": stage["title"],
                "topic": stage["topic"],
                "difficulty": stage["difficulty"],
                "status": status,
                "description": stage["description"],
                "recommended_problems": prob_list,
                "remediation_note": remediation_note
            })

        completion_pct = round((completed_nodes / len(ROADMAP_STAGES)) * 100.0, 1)

        return {
            "current_level": current_level,
            "completion_percentage": completion_pct,
            "nodes": nodes
        }

    @staticmethod
    async def process_gamification_rewards(
        db: AsyncSession,
        user: User,
        problem: Problem,
        submission_status: str,
        runtime_ms: float,
        first_attempt_success: bool
    ) -> Tuple[int, List[str]]:
        """
        Awards XP, calculates level-ups, evaluates streak, and unlocks badges.
        Returns: (xp_earned, new_badge_names)
        """
        if submission_status != "Accepted":
            return 0, []

        # 1. Calculate XP
        xp_earned = 50
        if problem.difficulty == "Medium":
            xp_earned = 100
        elif problem.difficulty == "Hard":
            xp_earned = 200

        if first_attempt_success:
            xp_earned += 35  # First attempt accuracy bonus

        user.xp += xp_earned
        user.level = 1 + (user.xp // 250)

        # 2. Update streak
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if user.last_active_date != today_str:
            user.streak = (user.streak or 0) + 1
            user.last_active_date = today_str

        # 3. Check for unlocked badges
        existing_badge_ids = set((await db.execute(
            select(UserBadge.badge_id).where(UserBadge.user_id == user.id)
        )).scalars().all())

        all_badges = (await db.execute(select(Badge))).scalars().all()
        new_badges = []

        # Count total solved
        total_solved = (await db.execute(
            select(func.count(func.distinct(Submission.problem_id)))
            .where(and_(Submission.user_id == user.id, Submission.status == "Accepted"))
        )).scalar() or 0

        for badge in all_badges:
            if badge.id in existing_badge_ids:
                continue

            unlocked = False
            if badge.slug == "first_blood" and total_solved >= 1:
                unlocked = True
            elif badge.slug == "array_explorer" and problem.topic == "Arrays":
                # Check how many array problems solved
                arr_count = (await db.execute(
                    select(func.count(func.distinct(Problem.id)))
                    .join(Submission, Submission.problem_id == Problem.id)
                    .where(and_(Submission.user_id == user.id, Problem.topic == "Arrays", Submission.status == "Accepted"))
                )).scalar() or 0
                if arr_count >= 2:
                    unlocked = True
            elif badge.slug == "speed_demon" and runtime_ms > 0 and runtime_ms < 150:
                unlocked = True
            elif badge.slug == "consistency_champion" and (user.streak or 0) >= 3:
                unlocked = True
            elif badge.slug == "dp_conqueror" and problem.topic == "Dynamic Programming" and problem.difficulty in ["Medium", "Hard"]:
                unlocked = True

            if unlocked:
                db.add(UserBadge(user_id=user.id, badge_id=badge.id))
                user.xp += badge.xp_reward
                new_badges.append(badge.name)

        await db.commit()
        return xp_earned, new_badges
