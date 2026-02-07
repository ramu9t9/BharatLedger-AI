"""
GST calculation: taxable value + rate + intra/inter-state -> CGST, SGST, IGST.
"""

from __future__ import annotations

from .types import GSTBreakdown
from .gst_rates import is_valid_gst_rate


def calculate_gst(
    taxable_value: float,
    gst_rate: float,
    is_inter_state: bool,
    quantity: float = 1.0,
) -> GSTBreakdown:
    """
    Compute GST breakdown for a line item.
    - Intra-state: CGST + SGST (half each of rate)
    - Inter-state: IGST (full rate)
    """
    if not is_valid_gst_rate(gst_rate):
        gst_rate = round(gst_rate)  # allow nearest rate for flexibility
        if gst_rate not in (0, 5, 12, 18, 28):
            gst_rate = 18  # fallback

    base = taxable_value * quantity
    gst_amount = round(base * (gst_rate / 100), 2)

    if is_inter_state:
        return GSTBreakdown(cgst=0.0, sgst=0.0, igst=gst_amount)
    else:
        half = round(gst_amount / 2, 2)
        return GSTBreakdown(cgst=half, sgst=half, igst=0.0)
