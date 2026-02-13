#!/usr/bin/env python3
"""
Test invoice processing from backend (uses backend .env).
Run from repo root:  py backend/test_invoice_backend.py
Or from backend:    py test_invoice_backend.py
"""
import os
import sys
from pathlib import Path

# Ensure backend and repo root are on path
BACKEND = Path(__file__).resolve().parent
ROOT = BACKEND.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

# Load .env from project root or backend so API keys are available
for _env in [ROOT / ".env", BACKEND / ".env"]:
    if _env.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(_env)
            break
        except ImportError:
            pass

# Load backend config
from app.core.config import settings

# Test file - same as diagnostic
TEST_PDF = os.environ.get("TEST_INVOICE_PDF", r"C:\Users\Ram\Downloads\Doc1.pdf")


def main():
    print("=== Backend invoice processing test ===\n")
    print("1. Config (env loaded)")
    print("   OPENROUTER_API_KEY set:", bool(os.environ.get("OPENROUTER_API_KEY")))
    print("   OPENAI_API_KEY set:", bool(os.environ.get("OPENAI_API_KEY")))
    print("   OPENROUTER_MODEL:", os.environ.get("OPENROUTER_MODEL", "(default)"))

    if not Path(TEST_PDF).exists():
        print(f"\n   SKIP: Test file not found: {TEST_PDF}")
        print("   Set TEST_INVOICE_PDF to another path or copy Doc1.pdf there.")
        return

    print(f"\n2. Test file: {TEST_PDF}")
    print("   Size:", Path(TEST_PDF).stat().st_size, "bytes")

    print("\n3. Running process_invoice_file (OCR + LLM)...")
    try:
        from app.services.invoice_service import process_invoice_file
        result = process_invoice_file(TEST_PDF, "application/pdf")
        print("   OK. Result keys:", list(result.keys())[:8])
        if result.get("vendor"):
            print("   Vendor:", result["vendor"].get("name", ""))
        if result.get("invoice"):
            print("   Invoice:", result["invoice"].get("number", ""), result["invoice"].get("date", ""))
        print("   Line items:", len(result.get("line_items", [])))
        print("   Totals:", result.get("totals", {}))
        print("\n   Backend pipeline succeeded. You can test from the frontend.")
    except Exception as e:
        print("   FAILED:", type(e).__name__, ":", str(e))
        raise


if __name__ == "__main__":
    main()
