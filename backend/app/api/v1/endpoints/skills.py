from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.skill import Skill
from app.db.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate
from app.schemas.sie import DecomposedSkill, DecomposeSkillsBody
from app.services.ai_engine import ai_engine_service

router = APIRouter()

@router.post("/", response_model=SkillResponse)
def create_skill(
    *,
    db: Session = Depends(get_db),
    skill_in: SkillCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    data = skill_in.model_dump()
    # If decomposed nodes not supplied, automatically decompose using AI engine
    if not data.get("decomposed_nodes"):
        decomposed = ai_engine_service.decompose_input_skills([skill_in.core_skill])
        data["decomposed_nodes"] = [d.model_dump() for d in decomposed]
        if not data.get("detected_tags") and decomposed:
            data["detected_tags"] = list({d.category for d in decomposed} | {skill_in.core_skill})

    skill = Skill(**data, user_id=current_user.id)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.get("/", response_model=List[SkillResponse])
def get_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    return skills

@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(
    *,
    db: Session = Depends(get_db),
    skill_id: int,
    skill_in: SkillUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    
    update_data = skill_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)
    
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/{skill_id}")
def delete_skill(
    *,
    db: Session = Depends(get_db),
    skill_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted successfully"}

# ---------------------------------------------------------------------------
# AI Decomposition Endpoints (Wired to Neon PostgreSQL DB)
# ---------------------------------------------------------------------------

@router.post("/decomposition", response_model=List[DecomposedSkill])
@router.post("/analyze", response_model=List[DecomposedSkill])
def decompose_and_persist_skills(
    payload: DecomposeSkillsBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    decomposed = ai_engine_service.decompose_input_skills(payload.skills)
    
    # Persist decomposed skills to DB for the authenticated user
    for skill_name in payload.skills:
        nodes = [d.model_dump() for d in decomposed if d.skill.lower() == skill_name.lower()]
        if not nodes:
            nodes = [d.model_dump() for d in decomposed]
        tags = list({d.get("category", "General") for d in nodes} | {skill_name})
        
        # Check if already exists for user or create new
        existing = db.query(Skill).filter(
            Skill.user_id == current_user.id,
            Skill.core_skill.ilike(skill_name)
        ).first()

        if existing:
            existing.detected_tags = tags
            existing.decomposed_nodes = nodes
            db.add(existing)
        else:
            db_skill = Skill(
                user_id=current_user.id,
                core_skill=skill_name,
                detected_tags=tags,
                decomposed_nodes=nodes,
            )
            db.add(db_skill)
    
    db.commit()
    return decomposed

@router.get("/decomposition", response_model=List[DecomposedSkill])
def get_skills_decomposition(
    filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    all_decomposed: List[DecomposedSkill] = []
    
    for s in skills:
        if s.decomposed_nodes:
            if isinstance(s.decomposed_nodes, list):
                for node in s.decomposed_nodes:
                    if isinstance(node, dict):
                        all_decomposed.append(DecomposedSkill.model_validate(node))
            elif isinstance(s.decomposed_nodes, dict):
                for k, v in s.decomposed_nodes.items():
                    if isinstance(v, dict):
                        all_decomposed.append(DecomposedSkill(
                            id=f"skill-{k}",
                            skill=s.core_skill,
                            microService=k,
                            category="Tech & Data",
                            demand=int(v.get("demand", 80) if isinstance(v.get("demand"), (int, float)) else 80),
                            competition=int(v.get("competition", 40) if isinstance(v.get("competition"), (int, float)) else 40),
                            suitability=85,
                            trend="Rising",
                            beginnerFriendly=True,
                            description=f"Specialized deliverable for {k}."
                        ))

    if not filter:
        return all_decomposed

    fq = filter.lower().strip()
    if "high demand" in fq:
        return [item for item in all_decomposed if item.demand >= 80]
    if "low competition" in fq:
        return [item for item in all_decomposed if item.competition <= 40]
    if "trending" in fq:
        return [item for item in all_decomposed if "+" in str(item.trend)]
    if "beginner" in fq:
        return [item for item in all_decomposed if item.beginnerFriendly]

    return all_decomposed

