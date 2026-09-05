"""
code_analysis.py  —  Real-Time Code Analysis Router
────────────────────────────────────────────────────
POST /api/v1/analysis/analyze          Run full analysis on a code snapshot
GET  /api/v1/analysis/session/{sid}    Fetch persisted session summary
DELETE /api/v1/analysis/session/{sid}  Clear a session
"""

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.schemas import CodeAnalysisRequest, CodeAnalysisResponse, SessionSummaryResponse
from app.models import CodingSession, SessionMistake
from app.services.code_analysis_service import perform_realtime_analysis
from app.routers.auth import get_optional_user

logger = logging.getLogger("codementor.analysis")

router = APIRouter(prefix="/analysis", tags=["Code Analysis"])


# ─────────────────────────────────────────────────────────────────────────────
# POST /analysis/analyze
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=CodeAnalysisResponse)
async def analyze_code(
    payload: CodeAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """
    Debounced real-time code analysis endpoint.
    Works for both authenticated users and guests (no auth required).
    """

    # Fetch previous scores for this session (consistency calculation)
    previous_scores = None
    db_session = await db.execute(
        select(CodingSession).where(CodingSession.session_id == payload.session_id)
    )
    db_session = db_session.scalar_one_or_none()

    if db_session:
        previous_scores = {
            "overall":         db_session.overall_score,
            "syntax":          db_session.syntax_score,
            "quality":         db_session.quality_score,
            "problem_solving": db_session.problem_solving_score,
            "efficiency":      db_session.efficiency_score,
        }

    # Run analysis pipeline
    result = await perform_realtime_analysis(
        code=payload.code,
        language=payload.language,
        session_id=payload.session_id,
        problem_id=payload.problem_id,
        problem_title=payload.problem_title,
        problem_topic=payload.problem_topic,
        previous_scores=previous_scores,
    )

    scores = result["scores"]

    # Persist / update session in DB
    try:
        if db_session:
            await db.execute(
                update(CodingSession)
                .where(CodingSession.session_id == payload.session_id)
                .values(
                    overall_score=scores["overall"],
                    syntax_score=scores["syntax"],
                    quality_score=scores["quality"],
                    problem_solving_score=scores["problem_solving"],
                    efficiency_score=scores["efficiency"],
                    coding_level=scores["coding_level"],
                    total_keystrokes=CodingSession.total_keystrokes + payload.keystrokes,
                    language=payload.language,
                )
            )
        else:
            new_session = CodingSession(
                session_id=payload.session_id,
                user_id=current_user.id if current_user else None,
                problem_id=payload.problem_id,
                language=payload.language,
                overall_score=scores["overall"],
                syntax_score=scores["syntax"],
                quality_score=scores["quality"],
                problem_solving_score=scores["problem_solving"],
                efficiency_score=scores["efficiency"],
                coding_level=scores["coding_level"],
                total_keystrokes=payload.keystrokes,
            )
            db.add(new_session)
            await db.flush()
            db_session = new_session

        # Persist new mistakes (deduplicate by message within session)
        if db_session and db_session.id and result["mistakes"]:
            for m in result["mistakes"]:
                existing = await db.execute(
                    select(SessionMistake).where(
                        SessionMistake.session_id == db_session.id,
                        SessionMistake.message == m["message"],
                    )
                )
                existing = existing.scalar_one_or_none()
                if existing:
                    existing.frequency += 1
                else:
                    db.add(SessionMistake(
                        session_id=db_session.id,
                        category=m["category"],
                        message=m["message"],
                        explanation=m["explanation"],
                        line_number=m.get("line_number"),
                        severity=m["severity"],
                        frequency=1,
                    ))

        await db.commit()
    except Exception as e:
        logger.warning(f"DB session persist failed (non-critical): {e}")
        await db.rollback()

    return CodeAnalysisResponse(
        session_id=result["session_id"],
        scores=result["scores"],
        mistakes=result["mistakes"],
        ai_tips=result["ai_tips"],
        recommendations=result["recommendations"],
        analysis_summary=result["analysis_summary"],
        is_empty=result["is_empty"],
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /analysis/session/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/session/{session_id}", response_model=SessionSummaryResponse)
async def get_session_summary(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Returns the accumulated summary for a coding session."""
    result = await db.execute(
        select(CodingSession).where(CodingSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch top mistakes
    mistakes_result = await db.execute(
        select(SessionMistake)
        .where(SessionMistake.session_id == session.id)
        .order_by(SessionMistake.frequency.desc())
        .limit(10)
    )
    mistakes = mistakes_result.scalars().all()

    return SessionSummaryResponse(
        session_id=session_id,
        language=session.language,
        scores={
            "overall":         session.overall_score,
            "syntax":          session.syntax_score,
            "quality":         session.quality_score,
            "problem_solving": session.problem_solving_score,
            "efficiency":      session.efficiency_score,
            "coding_level":    session.coding_level,
        },
        top_mistakes=[
            {
                "category":    m.category,
                "message":     m.message,
                "explanation": m.explanation or "",
                "line_number": m.line_number,
                "severity":    m.severity,
                "frequency":   m.frequency,
            }
            for m in mistakes
        ],
        duration_s=session.session_duration_s or 0,
        keystrokes=session.total_keystrokes or 0,
        recommendations=["Keep practicing!", "Review your most common mistake types."],
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /analysis/session/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete("/session/{session_id}")
async def clear_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CodingSession).where(CodingSession.session_id == session_id)
    )
    session = result.scalar_one_or_none()
    if session:
        await db.delete(session)
        await db.commit()
    return {"detail": "Session cleared"}
