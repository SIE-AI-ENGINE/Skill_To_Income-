from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Any
from datetime import date, datetime

# ==========================================
# 1. Opportunity Schemas
# ==========================================
class Opportunity(BaseModel):
    id: str
    rank: int
    title: str
    platform: str
    expectedEarnings: str
    demand: int
    competition: int
    effort: str
    score: int
    whyNow: str
    description: str
    tags: List[str]

# ==========================================
# 2. Decomposed Skill Schemas
# ==========================================
class DecomposedSkill(BaseModel):
    id: str
    skill: str
    microService: str
    category: str
    demand: int
    competition: int
    suitability: int
    trend: str  # "Rising", "Steady", "Declining"
    beginnerFriendly: bool
    description: str

class DecomposeSkillsBody(BaseModel):
    skills: List[str] = Field(min_length=1)

# ==========================================
# 3. Dashboard Schemas
# ==========================================
class RecentActivity(BaseModel):
    id: str
    title: str
    detail: str
    time: str
    tone: str  # "blue", "green", "purple"

class TrendPoint(BaseModel):
    label: str
    value: int

class DashboardResponse(BaseModel):
    userName: str
    profileCompletion: int
    opportunitiesFound: int
    assetsGenerated: int
    expectedEarnings: int
    topOpportunity: Opportunity
    recentActivity: List[RecentActivity]
    trend: List[TrendPoint]

# ==========================================
# 4. Market Intelligence Schemas
# ==========================================
class MarketSource(BaseModel):
    name: str
    value: int
    color: str

class MarketCategory(BaseModel):
    name: str
    demand: int
    competition: int
    score: int

class MarketIntelligenceResponse(BaseModel):
    marketScore: int
    demand: int
    competition: int
    trend: str
    sources: List[MarketSource]
    categories: List[MarketCategory]
    weeklyTrend: List[TrendPoint]

# ==========================================
# 5. Income Kit Schemas
# ==========================================
class KitAsset(BaseModel):
    id: str
    type: Literal["Gig listing", "Portfolio project", "Landing page", "Outreach scripts"]
    title: str
    status: str
    content: str = Field(min_length=1)
    description: str

class IncomeKitResponse(BaseModel):
    opportunityId: str
    opportunityTitle: str
    generatedAt: str
    assets: List[KitAsset] = Field(min_length=4, max_length=4)

class GenerateIncomeKitBody(BaseModel):
    opportunityId: str

# ==========================================
# 6. Asset & Tracker Schemas
# ==========================================
class SIEAsset(BaseModel):
    id: str
    name: str
    type: str
    status: str
    createdAt: str
    views: int
    clicks: int
    responses: int
    content: str
    opportunityId: str

class UpdateAssetBody(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    content: Optional[str] = None
    views: Optional[int] = None
    clicks: Optional[int] = None
    responses: Optional[int] = None

# ==========================================
# 7. Analytics & Feedback Schemas
# ==========================================
class Experiment(BaseModel):
    id: str
    name: str
    status: str
    variantA: float
    variantB: float
    winner: str

class AnalyticsResponse(BaseModel):
    views: int
    clicks: int
    responses: int
    conversions: int
    conversionRate: float
    performance: List[TrendPoint]
    recommendations: List[str]
    experiments: List[Experiment]

# ==========================================
# 8. User Profile Schemas
# ==========================================
class ProfileResponse(BaseModel):
    name: str
    email: str
    experience: str
    goals: List[str]
    availability: str
    platforms: List[str]
    incomeGoal: str
    workType: str
    skills: List[str]
    completion: int
    onboarded: bool = False

class UpdateProfileBody(BaseModel):
    name: Optional[str] = None
    experience: Optional[str] = None
    goals: Optional[List[str]] = None
    availability: Optional[str] = None
    platforms: Optional[List[str]] = None
    incomeGoal: Optional[str] = None
    workType: Optional[str] = None
    skills: Optional[List[str]] = None
    completion: Optional[int] = None
    onboarded: Optional[bool] = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    opportunityId: str
    status: str
    repositoryUrl: Optional[str] = None
    createdAt: str


class CreateProjectBody(BaseModel):
    name: str = Field(min_length=1)
    description: str = Field(min_length=1)
    opportunityId: str


class DeploymentResponse(BaseModel):
    id: str
    projectId: str
    status: str
    url: Optional[str] = None
    createdAt: str


class DeployProjectBody(BaseModel):
    projectId: str


class FeedbackBody(BaseModel):
    opportunityId: str
    outcome: str = Field(min_length=1)
    notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    opportunityId: str
    outcome: str
    notes: Optional[str] = None
    createdAt: str


class HistoryEntry(BaseModel):
    id: str
    action: str
    resourceId: str
    createdAt: str