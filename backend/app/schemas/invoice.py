from datetime import datetime
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
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceUpdate(BaseModel):
    extracted_json: dict[str, Any] | None = None
    status: str | None = None
