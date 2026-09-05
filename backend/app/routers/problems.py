from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database import get_db
from app.models import Problem, Submission, User
from app.schemas import ProblemResponse, ProblemListResponse
from app.routers.auth import get_optional_user

router = APIRouter(prefix="/problems", tags=["Problems"])

@router.get("", response_model=List[ProblemListResponse])
async def list_problems(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,  # "solved", "unsolved", "all"
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = select(Problem)
    conditions = []

    if topic and topic != "All":
        conditions.append(Problem.topic == topic)
    if difficulty and difficulty != "All":
        conditions.append(Problem.difficulty == difficulty)
    if search:
        conditions.append(Problem.title.ilike(f"%{search}%"))

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(Problem.id).offset(skip).limit(limit)
    result = await db.execute(query)
    problems = result.scalars().all()

    # If user is logged in, mark solved status
    solved_ids = set()
    if current_user:
        sub_query = (
            select(Submission.problem_id)
            .where(and_(Submission.user_id == current_user.id, Submission.status == "Accepted"))
        )
        sub_res = await db.execute(sub_query)
        solved_ids = set(sub_res.scalars().all())

    response = []
    for p in problems:
        is_solved = p.id in solved_ids
        if status == "solved" and not is_solved:
            continue
        if status == "unsolved" and is_solved:
            continue

        response.append(ProblemListResponse(
            id=p.id,
            slug=p.slug,
            title=p.title,
            difficulty=p.difficulty,
            topic=p.topic,
            acceptance_rate=p.acceptance_rate,
            is_solved=is_solved
        ))

    return response

@router.get("/topics")
async def get_topics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Returns topics with total problems count and user solved count."""
    all_topics = [
        "Arrays", "Strings", "Linked Lists", "Stacks", "Queues",
        "Recursion", "Trees", "Graphs", "Dynamic Programming"
    ]

    # Count total per topic
    count_stmt = select(Problem.topic, func.count(Problem.id)).group_by(Problem.topic)
    total_counts = dict((await db.execute(count_stmt)).all())

    # Count user solved per topic
    user_counts = {}
    if current_user:
        solved_stmt = (
            select(Problem.topic, func.count(func.distinct(Problem.id)))
            .join(Submission, Submission.problem_id == Problem.id)
            .where(and_(Submission.user_id == current_user.id, Submission.status == "Accepted"))
            .group_by(Problem.topic)
        )
        user_counts = dict((await db.execute(solved_stmt)).all())

    return [
        {
            "topic": t,
            "total_problems": total_counts.get(t, 0),
            "solved_problems": user_counts.get(t, 0),
            "progress_percent": round((user_counts.get(t, 0) / max(1, total_counts.get(t, 1))) * 100, 1)
        }
        for t in all_topics
    ]

@router.get("/{slug}", response_model=ProblemResponse)
async def get_problem_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    stmt = select(Problem).where(Problem.slug == slug)
    problem = (await db.execute(stmt)).scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    is_solved = False
    if current_user:
        sub_stmt = select(Submission.id).where(
            and_(
                Submission.user_id == current_user.id,
                Submission.problem_id == problem.id,
                Submission.status == "Accepted"
            )
        ).limit(1)
        is_solved = (await db.execute(sub_stmt)).scalar_one_or_none() is not None

    prob_dict = {c.name: getattr(problem, c.name) for c in problem.__table__.columns}
    prob_dict["is_solved"] = is_solved
    return prob_dict
