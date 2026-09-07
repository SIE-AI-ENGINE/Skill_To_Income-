from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class HistoryBase(BaseModel):
    action: str
    details: Optional[Dict[str, Any]] = None

class HistoryCreate(HistoryBase):
    pass

class HistoryResponse(HistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
