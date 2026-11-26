"""
Application configuration using Pydantic Settings.
Reads from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from pydantic import AnyUrl, validator
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart City Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    ASYNC_DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Admin bootstrap
    ADMIN_EMAIL: str = "admin@smartcity.com"
    ADMIN_PASSWORD: str = "Admin@123!"
    ADMIN_USERNAME: str = "admin"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # External APIs
    OPENAQ_API_URL: str = "https://api.openaq.org/v2"
    WAQI_API_TOKEN: str = "demo"
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1"
    OPENWEATHER_API_KEY: str = ""
    OPENWEATHER_API_URL: str = "https://api.openweathermap.org/data/2.5"
    WORLD_BANK_API_URL: str = "https://api.worldbank.org/v2"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Scheduler
    DATA_COLLECT_INTERVAL_HOURS: int = 6

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
