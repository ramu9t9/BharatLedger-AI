from datetime import datetime, date
from typing import Any

from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    id: str
    business_id: str
    file_name: str
    content_type: str
    status: str
    error_message: str | None
    raw_text: str | None
    extracted_json: dict[str, Any]
    processed_at: datetime | None
    is_corrected: bool = False
    corrected_at: datetime | None = None
    invoice_date: date | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceUpdate(BaseModel):
    extracted_json: dict[str, Any] | None = None
    status: str | None = None


class LineItemUpdate(BaseModel):
    """Partial update for a single line item (by index)."""

    index: int
    description: str | None = None
    hsn_sac: str | None = None
    gst_rate: float | None = None
    taxable_value: float | None = None


class LineItemsPatchRequest(BaseModel):
    """Request body for PATCH /invoices/{id}/line-items."""

    line_items: list[LineItemUpdate]
