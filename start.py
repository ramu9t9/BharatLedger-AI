#!/usr/bin/env python3
"""
Start BharatLedger AI with one command: Docker services + backend + frontend.
Run from repo root:  py start.py   or  python start.py

Prerequisites: Docker (for postgres/redis), Python 3.11+, Node 18+
One-time setup: pip install -r backend/requirements.txt && pip install -e ai_engine
                cd frontend && npm install
"""
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def _check_backend_deps():
    """Ensure backend dependencies are installed."""
    try:
        import psycopg  # noqa: F401
    except ImportError:
        print("Backend dependencies missing. Run once from repo root:")
        print("  pip install -r backend/requirements.txt")
        print("  pip install -e ai_engine")
        sys.exit(1)


def _check_frontend_deps():
    """Ensure frontend node_modules exist."""
    if not (FRONTEND / "node_modules").exists():
        print("Frontend dependencies missing. Run once from repo root:")
        print("  cd frontend && npm install")
        sys.exit(1)


def run(cmd, cwd=None, env=None, shell=False):
    return subprocess.Popen(
        cmd,
        cwd=cwd or ROOT,
        env=env or os.environ,
        shell=shell,
        stdin=subprocess.DEVNULL,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )


def _docker_compose_up():
    """Run Docker Compose (try 'docker compose' then 'docker-compose')."""
    for cmd in [["docker", "compose", "up", "-d"], ["docker-compose", "up", "-d"]]:
        try:
            r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=60)
            if r.returncode == 0:
                return True
        except FileNotFoundError:
            continue
        except subprocess.TimeoutExpired:
            continue
    return False


def main():
    print("Starting BharatLedger AI...")
    _check_backend_deps()
    _check_frontend_deps()
    # 1) Docker services
    print("  Starting Postgres & Redis...")
    if _docker_compose_up():
        print("  Docker services started.")
        time.sleep(2)
    else:
        print("  Warning: Could not run Docker (is Docker Desktop running?). Continuing anyway.")
        print("  Ensure Postgres and Redis are available, or start them with: docker compose up -d")
        time.sleep(1)

    # 2) Backend: PYTHONPATH so app and ai_engine are found
    env = os.environ.copy()
    env["PYTHONPATH"] = os.pathsep.join([str(BACKEND), str(ROOT)])
    print("  Starting backend (uvicorn)...")
    backend_proc = run(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=BACKEND,
        env=env,
    )
    time.sleep(2)

    # 3) Frontend (npx so local vite is used on Windows)
    print("  Starting frontend (Vite)...")
    frontend_proc = run(["npx", "vite"], cwd=FRONTEND, shell=os.name == "nt")
    print("\nBackend: http://localhost:8000  |  Frontend: http://localhost:5173")
    print("Press Ctrl+C to stop all.\n")
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        backend_proc.terminate()
        frontend_proc.terminate()
        backend_proc.wait()
        frontend_proc.wait()


if __name__ == "__main__":
    main()
