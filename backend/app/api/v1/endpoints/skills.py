from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.skill import Skill
from app.db.models.user import User
from app.db.models.market import MarketData
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate, SkillBulkSyncRequest
from app.schemas.sie import (
    DecomposedSkill, DecomposeSkillsBody,
    SemanticMatchRequest, SemanticMatchResponse, SemanticMatchItem
)
from app.services.ai_engine import ai_engine_service
from app.services.vector_engine import vector_engine

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

@router.put("/", response_model=List[SkillResponse])
def sync_user_skills(
    payload: SkillBulkSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Synchronizes active user skills and re-runs AI decomposition."""
    clean_skills = [str(s).strip() for s in payload.skills if str(s).strip()]
    db.query(Skill).filter(Skill.user_id == current_user.id).delete()

    if not clean_skills:
        db.commit()
        return []

    decomposed = ai_engine_service.decompose_input_skills(clean_skills)
    created_skills = []
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
        created_skills.append(db_skill)

    db.commit()
    for s in created_skills:
        db.refresh(s)
    return created_skills

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
@router.post("/decompose", response_model=List[DecomposedSkill])
@router.post("/analyze", response_model=List[DecomposedSkill])
def decompose_and_persist_skills(
    payload: DecomposeSkillsBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    clean_skills = [s.strip() for s in payload.skills if s.strip()]
    if not clean_skills:
        return []

    decomposed = ai_engine_service.decompose_input_skills(clean_skills)

    # Persist decomposed skills to DB for the authenticated user
    for skill_name in clean_skills:
        nodes = [d.model_dump() for d in decomposed if d.skill.lower() == skill_name.lower()]
        if not nodes:
            nodes = [d.model_dump() for d in decomposed]
        tags = list({d.get("category", "General") for d in nodes} | {skill_name})

        # Remove previous entry for this skill to avoid stale duplicates and elevate to latest
        db.query(Skill).filter(
            Skill.user_id == current_user.id,
            Skill.core_skill.ilike(skill_name),
        ).delete()
        db.flush()

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
@router.get("/decompose", response_model=List[DecomposedSkill])
def get_skills_decomposition(
    filter: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    query = db.query(Skill).filter(Skill.user_id == current_user.id)
    target_skills = []
    if skill:
        target_skills.append(skill.strip().lower())
    if skills:
        target_skills.extend([s.strip().lower() for s in skills.split(",") if s.strip()])

    if target_skills:
        all_skills = query.order_by(Skill.id.desc()).all()
        matching_skills = [s for s in all_skills if any(t in s.core_skill.lower() for t in target_skills)]
        other_skills = [s for s in all_skills if not any(t in s.core_skill.lower() for t in target_skills)]
        skills_records = matching_skills + other_skills
    else:
        skills_records = query.order_by(Skill.id.desc()).all()

    all_decomposed: List[DecomposedSkill] = []
    seen_ids = set()

    for s in skills_records:
        if s.decomposed_nodes:
            if isinstance(s.decomposed_nodes, list):
                for node in s.decomposed_nodes:
                    if isinstance(node, dict):
                        try:
                            item = DecomposedSkill.model_validate(node)
                            if item.id not in seen_ids:
                                seen_ids.add(item.id)
                                all_decomposed.append(item)
                        except Exception:
                            pass
            elif isinstance(s.decomposed_nodes, dict):
                for k, v in s.decomposed_nodes.items():
                    if isinstance(v, dict):
                        item_id = f"skill-{s.id}-{k}"
                        if item_id not in seen_ids:
                            seen_ids.add(item_id)
                            all_decomposed.append(DecomposedSkill(
                                id=item_id,
                                skill=s.core_skill,
                                microService=k,
                                category="Tech & Data",
                                demand=int(v.get("demand", 80) if isinstance(v.get("demand"), (int, float)) else 80),
                                competition=int(v.get("competition", 40) if isinstance(v.get("competition"), (int, float)) else 40),
                                suitability=85,
                                trend="Rising",
                                beginnerFriendly=True,
                                description=f"Specialized deliverable for {k}.",
                            ))

    if not filter:
        return all_decomposed

    fq = filter.lower().strip()
    if "high demand" in fq:
        return [item for item in all_decomposed if item.demand >= 80]
    if "low competition" in fq:
        return [item for item in all_decomposed if item.competition <= 40]
    if "trending" in fq:
        return [item for item in all_decomposed if "+" in str(item.trend) or "rising" in str(item.trend).lower()]
    if "beginner" in fq:
        return [item for item in all_decomposed if item.beginnerFriendly]

    return all_decomposed


CANONICAL_MARKET_CATALOG = [
    {
        "category": "Data Engineering",
        "micro_service": "Automated Data Cleaning & Web Scraping ETL Pipeline",
        "demand_index": 91,
    },
    {
        "category": "Data Engineering",
        "micro_service": "Automated Spreadsheet Reporting & SQL Pipeline Integration",
        "demand_index": 89,
    },
    {
        "category": "Backend Development",
        "micro_service": "Production-Grade FastAPI REST Microservice with JWT Auth",
        "demand_index": 94,
    },
    {
        "category": "Frontend & Mobile",
        "micro_service": "Interactive BI Analytics Dashboard with React & Tailwind",
        "demand_index": 93,
    },
    {
        "category": "Frontend & Mobile",
        "micro_service": "Cross-Platform Mobile App Screen & State Management",
        "demand_index": 89,
    },
    {
        "category": "Creative & Media",
        "micro_service": "High-Retention Short-Form Video Editing & Motion Cut",
        "demand_index": 95,
    },
    {
        "category": "Creative & Media",
        "micro_service": "Figma-to-Code Pixel-Perfect Component Conversion",
        "demand_index": 92,
    },
    {
        "category": "Business & Strategy",
        "micro_service": "B2B Lead Generation Funnel & Cold Email Deliverability Audit",
        "demand_index": 88,
    },
    {
        "category": "Business & Strategy",
        "micro_service": "Technical SEO Audit & Programmatic Content Strategy",
        "demand_index": 87,
    },
    {
        "category": "AI & Machine Learning",
        "micro_service": "Retrieval-Augmented Generation (RAG) Knowledge Agent Setup",
        "demand_index": 96,
    },
]


@router.post("/semantic-match", response_model=SemanticMatchResponse)
def semantic_skill_match(
    payload: SemanticMatchRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Computes dense vector embeddings for input skills and matches them against
    freelance market niches and database market opportunities using cosine similarity.
    """
    # 1. Build candidate catalog combining DB MarketData records and canonical catalog
    candidates = [dict(c) for c in CANONICAL_MARKET_CATALOG]
    try:
        db_records = db.query(MarketData).all()
        for rec in db_records:
            cat = rec.category or rec.skill_category or "Market Opportunity"
            candidates.append({
                "category": cat,
                "micro_service": rec.opportunity_title,
                "demand_index": int(rec.demand_score) if rec.demand_score else 85,
            })
    except Exception:
        pass

    # 2. Rank candidates across input skills
    top_k = max(1, min(20, payload.top_k))
    combined_query = " ".join(payload.skills).strip()

    scored = vector_engine.semantic_search(
        query=combined_query,
        candidates=candidates,
        top_k=top_k,
        threshold=0.15,
    )

    matches = [
        SemanticMatchItem(
            category=item.get("category", "General"),
            micro_service=item.get("micro_service", ""),
            similarity_score=float(item.get("similarity_score", 0.0)),
            demand_index=int(item.get("demand_index", 85)),
        )
        for item in scored
    ]

    return SemanticMatchResponse(
        matches=matches,
        model_used=vector_engine.model_name,
    )

