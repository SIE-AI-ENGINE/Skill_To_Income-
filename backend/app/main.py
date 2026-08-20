from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend services for SIE execution pipeline",
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Configure CORS for Frontend integration (Member 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    return health_payload()


def health_payload():
    return {
        "status": "healthy",
        "service": "SIE-Backend",
        "database": "pending_connection",
    }


@app.get(f"{settings.API_V1_STR}/healthz", tags=["Health"])
def api_health_check():
    return health_payload()