from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class DeploymentBase(BaseModel):
    platform: str
    status: str
    metadata_json: Optional[Dict[str, Any]] = None

class DeploymentCreate(DeploymentBase):
    pass

class DeploymentResponse(DeploymentBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
