from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine
# Import all models so SQLAlchemy registers them
from app.db import models
from app.core.middleware import catch_exceptions_middleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup safely
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        # In production environments with Neon/PostgreSQL, migrations run via Alembic
        print(f"[SIE-Startup] Table initialization notice: {exc}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for SIE execution pipeline",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(exc)}"})

# Configure CORS for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(catch_exceptions_middleware)

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


def health_payload():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "offline"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "SIE-Backend",
        "database": db_status,
        "version": settings.VERSION,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return health_payload()


@app.get(f"{settings.API_V1_STR}/healthz", tags=["Health"])
def api_health_check():
    return health_payload()