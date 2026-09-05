from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, delete
from datetime import datetime, timezone

from app.database import get_db
from app.models import Problem, User, Submission, DailyChallenge
from app.schemas import (
    AdminPlatformStats, UserResponse, ProblemCreate, ProblemUpdate, ProblemResponse
)
from app.routers.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats", response_model=AdminPlatformStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_submissions = (await db.execute(select(func.count(Submission.id)))).scalar() or 0
    total_problems = (await db.execute(select(func.count(Problem.id)))).scalar() or 0

    accepted_count = (await db.execute(
        select(func.count(Submission.id)).where(Submission.status == "Accepted")
    )).scalar() or 0

    acc_rate = round((accepted_count / max(1, total_submissions)) * 100, 1)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_subs = (await db.execute(
        select(func.count(Submission.id)).where(func.date(Submission.created_at) == today_str)
    )).scalar() or 0

    topic_counts = dict((await db.execute(
        select(Problem.topic, func.count(Problem.id)).group_by(Problem.topic)
    )).all())

    return AdminPlatformStats(
        total_users=total_users,
        total_submissions=total_submissions,
        total_problems=total_problems,
        overall_acceptance_rate=acc_rate,
        submissions_today=today_subs,
        topic_distribution=topic_counts
    )

@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    stmt = select(User).order_by(desc(User.created_at)).offset(skip).limit(limit)
    users = (await db.execute(stmt)).scalars().all()
    return users

@router.post("/problems", response_model=ProblemResponse)
async def create_problem(
    problem_in: ProblemCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # Check slug uniqueness
    existing = (await db.execute(select(Problem).where(Problem.slug == problem_in.slug))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="A problem with this slug already exists.")

    problem = Problem(**problem_in.model_dump())
    db.add(problem)
    await db.commit()
    await db.refresh(problem)
    return problem

@router.put("/problems/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: int,
    problem_in: ProblemUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    problem = await db.get(Problem, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    update_data = problem_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(problem, field, val)

    await db.commit()
    await db.refresh(problem)
    return problem

@router.delete("/problems/{problem_id}")
async def delete_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    problem = await db.get(Problem, problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    await db.delete(problem)
    await db.commit()
    return {"status": "success", "message": f"Problem {problem_id} deleted."}
