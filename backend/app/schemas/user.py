from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[float] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[float] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None