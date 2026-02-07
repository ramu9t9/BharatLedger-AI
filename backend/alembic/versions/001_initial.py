"""Initial schema: users, businesses, invoices, invoice_line_items, expense_categories, gst_returns

Revision ID: 001
Revises:
Create Date: 2026-02-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "businesses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("gstin", sa.String(20), server_default=""),
        sa.Column("business_type", sa.String(50), server_default="regular"),
        sa.Column("address", sa.String(500), server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_businesses_user_id", "businesses", ["user_id"])

    op.create_table(
        "invoices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("business_id", sa.String(36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(1024), nullable=False),
        sa.Column("file_name", sa.String(255), server_default=""),
        sa.Column("content_type", sa.String(128), server_default=""),
        sa.Column("status", sa.String(32), server_default="UPLOADED", nullable=False),
        sa.Column("error_message", sa.Text(), server_default=""),
        sa.Column("raw_text", sa.Text(), server_default=""),
        sa.Column("extracted_json", postgresql.JSONB(astext_type=sa.Text()), server_default="{}"),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_invoices_business_id", "invoices", ["business_id"])
    op.create_index("ix_invoices_status", "invoices", ["status"])

    op.create_table(
        "invoice_line_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("invoice_id", sa.String(36), sa.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.String(500), server_default=""),
        sa.Column("hsn_sac", sa.String(20), server_default=""),
        sa.Column("category", sa.String(128), server_default=""),
        sa.Column("qty", sa.Float(), server_default=1.0),
        sa.Column("unit_price", sa.Float(), server_default=0.0),
        sa.Column("taxable_value", sa.Float(), server_default=0.0),
        sa.Column("gst_rate", sa.Float(), server_default=0.0),
        sa.Column("gst_breakdown", postgresql.JSONB(astext_type=sa.Text()), server_default="{}"),
        sa.Column("total", sa.Float(), server_default=0.0),
    )
    op.create_index("ix_invoice_line_items_invoice_id", "invoice_line_items", ["invoice_id"])

    op.create_table(
        "expense_categories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("default_gst_rate", sa.Float(), server_default="18.0"),
        sa.Column("hsn_keywords", sa.String(500), server_default=""),
    )
    op.create_index("ix_expense_categories_name", "expense_categories", ["name"], unique=True)

    op.create_table(
        "gst_returns",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("business_id", sa.String(36), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("return_type", sa.String(20), nullable=False),
        sa.Column("period", sa.String(20), nullable=False),
        sa.Column("json_data", postgresql.JSONB(astext_type=sa.Text()), server_default="{}"),
        sa.Column("filed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_gst_returns_business_id", "gst_returns", ["business_id"])


def downgrade() -> None:
    op.drop_table("gst_returns")
    op.drop_table("invoice_line_items")
    op.drop_table("expense_categories")
    op.drop_table("invoices")
    op.drop_table("businesses")
    op.drop_table("users")
