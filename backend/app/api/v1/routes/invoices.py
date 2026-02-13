from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models import Invoice
from app.schemas.invoice import InvoiceResponse, InvoiceUpdate, LineItemsPatchRequest
from app.services.gst_utils import recalculate_line_item_totals
from app.api.deps import get_current_user_id
from app.services.storage import save_upload, read_file, get_content_type, delete_file
from app.services.invoice_service import process_invoice_file

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _unwrap_error_message(exc: BaseException) -> str:
    """Get a user-friendly error message, unwrapping RetryError and similar."""
    try:
        from tenacity import RetryError
        if isinstance(exc, RetryError) and getattr(exc, "last_attempt", None):
            last = exc.last_attempt
            if last and getattr(last, "failed", False) and last.exception():
                return str(last.exception())
    except Exception:
        pass
    cause = getattr(exc, "__cause__", None)
    if cause:
        return _unwrap_error_message(cause)
    return str(exc)


def _set_invoice_date(inv: Invoice) -> None:
    """Populate invoice_date from extracted_json for indexing."""
    ext = inv.extracted_json or {}
    inv_date_str = (ext.get("invoice") or {}).get("date", "")
    if inv_date_str:
        try:
            inv.invoice_date = datetime.strptime(inv_date_str[:10], "%Y-%m-%d").date()
        except (ValueError, TypeError):
            pass


def _invoice_for_user(db: Session, invoice_id: str, user_id: str) -> Invoice | None:
    """Get invoice if it belongs to a business owned by user."""
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        return None
    from app.db.models import Business
    biz = db.query(Business).filter(Business.id == inv.business_id, Business.user_id == user_id).first()
    return inv if biz else None


@router.post("", response_model=InvoiceResponse)
async def upload_invoice(
    business_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from app.db.models import Business
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    content = await file.read()
    file_path = save_upload(content, business_id, file.filename or "invoice", file.content_type or "")
    content_type = file.content_type or get_content_type(file_path)

    inv = Invoice(
        id=str(uuid.uuid4()),
        business_id=business_id,
        file_path=file_path,
        file_name=file.filename or "invoice",
        content_type=content_type,
        status="UPLOADED",
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    # Process synchronously for MVP (Celery can be wired in workers/)
    try:
        inv.status = "PROCESSING"
        db.commit()
        result = process_invoice_file(file_path, content_type=content_type)
        inv.extracted_json = result
        inv.raw_text = result.get("raw_text", "")
        inv.status = "EXTRACTED"
        inv.processed_at = datetime.now(timezone.utc)
        _set_invoice_date(inv)
    except Exception as e:
        inv.status = "FAILED"
        inv.error_message = _unwrap_error_message(e)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    business_id: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    from app.db.models import Business
    q = db.query(Invoice)
    if business_id:
        biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")
        q = q.filter(Invoice.business_id == business_id)
    else:
        biz_ids = [b.id for b in db.query(Business).filter(Business.user_id == user_id).all()]
        q = q.filter(Invoice.business_id.in_(biz_ids))
    return q.order_by(Invoice.created_at.desc()).all()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    inv = _invoice_for_user(db, invoice_id, user_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    inv = _invoice_for_user(db, invoice_id, user_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if data.extracted_json is not None:
        inv.extracted_json = data.extracted_json
    if data.status is not None:
        inv.status = data.status
    db.commit()
    db.refresh(inv)
    return inv


@router.patch("/{invoice_id}/line-items", response_model=InvoiceResponse)
def patch_invoice_line_items(
    invoice_id: str,
    data: LineItemsPatchRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update line items (description, HSN/SAC, GST rate, taxable value) and recalculate totals."""
    inv = _invoice_for_user(db, invoice_id, user_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status != "EXTRACTED":
        raise HTTPException(status_code=400, detail="Only EXTRACTED invoices can be corrected")

    ext = inv.extracted_json or {}
    line_items = list(ext.get("line_items") or [])
    is_inter = bool(ext.get("is_inter_state", False))

    for upd in data.line_items:
        idx = upd.index
        if idx < 0 or idx >= len(line_items):
            raise HTTPException(status_code=400, detail=f"Invalid line item index: {idx}")
        item = dict(line_items[idx])
        if upd.description is not None:
            item["description"] = upd.description
        if upd.hsn_sac is not None:
            item["hsn_sac"] = upd.hsn_sac
        if upd.gst_rate is not None:
            item["gst_rate"] = upd.gst_rate
        if upd.taxable_value is not None:
            item["taxable_value"] = upd.taxable_value
        recalculate_line_item_totals(item, is_inter)
        item["is_corrected"] = True
        line_items[idx] = item

    total_taxable = sum(float(i.get("taxable_value") or 0) for i in line_items)
    total_gst = sum(
        float(i.get("gst_breakdown") or {}).get("cgst", 0)
        + float(i.get("gst_breakdown") or {}).get("sgst", 0)
        + float(i.get("gst_breakdown") or {}).get("igst", 0)
        for i in line_items
    )
    ext["line_items"] = line_items
    ext["totals"] = {
        "taxable_value": round(total_taxable, 2),
        "gst_total": round(total_gst, 2),
        "grand_total": round(total_taxable + total_gst, 2),
    }
    inv.extracted_json = ext
    inv.is_corrected = True
    inv.corrected_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inv)
    return inv


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Delete an invoice and its stored file."""
    inv = _invoice_for_user(db, invoice_id, user_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        delete_file(inv.file_path)
    except OSError:
        pass  # ignore if file already missing
    db.delete(inv)
    db.commit()
    return None


@router.post("/{invoice_id}/process", response_model=InvoiceResponse)
def process_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    inv = _invoice_for_user(db, invoice_id, user_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    try:
        inv.status = "PROCESSING"
        db.commit()
        result = process_invoice_file(inv.file_path, content_type=inv.content_type or None)
        inv.extracted_json = result
        inv.raw_text = result.get("raw_text", "")
        inv.status = "EXTRACTED"
        inv.processed_at = datetime.now(timezone.utc)
        inv.error_message = ""
        _set_invoice_date(inv)
    except Exception as e:
        inv.status = "FAILED"
        inv.error_message = _unwrap_error_message(e)
    db.commit()
    db.refresh(inv)
    return inv
