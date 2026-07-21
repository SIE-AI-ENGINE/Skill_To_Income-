from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

# Temporary in-memory user store until Member 3 provides PostgreSQL credentials
# Allows testing auth flow without breaking database dependency constraints
TEMP_USER_DB = {}


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate):
    if user_in.email in TEMP_USER_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    # Hash password & construct user payload
    hashed_pwd = get_password_hash(user_in.password)
    user_dict = {
        "id": len(TEMP_USER_DB) + 1,
        "email": user_in.email,
        "full_name": user_in.full_name,
        "target_income_monthly": user_in.target_income_monthly,
        "career_mode": user_in.career_mode,
        "hashed_password": hashed_pwd,
        "is_active": True,
        "created_at": "2026-07-21T00:00:00",
    }

    TEMP_USER_DB[user_in.email] = user_dict
    return user_dict


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = TEMP_USER_DB.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(subject=user["email"])
    return {"access_token": access_token, "token_type": "bearer"}