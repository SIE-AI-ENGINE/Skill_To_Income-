from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Skill-to-Income AI Engine (SIE) API",
    description="Backend services for SIE execution pipeline",
    version="1.0.0"
)

# Configure CORS for Frontend integration (Member 2)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to Skill-to-Income AI Engine API",
        "docs": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "SIE-Backend",
        "database": "pending_connection"
    }