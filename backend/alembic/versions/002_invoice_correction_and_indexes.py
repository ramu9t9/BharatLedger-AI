"""Invoice correction workflow, indexes for performance.

Revision ID: 002
Revises: 001
Create Date: 2026-02-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Invoice: correction flags and invoice_date for filtering
    op.add_column("invoices", sa.Column("is_corrected", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("invoices", sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("invoices", sa.Column("invoice_date", sa.Date(), nullable=True))

    # Index for date-range and business queries
    op.create_index("ix_invoices_business_id_created_at", "invoices", ["business_id", "created_at"])
    op.create_index("ix_invoices_invoice_date", "invoices", ["invoice_date"])

    # InvoiceLineItem: correction flags (for normalized line items if used)
    op.add_column("invoice_line_items", sa.Column("is_corrected", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("invoice_line_items", sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_index("ix_invoices_invoice_date", table_name="invoices")
    op.drop_index("ix_invoices_business_id_created_at", table_name="invoices")
    op.drop_column("invoices", "invoice_date")
    op.drop_column("invoices", "corrected_at")
    op.drop_column("invoices", "is_corrected")

    op.drop_column("invoice_line_items", "corrected_at")
    op.drop_column("invoice_line_items", "is_corrected")
