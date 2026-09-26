from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.income_kit import IncomeKit
from app.db.models.skill import Skill
from app.db.models.user import User
from app.schemas.income_kit import IncomeKitCreate, IncomeKitResponse as DBIncomeKitResponse, IncomeKitUpdate
from app.schemas.sie import IncomeKitResponse as SIEKitResponse, GenerateIncomeKitBody, KitAsset, DecomposedSkill
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


def _serialize_kit_record(
    kit: IncomeKit,
    opp_id: Optional[str] = None,
    title: Optional[str] = None,
    db: Optional[Session] = None,
    current_user: Optional[User] = None,
) -> SIEKitResponse:
    assets: List[KitAsset] = []
    if kit.fiverr_gig and isinstance(kit.fiverr_gig, dict):
        assets.append(KitAsset.model_validate(kit.fiverr_gig))
    if kit.github_readme and isinstance(kit.github_readme, dict):
        assets.append(KitAsset.model_validate(kit.github_readme))
    if kit.portfolio_site and isinstance(kit.portfolio_site, dict):
        assets.append(KitAsset.model_validate(kit.portfolio_site))
    if kit.cold_email_template and isinstance(kit.cold_email_template, dict):
        assets.append(KitAsset.model_validate(kit.cold_email_template))

    # Resolve authentic title without generic fallback
    resolved_title = title
    resolved_opp_id = opp_id

    # 1. Try extracting title from stored assets (fiverr_gig or github_readme)
    if not resolved_title:
        if kit.fiverr_gig and isinstance(kit.fiverr_gig, dict):
            t = kit.fiverr_gig.get("opportunity_title") or kit.fiverr_gig.get("opportunityTitle")
            if not t and kit.fiverr_gig.get("title"):
                raw_t = str(kit.fiverr_gig["title"])
                if " — Professional Service" in raw_t:
                    t = raw_t.split(" — Professional Service")[0].strip()
                elif raw_t and raw_t != "Client Deliverable":
                    t = raw_t
            if t and t != "Client Deliverable":
                resolved_title = t
        if not resolved_title and kit.github_readme and isinstance(kit.github_readme, dict):
            t = kit.github_readme.get("opportunity_title") or kit.github_readme.get("opportunityTitle") or kit.github_readme.get("title")
            if t and t != "Client Deliverable":
                resolved_title = t

    # 2. If still ungrounded, query user's actual top-ranked opportunity
    if not resolved_title and db and current_user:
        decomposed = _get_user_decomposed_skills(current_user.id, db)
        if decomposed:
            opportunities = ai_engine_service.compute_ranked_opportunities(decomposed, db=db, user=current_user)
            if opportunities:
                top_opp = opportunities[0]
                resolved_title = top_opp.title
                if not resolved_opp_id:
                    resolved_opp_id = top_opp.id

    # 3. Fallback to domain starter service rather than generic placeholder
    if not resolved_title or resolved_title == "Client Deliverable":
        resolved_title = "Automated Workflow & API Service"
    if not resolved_opp_id:
        resolved_opp_id = f"opp-{kit.id}"

    if len(assets) < 4:
        fallback = ai_engine_service.generate_income_kit(
            resolved_opp_id,
            resolved_title,
            user=current_user,
            db=db,
        )
        assets = fallback.assets

    created_at = kit.created_at.isoformat() if kit.created_at else datetime.now(timezone.utc).isoformat()

    return SIEKitResponse(
        id=str(kit.id),
        opportunityId=resolved_opp_id,
        title=resolved_title,
        opportunityTitle=resolved_title,
        service=resolved_title,
        generatedAt=created_at,
        createdAt=created_at,
        assets=assets,
    )


def _generate_and_persist_kit(
    db: Session,
    current_user: User,
    opp_id_param: Optional[str] = None,
    service_param: Optional[str] = None,
    title_param: Optional[str] = None,
    skill_name: Optional[str] = None,
) -> SIEKitResponse:
    opp_id = opp_id_param
    service_name = service_param or title_param

    # Look up matching opportunity if available
    decomposed = _get_user_decomposed_skills(current_user.id, db)
    opportunities = ai_engine_service.compute_ranked_opportunities(decomposed, db=db, user=current_user) if decomposed else []

    resolved_title = None
    resolved_opp_id = None

    if opp_id:
        for opp in opportunities:
            if opp.id == opp_id:
                resolved_title = opp.title
                resolved_opp_id = opp.id
                break

    if not resolved_title and service_name:
        for opp in opportunities:
            if (service_name.lower() in opp.title.lower()) or (opp.title.lower() in service_name.lower()):
                resolved_title = opp.title
                resolved_opp_id = opp.id
                break

    if not resolved_title:
        resolved_title = service_name or (opportunities[0].title if opportunities else "Client Automation & API Service")
    if not resolved_opp_id:
        resolved_opp_id = opp_id or (opportunities[0].id if opportunities else f"opp-{abs(hash(resolved_title)) % 100000}")

    generated_kit = ai_engine_service.generate_income_kit(
        resolved_opp_id,
        resolved_title,
        user=current_user,
        db=db,
        skill_name=skill_name,
    )

    # Persist the 4 bundled asset blueprints into income_kits table
    assets_by_type = {a.type: a.model_dump() for a in generated_kit.assets}
    kit_record = IncomeKit(
        user_id=current_user.id,
        fiverr_gig=assets_by_type.get("Gig listing"),
        portfolio_site=assets_by_type.get("Landing page"),
        github_readme=assets_by_type.get("Portfolio project"),
        cold_email_template=assets_by_type.get("Outreach scripts"),
    )
    db.add(kit_record)
    db.commit()
    db.refresh(kit_record)

    created_at = kit_record.created_at.isoformat() if kit_record.created_at else datetime.now(timezone.utc).isoformat()
    return SIEKitResponse(
        id=str(kit_record.id),
        opportunityId=resolved_opp_id,
        title=resolved_title,
        opportunityTitle=resolved_title,
        service=resolved_title,
        generatedAt=created_at,
        createdAt=created_at,
        assets=generated_kit.assets,
    )


# ---------------------------------------------------------------------------
# POST endpoints: Generate income kit (supports body, query param fallback,
# and both slash and non-slash variants to eliminate HTTP 307 redirects)
# ---------------------------------------------------------------------------

@router.post("", response_model=SIEKitResponse)
@router.post("/", response_model=SIEKitResponse)
@router.post("/generate", response_model=SIEKitResponse)
@router.post("/generate/", response_model=SIEKitResponse)
def generate_income_kit(
    payload: Optional[GenerateIncomeKitBody] = Body(None),
    opportunityId: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    opp_id = (payload.opportunityId if payload else None) or opportunityId
    service_name = (
        (payload.service if payload else None)
        or (payload.opportunityTitle if payload else None)
        or (payload.opportunity_title if payload else None)
        or service
    )
    title_name = (
        (payload.opportunityTitle if payload else None)
        or (payload.opportunity_title if payload else None)
    )
    skill_val = (
        (payload.skill if payload else None)
        or (payload.skill_name if payload else None)
        or skill
    )
    return _generate_and_persist_kit(db, current_user, opp_id, service_name, title_name, skill_name=skill_val)


# ---------------------------------------------------------------------------
# GET endpoints: Retrieve or initialize current income kit (slash & non-slash)
# ---------------------------------------------------------------------------

@router.get("", response_model=SIEKitResponse)
@router.get("/", response_model=SIEKitResponse)
def get_current_income_kit(
    opportunityId: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    kit_id: Optional[str] = Query(None),
    id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    # If a specific service or opportunity is requested, generate/retrieve for that service
    if service or opportunityId:
        return _generate_and_persist_kit(db, current_user, opportunityId, service, None, skill_name=skill)

    target_id = kit_id or id
    if target_id:
        try:
            k_id = int(target_id)
            kit = (
                db.query(IncomeKit)
                .filter(IncomeKit.id == k_id, IncomeKit.user_id == current_user.id)
                .first()
            )
            if kit:
                return _serialize_kit_record(kit, db=db, current_user=current_user)
        except ValueError:
            pass

    latest = (
        db.query(IncomeKit)
        .filter(IncomeKit.user_id == current_user.id)
        .order_by(IncomeKit.id.desc())
        .first()
    )
    if latest:
        return _serialize_kit_record(latest, db=db, current_user=current_user)

    # Auto-generate if not yet existing for user
    return _generate_and_persist_kit(db, current_user)


@router.get("/latest", response_model=Optional[SIEKitResponse])
@router.get("/latest/", response_model=Optional[SIEKitResponse])
def get_latest_income_kit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    latest = (
        db.query(IncomeKit)
        .filter(IncomeKit.user_id == current_user.id)
        .order_by(IncomeKit.id.desc())
        .first()
    )
    if not latest:
        return None
    return _serialize_kit_record(latest, db=db, current_user=current_user)


@router.get("/{kit_id}", response_model=SIEKitResponse)
def get_income_kit_by_id(
    kit_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    kit = None
    if kit_id.isdigit():
        kit = db.query(IncomeKit).filter(IncomeKit.id == int(kit_id), IncomeKit.user_id == current_user.id).first()
    if not kit:
        kit = db.query(IncomeKit).filter(IncomeKit.user_id == current_user.id).order_by(IncomeKit.id.desc()).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Income kit not found")
    return _serialize_kit_record(kit, opp_id=kit_id, db=db, current_user=current_user)


# ---------------------------------------------------------------------------
# Additional management endpoints (PUT, DELETE)
# ---------------------------------------------------------------------------

@router.put("/{kit_id}", response_model=DBIncomeKitResponse)
def update_income_kit(
    *,
    db: Session = Depends(get_db),
    kit_id: int,
    kit_in: IncomeKitUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    kit = db.query(IncomeKit).filter(IncomeKit.id == kit_id, IncomeKit.user_id == current_user.id).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Income kit not found")
    
    update_data = kit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(kit, field, value)
    
    db.add(kit)
    db.commit()
    db.refresh(kit)
    return kit


@router.delete("/{kit_id}")
def delete_income_kit(
    *,
    db: Session = Depends(get_db),
    kit_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    kit = db.query(IncomeKit).filter(IncomeKit.id == kit_id, IncomeKit.user_id == current_user.id).first()
    if not kit:
        raise HTTPException(status_code=404, detail="Income kit not found")
    db.delete(kit)
    db.commit()
    return {"message": "Income kit deleted successfully"}
