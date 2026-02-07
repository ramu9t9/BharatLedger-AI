from sqlalchemy import Column, String, Float, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(String(36), primary_key=True)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(500), default="")
    hsn_sac = Column(String(20), default="")
    category = Column(String(128), default="")
    qty = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    taxable_value = Column(Float, default=0.0)
    gst_rate = Column(Float, default=0.0)
    gst_breakdown = Column(JSONB, default=dict)  # {cgst, sgst, igst}
    total = Column(Float, default=0.0)
