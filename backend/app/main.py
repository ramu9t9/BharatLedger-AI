"""Load .env into os.environ so ai_engine and other code see OPENROUTER_API_KEY etc."""
from pathlib import Path
try:
    from dotenv import load_dotenv
    _root = Path(__file__).resolve().parents[2]
    _backend = Path(__file__).resolve().parents[1]
    load_dotenv(_root / ".env")
    load_dotenv(_backend / ".env")
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import auth, businesses, invoices, reports, gst
from app.core.config import settings

app = FastAPI(title="BharatLedger API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(businesses.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(gst.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
