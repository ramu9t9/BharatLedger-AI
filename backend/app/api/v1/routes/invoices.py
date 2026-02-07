from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models import Invoice
from app.schemas.invoice import InvoiceResponse, InvoiceUpdate
from app.api.deps import get_current_user_id
from app.services.storage import save_upload, read_file, get_content_type
from app.services.invoice_service import process_invoice_file

router = APIRouter(prefix="/invoices", tags=["invoices"])


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
    except Exception as e:
        inv.status = "FAILED"
        inv.error_message = str(e)
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
    except Exception as e:
        inv.status = "FAILED"
        inv.error_message = str(e)
    db.commit()
    db.refresh(inv)
    return inv
