"""File storage for invoice uploads (local or S3)."""
import os
import uuid
from pathlib import Path

from app.core.config import settings


UPLOADS_DIR = Path("uploads").resolve()


def _ensure_uploads_dir() -> Path:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOADS_DIR


def save_upload(content: bytes, business_id: str, original_name: str, content_type: str) -> str:
    """
    Save uploaded file and return the storage path (file_path) for DB.
    For now uses local uploads/; can be extended to S3.
    """
    _ensure_uploads_dir()
    ext = Path(original_name).suffix or ".bin"
    key = f"{business_id}/{uuid.uuid4().hex}{ext}"
    path = UPLOADS_DIR / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)
    return str(path)


def read_file(file_path: str) -> bytes:
    """Read file content by path (local path for now)."""
    return Path(file_path).read_bytes()


def get_content_type(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return "application/pdf"
    if ext in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    if ext == ".webp":
        return "image/webp"
    return "application/octet-stream"


def delete_file(file_path: str) -> None:
    """Delete a stored file by path (local storage). No-op if file does not exist."""
    path = Path(file_path)
    if path.exists() and path.is_file():
        path.unlink()
