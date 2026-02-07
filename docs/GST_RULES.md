# GST implementation notes (BharatLedger)

## Rates (India)

- Standard rates: **0%, 5%, 12%, 18%, 28%**
- HSN/SAC codes map to categories and default rates in `ai_engine/category_mappings.py`

## Intra-state vs inter-state

- **Intra-state:** CGST + SGST (half of applicable rate each)
- **Inter-state:** IGST (full rate)
- Determined by `place_of_supply` and vendor/buyer state (from invoice or user).

## GSTR-1 (Outward supplies)

- B2B (with buyer GSTIN) and B2C sections
- Invoice-level detail; JSON shape is simplified in this MVP and can be extended to full GSTN format

## GSTR-3B (Summary return)

- Outward taxable supplies, ITC, tax payable
- MVP generates summary JSON; filing via GST portal is out of scope

## References

- [GST Portal](https://www.gst.gov.in/)
- [GSTN API](https://developer.gst.gov.in/)
