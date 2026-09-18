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
    semanticFit: Optional[int] = None

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
    semanticFit: Optional[int] = None

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
    average_rate: Optional[str] = None

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
    id: Optional[str] = None
    opportunityId: str
    title: Optional[str] = None
    opportunityTitle: Optional[str] = None
    service: Optional[str] = None
    generatedAt: Optional[str] = None
    createdAt: Optional[str] = None
    assets: List[KitAsset] = Field(min_length=4, max_length=4)

class GenerateIncomeKitBody(BaseModel):
    opportunityId: Optional[str] = None
    service: Optional[str] = None
    opportunityTitle: Optional[str] = None
    opportunity_title: Optional[str] = None
    category: Optional[str] = None
    deliverables: Optional[Any] = None
    platform: Optional[str] = None
    target_budget: Optional[Any] = None


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
    content: Optional[str] = ""
    opportunityId: Optional[str] = ""
    opportunityTitle: Optional[str] = ""

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
    isVerified: bool = False
    githubUsername: Optional[str] = None
    linkedinUrl: Optional[str] = None
    targetWeeklyHours: Optional[int] = 10
    onboardingCompleted: bool = False

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
    isVerified: Optional[bool] = None
    githubUsername: Optional[str] = None
    linkedinUrl: Optional[str] = None
    targetWeeklyHours: Optional[int] = None
    onboardingCompleted: Optional[bool] = None



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


# ==========================================
# 11. Semantic Vector Match Schemas
# ==========================================
class SemanticMatchRequest(BaseModel):
    skills: List[str] = Field(min_length=1)
    top_k: int = 5


class SemanticMatchItem(BaseModel):
    category: str
    micro_service: str
    similarity_score: float
    demand_index: int


class SemanticMatchResponse(BaseModel):
    matches: List[SemanticMatchItem]
    model_used: str


# ==========================================
# 12. Proposal & Pitch Customizer Schemas
# ==========================================
class TailorProposalRequest(BaseModel):
    kit_id: int
    job_description: str = Field(min_length=5)
    client_platform: str = "upwork"  # "upwork" | "fiverr" | "email" | "linkedin"
    client_budget: Optional[str] = None


class ReferencedAssets(BaseModel):
    portfolio_url: Optional[str] = None
    github_repo_url: Optional[str] = None


class TailorProposalResponse(BaseModel):
    status: str = "success"
    platform: str
    custom_proposal: str
    hook_summary: str
    detected_pain_points: List[str]
    referenced_assets: ReferencedAssets