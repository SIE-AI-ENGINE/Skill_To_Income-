from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.db.models.market import MarketData
from app.schemas.market import MarketDataResponse

router = APIRouter()

@router.get("/", response_model=List[MarketDataResponse])
def get_market_data(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    market_data = db.query(MarketData).offset(skip).limit(limit).all()
    return market_data
