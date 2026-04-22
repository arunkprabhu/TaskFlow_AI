"""
Configuration management for the meetingtotask backend
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Ollama Configuration
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:1b"
    ollama_timeout: int = 180  # Increased timeout for first-time model loading
    
    # Monday.com Configuration
    monday_api_token: str = ""
    monday_board_id: str = ""
    monday_api_url: str = "https://api.monday.com/v2"
    
    # Application Settings
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    log_level: str = "INFO"
    environment: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
