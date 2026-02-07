from sqlalchemy import Column, String, Float
from app.db.base import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(String(36), primary_key=True)
    name = Column(String(128), nullable=False, unique=True)
    default_gst_rate = Column(Float, default=18.0)
    hsn_keywords = Column(String(500), default="")
