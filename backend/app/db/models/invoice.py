from sqlalchemy import Column, DateTime, Date, String, Text, ForeignKey, Boolean, func
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from app.db.base import Base
import enum


class InvoiceStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    FAILED = "FAILED"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(1024), nullable=False)  # S3 key or local path
    file_name = Column(String(255), default="")
    content_type = Column(String(128), default="")
    status = Column(String(32), default=InvoiceStatus.UPLOADED.value, nullable=False, index=True)
    error_message = Column(Text, default="")
    raw_text = Column(Text, default="")
    extracted_json = Column(JSONB, default=dict)
    processed_at = Column(DateTime(timezone=True), default=None)
    is_corrected = Column(Boolean, default=False, nullable=False)
    corrected_at = Column(DateTime(timezone=True), default=None)
    invoice_date = Column(Date, default=None)  # Denormalized from extracted_json for indexing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
