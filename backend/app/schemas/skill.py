from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

class SkillBase(BaseModel):
    core_skill: str
    detected_tags: Optional[List[str]] = []
    decomposed_nodes: Optional[Union[Dict[str, Any], List[Any]]] = []

class SkillCreate(SkillBase):
    pass

class SkillUpdate(BaseModel):
    detected_tags: Optional[List[str]] = None
    decomposed_nodes: Optional[Union[Dict[str, Any], List[Any]]] = None

class SkillResponse(SkillBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class SkillBulkSyncRequest(BaseModel):
    skills: List[str] = []
