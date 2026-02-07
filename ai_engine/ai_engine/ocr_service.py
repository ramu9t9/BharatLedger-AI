"""
OCR: file (image/PDF) -> raw text.
Uses Tesseract; optional Google Vision / EasyOCR can be added later.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Union

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    from PIL import Image
except ImportError:
    Image = None


def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from image bytes (JPEG/PNG/WEBP) using Tesseract."""
    if Image is None:
        raise ImportError("Pillow is required for OCR. pip install Pillow")
    if pytesseract is None:
        raise ImportError("pytesseract is required. pip install pytesseract (and install Tesseract binary)")
    img = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(img, lang="eng+hin")


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF (single or multi-page) using pdf2image + Tesseract."""
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        raise ImportError("pdf2image is required for PDF OCR. pip install pdf2image (and poppler)")
    images = convert_from_bytes(pdf_bytes)
    texts = []
    for img in images:
        if pytesseract is None:
            raise ImportError("pytesseract is required for OCR")
        texts.append(pytesseract.image_to_string(img, lang="eng+hin"))
    return "\n\n".join(texts)


def extract_text(file_path_or_bytes: Union[str, Path, bytes], content_type: str | None = None) -> str:
    """
    Extract raw text from file path or bytes.
    Supports: image (jpg/png/webp), PDF.
    content_type optional: "application/pdf", "image/jpeg", etc.
    """
    if isinstance(file_path_or_bytes, (str, Path)):
        path = Path(file_path_or_bytes)
        if not path.exists():
            raise FileNotFoundError(str(path))
        raw = path.read_bytes()
        suffix = path.suffix.lower()
    else:
        raw = file_path_or_bytes
        suffix = ""

    if content_type and "pdf" in content_type:
        return extract_text_from_pdf(raw)
    if suffix == ".pdf" or (content_type and "pdf" in (content_type or "")):
        return extract_text_from_pdf(raw)

    return extract_text_from_image(raw)
