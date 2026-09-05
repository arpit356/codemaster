import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Ensure .env is always loaded from backend directory regardless of launch directory
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=str(ENV_PATH), extra="ignore")
    
    PROJECT_NAME: str = "CodeMentor AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "codementor-secret-key-super-secure-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Default: local SQLite with async aiosqlite, supports PostgreSQL via DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./codementor.db")
    
    # Code Execution API
    PISTON_API_URL: str = os.getenv("PISTON_API_URL", "https://emkc.org/api/v2/piston")
    
    # AI Engine
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

