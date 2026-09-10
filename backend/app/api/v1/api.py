from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    skills,
    market,
    income_kits,
    analytics,
    feedback,
    dashboard,
    workflow,
    assets,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(skills.router, prefix="/skills", tags=["skills"])
api_router.include_router(market.router, prefix="/market", tags=["market"])
api_router.include_router(income_kits.router, prefix="/income-kits", tags=["income-kits"])
api_router.include_router(income_kits.router, prefix="/income-kit", tags=["income-kit-alias"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
api_router.include_router(users.onboarding_router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(dashboard.router, tags=["dashboard"])