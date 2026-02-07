"""API tests for reports and GST (require DB)."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_reports_pl_unauthorized():
    r = client.get("/api/v1/reports/pl")
    assert r.status_code == 401  # no auth


def test_gst_liability_unauthorized():
    r = client.get("/api/v1/gst/businesses/some-id/liability")
    assert r.status_code == 401
