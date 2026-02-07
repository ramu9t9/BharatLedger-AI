from sqlalchemy import Column, DateTime, String, ForeignKey, func
from app.db.base import Base


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    gstin = Column(String(20), default="")
    business_type = Column(String(50), default="regular")  # regular | composition
    address = Column(String(500), default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
