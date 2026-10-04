import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RELIEFGRID - Emergency Resource Matching Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Default to SQLite file for easy local development, overridable by PostgreSQL env var
    DATABASE_URL: str = "sqlite:///./reliefgrid.db"
    
    # Optional Redis connection
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
