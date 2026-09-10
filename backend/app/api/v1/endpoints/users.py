from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.skill import Skill
from app.schemas.user import UserUpdate, UserResponse, OnboardingCompleteRequest
from app.services.ai_engine import ai_engine_service

router = APIRouter()
onboarding_router = APIRouter()

@onboarding_router.post("/complete", response_model=UserResponse)
@router.post("/onboarding/complete", response_model=UserResponse)
def complete_onboarding(
    *,
    db: Session = Depends(get_db),
    payload: OnboardingCompleteRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    # Strict Guard: User email must be verified
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email must be verified before completing onboarding.",
        )

    # 1. Update user footprint and onboarding state
    if payload.github_username:
        current_user.github_username = payload.github_username.strip()
    if payload.linkedin_url:
        current_user.linkedin_url = payload.linkedin_url.strip()
    if payload.target_weekly_hours:
        current_user.target_weekly_hours = payload.target_weekly_hours
        current_user.available_time_hrs = payload.target_weekly_hours

    current_user.onboarding_completed = True

    # 2. Ingest and decompose skills atomically
    if payload.skills:
        clean_skills = [s.strip() for s in payload.skills if s.strip()]
        if clean_skills:
            decomposed = ai_engine_service.decompose_input_skills(clean_skills)

            # Clear any placeholder skills for clean state
            db.query(Skill).filter(Skill.user_id == current_user.id).delete()

            for skill_name in clean_skills:
                nodes = [d.model_dump() for d in decomposed if d.skill.lower() == skill_name.lower()]
                if not nodes:
                    nodes = [d.model_dump() for d in decomposed]
                tags = list({d.get("category", "General") for d in nodes} | {skill_name})

                db_skill = Skill(
                    user_id=current_user.id,
                    core_skill=skill_name,
                    detected_tags=tags,
                    decomposed_nodes=nodes,
                )
                db.add(db_skill)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), skip: int = 0, limit: int = 10) -> Any:
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db)) -> Any:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    for field, value in user_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

