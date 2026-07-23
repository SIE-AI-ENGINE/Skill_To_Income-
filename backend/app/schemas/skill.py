from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SkillBase(BaseModel):
    name: str
    category: Optional[str] = None
    proficiency_level: Optional[str] = "intermediate"  # beginner, intermediate, expert


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int
    user_id: int
    decomposed_nodes: Optional[List[str]] = []
    created_at: datetime

    class Config:
        from_attributes = True