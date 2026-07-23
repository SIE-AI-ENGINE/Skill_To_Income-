from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Base properties shared across schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    target_income_monthly: Optional[float] = 0.0
    career_mode: Optional[str] = "freelance"  # freelance, full_time, side_hustle


# Properties required on signup
class UserCreate(UserBase):
    password: str


# Properties returned via API endpoints (hides hashed password)
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Authentication Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None