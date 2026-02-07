"""
LLM extraction: raw text -> structured fields (strict JSON).
Uses OpenRouter (or OpenAI) to extract invoice fields per types.py schema.
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from .types import (
    BuyerInfo,
    Confidence,
    InvoiceExtractResult,
    InvoiceInfo,
    LineItem,
    Totals,
    VendorInfo,
)

EXTRACT_SCHEMA = """
Extract from the following invoice text and return a single JSON object with exactly these keys (use empty string or 0 where unknown):
- vendor: { "name": "", "gstin": "", "address": "" }
- invoice: { "number": "", "date": "YYYY-MM-DD", "currency": "INR" }
- buyer: { "name": "", "gstin": "" }
- place_of_supply_state: "" (state name or code)
- is_inter_state: true/false (true if vendor and buyer are in different states)
- line_items: [ { "description": "", "hsn_sac": "", "qty": 1, "unit_price": 0, "taxable_value": 0, "gst_rate": 0 } ]
- totals: { "taxable_value": 0, "gst_total": 0, "grand_total": 0 }
- confidence: { "overall": 0.0-1.0, "fields": {} }
Return only valid JSON, no markdown or explanation.
"""


def _get_api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ValueError("Set OPENROUTER_API_KEY or OPENAI_API_KEY in environment")
    return key


def _get_base_url() -> str:
    if os.environ.get("OPENROUTER_API_KEY"):
        return "https://openrouter.ai/api/v1"
    return "https://api.openai.com/v1"


def _get_model() -> str:
    return os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def extract_from_text(raw_text: str) -> dict[str, Any]:
    """
    Call LLM to extract structured invoice data from raw text.
    Returns a dict that can be passed to InvoiceExtractResult.model_validate() after
    enriching line_items with category and gst_breakdown.
    """
    key = _get_api_key()
    base = _get_base_url()
    model = _get_model()

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You extract invoice data from text. Return only valid JSON."},
            {"role": "user", "content": EXTRACT_SCHEMA + "\n\n---\n\n" + raw_text[:12000]},
        ],
        "temperature": 0.1,
    }

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"{base}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
        if not content:
            raise ValueError("Empty LLM response")

    # Strip markdown code block if present
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        content = "\n".join(lines)

    return json.loads(content)


def parse_extract_to_result(raw: dict[str, Any], raw_text: str) -> InvoiceExtractResult:
    """
    Convert LLM extract dict to InvoiceExtractResult.
    Fills defaults and normalizes types; does not compute gst_breakdown (done in processor).
    """
    vendor = raw.get("vendor") or {}
    invoice = raw.get("invoice") or {}
    buyer = raw.get("buyer") or {}
    place = (raw.get("place_of_supply_state") or "").strip()
    is_inter = bool(raw.get("is_inter_state", False))
    items = raw.get("line_items") or []
    totals = raw.get("totals") or {}
    confidence = raw.get("confidence") or {}

    line_items: list[LineItem] = []
    for it in items:
        if isinstance(it, dict):
            line_items.append(
                LineItem(
                    description=str(it.get("description", "")),
                    hsn_sac=str(it.get("hsn_sac", "")),
                    category=str(it.get("category", "")),
                    qty=float(it.get("qty", 1)),
                    unit_price=float(it.get("unit_price", 0)),
                    taxable_value=float(it.get("taxable_value", 0)),
                    gst_rate=float(it.get("gst_rate", 0)),
                    gst_breakdown=it.get("gst_breakdown") or {"cgst": 0, "sgst": 0, "igst": 0},
                    total=float(it.get("total", 0)),
                )
            )

    return InvoiceExtractResult(
        vendor=VendorInfo(
            name=str(vendor.get("name", "")),
            gstin=str(vendor.get("gstin", "")),
            address=str(vendor.get("address", "")),
        ),
        invoice=InvoiceInfo(
            number=str(invoice.get("number", "")),
            date=str(invoice.get("date", "")),
            currency=str(invoice.get("currency", "INR")),
        ),
        buyer=BuyerInfo(name=str(buyer.get("name", "")), gstin=str(buyer.get("gstin", ""))),
        place_of_supply_state=place,
        is_inter_state=is_inter,
        line_items=line_items,
        totals=Totals(
            taxable_value=float(totals.get("taxable_value", 0)),
            gst_total=float(totals.get("gst_total", 0)),
            grand_total=float(totals.get("grand_total", 0)),
        ),
        confidence=Confidence(
            overall=float(confidence.get("overall", 0)),
            fields=dict(confidence.get("fields", {})),
        ),
        raw_text=raw_text,
    )
