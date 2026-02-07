"""Unit tests for invoice processor (OCR and LLM mocked)."""
import pytest
from unittest.mock import patch
from ai_engine.ai_engine.invoice_processor import process_invoice
from ai_engine.ai_engine.types import InvoiceExtractResult, Confidence


@patch("ai_engine.ai_engine.invoice_processor.extract_text")
@patch("ai_engine.ai_engine.invoice_processor.extract_from_text")
def test_process_invoice_returns_result(mock_extract_from_text, mock_extract_text):
    """Processor returns InvoiceExtractResult with line items and GST breakdown."""
    mock_extract_text.return_value = "Sample invoice text\nVendor: ABC Ltd\nInvoice No: INV-001"
    mock_extract_from_text.return_value = {
        "vendor": {"name": "ABC Ltd", "gstin": "29AABCU9603R1ZM", "address": "Bangalore"},
        "invoice": {"number": "INV-001", "date": "2024-01-15", "currency": "INR"},
        "buyer": {"name": "XYZ Corp", "gstin": "27AABCU9603R1Z1"},
        "place_of_supply_state": "Maharashtra",
        "is_inter_state": True,
        "line_items": [
            {"description": "Software license", "hsn_sac": "998314", "qty": 1, "unit_price": 10000, "taxable_value": 10000, "gst_rate": 18}
        ],
        "totals": {"taxable_value": 10000, "gst_total": 1800, "grand_total": 11800},
        "confidence": {"overall": 0.9, "fields": {}},
    }
    result = process_invoice(b"fake-image-bytes")
    assert isinstance(result, InvoiceExtractResult)
    assert result.vendor.name == "ABC Ltd"
    assert result.invoice.number == "INV-001"
    assert len(result.line_items) >= 1
    assert result.line_items[0].gst_breakdown.igst == 1800.0
    assert result.totals.grand_total == 11800.0


@patch("ai_engine.ai_engine.invoice_processor.extract_text")
def test_process_invoice_empty_text_returns_empty_result(mock_extract_text):
    """When OCR returns empty text, result has empty content and zero confidence."""
    mock_extract_text.return_value = ""
    result = process_invoice(b"empty")
    assert isinstance(result, InvoiceExtractResult)
    assert result.raw_text == ""
    assert result.confidence.overall == 0.0
    assert result.line_items == []
