from sqlalchemy import Column, DateTime, String, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.base import Base


class GSTReturn(Base):
    __tablename__ = "gst_returns"

    id = Column(String(36), primary_key=True)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    return_type = Column(String(20), nullable=False)  # GSTR1 | GSTR3B
    period = Column(String(20), nullable=False)  # e.g. 2024-01
    json_data = Column(JSONB, default=dict)
    filed_at = Column(DateTime(timezone=True), default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
