import os
import sys
from pathlib import Path

# Repo root on path for app and ai_engine
repo_root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(repo_root))
sys.path.insert(0, str(repo_root / "backend"))

# Use in-memory SQLite for tests if no DATABASE_URL
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret")
