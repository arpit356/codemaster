from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import User
from app.schemas import SkillAssessmentOverview, LearningRoadmapResponse
from app.services.assessment_service import AssessmentService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assessment", tags=["Skill Assessment & Roadmap"])

@router.get("/overview", response_model=SkillAssessmentOverview)
async def get_skill_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns user's comprehensive skill score across all 9 topics,
    including radar chart metrics, strongest/weakest topics, and difficulty distribution.
    """
    return await AssessmentService.get_user_assessment_overview(db, current_user.id)

@router.get("/roadmap", response_model=LearningRoadmapResponse)
async def get_learning_roadmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns an adaptive, personalized learning path dynamically updated based on
    the user's topic strengths, weaknesses, and solved milestones.
    """
    return await AssessmentService.get_personalized_roadmap(db, current_user.id)
