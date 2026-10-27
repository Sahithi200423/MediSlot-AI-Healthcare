import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    AI_SERVICE_NAME: str = "MediSlot Clinical AI Copilot"
    AI_SERVICE_VERSION: str = "1.0.0"
    HOST: str = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8000"))
    
    # Provider: "gemini", "openai", or "deterministic_local"
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "deterministic_local")
    
    # API Keys (optional if running in deterministic_local mode)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Internal service-to-service secret
    AI_SERVICE_SECRET: str = os.getenv("AI_SERVICE_SECRET", "medislot-internal-ai-secret-2026")
    
    # Max file upload size (15MB)
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024

settings = Settings()
if settings.GEMINI_API_KEY and settings.AI_PROVIDER == "deterministic_local":
    settings.AI_PROVIDER = "gemini"
elif settings.OPENAI_API_KEY and settings.AI_PROVIDER == "deterministic_local":
    settings.AI_PROVIDER = "openai"
