"""Invoice processing: load file, call ai_engine, return result."""
import sys
from pathlib import Path

# Allow backend to import ai_engine when run from repo root or with ai_engine on path
_repo_root = Path(__file__).resolve().parents[3]
_ai_engine_root = _repo_root / "ai_engine"
if _ai_engine_root.exists() and str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))


def process_invoice_file(file_path: str, content_type: str | None = None) -> dict:
    """
    Call ai_engine.process_invoice and return the result as a JSON-serializable dict.
    """
    from ai_engine import process_invoice

    result = process_invoice(file_path, content_type=content_type)
    return result.model_dump()
