"""
OCR: file (image/PDF) -> raw text.
Uses Tesseract; optional Google Vision / EasyOCR can be added later.
"""

from __future__ import annotations

import io
import os
import sys
from pathlib import Path
from typing import Union

try:
    import pytesseract
    # On Windows, point to Tesseract if not in PATH (e.g. default install location)
    if sys.platform == "win32":
        _tesseract_cmd = os.environ.get("TESSERACT_CMD")
        if not _tesseract_cmd:
            for _path in (
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            ):
                if Path(_path).exists():
                    pytesseract.pytesseract.tesseract_cmd = _path
                    break
        elif Path(_tesseract_cmd).exists():
            pytesseract.pytesseract.tesseract_cmd = _tesseract_cmd
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


def _pdf_to_images_pymupdf(pdf_bytes: bytes) -> list:
    """Convert PDF to PIL Images using PyMuPDF (no external binaries, works on Windows)."""
    import pymupdf
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    images = []
    try:
        for page in doc:
            # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
            images.append(pix.pil_image())
    finally:
        doc.close()
    return images


def _pdf_to_images_pdf2image(pdf_bytes: bytes) -> list:
    """Convert PDF to PIL Images using pdf2image (requires poppler)."""
    from pdf2image import convert_from_bytes
    return convert_from_bytes(pdf_bytes)


def _pdf_extract_text_pymupdf(pdf_bytes: bytes) -> str:
    """Extract embedded text from PDF using PyMuPDF (no Tesseract needed for text-based PDFs)."""
    import pymupdf
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    texts = []
    try:
        for page in doc:
            texts.append(page.get_text())
    finally:
        doc.close()
    return "\n\n".join(texts).strip()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF: try embedded text first (no Tesseract), then OCR if needed."""
    # 1. Try PyMuPDF direct text extraction (works for text-based PDFs, no Tesseract needed)
    try:
        direct_text = _pdf_extract_text_pymupdf(pdf_bytes)
        if direct_text and len(direct_text.strip()) > 20:
            return direct_text
    except Exception:
        pass

    # 2. Fall back to OCR (requires Tesseract) for image-based/scanned PDFs
    images = None
    try:
        images = _pdf_to_images_pymupdf(pdf_bytes)
    except ImportError:
        # PyMuPDF not installed; try pdf2image (requires poppler)
        try:
            images = _pdf_to_images_pdf2image(pdf_bytes)
        except Exception as e:
            err_msg = str(e).lower()
            if "poppler" in err_msg or "page count" in err_msg or "pdftoppm" in err_msg:
                raise ImportError(
                    "PDF processing requires either pymupdf (pip install pymupdf) or poppler. "
                    "On Windows: pip install pymupdf"
                ) from e
            raise
    except Exception:
        # PyMuPDF failed (e.g. corrupted PDF); try pdf2image as fallback
        try:
            images = _pdf_to_images_pdf2image(pdf_bytes)
        except Exception:
            raise

    if not images:
        return ""

    # Tesseract required for OCR - if not installed, raise helpful error
    if pytesseract is None:
        raise ImportError(
            "OCR requires pytesseract. pip install pytesseract. "
            "Also install Tesseract binary: https://github.com/UB-Mannheim/tesseract/wiki"
        )

    texts = []
    try:
        for img in images:
            texts.append(pytesseract.image_to_string(img, lang="eng+hin"))
    except Exception as e:
        err = str(e).lower()
        if "tesseract" in err or "path" in err or "not found" in err:
            raise ImportError(
                "Tesseract OCR is required for image-based PDFs. "
                "Install Tesseract: choco install tesseract (Windows) or see "
                "https://github.com/UB-Mannheim/tesseract/wiki"
            ) from e
        raise
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
