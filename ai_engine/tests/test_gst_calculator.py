"""Unit tests for GST calculator."""
import pytest
from ai_engine.ai_engine.gst_calculator import calculate_gst
from ai_engine.ai_engine.types import GSTBreakdown


def test_intra_state_cgst_sgst():
    """Intra-state: 18% splits into 9% CGST + 9% SGST."""
    b = calculate_gst(1000.0, 18.0, is_inter_state=False)
    assert b.igst == 0.0
    assert b.cgst == 90.0
    assert b.sgst == 90.0


def test_inter_state_igst():
    """Inter-state: 18% is full IGST."""
    b = calculate_gst(1000.0, 18.0, is_inter_state=True)
    assert b.cgst == 0.0
    assert b.sgst == 0.0
    assert b.igst == 180.0


def test_zero_rate():
    """Zero rate gives zero tax."""
    b = calculate_gst(500.0, 0.0, is_inter_state=False)
    assert b.cgst == 0.0 and b.sgst == 0.0 and b.igst == 0.0


def test_five_percent_intra():
    """5% intra-state."""
    b = calculate_gst(200.0, 5.0, is_inter_state=False)
    assert b.igst == 0.0
    assert b.cgst == 5.0
    assert b.sgst == 5.0
