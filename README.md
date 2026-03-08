# BondScope

Monorepo: Next.js (frontend) + FastAPI (backend). Bond and equity portfolio dashboard with YTM, duration, and stock price data.

## Requirements

- **Node.js** 18+ (for Next.js and root scripts)
- **Python** 3.10+ (for FastAPI backend)
- **npm** (comes with Node)

## Structure

- `frontend/` — Next.js App Router + TypeScript
- `backend/`  — Python FastAPI + SQLite (SQLAlchemy)

## Setup

### 1. Create Python virtual env (backend)

From the project root:

```bash
cd backend
python -m venv .venv
```

**Windows (PowerShell / CMD):**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

Leave the venv activated for the next steps (you should see `(.venv)` in the prompt).

### 2. Install dependencies

From the **project root** (with backend venv still activated):

```bash
npm install
npm run install
```

- `npm install` — installs root dev deps (e.g. `concurrently`)
- `npm run install` — installs frontend deps (`frontend/node_modules`) and backend deps (`pip install -r backend/requirements.txt` into the active Python env)

Or install separately:

```bash
# Frontend
cd frontend && npm install && cd ..

# Backend (with venv activated)
cd backend && pip install -r requirements.txt && cd ..
```

### 3. Run everything

From the project root (with backend venv activated):

```bash
npm run dev
```

- **Frontend:** http://localhost:3000  
- **Backend:**  http://localhost:8000  

The frontend proxies `/api/*` to the backend, so use `fetch("/api/...")` from the app.

## AI (Mistral)

The app can generate portfolio reports and answer questions about your data via Mistral. **This is not investment advice**; the AI is instructed to use only app data and never to recommend buy/sell or predict prices.

### Enabling AI

1. Copy the example env file and set your API key:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Edit `backend/.env` and set `MISTRAL_API_KEY` to your [Mistral API key](https://console.mistral.ai/). Optionally set `MISTRAL_MODEL` (default: `mistral-large-latest`).
3. Restart the backend (e.g. run `npm run dev` again). If the key is missing, AI endpoints return **501** with message `AI disabled: set MISTRAL_API_KEY`.

### Run

Same as above: from the project root with backend venv activated, run:

```bash
npm run dev
```

### AI endpoints (curl)

- **Report** (generates a short portfolio report from app data):
  ```bash
  curl -X POST http://localhost:8000/ai/report \
    -H "Content-Type: application/json" \
    -d "{}"
  ```
  Optional body: `{"timeframe": "last month"}`.

- **Chat** (Q&A about your portfolio/bonds/watchlist):
  ```bash
  curl -X POST http://localhost:8000/ai/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "What is my total exposure to bonds?"}'
  ```

From the frontend, open **Dashboard** → **AI Report** (or go to http://localhost:3000/ai) to use the report and chat UI.

### Limits and costs

- **Rate limit:** in-memory limit of 20 requests per minute (shared across `/ai/report` and `/ai/chat`). Exceeding returns **429**.
- **Mistral usage:** API calls consume your Mistral account quota and may incur cost. Check [Mistral pricing](https://mistral.ai/pricing/) and set usage limits in the Mistral console if needed.

## Tests (backend)

From the project root (with backend venv activated so `pytest` and deps are available):

```bash
npm run test
```

Or from the backend folder:

```bash
cd backend && python -m pytest tests/ -v
```

Tests use an in-memory SQLite DB and do not call the Mistral API (AI endpoints return 501 when `MISTRAL_API_KEY` is unset). They cover: health, trades/bonds/watchlist CRUD, prices (mocked), AI disabled; `bonds_math` (cashflows, YTM, duration); and `ai.facts.get_facts`.

## Lint / type check (optional)

- **Frontend:** from root run `npm run lint` (runs `next lint` in `frontend/`). TypeScript types are checked on build (`npm run build` in `frontend/`).
- **Backend:** code is type-hinted; you can add `mypy` or `pyright` if you want static checks.

## Typical problems

| Problem | What to do |
|--------|-------------|
| **Port 3000 or 8000 already in use** | Stop the other process using that port, or change the port (e.g. `next dev -p 3001` for frontend; for backend change `--port` in `package.json`). |
| **`python` or `python3` not found** | Install Python 3.10+ and ensure it’s on your PATH. On macOS you may need `python3` and `python3 -m venv`. |
| **`node` or `npm` not found** | Install Node.js 18+ (e.g. from [nodejs.org](https://nodejs.org)) and ensure `node` and `npm` are on your PATH. |
| **Backend fails with "No module named 'fastapi'"** | Activate the backend venv, then run `pip install -r backend/requirements.txt`. Use the same activated venv when you run `npm run dev`. |
| **Frontend shows "Failed to fetch" for /api** | Make sure the backend is running on port 8000 and that `next.config.js` rewrites point to `http://127.0.0.1:8000`. |
