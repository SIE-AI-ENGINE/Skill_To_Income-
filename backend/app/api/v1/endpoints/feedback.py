from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.feedback import Feedback
from app.db.models.outcome import UserOutcome
from app.db.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
from app.schemas.outcome import OutcomeCreate, OutcomeResponse, OutcomeSubmissionResponse
from app.services.ai_engine import ai_engine_service

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
@router.post("", response_model=FeedbackResponse)
def submit_feedback(
    *,
    db: Session = Depends(get_db),
    feedback_in: FeedbackCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    feedback = Feedback(**feedback_in.model_dump(), user_id=current_user.id)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("/", response_model=List[FeedbackResponse])
@router.get("", response_model=List[FeedbackResponse])
def get_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.query(Feedback).filter(Feedback.user_id == current_user.id).all()


@router.post("/outcome", response_model=OutcomeSubmissionResponse)
@router.post("/outcome/", response_model=OutcomeSubmissionResponse)
def log_outcome(
    *,
    db: Session = Depends(get_db),
    outcome_in: OutcomeCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    # Determine status
    status = "running"
    if outcome_in.orders_converted > 0:
        status = "converted"
    elif outcome_in.days_active >= 7 and outcome_in.inquiries_received == 0:
        status = "stalled"

    # Create outcome record
    outcome_data = outcome_in.model_dump()
    outcome_record = UserOutcome(
        user_id=current_user.id,
        status=status,
        **outcome_data,
    )

    # Compute adaptive strategy recalibration
    recalibration_note = ai_engine_service.evaluate_outcome_and_recalibrate(
        outcome_record,
        user=current_user,
        db=db,
    )
    outcome_record.strategy_recommendation = recalibration_note

    db.add(outcome_record)
    db.commit()
    db.refresh(outcome_record)

    return OutcomeSubmissionResponse(
        outcome=OutcomeResponse.model_validate(outcome_record),
        strategy_recommendation=recalibration_note,
    )


@router.get("/outcomes", response_model=List[OutcomeResponse])
@router.get("/outcomes/", response_model=List[OutcomeResponse])
def get_user_outcomes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return (
        db.query(UserOutcome)
        .filter(UserOutcome.user_id == current_user.id)
        .order_by(UserOutcome.id.desc())
        .all()
    )
