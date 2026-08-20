from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.db.session import get_db
from app.db.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token, get_session_token
from app.schemas.user import AuthResponse

router = APIRouter()

class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: Optional[str] = None

# Active session cache for development
ACTIVE_SESSIONS = {}
TEMP_USER_DB = {}


@router.post("/signup", response_model=AuthResponse)
def signup(payload: AuthPayload, response: Response, db: Session = Depends(get_db)):
    user_id = None
    user_name = payload.name or payload.email.split("@")[0].title()

    try:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already registered")

        user = User(
            email=payload.email,
            hashed_password=get_password_hash(payload.password),
            full_name=user_name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        user_id = str(user.id)
    except HTTPException:
        raise
    except Exception:
        # Local memory fallback if DB is offline
        if payload.email in TEMP_USER_DB:
            raise HTTPException(status_code=400, detail="User already registered")
        user_id = str(len(TEMP_USER_DB) + 1)
        TEMP_USER_DB[payload.email] = {
            "id": user_id,
            "email": payload.email,
            "name": user_name,
            "hashed_password": get_password_hash(payload.password)
        }

    token = create_access_token(subject=user_id)
    ACTIVE_SESSIONS[token] = {"id": user_id, "email": payload.email, "name": user_name}
    response.set_cookie(key="sie_session", value=token, httponly=True, samesite="lax")
    return {"id": user_id, "email": payload.email, "name": user_name}


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthPayload, response: Response, db: Session = Depends(get_db)):
    user_id = None
    user_name = None

    try:
        user = db.query(User).filter(User.email == payload.email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user_id = str(user.id)
        user_name = user.full_name
    except HTTPException:
        raise
    except Exception:
        user_mem = TEMP_USER_DB.get(payload.email)
        if not user_mem or not verify_password(payload.password, user_mem["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        user_id = user_mem["id"]
        user_name = user_mem["name"]

    token = create_access_token(subject=user_id)
    ACTIVE_SESSIONS[token] = {"id": user_id, "email": payload.email, "name": user_name}
    response.set_cookie(key="sie_session", value=token, httponly=True, samesite="lax")
    return {"id": user_id, "email": payload.email, "name": user_name}


@router.get("/me", response_model=AuthResponse)
def get_current_user(session_token: str = Depends(get_session_token)):
    session = ACTIVE_SESSIONS.get(session_token)
    if session:
        from app.api.v1.endpoints.skills import profile_cache

        return {**session, "onboarded": profile_cache.onboarded}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is no longer active")


@router.post("/logout")
def logout(request: Request, response: Response, bearer_token: Optional[str] = Depends(get_session_token)):
    session_token = bearer_token or request.cookies.get("sie_session")
    if session_token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[session_token]
    response.delete_cookie("sie_session")
    return {"success": True}