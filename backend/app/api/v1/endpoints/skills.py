from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillResponse
from app.services.ai_engine import decompose_skill_via_llm

router = APIRouter()

@router.post("/analyze", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def analyze_skill(
    skill_in: SkillCreate, 
    db: Session = Depends(get_db)
):
    """
    Ingest core skill, trigger Phase 9 AI Decomposition Engine, 
    and persist directly into Neon PostgreSQL via SQLAlchemy ORM.
    """
    # 1. Trigger AI Decomposition
    decomposed_nodes = await decompose_skill_via_llm(skill_in.name)

    # 2. Persist directly to PostgreSQL (mapping schema 'name' to DB column 'core_skill')
    db_skill = Skill(
        user_id=1,  # Hardcoded user_id until current_user auth dependency is attached
        core_skill=skill_in.name,
        detected_tags=[skill_in.category] if skill_in.category else [],
        decomposed_nodes=decomposed_nodes
    )
    
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)

    # 3. Construct response matching SkillResponse schema
    return SkillResponse(
        id=db_skill.id,
        user_id=db_skill.user_id,
        name=db_skill.core_skill,
        category=skill_in.category or "General",
        proficiency_level=skill_in.proficiency_level or "intermediate",
        decomposed_nodes=db_skill.decomposed_nodes,
        created_at=db_skill.created_at or "2026-07-29T20:00:00"
    )

@router.get("/", response_model=List[SkillResponse])
def get_user_skills(db: Session = Depends(get_db)):
    """
    Retrieve all analyzed skills directly from Neon PostgreSQL.
    """
    skills_from_db = db.query(Skill).all()
    
    response_list = []
    for s in skills_from_db:
        response_list.append(
            SkillResponse(
                id=s.id,
                user_id=s.user_id,
                name=s.core_skill,
                category="General",
                proficiency_level="intermediate",
                decomposed_nodes=s.decomposed_nodes or [],
                created_at=s.created_at or "2026-07-29T20:00:00"
            )
        )
    return response_list