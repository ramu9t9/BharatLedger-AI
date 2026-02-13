"""GST liability and GSTR-1 / GSTR-3B preparation."""
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime

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


@router.get("/summary")
def gst_summary(
    business_id: str = Query(...),
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """GST summary: total sales, purchases, output GST, input GST, net payable."""
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    # Query invoices
    query = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    )
    
    invoices = query.all()
    
    total_sales = 0.0
    total_purchases = 0.0
    output_gst = 0.0
    input_gst = 0.0
    
    for inv in invoices:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        
        # Determine if it's a sale or purchase based on invoice type
        invoice_type = ext.get("invoice_type", "").lower()
        is_sale = "sale" in invoice_type or "outward" in invoice_type or not ("purchase" in invoice_type or "inward" in invoice_type)
        
        taxable_value = float(totals.get("taxable_value", 0) or 0)
        gst_total = float(totals.get("gst_total", 0) or 0)
        
        if is_sale:
            total_sales += taxable_value
            output_gst += gst_total
        else:
            total_purchases += taxable_value
            input_gst += gst_total
    
    net_gst_payable = output_gst - input_gst
    
    return {
        "total_sales": round(total_sales, 2),
        "total_purchases": round(total_purchases, 2),
        "output_gst": round(output_gst, 2),
        "input_gst": round(input_gst, 2),
        "net_gst_payable": round(net_gst_payable, 2),
        "period_month": month or datetime.now().strftime("%Y-%m"),
    }


@router.get("/vendors")
def gst_vendors(
    business_id: str = Query(...),
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Get vendor-wise GST summary for purchases."""
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return [{"error": "Business not found"}]

    invoices = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    
    vendor_data = defaultdict(lambda: {"total_purchase": 0.0, "gstin": None, "gstin_missing": False, "gstin_invalid": False})
    total_purchases = 0.0
    
    for inv in invoices:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        invoice_type = ext.get("invoice_type", "").lower()
        
        # Only include purchases
        if "purchase" in invoice_type or "inward" in invoice_type:
            vendor_name = ext.get("vendor", {}).get("name", "Unknown Vendor") or "Unknown Vendor"
            vendor_gstin = ext.get("vendor", {}).get("gstin", "")
            
            taxable_value = float(totals.get("taxable_value", 0) or 0)
            
            vendor_data[vendor_name]["total_purchase"] += taxable_value
            total_purchases += taxable_value
            
            if vendor_gstin:
                vendor_data[vendor_name]["gstin"] = vendor_gstin
                # Basic GSTIN validation (15 characters, alphanumeric)
                if len(vendor_gstin) != 15 or not vendor_gstin.isalnum():
                    vendor_data[vendor_name]["gstin_invalid"] = True
            else:
                vendor_data[vendor_name]["gstin_missing"] = True
    
    # Build response
    result = []
    for vendor_name, data in vendor_data.items():
        percentage = (data["total_purchase"] / total_purchases * 100) if total_purchases > 0 else 0
        result.append({
            "vendor_name": vendor_name,
            "vendor_gstin": data["gstin"],
            "total_purchase": round(data["total_purchase"], 2),
            "gstin_missing": data["gstin_missing"],
            "gstin_invalid": data["gstin_invalid"],
            "percentage_share": round(percentage, 2),
        })
    
    # Sort by total purchase descending
    result.sort(key=lambda x: x["total_purchase"], reverse=True)
    
    return result


@router.get("/itc")
def gst_itc(
    business_id: str = Query(...),
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Get ITC summary and risk-flagged vendors."""
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    invoices = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    
    total_itc = 0.0
    risk_flagged = []
    
    for inv in invoices:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        invoice_type = ext.get("invoice_type", "").lower()
        
        # Only include purchases for ITC
        if "purchase" in invoice_type or "inward" in invoice_type:
            cgst = float(totals.get("cgst", 0) or 0)
            sgst = float(totals.get("sgst", 0) or 0)
            igst = float(totals.get("igst", 0) or 0)
            
            itc_amount = cgst + sgst + igst
            total_itc += itc_amount
            
            # Check for risk flags
            vendor_name = ext.get("vendor", {}).get("name", "Unknown")
            vendor_gstin = ext.get("vendor", {}).get("gstin", "")
            
            if not vendor_gstin:
                risk_flagged.append({
                    "vendor_name": vendor_name,
                    "issue": "GSTIN missing",
                    "amount": round(itc_amount, 2),
                })
            elif len(vendor_gstin) != 15 or not vendor_gstin.isalnum():
                risk_flagged.append({
                    "vendor_name": vendor_name,
                    "issue": "Invalid GSTIN format",
                    "amount": round(itc_amount, 2),
                })
    
    return {
        "total_itc": round(total_itc, 2),
        "risk_flagged_vendors": risk_flagged,
    }


@router.get("/export/ca-pack")
def export_ca_pack(
    business_id: str = Query(...),
    month: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Export CA pack - JSON file with all GST data."""
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        return {"error": "Business not found"}

    invoices = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    
    # Get liability
    liability = db.query(Invoice).filter(
        Invoice.business_id == business_id,
        Invoice.status == "EXTRACTED",
    ).all()
    
    output_tax = 0.0
    for inv in liability:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        output_tax += float(totals.get("gst_total", 0) or 0)
    
    return {
        "business": {
            "id": biz.id,
            "name": biz.name,
            "gstin": biz.gstin,
        },
        "period": month or datetime.now().strftime("%Y-%m"),
        "total_invoices": len(invoices),
        "gst_liability": {
            "output_tax": round(output_tax, 2),
            "itc": 0,
            "tax_payable": round(output_tax, 2),
        },
        "invoices": [
            {
                "id": inv.id,
                "file_name": inv.file_name,
                "extracted_json": inv.extracted_json,
            }
            for inv in invoices
        ],
    }
