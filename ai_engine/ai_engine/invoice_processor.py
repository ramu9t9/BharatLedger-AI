"""
Invoice processor: single entry point.
process_invoice(file_path | bytes) -> InvoiceExtractResult.
Orchestrates OCR -> LLM extract -> category mapping -> GST calculation.
"""

from __future__ import annotations

from pathlib import Path
from typing import Union

from .category_mappings import get_category_and_rate
from .gst_calculator import calculate_gst
from .llm_extractor import extract_from_text, parse_extract_to_result
from .ocr_service import extract_text
from .types import (
    Confidence,
    InvoiceExtractResult,
    LineItem,
    Totals,
)


def process_invoice(file_path_or_bytes: Union[str, Path, bytes], content_type: str | None = None) -> InvoiceExtractResult:
    """
    Process an invoice (image or PDF) and return structured extraction result.
    - OCR -> raw text
    - LLM -> extracted fields
    - Category mapping + GST calculation applied to each line item
    """
    raw_text = extract_text(file_path_or_bytes, content_type=content_type)
    if not raw_text or not raw_text.strip():
        return InvoiceExtractResult(
            raw_text=raw_text or "",
            confidence=Confidence(overall=0.0, fields={}),
        )

    raw = extract_from_text(raw_text)
    result = parse_extract_to_result(raw, raw_text)

    # Enrich line items: category from HSN/description, gst_breakdown from calculator
    is_inter = result.is_inter_state
    new_items: list[LineItem] = []
    total_taxable = 0.0
    total_gst = 0.0

    for item in result.line_items:
        category, default_rate = get_category_and_rate(item.description, item.hsn_sac)
        rate = item.gst_rate if item.gst_rate else default_rate
        taxable = item.taxable_value or (item.unit_price * item.qty)
        breakdown = calculate_gst(taxable, rate, is_inter, quantity=1.0)
        line_total = taxable + breakdown.cgst + breakdown.sgst + breakdown.igst

        total_taxable += taxable
        total_gst += breakdown.cgst + breakdown.sgst + breakdown.igst

        new_items.append(
            LineItem(
                description=item.description,
                hsn_sac=item.hsn_sac,
                category=category,
                qty=item.qty,
                unit_price=item.unit_price,
                taxable_value=taxable,
                gst_rate=rate,
                gst_breakdown=breakdown,
                total=round(line_total, 2),
            )
        )

    result.line_items = new_items
    result.totals.taxable_value = round(total_taxable, 2)
    result.totals.gst_total = round(total_gst, 2)
    result.totals.grand_total = round(total_taxable + total_gst, 2)
    return result
