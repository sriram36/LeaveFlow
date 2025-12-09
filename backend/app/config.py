from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/leaveflow"
    
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
    
    class Config:
        env_file = ".env.local"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
