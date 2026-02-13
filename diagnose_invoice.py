#!/usr/bin/env python3
"""Diagnose invoice processing failure - run from repo root."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# Load .env from project root or backend
for env_path in [ROOT / ".env", ROOT / "backend" / ".env"]:
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
            print(f"Loaded env from {env_path}\n")
            break
        except ImportError:
            pass

# Add ai_engine package root so "from ai_engine import ..." works
sys.path.insert(0, str(ROOT / "ai_engine"))
sys.path.insert(0, str(ROOT))

test_file = r"C:\Users\Ram\Downloads\Doc1.pdf"

def main():
    print("=== Invoice Processing Diagnostic ===\n")
    
    print("1. File check")
    print("   Path:", test_file)
    print("   Exists:", Path(test_file).exists())
    if Path(test_file).exists():
        print("   Size:", Path(test_file).stat().st_size, "bytes")
    
    print("\n2. OCR (extract text from PDF)")
    try:
        from ai_engine.ocr_service import _pdf_extract_text_pymupdf
        raw_bytes = Path(test_file).read_bytes()
        direct_text = _pdf_extract_text_pymupdf(raw_bytes)
        print("   PyMuPDF direct text:", len(direct_text), "chars", repr(direct_text[:100])[:120] if direct_text else "(empty)")
    except Exception as e:
        print("   Direct extract failed:", e)
    try:
        from ai_engine.ocr_service import extract_text
        raw_text = extract_text(test_file, "application/pdf")
        print("   Full extract OK. Total", len(raw_text), "chars")
        preview = raw_text[:300].replace("\n", " ")
        print("   Preview:", repr(preview) if raw_text else "(empty)")
        if not raw_text or not raw_text.strip():
            print("   WARNING: Empty text - PDF may be image-only or OCR failed silently")
    except Exception as e:
        print("   FAILED:", type(e).__name__, ":", str(e))
        return
    
    print("\n3. LLM extraction (OpenRouter/OpenAI)")
    key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY")
    print("   OPENROUTER_API_KEY set:", bool(os.environ.get("OPENROUTER_API_KEY")))
    print("   OPENAI_API_KEY set:", bool(os.environ.get("OPENAI_API_KEY")))
    if not key:
        print("   FAILED: No API key. Set OPENROUTER_API_KEY or OPENAI_API_KEY in .env")
        return
    try:
        from ai_engine.llm_extractor import extract_from_text
        result = extract_from_text(raw_text[:12000])
        print("   OK. Got keys:", list(result.keys()))
    except Exception as e:
        print("   FAILED:", type(e).__name__, ":", str(e))
        return
    
    print("\n4. Full pipeline (process_invoice)")
    try:
        from ai_engine import process_invoice
        result = process_invoice(test_file, "application/pdf")
        print("   OK. Line items:", len(result.line_items))
    except Exception as e:
        print("   FAILED:", type(e).__name__, ":", str(e))

if __name__ == "__main__":
    main()
