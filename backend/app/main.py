from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.seed_data import seed_database
from app.routers import auth, problems, submissions, assessment, mentor, gamification, admin, code_analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed initial data
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed_database(db)

    yield
    # Shutdown: dispose engine
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(problems.router, prefix=api_v1)
app.include_router(submissions.router, prefix=api_v1)
app.include_router(assessment.router, prefix=api_v1)
app.include_router(mentor.router, prefix=api_v1)
app.include_router(gamification.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(code_analysis.router, prefix=api_v1)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/api/docs"
    }
