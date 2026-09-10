from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, Union, Any, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    name: Optional[str] = None
    is_verified: bool = False
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_weekly_hours: Optional[int] = 10
    onboarding_completed: bool = False
    education: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[float] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_name_and_full_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("full_name") and data.get("name"):
                data["full_name"] = data.get("name")
            elif not data.get("name") and data.get("full_name"):
                data["name"] = data.get("full_name")
        return data

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_weekly_hours: Optional[int] = None
    onboarding_completed: Optional[bool] = None
    is_verified: Optional[bool] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[float] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    onboarded: bool = False

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = dict(data.__dict__)
            d["name"] = getattr(data, "full_name", None) or getattr(data, "name", None) or "User"
            d["full_name"] = getattr(data, "full_name", None) or d["name"]
            is_done = getattr(data, "onboarding_completed", False) or bool(
                getattr(data, "career_mode", None) or (hasattr(data, "skills") and len(data.skills) > 0)
            )
            d["onboarding_completed"] = bool(is_done)
            d["onboarded"] = bool(is_done)
            d["is_verified"] = getattr(data, "is_verified", False)
            d["github_username"] = getattr(data, "github_username", None)
            d["linkedin_url"] = getattr(data, "linkedin_url", None)
            d["target_weekly_hours"] = getattr(data, "target_weekly_hours", 10)
            return d
        elif isinstance(data, dict):
            data["name"] = data.get("full_name") or data.get("name") or "User"
            data["full_name"] = data.get("full_name") or data.get("name")
            is_done = data.get("onboarding_completed", False) or data.get("onboarded", False)
            data["onboarding_completed"] = bool(is_done)
            data["onboarded"] = bool(is_done)
            return data
        return data

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class AuthResponse(Token):
    user: Optional[UserResponse] = None
    id: Optional[Union[str, int]] = None
    name: Optional[str] = None
    email: Optional[str] = None
    onboarded: Optional[bool] = False
    is_verified: bool = False
    onboarding_completed: bool = False

class TokenData(BaseModel):
    email: Optional[str] = None

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ResendOtpRequest(BaseModel):
    email: EmailStr

class OnboardingCompleteRequest(BaseModel):
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_weekly_hours: Optional[int] = 10
    skills: List[str] = []
