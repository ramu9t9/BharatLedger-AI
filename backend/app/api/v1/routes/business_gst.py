"""Business GST intelligence and CA export endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Invoice, Business
from app.api.deps import get_current_user_id
from app.services.gst_intelligence import (
    calculate_monthly_summary,
    vendor_dependency_analysis,
    itc_summary,
)

router = APIRouter(prefix="/businesses", tags=["business-gst"])


def _business_for_user(db: Session, business_id: str, user_id: str) -> Business | None:
    return db.query(Business).filter(
        Business.id == business_id, Business.user_id == user_id
    ).first()


@router.get("/{business_id}/gst/summary")
def gst_summary(
    business_id: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """GET /api/v1/businesses/{id}/gst/summary?year=&month="""
    biz = _business_for_user(db, business_id, user_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return calculate_monthly_summary(db, business_id, year, month)


@router.get("/{business_id}/gst/vendors")
def gst_vendors(
    business_id: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """GET /api/v1/businesses/{id}/gst/vendors?year=&month="""
    biz = _business_for_user(db, business_id, user_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return vendor_dependency_analysis(db, business_id, year, month)


@router.get("/{business_id}/gst/itc")
def gst_itc(
    business_id: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """GET /api/v1/businesses/{id}/gst/itc?year=&month="""
    biz = _business_for_user(db, business_id, user_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return itc_summary(db, business_id, year, month)


@router.get("/{business_id}/export/monthly")
def export_monthly(
    business_id: str,
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    CA Export: structured JSON for Excel export.
    Returns invoices, totals, gst_summary, vendor_summary.
    """
    biz = _business_for_user(db, business_id, user_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    from app.services.gst_intelligence import (
        _parse_invoice_date,
        _in_month,
        _get_totals,
        _get_vendor,
        _is_sales_invoice,
        _is_purchase_invoice,
    )

    rows = (
        db.query(Invoice)
        .filter(Invoice.business_id == business_id, Invoice.status == "EXTRACTED")
        .all()
    )

    gstin = (biz.gstin or "").strip()
    invoices = []
    total_taxable = 0.0
    total_gst = 0.0
    grand_total = 0.0
    vendor_totals = {}

    for inv in rows:
        inv_date = _parse_invoice_date(inv)
        if not _in_month(inv_date, year, month):
            continue

        ext = inv.extracted_json or {}
        taxable, gst_tot, grand = _get_totals(ext)
        inv_data = {
            "id": inv.id,
            "file_name": inv.file_name,
            "invoice_number": (ext.get("invoice") or {}).get("number", ""),
            "invoice_date": str(inv_date) if inv_date else "",
            "type": "sales" if _is_sales_invoice(ext, gstin or None) else "purchase",
            "totals": {"taxable_value": taxable, "gst_total": gst_tot, "grand_total": grand},
            "line_items": ext.get("line_items", []),
        }
        invoices.append(inv_data)

        total_taxable += taxable
        total_gst += gst_tot
        grand_total += grand

        if _is_purchase_invoice(ext, gstin or None):
            name, _ = _get_vendor(ext)
            vendor_totals[name] = vendor_totals.get(name, 0) + grand

    gst_summary = calculate_monthly_summary(db, business_id, year, month)
    vendor_data = vendor_dependency_analysis(db, business_id, year, month)

    return {
        "invoices": invoices,
        "totals": {
            "taxable_value": round(total_taxable, 2),
            "gst_total": round(total_gst, 2),
            "grand_total": round(grand_total, 2),
        },
        "gst_summary": gst_summary,
        "vendor_summary": vendor_data,
    }
