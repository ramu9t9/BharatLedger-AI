"""Unit tests for gst_intelligence service."""

import pytest
from datetime import date
from unittest.mock import MagicMock

from app.services.gst_intelligence import (
    calculate_monthly_summary,
    vendor_dependency_analysis,
    itc_summary,
)


def _mock_invoice(
    inv_date: str | None,
    vendor_gstin: str,
    buyer_gstin: str,
    grand_total: float,
    gst_total: float,
):
    o = MagicMock()
    o.invoice_date = date.fromisoformat(inv_date[:10]) if inv_date else None
    o.extracted_json = {
        "invoice": {"number": "INV001", "date": inv_date or ""},
        "vendor": {"name": "Vendor A", "gstin": vendor_gstin},
        "buyer": {"name": "Buyer B", "gstin": buyer_gstin},
        "totals": {
            "taxable_value": grand_total - gst_total,
            "gst_total": gst_total,
            "grand_total": grand_total,
        },
        "line_items": [],
    }
    return o


def _mock_business(gstin: str = "27AABCU9603R1ZM"):
    b = MagicMock()
    b.id = "biz-1"
    b.gstin = gstin
    return b


def test_calculate_monthly_summary():
    db = MagicMock()
    biz = _mock_business()
    db.query.return_value.filter.return_value.first.return_value = biz

    inv1 = _mock_invoice("2025-02-10", "27AABCU9603R1ZM", "09AAAAA0000A1Z5", 11800.0, 1800.0)
    inv2 = _mock_invoice("2025-02-15", "27AABCU9603R1ZM", "07AAAAA0000A1Z5", 5900.0, 900.0)
    inv3 = _mock_invoice("2025-02-20", "09AAAAA0000A1Z5", "27AABCU9603R1ZM", 23600.0, 3600.0)
    inv4 = _mock_invoice("2025-01-05", "27AABCU9603R1ZM", "07XXXXX0000X1Z5", 1000.0, 180.0)

    def all_side_effect():
        q = db.query.return_value.filter.return_value
        if q.all.called or "Invoice" in str(db.query.call_args):
            return [inv1, inv2, inv3, inv4]
        return None

    db.query.return_value.filter.return_value.all.return_value = [inv1, inv2, inv3, inv4]
    db.query.return_value.filter.return_value.first.side_effect = [biz, None]

    result = calculate_monthly_summary(db, "biz-1", 2025, 2)
    assert "error" not in result
    assert result["total_sales"] == 17700.0  # 11800 + 5900
    assert result["total_purchases"] == 23600.0
    assert result["output_gst"] == 2700.0
    assert result["input_gst"] == 3600.0
    assert result["net_gst_payable"] == 0.0


def test_calculate_monthly_summary_business_not_found():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None

    result = calculate_monthly_summary(db, "nonexistent", 2025, 2)
    assert result == {"error": "Business not found"}


def test_vendor_dependency_analysis():
    db = MagicMock()
    biz = _mock_business()
    inv = _mock_invoice("2025-02-20", "09AAAAA0000A1Z5", "27AABCU9603R1ZM", 23600.0, 3600.0)
    inv.extracted_json["vendor"]["name"] = "Supplier X"

    db.query.return_value.filter.return_value.first.return_value = biz
    db.query.return_value.filter.return_value.all.return_value = [inv]

    result = vendor_dependency_analysis(db, "biz-1", 2025, 2)
    assert "error" not in result
    assert result["total_purchases"] == 23600.0
    assert len(result["vendors"]) >= 1
    assert result["vendors"][0]["percentage"] == 100.0


def test_itc_summary():
    db = MagicMock()
    biz = _mock_business()
    inv = _mock_invoice("2025-02-20", "09AAAAA0000A1Z5", "27AABCU9603R1ZM", 23600.0, 3600.0)
    inv.extracted_json["vendor"]["name"] = "Supplier X"

    db.query.return_value.filter.return_value.first.return_value = biz
    db.query.return_value.filter.return_value.all.return_value = [inv]

    result = itc_summary(db, "biz-1", 2025, 2)
    assert "error" not in result
    assert result["total_input_gst"] == 3600.0
    assert "vendor_wise_itc" in result
    assert "potential_itc_risk" in result


def test_itc_summary_missing_gstin_risk():
    db = MagicMock()
    biz = _mock_business()
    inv = _mock_invoice("2025-02-01", "", "27AABCU9603R1ZM", 1180.0, 180.0)
    inv.extracted_json["vendor"]["gstin"] = ""
    inv.extracted_json["vendor"]["name"] = "Vendor No GSTIN"

    db.query.return_value.filter.return_value.first.return_value = biz
    db.query.return_value.filter.return_value.all.return_value = [inv]

    result = itc_summary(db, "biz-1", 2025, 2)
    assert "error" not in result
    assert result["potential_itc_risk"] == 180.0
    assert result["total_input_gst"] == 0.0
