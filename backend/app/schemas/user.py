import re
from pydantic import BaseModel, EmailStr, model_validator, field_validator
from typing import Optional, Union, Any, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    name: Optional[str] = None
    is_verified: bool = False
    github_username: Optional[str] = None
    github_token: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_weekly_hours: Optional[int] = 10
    onboarding_completed: bool = False
    education: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[float] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None
    proof_project: Optional[str] = None

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

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one numeric digit (0-9)")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]", v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)")
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    name: Optional[str] = None
    github_username: Optional[str] = None
    github_token: Optional[str] = None
    linkedin_url: Optional[str] = None
    target_weekly_hours: Optional[int] = None
    onboarding_completed: Optional[bool] = None
    is_verified: Optional[bool] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    experience_level: Optional[str] = None
    income_goal: Optional[Union[float, str]] = None
    available_time_hrs: Optional[int] = None
    career_mode: Optional[str] = None
    target_role: Optional[str] = None
    proof_project: Optional[str] = None
    github_url: Optional[str] = None
    github_pat: Optional[str] = None
    skills: Optional[List[str]] = None

class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    onboarded: bool = False
    skills: List[str] = []
    primary_skill: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_fields(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = dict(data.__dict__)
            d["name"] = getattr(data, "full_name", None) or getattr(data, "name", None) or "User"
            d["full_name"] = getattr(data, "full_name", None) or d["name"]
            is_done = bool(getattr(data, "onboarding_completed", False))
            d["onboarding_completed"] = is_done
            d["onboarded"] = is_done
            d["is_verified"] = getattr(data, "is_verified", False)
            d["github_username"] = getattr(data, "github_username", None)
            d["github_token"] = getattr(data, "github_token", None)
            d["linkedin_url"] = getattr(data, "linkedin_url", None)
            d["proof_project"] = getattr(data, "proof_project", None)
            d["target_weekly_hours"] = getattr(data, "target_weekly_hours", 10)
            if hasattr(data, "skills") and data.skills is not None:
                skill_names = [s.core_skill if hasattr(s, "core_skill") else str(s) for s in data.skills]
                d["skills"] = skill_names
                d["primary_skill"] = skill_names[0] if skill_names else None
            elif hasattr(data, "skills_list") and data.skills_list:
                d["skills"] = data.skills_list
                d["primary_skill"] = data.skills_list[0]
            elif "skills" not in d or d["skills"] is None:
                d["skills"] = []
            return d
        elif isinstance(data, dict):
            data["name"] = data.get("full_name") or data.get("name") or "User"
            data["full_name"] = data.get("full_name") or data.get("name")
            is_done = bool(data.get("onboarding_completed", False) or data.get("onboarded", False))
            data["onboarding_completed"] = is_done
            data["onboarded"] = is_done
            data["github_token"] = data.get("github_token")
            data["proof_project"] = data.get("proof_project")
            if "skills" in data and isinstance(data["skills"], list):
                skill_names = [s if isinstance(s, str) else getattr(s, "core_skill", str(s)) for s in data["skills"]]
                data["skills"] = skill_names
                data["primary_skill"] = skill_names[0] if skill_names else None
            else:
                data["skills"] = []
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
    name: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    target_role: Optional[str] = None
    career_mode: Optional[str] = None
    experience_level: Optional[str] = None
    experience: Optional[str] = None
    income_goal: Optional[Union[float, str]] = None
    github_username: Optional[str] = None
    github_url: Optional[str] = None
    github_token: Optional[str] = None
    github_pat: Optional[str] = None
    linkedin_url: Optional[str] = None
    proof_project: Optional[str] = None
    target_weekly_hours: Optional[int] = 10
    skills: List[str] = []
