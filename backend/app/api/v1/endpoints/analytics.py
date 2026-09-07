from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.analytics import Analytics
from app.db.models.user import User
from app.schemas.analytics import AnalyticsCreate, AnalyticsResponse

router = APIRouter()

@router.post("/", response_model=AnalyticsResponse)
def track_analytics(
    *,
    db: Session = Depends(get_db),
    analytics_in: AnalyticsCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    analytics = Analytics(**analytics_in.model_dump(), user_id=current_user.id)
    db.add(analytics)
    db.commit()
    db.refresh(analytics)
    return analytics

@router.get("/", response_model=List[AnalyticsResponse])
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.query(Analytics).filter(Analytics.user_id == current_user.id).all()
