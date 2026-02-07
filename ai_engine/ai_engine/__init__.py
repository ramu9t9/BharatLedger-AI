"""
BharatLedger AI Engine — standalone invoice processing package.
Single entry point: process_invoice(file_path | bytes) -> InvoiceExtractResult.
"""

from .invoice_processor import process_invoice
from .types import InvoiceExtractResult

__all__ = ["process_invoice", "InvoiceExtractResult"]
