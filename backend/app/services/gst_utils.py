"""GST calculation utilities for invoice correction. Mirrors ai_engine logic."""


def calculate_gst_breakdown(
    taxable_value: float, gst_rate: float, is_inter_state: bool, qty: float = 1.0
) -> dict:
    """
    Compute GST breakdown: CGST+SGST (intra) or IGST (inter).
    Returns {"cgst": float, "sgst": float, "igst": float}.
    """
    rate = float(gst_rate or 0)
    if rate not in (0, 5, 12, 18, 28):
        rate = 18.0

    base = float(taxable_value or 0) * float(qty or 1.0)
    gst_amount = round(base * (rate / 100), 2)

    if is_inter_state:
        return {"cgst": 0.0, "sgst": 0.0, "igst": gst_amount}
    half = round(gst_amount / 2, 2)
    return {"cgst": half, "sgst": half, "igst": 0.0}


def recalculate_line_item_totals(line_item: dict, is_inter_state: bool) -> dict:
    """
    Recalculate gst_breakdown and total for a line item.
    Updates in place and returns the item.
    """
    taxable = float(line_item.get("taxable_value") or 0)
    rate = float(line_item.get("gst_rate") or 0)
    qty = float(line_item.get("qty") or 1.0)

    breakdown = calculate_gst_breakdown(taxable, rate, is_inter_state, qty)
    gst_total = breakdown["cgst"] + breakdown["sgst"] + breakdown["igst"]
    total = round(taxable + gst_total, 2)

    line_item["gst_breakdown"] = breakdown
    line_item["total"] = total
    return line_item
