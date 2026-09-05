from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # "user", "admin"
    skill_level = Column(String(20), default="Beginner")  # "Beginner", "Intermediate", "Advanced"
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_active_date = Column(String(10), nullable=True)  # YYYY-MM-DD
    avatar_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    mentor_messages = relationship("MentorMessage", back_populates="user", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(200), index=True, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), index=True, nullable=False)  # Easy, Medium, Hard
    topic = Column(String(50), index=True, nullable=False)  # Arrays, Strings, Linked Lists, etc.
    input_format = Column(Text, nullable=False)
    output_format = Column(Text, nullable=False)
    constraints = Column(Text, nullable=False)
    examples = Column(JSON, default=list)  # list of {input, output, explanation}
    test_cases = Column(JSON, default=list)  # list of {input, expected_output, is_hidden}
    starter_codes = Column(JSON, default=dict)  # {python, java, cpp, c}
    hints = Column(JSON, default=list)  # list of strings
    acceptance_rate = Column(Float, default=75.0)
    created_at = Column(DateTime, default=utcnow)

    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(20), nullable=False)  # python, java, cpp, c
    status = Column(String(50), nullable=False)  # Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compile Error
    runtime_ms = Column(Float, default=0.0)
    memory_kb = Column(Float, default=0.0)
    passed_tests = Column(Integer, default=0)
    total_tests = Column(Integer, default=0)
    ai_feedback = Column(JSON, nullable=True)  # {score, logic_explanation, bugs, improvements, time_complexity, space_complexity, hints, better_approach}
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")

class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(50), nullable=False)
    score = Column(Float, default=0.0)  # 0 to 100 percentage
    problems_solved = Column(Integer, default=0)
    total_attempts = Column(Integer, default=0)
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="skills")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="Award")  # Lucide icon name
    category = Column(String(50), default="General")
    xp_reward = Column(Integer, default=50)

    user_badges = relationship("UserBadge", back_populates="badge")

class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

class MentorMessage(Base):
    __tablename__ = "mentor_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    problem_context = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="mentor_messages")

class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    date = Column(String(10), unique=True, index=True, nullable=False)  # YYYY-MM-DD
    bonus_xp = Column(Integer, default=100)

    problem = relationship("Problem")

class CodingSession(Base):
    """Tracks a user's real-time coding session for analysis."""
    __tablename__ = "coding_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for guests
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=True)  # nullable for playground
    language = Column(String(20), nullable=False, default="python")
    overall_score = Column(Float, default=0.0)
    syntax_score = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    problem_solving_score = Column(Float, default=0.0)
    efficiency_score = Column(Float, default=0.0)
    coding_level = Column(String(20), default="Beginner")  # Beginner, Intermediate, Advanced, Expert
    total_keystrokes = Column(Integer, default=0)
    session_duration_s = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    mistakes = relationship("SessionMistake", back_populates="session", cascade="all, delete-orphan")

class SessionMistake(Base):
    """Individual mistake record within a coding session."""
    __tablename__ = "session_mistakes"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("coding_sessions.id"), nullable=False)
    category = Column(String(30), nullable=False)   # syntax | logical | runtime | style | structure
    message = Column(String(255), nullable=False)   # short description
    explanation = Column(Text, nullable=True)        # AI plain-English explanation
    line_number = Column(Integer, nullable=True)
    frequency = Column(Integer, default=1)           # incremented on repeated mistake
    severity = Column(String(10), default="warning") # error | warning | info
    created_at = Column(DateTime, default=utcnow)

    session = relationship("CodingSession", back_populates="mistakes")
