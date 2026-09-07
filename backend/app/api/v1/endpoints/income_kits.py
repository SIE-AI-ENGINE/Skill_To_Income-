from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.income_kit import IncomeKit
from app.db.models.user import User
from app.schemas.income_kit import IncomeKitCreate, IncomeKitResponse, IncomeKitUpdate

router = APIRouter()

@router.post("/", response_model=IncomeKitResponse)
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

@router.get("/", response_model=List[IncomeKitResponse])
def get_income_kits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    kits = db.query(IncomeKit).filter(IncomeKit.user_id == current_user.id).all()
    return kits

@router.put("/{kit_id}", response_model=IncomeKitResponse)
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
