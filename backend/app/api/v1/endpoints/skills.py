from fastapi import APIRouter, status
from typing import List, Dict, Any
from datetime import datetime
from app.schemas.skill import SkillCreate, SkillResponse

router = APIRouter()

TEMP_SKILL_DB: List[Dict[str, Any]] = []

@router.post("/analyze", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def analyze_skill(skill_in: SkillCreate):
    """
    Ingest user skill input and trigger initial skill decomposition logic.
    """
    skill_entry = {
        "id": len(TEMP_SKILL_DB) + 1,
        "user_id": 1,
        "name": skill_in.name,
        "category": skill_in.category or "General",
        "proficiency_level": skill_in.proficiency_level or "intermediate",
        "decomposed_nodes": [
            f"{skill_in.name} Setup & Configuration",
            f"{skill_in.name} API Integration",
            f"{skill_in.name} Optimization & Debugging"
        ],
        "created_at": datetime.now()
    }
    TEMP_SKILL_DB.append(skill_entry)
    return skill_entry

@router.get("/", response_model=List[SkillResponse])
def get_user_skills():
    """
    Retrieve all analyzed skills.
    """
    return TEMP_SKILL_DB