# YieldDesk

Монорепо: Next.js (frontend) + FastAPI (backend).

## Структура

- `frontend/` — Next.js App Router + TypeScript
- `backend/`  — Python FastAPI + SQLite (SQLAlchemy)

## Установка зависимостей

В корне (для `concurrently`):

```bash
npm install
```

Установка фронта и бэка:

```bash
npm run install
```

Либо по отдельности:

```bash
# Frontend
cd frontend && npm install

# Backend (рекомендуется в виртуальном окружении)
cd backend && python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Запуск

Из корня проекта:

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend:  http://localhost:8000  

API с фронта вызывается через прокси: `fetch("/api/...")` → бэкенд на порту 8000.
