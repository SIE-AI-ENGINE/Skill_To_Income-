from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Skill-to-Income AI Engine (SIE)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Direct Database URL (Neon PostgreSQL)
    DATABASE_URL: Optional[str] = None

    # Fallback Local PostgreSQL Variables
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "sie_db"
    POSTGRES_PORT: str = "5432"

    # Security
    SECRET_KEY: str = "default_secret_key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 11520
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Prioritize Neon DATABASE_URL from .env if present
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()