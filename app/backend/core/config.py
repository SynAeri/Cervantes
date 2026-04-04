# Configuration settings for La Mancha backend
# Loads environment variables and provides settings object

from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 168

    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = True

settings = Settings()
