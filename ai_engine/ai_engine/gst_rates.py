"""
GST rates and rules for India.
Single source for rate constants and intra/inter-state logic.
"""

# Standard GST rates (percent)
GST_RATES = (0, 5, 12, 18, 28)

# State codes (place of supply) — used for IGST vs CGST+SGST
# Full list can be extended per GSTN; common ones for validation
STATE_CODES = {
    "01": "Jammu and Kashmir",
    "02": "Himachal Pradesh",
    "07": "Delhi",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "27": "Maharashtra",
    "33": "Tamil Nadu",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "29": "Karnataka",
    "32": "Kerala",
    # Add others as needed
}


def is_valid_gst_rate(rate: float) -> bool:
    return round(rate) in GST_RATES


def is_inter_state_supply(supplier_state: str, buyer_state: str) -> bool:
    """True if supply is inter-state (different states)."""
    if not supplier_state or not buyer_state:
        return False
    return supplier_state.strip().upper() != buyer_state.strip().upper()
