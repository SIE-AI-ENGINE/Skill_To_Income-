from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models.user import User
from app.schemas.user import UserCreate, UserResponse, AuthResponse
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
    user = User(**user_data)
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
        "user": user_resp,
    }

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
        "user": user_resp,
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(response: Response) -> Any:
    response.delete_cookie(key="sie_session")
    return {"message": "Successfully logged out"}