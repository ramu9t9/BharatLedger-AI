# BharatLedger AI — Local Development Setup

Follow these steps to run the project locally. No application code is required to validate Phase 0.

## Prerequisites

- **Python 3.11+**
- **Docker and Docker Compose** (for Postgres and Redis)
- **Git**

## Steps

### 1. Clone the repository

```bash
git clone <repo-url> BharatLedger_AI
cd BharatLedger_AI
```

### 2. Create and activate a virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Copy environment file

```bash
copy .env.example .env
# Or on macOS/Linux: cp .env.example .env
```

Edit `.env` and set at least:

- `SECRET_KEY` — use a long random string (e.g. `openssl rand -hex 32`)
- `OPENROUTER_API_KEY` or `OPENAI_API_KEY` — for AI features

### 4. Start Postgres and Redis with Docker

From the project root:

```bash
docker-compose up -d
```

This starts:

- **PostgreSQL 15** on `localhost:5432` (user: `bharatledger`, password: `bharatledger`, db: `bharatledger`)
- **Redis 7** on `localhost:6379`

### 5. Verify services

**Postgres:**
```bash
docker-compose exec postgres pg_isready -U bharatledger -d bharatledger
# Should print: bharatledger:5432 - accepting connections
```

**Redis:**
```bash
docker-compose exec redis redis-cli ping
# Should print: PONG
```

### 6. Install backend dependencies (optional for Phase 0)

From project root:

```bash
pip install -r backend/requirements.txt
```

This installs FastAPI, SQLAlchemy, and other backend deps. The backend app is created in Phase 2.

### 7. Database migrations (after Phase 2)

Once the backend and Alembic are set up, run:

```bash
cd backend
alembic upgrade head
```

(Placeholder — Alembic is configured in Phase 2.)

---

## Summary

| Step | Command / Action |
|------|------------------|
| Venv | `python -m venv venv` then activate |
| Env file | Copy `.env.example` → `.env` and fill values |
| Services | `docker-compose up -d` |
| Verify | `docker-compose exec postgres pg_isready -U bharatledger` and `docker-compose exec redis redis-cli ping` |

**Phase 0 done when:** `docker-compose up -d` works and the backend can read `.env` (e.g. a minimal script that loads `python-dotenv` and prints an env var). No API code required yet.
