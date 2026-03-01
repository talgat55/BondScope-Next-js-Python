# BondScope

Monorepo: Next.js (frontend) + FastAPI (backend). Bond and equity portfolio dashboard with YTM, duration, and stock price data.

## Structure

- `frontend/` — Next.js App Router + TypeScript
- `backend/`  — Python FastAPI + SQLite (SQLAlchemy)

## Install dependencies

From the repo root (for `concurrently`):

```bash
npm install
```

Install frontend and backend:

```bash
npm run install
```

Or separately:

```bash
# Frontend
cd frontend && npm install

# Backend (recommended: use a virtual env)
cd backend && python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

From the repo root:

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend:  http://localhost:8000  

Frontend proxies API calls: `fetch("/api/...")` is forwarded to the backend on port 8000.
