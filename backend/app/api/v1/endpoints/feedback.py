from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.db.models.feedback import Feedback
from app.db.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
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
def get_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return db.query(Feedback).filter(Feedback.user_id == current_user.id).all()
