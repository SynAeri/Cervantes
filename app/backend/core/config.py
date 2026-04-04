# Configuration settings for Cervantes backend
# Loads environment variables and provides settings object

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

class Settings(BaseSettings):
    # Database (PostgreSQL for local Docker dev; Firestore in production)
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/cervantes"

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # CurricuLLM (OpenAI-compatible)
    CURRICULLM_API_KEY: str = ""
    CURRICULLM_BASE_URL: str = "https://api.curricullm.com/v1"
    CURRICULLM_MODEL: str = "CurricuLLM-AU"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_WEB_API_KEY: str = ""
    # Optional: Cloud Run uses the metadata server for credentials automatically.
    # Only set this for local development with a service account key file.
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # JWT (kept as fallback; Firebase Auth is primary)
    JWT_SECRET: str = "dev-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 168

    # Server
    PORT: int = 8080

    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = True
        extra = "ignore"

settings = Settings()
