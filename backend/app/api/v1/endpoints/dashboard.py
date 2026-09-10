from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.skill import Skill
from app.db.models.income_kit import IncomeKit
from app.db.models.market import MarketData
from app.schemas.sie import (
    DashboardResponse,
    Opportunity,
    DecomposedSkill,
    RecentActivity,
    TrendPoint,
    ProfileResponse,
    UpdateProfileBody,
)
from app.services.ai_engine import ai_engine_service

router = APIRouter()

def _get_user_decomposed_skills(user_id: int, db: Session) -> List[DecomposedSkill]:
    skills = db.query(Skill).filter(Skill.user_id == user_id).all()
    all_decomposed: List[DecomposedSkill] = []
    for s in skills:
        if s.decomposed_nodes:
            if isinstance(s.decomposed_nodes, list):
                for node in s.decomposed_nodes:
                    if isinstance(node, dict):
                        try:
                            all_decomposed.append(DecomposedSkill.model_validate(node))
                        except Exception:
                            pass
            elif isinstance(s.decomposed_nodes, dict):
                for k, v in s.decomposed_nodes.items():
                    if isinstance(v, dict):
                        all_decomposed.append(
                            DecomposedSkill(
                                id=f"skill-{s.id}-{k}",
                                skill=s.core_skill,
                                microService=k,
                                category="Tech & Data",
                                demand=int(v.get("demand", 80) if isinstance(v.get("demand"), (int, float)) else 80),
                                competition=int(v.get("competition", 40) if isinstance(v.get("competition"), (int, float)) else 40),
                                suitability=85,
                                trend="Rising",
                                beginnerFriendly=True,
                                description=f"Specialized deliverable for {k}.",
                            )
                        )
    return all_decomposed


@router.get("/dashboard", response_model=DashboardResponse)
@router.get("/dashboard/overview", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    decomposed = _get_user_decomposed_skills(current_user.id, db)
    opportunities = ai_engine_service.compute_ranked_opportunities(decomposed) if decomposed else []

    kits_count = db.query(IncomeKit).filter(IncomeKit.user_id == current_user.id).count()
    skills_count = db.query(Skill).filter(Skill.user_id == current_user.id).count()

    # Calculate realistic profile completion
    completion = 20  # account exists
    if current_user.full_name:
        completion += 15
    if current_user.education:
        completion += 15
    if current_user.experience:
        completion += 15
    if current_user.income_goal:
        completion += 15
    if skills_count > 0:
        completion += 20
    completion = min(100, completion)

    # Top opportunity
    if opportunities:
        top_opp = opportunities[0]
        earnings = 1200 + (skills_count * 800) + (kits_count * 450)
    else:
        top_opp = Opportunity(
            id="opp-default",
            rank=1,
            title="Add skills to reveal top opportunities",
            platform="SIE Engine",
            expectedEarnings="$0",
            demand=0,
            competition=0,
            effort="N/A",
            score=0,
            whyNow="Input your primary skills in the Skill Decomposition tab to begin.",
            description="Your personal income blueprints will automatically populate here.",
            tags=["Get Started"],
        )
        earnings = 0

    # Recent activities based on real user actions in DB
    activities: List[RecentActivity] = []
    if kits_count > 0:
        activities.append(
            RecentActivity(
                id=f"act-kit-{kits_count}",
                title="Income Kit Generated",
                detail=f"{kits_count} active income kit blueprint(s) in database",
                time="Recently",
                tone="purple",
            )
        )
    if skills_count > 0:
        activities.append(
            RecentActivity(
                id=f"act-skill-{skills_count}",
                title="Skills Synced to Neon DB",
                detail=f"{skills_count} core skill(s) registered",
                time="Synced",
                tone="blue",
            )
        )
    activities.append(
        RecentActivity(
            id="act-auth",
            title="Authenticated Session",
            detail=f"Signed in as {current_user.email}",
            time="Active",
            tone="green",
        )
    )

    trend = [
        TrendPoint(label="W1", value=max(10, skills_count * 12)),
        TrendPoint(label="W2", value=max(20, (skills_count + kits_count) * 15)),
        TrendPoint(label="W3", value=max(35, (skills_count + kits_count) * 22)),
        TrendPoint(label="W4", value=max(50, (skills_count + kits_count) * 30)),
    ]

    display_name = current_user.full_name or current_user.name or current_user.email.split("@")[0]

    return DashboardResponse(
        userName=display_name,
        profileCompletion=completion,
        opportunitiesFound=len(opportunities),
        assetsGenerated=kits_count * 4,
        expectedEarnings=earnings,
        topOpportunity=top_opp,
        recentActivity=activities,
        trend=trend,
    )


@router.get("/opportunities", response_model=List[Opportunity])
def get_opportunities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    decomposed = _get_user_decomposed_skills(current_user.id, db)
    if not decomposed:
        return []
    return ai_engine_service.compute_ranked_opportunities(decomposed)


@router.get("/opportunities/{opp_id}", response_model=Opportunity)
def get_opportunity(
    opp_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    decomposed = _get_user_decomposed_skills(current_user.id, db)
    opportunities = ai_engine_service.compute_ranked_opportunities(decomposed) if decomposed else []
    for opp in opportunities:
        if opp.id == opp_id:
            return opp
    raise HTTPException(status_code=404, detail="Opportunity not found")


@router.get("/profile", response_model=ProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    skill_names = [s.core_skill for s in skills]

    completion = 20
    if current_user.is_verified:
        completion += 20
    if current_user.full_name:
        completion += 15
    if current_user.github_username or current_user.linkedin_url:
        completion += 15
    if skill_names:
        completion += 20
    if current_user.education or current_user.experience:
        completion += 10

    is_onboarded = bool(
        current_user.onboarding_completed
        or current_user.career_mode
        or len(skills) > 0
    )

    return ProfileResponse(
        name=current_user.full_name or "User",
        email=current_user.email,
        experience=current_user.experience or "Intermediate",
        goals=["Build an income kit", "Monetize skills"],
        availability=f"{current_user.target_weekly_hours or current_user.available_time_hrs or 10} hours / week",
        platforms=["Upwork", "Fiverr", "LinkedIn", "GitHub"],
        incomeGoal=f"${current_user.income_goal or 3000:,.0f} / month",
        workType=current_user.career_mode or "Freelance projects",
        skills=skill_names,
        completion=min(100, completion),
        onboarded=is_onboarded,
        isVerified=bool(current_user.is_verified),
        githubUsername=current_user.github_username,
        linkedinUrl=current_user.linkedin_url,
        targetWeeklyHours=current_user.target_weekly_hours or 10,
        onboardingCompleted=bool(current_user.onboarding_completed),
    )


@router.patch("/profile", response_model=ProfileResponse)
def update_profile(
    payload: UpdateProfileBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if payload.name is not None:
        current_user.full_name = payload.name
    if payload.experience is not None:
        current_user.experience = payload.experience
    if payload.githubUsername is not None:
        current_user.github_username = payload.githubUsername.strip()
    if payload.linkedinUrl is not None:
        current_user.linkedin_url = payload.linkedinUrl.strip()
    if payload.targetWeeklyHours is not None:
        current_user.target_weekly_hours = payload.targetWeeklyHours
        current_user.available_time_hrs = payload.targetWeeklyHours
    if payload.onboardingCompleted is not None:
        current_user.onboarding_completed = payload.onboardingCompleted

    if payload.availability is not None:
        digits = [int(s) for s in payload.availability.split() if s.isdigit()]
        if digits:
            current_user.available_time_hrs = digits[0]
            current_user.target_weekly_hours = digits[0]
    if payload.workType is not None:
        current_user.career_mode = payload.workType
    if payload.incomeGoal is not None:
        clean_val = payload.incomeGoal.replace("$", "").replace(",", "").split("/")[0].strip()
        try:
            current_user.income_goal = float(clean_val)
        except ValueError:
            pass

    # Dynamic skill recalibration if skills are updated in settings
    if payload.skills is not None:
        clean_skills = [s.strip() for s in payload.skills if s.strip()]
        db.query(Skill).filter(Skill.user_id == current_user.id).delete()
        if clean_skills:
            decomposed = ai_engine_service.decompose_input_skills(clean_skills)
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
    return get_profile(db=db, current_user=current_user)

