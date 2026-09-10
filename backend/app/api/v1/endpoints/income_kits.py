from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.income_kit import IncomeKit
from app.db.models.user import User
from app.schemas.income_kit import IncomeKitCreate, IncomeKitResponse as DBIncomeKitResponse, IncomeKitUpdate
from app.schemas.sie import IncomeKitResponse as SIEKitResponse, GenerateIncomeKitBody, KitAsset
from app.services.ai_engine import ai_engine_service

router = APIRouter()

@router.post("/", response_model=DBIncomeKitResponse)
def create_income_kit(
    *,
    db: Session = Depends(get_db),
    kit_in: IncomeKitCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    kit = IncomeKit(**kit_in.model_dump(), user_id=current_user.id)
    db.add(kit)
    db.commit()
    db.refresh(kit)
    return kit

@router.get("/", response_model=List[DBIncomeKitResponse])
def get_income_kits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    kits = db.query(IncomeKit).filter(IncomeKit.user_id == current_user.id).all()
    return kits

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

# ---------------------------------------------------------------------------
# AI Income Kit Generation Endpoints (Persisted in Neon PostgreSQL)
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=SIEKitResponse)
def generate_and_persist_income_kit(
    payload: GenerateIncomeKitBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    title = payload.opportunityTitle or "Client Automation & API Service"
    generated_kit = ai_engine_service.generate_income_kit(payload.opportunityId, title)

    # Persist the 4 bundled asset blueprints into the user's income_kits table
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

    return generated_kit

@router.get("/latest", response_model=Optional[SIEKitResponse])
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

    assets: List[KitAsset] = []
    if latest.fiverr_gig and isinstance(latest.fiverr_gig, dict):
        assets.append(KitAsset.model_validate(latest.fiverr_gig))
    if latest.portfolio_site and isinstance(latest.portfolio_site, dict):
        assets.append(KitAsset.model_validate(latest.portfolio_site))
    if latest.github_readme and isinstance(latest.github_readme, dict):
        assets.append(KitAsset.model_validate(latest.github_readme))
    if latest.cold_email_template and isinstance(latest.cold_email_template, dict):
        assets.append(KitAsset.model_validate(latest.cold_email_template))

    opp_title = (assets[0].title if assets else "Client Deliverable")

    return SIEKitResponse(
        opportunityId=f"opp-{latest.id}",
        opportunityTitle=opp_title,
        generatedAt=latest.created_at.isoformat() if latest.created_at else datetime.now(timezone.utc).isoformat(),
        assets=assets,
    )

