"""GST liability and GSTR-1 / GSTR-3B preparation."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from collections import defaultdict

from app.db.session import get_db
from app.db.models import Invoice, Business
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/gst", tags=["gst"])


class PrepareRequest(BaseModel):
    business_id: str
    period: str | None = None


def _business_ids_for_user(db: Session, user_id: str):
    return [b.id for b in db.query(Business).filter(Business.user_id == user_id).all()]


@router.get("/businesses/{business_id}/liability")
def gst_liability(
    business_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """GST liability summary: output tax, ITC, payable from extracted invoices."""
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()

    output_tax = 0.0
    itc = 0.0
    for inv in rows:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        gst_total = float(totals.get("gst_total", 0) or 0)
        # Simplified: all as output tax (outward supply); ITC from inward can be added later
        output_tax += gst_total

    return {
        "business_id": business_id,
        "output_tax": round(output_tax, 2),
        "itc": round(itc, 2),
        "tax_payable": round(output_tax - itc, 2),
    }


def _build_gstr1_json(invoices: list) -> dict:
    """Build GSTR-1 style JSON (simplified structure)."""
    b2b = []
    b2c = []
    for inv in invoices:
        ext = inv.extracted_json or {}
        is_b2b = bool(ext.get("buyer") and (ext.get("buyer") or {}).get("gstin"))
        item = {
            "inv_no": (ext.get("invoice") or {}).get("number", ""),
            "inv_date": (ext.get("invoice") or {}).get("date", ""),
            "totals": ext.get("totals", {}),
            "line_items": ext.get("line_items", []),
        }
        if is_b2b:
            item["buyer_gstin"] = (ext.get("buyer") or {}).get("gstin", "")
            b2b.append(item)
        else:
            b2c.append(item)
    return {"b2b": b2b, "b2c": b2c, "version": "GSTR1_0.1"}


def _build_gstr3b_json(liability: dict, business_id: str) -> dict:
    """Build GSTR-3B style summary JSON."""
    return {
        "business_id": business_id,
        "outward_taxable_value": 0,
        "outward_tax": liability.get("output_tax", 0),
        "itc": liability.get("itc", 0),
        "tax_payable": liability.get("tax_payable", 0),
        "version": "GSTR3B_0.1",
    }


@router.post("/gstr1/prepare")
def prepare_gstr1(
    body: PrepareRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate GSTR-1 JSON for the business (outward supplies)."""
    business_id = body.business_id
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    return _build_gstr1_json(rows)


@router.post("/gstr3b/prepare")
def prepare_gstr3b(
    body: PrepareRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Generate GSTR-3B summary JSON."""
    business_id = body.business_id
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    output_tax = sum(
        float((inv.extracted_json or {}).get("totals") or {}).get("gst_total", 0) or 0
        for inv in rows
    )
    liability = {"output_tax": output_tax, "itc": 0, "tax_payable": output_tax}
    return _build_gstr3b_json(liability, business_id)
