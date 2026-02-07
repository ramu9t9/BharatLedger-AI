"""Unit tests for category mappings."""
import pytest
from ai_engine.ai_engine.category_mappings import get_category_and_rate, DEFAULT_CATEGORY, DEFAULT_GST_RATE


def test_food_category():
    """Food/grocery maps to 5%."""
    cat, rate = get_category_and_rate("Rice and wheat", "")
    assert "Food" in cat or "Grocery" in cat
    assert rate == 5.0


def test_software_category():
    """Software/IT maps to 18%."""
    cat, rate = get_category_and_rate("Software license", "998314")
    assert "IT" in cat or "Software" in cat
    assert rate == 18.0


def test_default():
    """Unknown description gets default category and 18%."""
    cat, rate = get_category_and_rate("Miscellaneous item xyz", "")
    assert cat == DEFAULT_CATEGORY
    assert rate == DEFAULT_GST_RATE
