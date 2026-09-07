from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class IncomeKitBase(BaseModel):
    fiverr_gig: Optional[Dict[str, Any]] = None
    upwork_proposal: Optional[Dict[str, Any]] = None
    github_readme: Optional[Dict[str, Any]] = None
    portfolio_site: Optional[Dict[str, Any]] = None
    resume_data: Optional[Dict[str, Any]] = None
    linkedin_optimizer: Optional[Dict[str, Any]] = None
    cold_email_template: Optional[Dict[str, Any]] = None
    whatsapp_pitch: Optional[Dict[str, Any]] = None

class IncomeKitCreate(IncomeKitBase):
    pass

class IncomeKitUpdate(IncomeKitBase):
    pass

class IncomeKitResponse(IncomeKitBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
