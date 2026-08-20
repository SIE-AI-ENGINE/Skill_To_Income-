from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_session_token
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.user import UserResponse

router = APIRouter()


def _session_user_id(session_token: str = Depends(get_session_token)) -> int:
    from app.api.v1.endpoints.auth import ACTIVE_SESSIONS

    session = ACTIVE_SESSIONS.get(session_token)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is no longer active")
    return int(session["id"])


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _: int = Depends(_session_user_id)):
    return db.query(User).all()


@router.get("/me", response_model=UserResponse)
def get_my_user(db: Session = Depends(get_db), current_user_id: int = Depends(_session_user_id)):
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(_session_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access another user")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user