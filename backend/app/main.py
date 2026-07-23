from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine
# Import all models so SQLAlchemy registers them
from app.db.models import user, skill, market, income_kit

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for SIE execution pipeline",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS for Frontend integration (Member 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Create database tables
Base.metadata.create_all(bind=engine)

# Include V1 API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to Skill-to-Income AI Engine API",
        "docs": "/docs",
        "version": settings.VERSION,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "SIE-Backend",
        "database": "pending_connection",
    }