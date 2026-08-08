"""
Core configuration for Our World backend.
Loads sensitive credentials from environment variables only.
Never hardcode or log these values.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Supabase — service role key stays on backend only
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # JWT — used to verify tokens issued by Supabase
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    # Groq LLM — backend ONLY
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:5174"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # App metadata
    app_name: str = "Our World API"
    app_version: str = "0.4.0"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — reads .env once at startup."""
    return Settings()
