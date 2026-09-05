from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models import MentorMessage, User
from app.schemas import MentorChatRequest, MentorChatResponse, MentorMessageResponse
from app.services.ai_service import AIService
from app.services.assessment_service import AssessmentService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/mentor", tags=["AI Coding Mentor"])

@router.post("/chat", response_model=MentorChatResponse)
async def chat_with_mentor(
    req: MentorChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Interacts with the AI CodeMentor chatbot.
    Maintains context of the user's current problem, code, and weakest topic.
    """
    # 1. Fetch recent user history
    history_stmt = (
        select(MentorMessage)
        .where(MentorMessage.user_id == current_user.id)
        .order_by(MentorMessage.created_at.desc())
        .limit(8)
    )
    res = await db.execute(history_stmt)
    history_msgs = list(reversed(res.scalars().all()))
    chat_history = [{"role": m.role, "content": m.content} for m in history_msgs]

    # 2. Find weakest topic for personalized tutoring
    overview = await AssessmentService.get_user_assessment_overview(db, current_user.id)
    weak_topic = overview.get("weakest_topic")

    # 3. Call AI Service
    ai_result = await AIService.chat_mentor(
        user_message=req.message,
        chat_history=chat_history,
        problem_context=req.problem_context,
        code_context=req.code_context,
        user_weak_topic=weak_topic
    )

    # 4. Save both user message and assistant reply
    user_msg_record = MentorMessage(
        user_id=current_user.id,
        role="user",
        content=req.message,
        problem_context=req.problem_context
    )
    assistant_msg_record = MentorMessage(
        user_id=current_user.id,
        role="assistant",
        content=ai_result["reply"],
        problem_context=req.problem_context
    )
    db.add(user_msg_record)
    db.add(assistant_msg_record)
    await db.commit()

    return MentorChatResponse(
        reply=ai_result["reply"],
        suggested_questions=ai_result.get("suggested_questions", [])
    )

@router.get("/history", response_model=List[MentorMessageResponse])
async def get_chat_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(MentorMessage)
        .where(MentorMessage.user_id == current_user.id)
        .order_by(MentorMessage.created_at.asc())
        .limit(limit)
    )
    messages = (await db.execute(stmt)).scalars().all()
    return messages

@router.delete("/history")
async def clear_chat_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = delete(MentorMessage).where(MentorMessage.user_id == current_user.id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "cleared"}
