from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class OutcomeCreate(BaseModel):
    opportunity_title: str
    platform: str  # 'Fiverr', 'Upwork', 'Cold Outreach', 'LinkedIn', 'WhatsApp'
    days_active: int
    inquiries_received: int
    orders_converted: int
    revenue_inr: float
    notes: Optional[str] = None
    asset_id: Optional[str] = None

class OutcomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    asset_id: Optional[str] = None
    opportunity_title: str
    platform: str
    days_active: int
    inquiries_received: int
    orders_converted: int
    revenue_inr: float
    status: str
    notes: Optional[str] = None
    strategy_recommendation: Optional[str] = None
    created_at: Optional[datetime] = None

class OutcomeSubmissionResponse(BaseModel):
    outcome: OutcomeResponse
    strategy_recommendation: str
