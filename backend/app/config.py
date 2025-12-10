from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/leaveflow"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Clean up DATABASE_URL if it has the variable name prefix
        if self.database_url.startswith("DATABASE_URL="):
            self.database_url = self.database_url.replace("DATABASE_URL=", "", 1)
        # Convert postgres:// to postgresql+asyncpg://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # JWT Auth
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days
    
    # WhatsApp
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = "leaveflow-verify"
    
    # Storage (optional)
    supabase_url: str = ""
    supabase_service_key: str = ""
    
    # App Config
    cors_origins: str = "http://localhost:3000"
    escalation_hours: int = 24
    
    # AI Service (OpenRouter - Free models available)
    openrouter_api_key: str = ""
    
    class Config:
        env_file = ".env"  # still works in local
        env_file_encoding = 'utf-8'
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
