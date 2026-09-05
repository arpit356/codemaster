# CodeMentor AI

CodeMentor AI is a full-stack coding practice platform with problem solving, code execution, AI feedback, skill assessments, roadmaps, gamification, and an AI mentor.

## Project Structure

```text
backend/    FastAPI API, database models, services, seed data, and tests
frontend/   React + Vite client
```

## Features

- User registration, login, and JWT authentication
- Coding problems with filtering by topic and difficulty
- In-browser code execution and problem submissions
- AI-powered code analysis and mentor chat
- Skill assessments and personalized learning roadmaps
- Leaderboards, badges, and daily challenges
- Admin tools for users and coding problems

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- A Gemini API key is optional, but required for AI-powered features

## Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` when you need to override the defaults:

```env
SECRET_KEY=replace-with-a-long-random-value
DATABASE_URL=sqlite+aiosqlite:///./codementor.db
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
PISTON_API_URL=https://emkc.org/api/v2/piston
```

Start the API:

```powershell
python app.py
```

The API is available at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

## Frontend Setup

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The frontend uses `http://localhost:8000/api/v1` by default. To point it at another API URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Seed Data

The backend includes seed data for development. Use the project population script after starting the backend environment if the database needs sample problems or users:

```powershell
cd backend
python populate_problems.py
```

## Verification

Run the backend test suite from `backend/`:

```powershell
pytest
```

With the API running, the core API verification script can be run with:

```powershell
python verify_apis.py
```

## Notes

- The default database is a local SQLite file at `backend/codementor.db`.
- Code execution uses the configured Piston API.
- Keep `.env` files and API keys out of version control.
