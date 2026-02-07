"""
BharatLedger AI — Output schema (single source of truth).
All extraction results must conform to this shape.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class VendorInfo(BaseModel):
    name: str = ""
    gstin: str = ""
    address: str = ""


class InvoiceInfo(BaseModel):
    number: str = ""
    date: str = ""  # YYYY-MM-DD
    currency: str = "INR"


class BuyerInfo(BaseModel):
    name: str = ""
    gstin: str = ""


class GSTBreakdown(BaseModel):
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0


class LineItem(BaseModel):
    description: str = ""
    hsn_sac: str = ""
    category: str = ""
    qty: float = 1.0
    unit_price: float = 0.0
    taxable_value: float = 0.0
    gst_rate: float = 0.0
    gst_breakdown: GSTBreakdown = Field(default_factory=GSTBreakdown)
    total: float = 0.0


class Totals(BaseModel):
    taxable_value: float = 0.0
    gst_total: float = 0.0
    grand_total: float = 0.0


class Confidence(BaseModel):
    overall: float = 0.0
    fields: dict[str, float] = Field(default_factory=dict)


class InvoiceExtractResult(BaseModel):
    """Result of process_invoice(); serializes to the contract JSON."""

    vendor: VendorInfo = Field(default_factory=VendorInfo)
    invoice: InvoiceInfo = Field(default_factory=InvoiceInfo)
    buyer: BuyerInfo = Field(default_factory=BuyerInfo)
    place_of_supply_state: str = ""
    is_inter_state: bool = False
    line_items: list[LineItem] = Field(default_factory=list)
    totals: Totals = Field(default_factory=Totals)
    confidence: Confidence = Field(default_factory=Confidence)
    raw_text: str = ""

    def to_json_dict(self) -> dict[str, Any]:
        return self.model_dump()
