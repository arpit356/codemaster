from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.database import get_db
from app.models import Problem, Submission, User
from app.schemas import (
    RunCodeRequest, RunCodeResponse,
    SubmitCodeRequest, SubmissionResponse, SingleTestResult
)
from app.services.executor import CodeExecutor
from app.services.ai_service import AIService
from app.services.assessment_service import AssessmentService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/submissions", tags=["Submissions & Execution"])

@router.post("/run", response_model=RunCodeResponse)
async def run_code(
    req: RunCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes code in real-time against custom input or against the problem's sample test cases.
    Does not write a permanent submission record to database.
    """
    if req.custom_input is not None:
        # Single execution with custom input
        res = await CodeExecutor.execute_piston(
            code=req.code,
            language=req.language,
            stdin=req.custom_input
        )
        return RunCodeResponse(
            status=res["status"],
            stdout=res["stdout"],
            stderr=res["stderr"],
            runtime_ms=res["runtime_ms"],
            memory_kb=res["memory_kb"],
            test_results=[]
        )

    # If problem_id is provided, run against its visible sample test cases
    if req.problem_id:
        problem = await db.get(Problem, req.problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")

        visible_cases = [tc for tc in problem.test_cases if not tc.get("is_hidden")]
        if not visible_cases:
            visible_cases = problem.test_cases[:2]

        overall_status, results, max_runtime, memory_kb = await CodeExecutor.run_test_cases(
            code=req.code,
            language=req.language,
            test_cases=visible_cases
        )

        first_err = next((r["error_message"] for r in results if r.get("error_message")), "")

        return RunCodeResponse(
            status=overall_status,
            stdout="\n".join(r["actual_output"] for r in results if r["actual_output"]),
            stderr=first_err or "",
            runtime_ms=max_runtime,
            memory_kb=memory_kb,
            test_results=results
        )

    # Fallback to simple run with empty input
    res = await CodeExecutor.execute_piston(code=req.code, language=req.language, stdin="")
    return RunCodeResponse(
        status=res["status"],
        stdout=res["stdout"],
        stderr=res["stderr"],
        runtime_ms=res["runtime_ms"],
        memory_kb=res["memory_kb"],
        test_results=[]
    )

@router.post("/submit", response_model=SubmissionResponse)
async def submit_code(
    req: SubmitCodeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Runs code against all problem test cases (including hidden verification cases),
    records submission, generates AI code review & complexity analysis,
    updates topic skill assessment, and awards XP/badges.
    """
    problem = await db.get(Problem, req.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = problem.test_cases or []
    if not test_cases:
        test_cases = [{"input": ex["input"], "expected_output": ex["output"]} for ex in problem.examples]

    # Execute against all test cases
    overall_status, test_results, max_runtime, memory_kb = await CodeExecutor.run_test_cases(
        code=req.code,
        language=req.language,
        test_cases=test_cases,
        stop_on_first_failure=False
    )

    passed_count = sum(1 for r in test_results if r["passed"])
    total_count = len(test_results)
    first_error = next((r["error_message"] for r in test_results if r.get("error_message")), None)

    # Check previous attempts for first attempt bonus
    prev_sub_stmt = select(Submission).where(
        and_(Submission.user_id == current_user.id, Submission.problem_id == problem.id)
    )
    prev_subs = (await db.execute(prev_sub_stmt)).scalars().all()
    first_attempt = len(prev_subs) == 0

    # Generate AI Code Review & Feedback
    ai_feedback = await AIService.review_code(
        code=req.code,
        language=req.language,
        problem_title=problem.title,
        problem_description=problem.description,
        submission_status=overall_status,
        runtime_ms=max_runtime,
        error_details=first_error
    )

    # Save submission
    submission = Submission(
        user_id=current_user.id,
        problem_id=problem.id,
        code=req.code,
        language=req.language,
        status=overall_status,
        runtime_ms=max_runtime,
        memory_kb=memory_kb,
        passed_tests=passed_count,
        total_tests=total_count,
        ai_feedback=ai_feedback
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    # Update skill assessment
    await AssessmentService.update_user_skills(db, current_user.id, problem.topic)

    # Gamification rewards
    xp_earned, new_badges = await AssessmentService.process_gamification_rewards(
        db=db,
        user=current_user,
        problem=problem,
        submission_status=overall_status,
        runtime_ms=max_runtime,
        first_attempt_success=first_attempt
    )

    return SubmissionResponse(
        id=submission.id,
        user_id=submission.user_id,
        problem_id=submission.problem_id,
        language=submission.language,
        status=submission.status,
        runtime_ms=submission.runtime_ms,
        memory_kb=submission.memory_kb,
        passed_tests=submission.passed_tests,
        total_tests=submission.total_tests,
        ai_feedback=submission.ai_feedback,
        created_at=submission.created_at,
        xp_earned=xp_earned,
        new_badges=new_badges,
        problem_title=problem.title
    )

@router.get("/user", response_model=List[SubmissionResponse])
async def get_user_submissions(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Submission, Problem.title)
        .join(Problem, Submission.problem_id == Problem.id)
        .where(Submission.user_id == current_user.id)
        .order_by(desc(Submission.created_at))
        .limit(limit)
    )
    results = (await db.execute(stmt)).all()

    resp = []
    for sub, p_title in results:
        sub_dict = {c.name: getattr(sub, c.name) for c in sub.__table__.columns}
        sub_dict["problem_title"] = p_title
        resp.append(SubmissionResponse(**sub_dict))
    return resp

@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Submission, Problem.title)
        .join(Problem, Submission.problem_id == Problem.id)
        .where(Submission.id == submission_id)
    )
    result = (await db.execute(stmt)).first()
    if not result:
        raise HTTPException(status_code=404, detail="Submission not found")

    sub, p_title = result
    if sub.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    sub_dict = {c.name: getattr(sub, c.name) for c in sub.__table__.columns}
    sub_dict["problem_title"] = p_title
    return SubmissionResponse(**sub_dict)
