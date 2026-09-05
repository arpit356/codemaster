from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[int] = None

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    skill_level: str
    xp: int
    level: int
    streak: int
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Problem Schemas ---
class ExampleCase(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None

class TestCase(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False

class ProblemBase(BaseModel):
    title: str
    slug: str
    description: str
    difficulty: str  # Easy, Medium, Hard
    topic: str  # Arrays, Strings, etc.
    input_format: str
    output_format: str
    constraints: str
    examples: List[Dict[str, Any]] = []
    test_cases: List[Dict[str, Any]] = []
    starter_codes: Dict[str, str] = {}
    hints: List[str] = []

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    topic: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    examples: Optional[List[Dict[str, Any]]] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    starter_codes: Optional[Dict[str, str]] = None
    hints: Optional[List[str]] = None

class ProblemResponse(ProblemBase):
    id: int
    acceptance_rate: float
    created_at: datetime
    is_solved: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

class ProblemListResponse(BaseModel):
    id: int
    slug: str
    title: str
    difficulty: str
    topic: str
    acceptance_rate: float
    is_solved: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)

# --- Code Execution & Submission Schemas ---
class RunCodeRequest(BaseModel):
    code: str
    language: str  # python, java, cpp, c
    custom_input: Optional[str] = None
    problem_id: Optional[int] = None

class SingleTestResult(BaseModel):
    test_case_index: int
    input: str
    expected_output: str
    actual_output: Optional[str] = None
    passed: bool
    status: str
    runtime_ms: float
    error_message: Optional[str] = None

class RunCodeResponse(BaseModel):
    status: str  # "Success", "Error", "Compile Error"
    stdout: str
    stderr: str
    runtime_ms: float
    memory_kb: float
    test_results: List[SingleTestResult] = []

class SubmitCodeRequest(BaseModel):
    problem_id: int
    code: str
    language: str

class AIFeedback(BaseModel):
    score: int  # 0 - 100
    logic_explanation: str
    time_complexity: str
    space_complexity: str
    bugs_identified: List[str] = []
    improvements: List[str] = []
    better_approach: Optional[str] = None
    hints: List[str] = []

class SubmissionResponse(BaseModel):
    id: int
    user_id: int
    problem_id: int
    language: str
    status: str
    runtime_ms: float
    memory_kb: float
    passed_tests: int
    total_tests: int
    ai_feedback: Optional[Dict[str, Any]] = None
    created_at: datetime
    xp_earned: Optional[int] = 0
    new_badges: Optional[List[str]] = []
    problem_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# --- Skill Assessment Schemas ---
class TopicSkillScore(BaseModel):
    topic: str
    score: float  # 0 to 100%
    problems_solved: int
    total_attempts: int
    status: str  # Mastered (>=80), Proficient (>=60), Developing (>=40), Novice (<40)

class SkillAssessmentOverview(BaseModel):
    overall_score: float
    total_solved: int
    solved_by_difficulty: Dict[str, int]
    strongest_topic: Optional[str] = None
    weakest_topic: Optional[str] = None
    topic_scores: List[TopicSkillScore]
    recent_trend: str

# --- Learning Roadmap Schemas ---
class RoadmapNode(BaseModel):
    id: str
    title: str
    topic: str
    difficulty: str
    status: str  # "completed", "in_progress", "locked", "recommended_review"
    description: str
    recommended_problems: List[ProblemListResponse] = []
    remediation_note: Optional[str] = None

class LearningRoadmapResponse(BaseModel):
    current_level: str  # Beginner, Intermediate, Advanced
    completion_percentage: float
    nodes: List[RoadmapNode]

# --- AI Mentor Schemas ---
class MentorChatRequest(BaseModel):
    message: str
    problem_context: Optional[str] = None
    code_context: Optional[str] = None

class MentorChatResponse(BaseModel):
    reply: str
    suggested_questions: List[str] = []

class MentorMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    problem_context: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Gamification Schemas ---
class BadgeResponse(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    icon: str
    category: str
    xp_reward: int
    unlocked: bool = False
    awarded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LeaderboardUserResponse(BaseModel):
    rank: int
    id: int
    username: str
    skill_level: str
    level: int
    xp: int
    problems_solved: int
    streak: int
    avatar_url: Optional[str] = None

class DailyChallengeResponse(BaseModel):
    date: str
    bonus_xp: int
    problem: ProblemResponse
    is_completed: bool = False

# --- Admin Schemas ---
class AdminPlatformStats(BaseModel):
    total_users: int
    total_submissions: int
    total_problems: int
    overall_acceptance_rate: float
    submissions_today: int
    topic_distribution: Dict[str, int]

# ─────────────────────────────────────────────────────────────────────────────
# Real-Time Code Analysis Schemas
# ─────────────────────────────────────────────────────────────────────────────

class CodeAnalysisRequest(BaseModel):
    session_id: str                          # UUID generated client-side
    code: str
    language: str                            # python | java | cpp | c
    problem_id: Optional[int] = None         # None for playground mode
    problem_title: Optional[str] = None
    problem_topic: Optional[str] = None
    keystrokes: int = 0

class MistakeItem(BaseModel):
    category: str                            # syntax | logical | runtime | style | structure
    message: str
    explanation: str
    line_number: Optional[int] = None
    severity: str = "warning"               # error | warning | info
    frequency: int = 1

class SkillScores(BaseModel):
    overall: float
    syntax: float
    quality: float
    problem_solving: float
    efficiency: float
    coding_level: str                        # Beginner | Intermediate | Advanced | Expert

class AITip(BaseModel):
    title: str
    body: str
    type: str = "improvement"               # improvement | warning | praise | recommendation

class CodeAnalysisResponse(BaseModel):
    session_id: str
    scores: SkillScores
    mistakes: List[MistakeItem]
    ai_tips: List[AITip]
    recommendations: List[str]
    analysis_summary: str                   # one-line natural-language verdict
    is_empty: bool = False

class SessionSummaryResponse(BaseModel):
    session_id: str
    language: str
    scores: SkillScores
    top_mistakes: List[MistakeItem]
    duration_s: int
    keystrokes: int
    recommendations: List[str]

