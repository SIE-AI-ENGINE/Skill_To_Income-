from pydantic import BaseModel
from datetime import datetime

class MarketDataBase(BaseModel):
    platform: str
    category: str
    opportunity_title: str
    estimated_income: float
    success_probability: float
    demand_score: float
    competition_score: float

class MarketDataCreate(MarketDataBase):
    pass

class MarketDataResponse(MarketDataBase):
    id: int
    scraped_at: datetime

    class Config:
        from_attributes = True
