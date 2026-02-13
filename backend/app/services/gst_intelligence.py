"""GST Intelligence Service: monthly summaries, vendor analysis, ITC."""

from __future__ import annotations

from datetime import date
from collections import defaultdict

from sqlalchemy.orm import Session

from app.db.models import Invoice, Business


def _parse_invoice_date(inv: Invoice) -> date | None:
    """Get invoice date from extracted_json or invoice_date column."""
    if inv.invoice_date:
        return inv.invoice_date
    ext = inv.extracted_json or {}
    dstr = (ext.get("invoice") or {}).get("date", "")
    if not dstr:
        return None
    try:
        return date.fromisoformat(dstr[:10])
    except (ValueError, TypeError):
        return None


def _in_month(d: date | None, year: int, month: int) -> bool:
    if not d:
        return False
    return d.year == year and d.month == month


def _is_sales_invoice(ext: dict, business_gstin: str | None) -> bool:
    """True if we (business) are the vendor/seller."""
    if not business_gstin:
        return False
    return (ext.get("vendor") or {}).get("gstin", "") == business_gstin


def _is_purchase_invoice(ext: dict, business_gstin: str | None) -> bool:
    """True if we (business) are the buyer."""
    if not business_gstin:
        return True  # Default to purchase when unclear
    return (ext.get("buyer") or {}).get("gstin", "") == business_gstin


def _get_totals(ext: dict) -> tuple[float, float, float]:
    totals = ext.get("totals") or {}
    taxable = float(totals.get("taxable_value") or 0)
    gst_total = float(totals.get("gst_total") or 0)
    grand = float(totals.get("grand_total") or 0)
    return taxable, gst_total, grand


def _get_vendor(ext: dict) -> tuple[str, str]:
    v = ext.get("vendor") or {}
    return (v.get("name") or "Unknown", v.get("gstin") or "")


def calculate_monthly_summary(
    db: Session, business_id: str, year: int, month: int
) -> dict:
    """
    Returns monthly GST summary.
    Uses extracted_json or normalized data from invoices.
    """
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = (
        db.query(Invoice)
        .filter(Invoice.business_id == business_id, Invoice.status == "EXTRACTED")
        .all()
    )

    total_sales = 0.0
    total_purchases = 0.0
    output_gst = 0.0
    input_gst = 0.0
    gstin = (biz.gstin or "").strip()

    for inv in rows:
        inv_date = _parse_invoice_date(inv)
        if not _in_month(inv_date, year, month):
            continue
        ext = inv.extracted_json or {}
        _, _, grand = _get_totals(ext)
        gst_tot = _get_totals(ext)[1]

        if _is_sales_invoice(ext, gstin or None):
            total_sales += grand
            output_gst += gst_tot
        elif _is_purchase_invoice(ext, gstin or None):
            total_purchases += grand
            input_gst += gst_tot

    net_gst_payable = max(0.0, output_gst - input_gst)
    projected_cash_outflow = net_gst_payable  # GST payable + other outflows could be extended

    return {
        "total_sales": round(total_sales, 2),
        "total_purchases": round(total_purchases, 2),
        "output_gst": round(output_gst, 2),
        "input_gst": round(input_gst, 2),
        "net_gst_payable": round(net_gst_payable, 2),
        "projected_cash_outflow": round(projected_cash_outflow, 2),
    }


def vendor_dependency_analysis(
    db: Session, business_id: str, year: int, month: int
) -> dict:
    """Top 5 vendors by purchase value and percentage concentration."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = (
        db.query(Invoice)
        .filter(Invoice.business_id == business_id, Invoice.status == "EXTRACTED")
        .all()
    )

    vendor_totals: dict[str, float] = defaultdict(float)
    gstin = (biz.gstin or "").strip()

    for inv in rows:
        inv_date = _parse_invoice_date(inv)
        if not _in_month(inv_date, year, month):
            continue
        ext = inv.extracted_json or {}
        if not _is_purchase_invoice(ext, gstin or None):
            continue
        _, _, grand = _get_totals(ext)
        name, _ = _get_vendor(ext)
        vendor_totals[name] += grand

    total_purchases = sum(vendor_totals.values())
    sorted_vendors = sorted(
        vendor_totals.items(), key=lambda x: -x[1]
    )[:5]
    vendors = [
        {
            "vendor_name": name,
            "purchase_value": round(val, 2),
            "percentage": round((val / total_purchases * 100), 2) if total_purchases else 0,
        }
        for name, val in sorted_vendors
    ]

    return {
        "vendors": vendors,
        "total_purchases": round(total_purchases, 2),
    }


def itc_summary(
    db: Session, business_id: str, year: int, month: int
) -> dict:
    """ITC summary: total input GST, vendor-wise ITC, potential risk from missing GSTIN."""
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        return {"error": "Business not found"}

    rows = (
        db.query(Invoice)
        .filter(Invoice.business_id == business_id, Invoice.status == "EXTRACTED")
        .all()
    )

    total_input_gst = 0.0
    vendor_wise_itc: dict[str, dict] = {}
    potential_itc_risk = 0.0
    gstin = (biz.gstin or "").strip()

    for inv in rows:
        inv_date = _parse_invoice_date(inv)
        if not _in_month(inv_date, year, month):
            continue
        ext = inv.extracted_json or {}
        if not _is_purchase_invoice(ext, gstin or None):
            continue

        _, gst_tot, _ = _get_totals(ext)
        name, vendor_gstin = _get_vendor(ext)

        if not vendor_gstin or len(vendor_gstin) < 15:
            potential_itc_risk += gst_tot
        else:
            total_input_gst += gst_tot
            if name not in vendor_wise_itc:
                vendor_wise_itc[name] = {"gstin": vendor_gstin, "itc": 0.0}
            vendor_wise_itc[name]["itc"] += gst_tot

    vendor_wise = [
        {"vendor_name": k, "gstin": v["gstin"], "itc": round(v["itc"], 2)}
        for k, v in sorted(vendor_wise_itc.items(), key=lambda x: -x[1]["itc"])
    ]

    return {
        "total_input_gst": round(total_input_gst, 2),
        "vendor_wise_itc": vendor_wise,
        "potential_itc_risk": round(potential_itc_risk, 2),
    }
