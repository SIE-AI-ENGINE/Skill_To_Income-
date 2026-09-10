import random
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models.user import User
from app.schemas.user import (
    UserCreate,
    UserResponse,
    AuthResponse,
    VerifyEmailRequest,
    ResendOtpRequest,
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.api.deps import get_db, get_current_user

router = APIRouter()

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(*, db: Session = Depends(get_db), user_in: UserCreate, response: Response) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user_data = user_in.model_dump(exclude={"password", "name"})
    if hasattr(user_in, "name") and user_in.name and not user_data.get("full_name"):
        user_data["full_name"] = user_in.name
    user_data["hashed_password"] = get_password_hash(user_in.password)

    # Generate 6-digit verification OTP
    otp = f"{random.randint(100000, 999999)}"
    user_data["verification_otp"] = otp
    user_data["otp_expires_at"] = datetime.now(timezone.utc) + timedelta(minutes=15)
    user_data["is_verified"] = False
    user_data["onboarding_completed"] = False

    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"[AUTH] Verification OTP for {user.email}: {otp}", flush=True)

    access_token = create_access_token(subject=user.email)
    response.set_cookie(
        key="sie_session",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    user_resp = UserResponse.model_validate(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "name": user_resp.name,
        "email": user.email,
        "onboarded": user_resp.onboarded,
        "is_verified": user.is_verified,
        "onboarding_completed": user.onboarding_completed,
        "user": user_resp,
    }

@router.post("/verify-email", response_model=AuthResponse)
def verify_email(
    *,
    db: Session = Depends(get_db),
    payload: VerifyEmailRequest,
    response: Response,
) -> Any:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        user_resp = UserResponse.model_validate(user)
        access_token = create_access_token(subject=user.email)
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "id": user.id,
            "name": user_resp.name,
            "email": user.email,
            "onboarded": user_resp.onboarded,
            "is_verified": True,
            "onboarding_completed": user.onboarding_completed,
            "user": user_resp,
        }

    if not user.verification_otp or user.verification_otp != payload.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")

    now_utc = datetime.now(timezone.utc)
    if user.otp_expires_at:
        expiry = (
            user.otp_expires_at
            if user.otp_expires_at.tzinfo
            else user.otp_expires_at.replace(tzinfo=timezone.utc)
        )
        if now_utc > expiry:
            raise HTTPException(
                status_code=400,
                detail="Verification code has expired. Please request a new one.",
            )

    user.is_verified = True
    user.verification_otp = None
    user.otp_expires_at = None
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.email)
    response.set_cookie(
        key="sie_session",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    user_resp = UserResponse.model_validate(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "name": user_resp.name,
        "email": user.email,
        "onboarded": user_resp.onboarded,
        "is_verified": True,
        "onboarding_completed": user.onboarding_completed,
        "user": user_resp,
    }

@router.post("/resend-otp")
def resend_otp(
    *,
    db: Session = Depends(get_db),
    payload: ResendOtpRequest,
) -> Any:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "Email is already verified"}

    otp = f"{random.randint(100000, 999999)}"
    user.verification_otp = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(user)
    db.commit()
    print(f"[AUTH] Verification OTP for {user.email}: {otp}", flush=True)
    return {"message": "Verification code resent successfully"}

@router.post("/login", response_model=AuthResponse)
async def login(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> Any:
    email: Optional[str] = None
    password: Optional[str] = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            email = body.get("email") or body.get("username")
            password = body.get("password")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON body")
    else:
        form = await request.form()
        email = form.get("username") or form.get("email")
        password = form.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email/username and password required")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = create_access_token(subject=user.email)
    response.set_cookie(
        key="sie_session",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    user_resp = UserResponse.model_validate(user)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user.id,
        "name": user_resp.name,
        "email": user.email,
        "onboarded": user_resp.onboarded,
        "is_verified": user.is_verified,
        "onboarding_completed": user.onboarding_completed,
        "user": user_resp,
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response) -> Any:
    response.delete_cookie(key="sie_session")
    return {"message": "Successfully logged out"}
