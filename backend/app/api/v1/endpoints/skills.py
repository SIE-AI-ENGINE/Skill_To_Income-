from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models.skill import Skill
from app.db.models.income_kit import IncomeKit
from app.services.ai_engine import ai_engine_service
from app.schemas.sie import (
    DashboardResponse, DecomposedSkill, DecomposeSkillsBody,
    MarketIntelligenceResponse, Opportunity, IncomeKitResponse,
    GenerateIncomeKitBody, SIEAsset, UpdateAssetBody, AnalyticsResponse,
    ProfileResponse, UpdateProfileBody
)

router = APIRouter()

user_skills_cache: List[DecomposedSkill] = ai_engine_service.decompose_input_skills(["Python", "Power BI", "SQL"])
opportunities_cache: List[Opportunity] = ai_engine_service.compute_ranked_opportunities(user_skills_cache)
current_kit_cache: IncomeKitResponse = ai_engine_service.generate_income_kit(opportunities_cache[0].id, opportunities_cache[0].title)

assets_cache: List[SIEAsset] = [
    SIEAsset(
        id="asset-1",
        name=f"{opportunities_cache[0].title} — Gig Listing",
        type="Gig listing",
        status="Live",
        createdAt="2026-08-12",
        views=428,
        clicks=94,
        responses=14,
        content="I build high-performance executive dashboards that make weekly operational decisions easier.",
        opportunityId=opportunities_cache[0].id
    )
]

profile_cache = ProfileResponse(
    name="Ananya Sharma",
    email="ananya@example.com",
    experience="Intermediate",
    goals=["Build a portfolio", "Find first client"],
    availability="8–12 hours / week",
    platforms=["Upwork", "LinkedIn"],
    incomeGoal="$1,000–$2,500 / month",
    workType="Freelance projects",
    skills=["Python", "SQL", "Power BI"],
    completion=80
)

# 1. Dashboard
@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard():
    top_opp = opportunities_cache[0] if opportunities_cache else ai_engine_service.compute_ranked_opportunities(user_skills_cache)[0]
    return DashboardResponse(
        userName=profile_cache.name.split()[0],
        profileCompletion=profile_cache.completion,
        opportunitiesFound=len(opportunities_cache),
        assetsGenerated=len(assets_cache),
        expectedEarnings=3200,
        topOpportunity=top_opp,
        recentActivity=[
            {"id": "act-1", "title": "Income Kit Engine Executed", "detail": top_opp.title, "time": "Just now", "tone": "blue"},
            {"id": "act-2", "title": "Market Demand Spike", "detail": f"{top_opp.tags[0]} demand up 16%", "time": "2 hrs ago", "tone": "green"}
        ],
        trend=[
            {"label": "Mon", "value": 65}, {"label": "Tue", "value": 72},
            {"label": "Wed", "value": 70}, {"label": "Thu", "value": 78},
            {"label": "Fri", "value": 85}, {"label": "Sat", "value": 90}
        ]
    )

# 2. Skill Decomposition Engine (Layer 1 + DB Sync)
@router.get("/skills/decomposition", response_model=List[DecomposedSkill])
def get_skills_decomposition(filter: Optional[str] = Query(None)):
    if not filter:
        return user_skills_cache
    fq = filter.lower()
    return [
        s for s in user_skills_cache 
        if ("demand" in fq and s.demand >= 85) or 
           ("competition" in fq and s.competition <= 40) or 
           ("trending" in fq and s.trend == "Rising") or 
           ("beginner" in fq and s.beginnerFriendly)
    ]

@router.post("/skills/decomposition", response_model=List[DecomposedSkill])
def decompose_skills(payload: DecomposeSkillsBody, db: Session = Depends(get_db)):
    global user_skills_cache, opportunities_cache
    user_skills_cache = ai_engine_service.decompose_input_skills(payload.skills)
    opportunities_cache = ai_engine_service.compute_ranked_opportunities(user_skills_cache)

    # Optional DB record persistence
    try:
        for skill_name in payload.skills:
            nodes_json = [s.model_dump() for s in user_skills_cache if s.skill.lower() == skill_name.lower()]
            new_skill = Skill(
                user_id=1,
                core_skill=skill_name,
                detected_tags=payload.skills,
                decomposed_nodes=nodes_json
            )
            db.add(new_skill)
        db.commit()
    except Exception:
        db.rollback()

    return user_skills_cache

# 3. Market Intelligence (Layer 2)
@router.get("/market", response_model=MarketIntelligenceResponse)
def get_market():
    return {
        "marketScore": 88,
        "demand": 86,
        "competition": 38,
        "trend": "+16.2%",
        "sources": [
            {"name": "Upwork", "value": 45, "color": "#2f64e8"},
            {"name": "Fiverr", "value": 30, "color": "#37b77a"},
            {"name": "LinkedIn", "value": 25, "color": "#8c6ce6"}
        ],
        "categories": [
            {"name": "Data & Automation", "demand": 92, "competition": 35, "score": 94},
            {"name": "Backend APIs", "demand": 88, "competition": 32, "score": 90}
        ],
        "weeklyTrend": [
            {"label": "W1", "value": 60}, {"label": "W2", "value": 68},
            {"label": "W3", "value": 75}, {"label": "W4", "value": 84}
        ]
    }

# 4. Opportunity Ranking Engine (Layer 3)
@router.get("/opportunities", response_model=List[Opportunity])
def get_opportunities():
    global opportunities_cache
    if not opportunities_cache:
        opportunities_cache = ai_engine_service.compute_ranked_opportunities(user_skills_cache)
    return opportunities_cache

@router.get("/opportunities/{opp_id}", response_model=Opportunity)
def get_opportunity(opp_id: str):
    for opp in opportunities_cache:
        if opp.id == opp_id:
            return opp
    raise HTTPException(status_code=404, detail="Opportunity not found")

# 5. Income Kit Generator (Layer 4 + DB Sync)
@router.get("/income-kit", response_model=IncomeKitResponse)
def get_income_kit():
    global current_kit_cache
    return current_kit_cache

@router.post("/income-kit", response_model=IncomeKitResponse)
def generate_income_kit(payload: GenerateIncomeKitBody, db: Session = Depends(get_db)):
    global current_kit_cache
    selected_opp = next((o for o in opportunities_cache if o.id == payload.opportunityId), None)
    title = selected_opp.title if selected_opp else "Custom Micro-Service Deliverable"
    current_kit_cache = ai_engine_service.generate_income_kit(payload.opportunityId, title)

    # Optional DB record persistence
    try:
        kit_record = IncomeKit(
            user_id=1,
            fiverr_gig=current_kit_cache.assets[0].model_dump() if len(current_kit_cache.assets) > 0 else {},
            portfolio_site=current_kit_cache.assets[1].model_dump() if len(current_kit_cache.assets) > 1 else {},
            github_readme=current_kit_cache.assets[2].model_dump() if len(current_kit_cache.assets) > 2 else {},
            cold_email_template=current_kit_cache.assets[3].model_dump() if len(current_kit_cache.assets) > 3 else {}
        )
        db.add(kit_record)
        db.commit()
    except Exception:
        db.rollback()

    return current_kit_cache

# 6. Assets Management
@router.get("/assets", response_model=List[SIEAsset])
def get_assets():
    return assets_cache

@router.patch("/assets/{asset_id}", response_model=SIEAsset)
def update_asset(asset_id: str, payload: UpdateAssetBody):
    for i, asset in enumerate(assets_cache):
        if asset.id == asset_id:
            data = asset.model_dump()
            data.update(payload.model_dump(exclude_unset=True))
            updated = SIEAsset(**data)
            assets_cache[i] = updated
            return updated
    raise HTTPException(status_code=404, detail="Asset not found")

# 7. Adaptive Feedback & Analytics Loop (Layer 5)
@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics():
    total_views = sum(a.views for a in assets_cache)
    total_clicks = sum(a.clicks for a in assets_cache)
    total_conversions = sum(a.responses for a in assets_cache)
    return ai_engine_service.compute_adaptive_feedback(total_views, total_clicks, total_conversions)

# 8. Profile Settings
@router.get("/profile", response_model=ProfileResponse)
def get_profile():
    return profile_cache

@router.patch("/profile", response_model=ProfileResponse)
def update_profile(payload: UpdateProfileBody):
    global profile_cache
    data = profile_cache.model_dump()
    data.update(payload.model_dump(exclude_unset=True))
    profile_cache = ProfileResponse(**data)
    return profile_cache