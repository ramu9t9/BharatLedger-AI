"""
HSN/SAC keywords -> expense category + default GST rate.
Used to categorize line items and suggest GST when not on invoice.
"""

from __future__ import annotations

# Map (keyword in description or HSN) -> (category_name, default_gst_rate)
# Order matters: more specific HSN/categories first (e.g. 998314 before 9983)
HSN_TO_CATEGORY_AND_RATE: list[tuple[list[str], str, float]] = [
    (["food", "grocery", "rice", "wheat", "milk", "vegetables", "fruit"], "Food & Grocery", 5.0),
    (["restaurant", "catering", "hotel stay"], "Restaurant & Hospitality", 5.0),
    (["software", "saas", "it service", "998314"], "IT & Software", 18.0),
    (["transport", "freight", "9983"], "Transport", 12.0),
    (["consultancy", "professional", "legal", "9982"], "Professional Services", 18.0),
    (["office", "stationery", "paper", "pen"], "Office Supplies", 12.0),
    (["electrical", "equipment", "machine", "8471"], "Equipment & Machinery", 18.0),
    (["rent", "lease", "immovable"], "Rent", 18.0),
    (["advertisement", "marketing", "9983"], "Marketing", 18.0),
    (["medicine", "pharma", "drug", "3004"], "Pharma", 12.0),
    (["textile", "fabric", "garment", "61", "62", "63"], "Textiles", 12.0),
    (["gold", "jewellery", "7113"], "Jewellery", 3.0),  # special rate
]

DEFAULT_CATEGORY = "General"
DEFAULT_GST_RATE = 18.0


def get_category_and_rate(description: str, hsn_sac: str) -> tuple[str, float]:
    """
    Return (category_name, gst_rate) for a line item.
    Uses description and HSN/SAC to match; defaults to GENERAL and 18%.
    """
    combined = f"{description} {hsn_sac}".lower()
    for keywords, category, rate in HSN_TO_CATEGORY_AND_RATE:
        if any(kw in combined for kw in keywords):
            return category, rate
    return DEFAULT_CATEGORY, DEFAULT_GST_RATE
