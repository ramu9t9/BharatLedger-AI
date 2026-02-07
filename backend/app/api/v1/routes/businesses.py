from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from app.db.session import get_db
from app.db.models import Business
from app.schemas.business import BusinessCreate, BusinessResponse
from app.api.deps import get_current_user_id

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("", response_model=list[BusinessResponse])
def list_businesses(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    rows = db.query(Business).filter(Business.user_id == user_id).all()
    return rows


@router.post("", response_model=BusinessResponse)
def create_business(
    data: BusinessCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    biz = Business(
        id=str(uuid.uuid4()),
        user_id=user_id,
        name=data.name,
        gstin=data.gstin or "",
        business_type=data.business_type or "regular",
        address=data.address or "",
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(
    business_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    biz = db.query(Business).filter(Business.id == business_id, Business.user_id == user_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz
