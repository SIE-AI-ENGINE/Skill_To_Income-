from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.skill import Skill
from app.db.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate

router = APIRouter()

@router.post("/", response_model=SkillResponse)
def create_skill(
    *,
    db: Session = Depends(get_db),
    skill_in: SkillCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    skill = Skill(**skill_in.model_dump(), user_id=current_user.id)
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
