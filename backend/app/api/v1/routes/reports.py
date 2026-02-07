"""P&L and expense reports."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from collections import defaultdict

from app.db.session import get_db
from app.db.models import Invoice, Business
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/reports", tags=["reports"])


def _business_ids_for_user(db: Session, user_id: str):
    return [b.id for b in db.query(Business).filter(Business.user_id == user_id).all()]


@router.get("/pl")
def report_pl(
    business_id: str | None = None,
    period_start: str | None = Query(None, description="YYYY-MM-DD"),
    period_end: str | None = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """P&L summary: aggregate by expense category from extracted invoices."""
    biz_ids = _business_ids_for_user(db, user_id)
    if business_id and business_id not in biz_ids:
        return {"error": "Business not found"}
    if business_id:
        biz_ids = [business_id]

    q = db.query(Invoice).filter(
        Invoice.business_id.in_(biz_ids),
        Invoice.status == "EXTRACTED",
    )
    rows = q.all()

    income = 0.0
    expenses_by_category: dict[str, float] = defaultdict(float)
    for inv in rows:
        ext = inv.extracted_json or {}
        totals = ext.get("totals") or {}
        grand = float(totals.get("grand_total", 0))
        # Simplified: treat as expense (outgoing); can add type later
        expenses_by_category["Invoices"] += grand

    return {
        "income": income,
        "expenses_by_category": dict(expenses_by_category),
        "total_expenses": sum(expenses_by_category.values()),
        "net": income - sum(expenses_by_category.values()),
    }


@router.get("/expenses")
def report_expenses(
    business_id: str | None = None,
    period_start: str | None = None,
    period_end: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Expense breakdown by category for charts."""
    biz_ids = _business_ids_for_user(db, user_id)
    if business_id and business_id not in biz_ids:
        return {"error": "Business not found"}
    if business_id:
        biz_ids = [business_id]

    q = db.query(Invoice).filter(
        Invoice.business_id.in_(biz_ids),
        Invoice.status == "EXTRACTED",
    )
    rows = q.all()

    by_category: dict[str, float] = defaultdict(float)
    for inv in rows:
        for item in (inv.extracted_json or {}).get("line_items") or []:
            cat = item.get("category") or "Other"
            by_category[cat] += float(item.get("total", 0) or 0)

    return {"by_category": dict(by_category)}
