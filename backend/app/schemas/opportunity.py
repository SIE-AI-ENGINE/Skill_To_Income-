from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OpportunityBase(BaseModel):
    title: str
    platform: str
    match_score: float

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityResponse(OpportunityBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
