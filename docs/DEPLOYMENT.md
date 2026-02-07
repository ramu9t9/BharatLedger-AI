# BharatLedger — Deployment

## Prerequisites

- Python 3.11+
- Node 18+
- PostgreSQL 15+
- Redis 7+
- (Optional) S3-compatible storage

## Local run

1. **Environment:** Copy `.env.example` to `.env`; set `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `OPENROUTER_API_KEY` (or `OPENAI_API_KEY`).
2. **Services:** `docker-compose up -d` (Postgres + Redis).
3. **Backend:** From repo root, add repo root and `backend` to `PYTHONPATH`; install deps: `pip install -r backend/requirements.txt`. Install ai_engine: `pip install -e ai_engine`. Run migrations: `cd backend && alembic upgrade head`. Start API: `uvicorn app.main:app --reload` (with `PYTHONPATH` including repo root and backend).
4. **Frontend:** `cd frontend && npm install && npm run dev`. Use Vite proxy to backend (e.g. `/api` → `http://localhost:8000`) or set `VITE_API_URL=http://localhost:8000`.

## Production

- **Backend:** Run with gunicorn/uvicorn behind a reverse proxy (nginx/Caddy). Use a process manager (systemd/supervisor) or container (Docker).
- **Workers:** Run Celery worker when async invoice processing is enabled: `celery -A app.workers.tasks worker -l info` (after wiring tasks in `app.workers.tasks`).
- **Frontend:** `npm run build`; serve `dist/` via nginx or static hosting.
- **Database:** Use managed PostgreSQL; run Alembic migrations in CI or manually.
- **Secrets:** Store `SECRET_KEY`, DB URL, API keys in environment or secret manager; never commit `.env`.
- **HTTPS:** Terminate TLS at reverse proxy; set `ENV=production` and restrict CORS.

## Docker (single host)

- Build backend image from repo root: include `backend/` and `ai_engine/` in build context; set `PYTHONPATH` so `app` and `ai_engine` are importable.
- Use `docker-compose` for Postgres, Redis, backend, and (optional) frontend static server.

## CI/CD

- **GitHub Actions:** `.github/workflows/ci.yml` runs backend tests (with Postgres/Redis services) and ai_engine unit tests on push/PR.
- Extend with: deploy step (e.g. to Railway/Render), frontend build, E2E (Playwright).

## Launch checklist

- [ ] Production DB and Redis provisioned; migrations run
- [ ] `SECRET_KEY` and API keys set in production env
- [ ] Backend and (optional) Celery worker deployed; health check on `/health`
- [ ] Frontend built and served over HTTPS
- [ ] CORS and rate limiting configured
- [ ] First beta users onboarded; monitor logs and errors
