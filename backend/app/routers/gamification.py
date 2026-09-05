from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, and_
from datetime import datetime, timezone

from app.database import get_db
from app.models import User, Badge, UserBadge, DailyChallenge, Submission, Problem
from app.schemas import BadgeResponse, LeaderboardUserResponse, DailyChallengeResponse, ProblemResponse
from app.routers.auth import get_optional_user

router = APIRouter(prefix="/gamification", tags=["Gamification & Community"])

@router.get("/leaderboard", response_model=List[LeaderboardUserResponse])
async def get_leaderboard(
    limit: int = 25,
    db: AsyncSession = Depends(get_db)
):
    """Returns top users ranked by total XP and level."""
    # Query users ordered by XP desc
    user_stmt = select(User).order_by(desc(User.xp), desc(User.level)).limit(limit)
    users = (await db.execute(user_stmt)).scalars().all()

    # Query problems solved for each user
    leaderboard = []
    for idx, u in enumerate(users):
        solved_count = (await db.execute(
            select(func.count(func.distinct(Submission.problem_id)))
            .where(and_(Submission.user_id == u.id, Submission.status == "Accepted"))
        )).scalar() or 0

        leaderboard.append(LeaderboardUserResponse(
            rank=idx + 1,
            id=u.id,
            username=u.username,
            skill_level=u.skill_level,
            level=u.level,
            xp=u.xp,
            problems_solved=solved_count,
            streak=u.streak or 0,
            avatar_url=u.avatar_url
        ))

    return leaderboard

@router.get("/badges", response_model=List[BadgeResponse])
async def get_badges(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Returns all available achievement badges with unlock status for the current user."""
    badges = (await db.execute(select(Badge))).scalars().all()

    unlocked_map = {}
    if current_user:
        ub_stmt = select(UserBadge).where(UserBadge.user_id == current_user.id)
        ub_records = (await db.execute(ub_stmt)).scalars().all()
        for ub in ub_records:
            unlocked_map[ub.badge_id] = ub.awarded_at

    response = []
    for b in badges:
        is_unlocked = b.id in unlocked_map
        response.append(BadgeResponse(
            id=b.id,
            slug=b.slug,
            name=b.name,
            description=b.description,
            icon=b.icon,
            category=b.category,
            xp_reward=b.xp_reward,
            unlocked=is_unlocked,
            awarded_at=unlocked_map.get(b.id)
        ))

    return response

@router.get("/daily-challenge", response_model=DailyChallengeResponse)
async def get_daily_challenge(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Returns today's daily coding challenge."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    daily_stmt = select(DailyChallenge).where(DailyChallenge.date == today_str)
    challenge = (await db.execute(daily_stmt)).scalar_one_or_none()

    if not challenge:
        # Fallback to first problem if daily challenge not set
        prob = (await db.execute(select(Problem).order_by(Problem.id))).scalars().first()
        if not prob:
            raise HTTPException(status_code=404, detail="No problem available")
        challenge = DailyChallenge(problem_id=prob.id, date=today_str, bonus_xp=100)
        db.add(challenge)
        await db.commit()
        await db.refresh(challenge)

    problem = await db.get(Problem, challenge.problem_id)
    is_completed = False

    if current_user:
        sub_stmt = select(Submission.id).where(
            and_(
                Submission.user_id == current_user.id,
                Submission.problem_id == problem.id,
                Submission.status == "Accepted"
            )
        ).limit(1)
        is_completed = (await db.execute(sub_stmt)).scalar_one_or_none() is not None

    prob_dict = {c.name: getattr(problem, c.name) for c in problem.__table__.columns}
    prob_dict["is_solved"] = is_completed

    return DailyChallengeResponse(
        date=challenge.date,
        bonus_xp=challenge.bonus_xp,
        problem=ProblemResponse(**prob_dict),
        is_completed=is_completed
    )
