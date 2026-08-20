from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Base properties shared across schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


# Properties required on signup
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


# Properties returned via API endpoints (hides hashed password)
class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    onboarded: bool = False


# Authentication Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None