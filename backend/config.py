"""Lumina IDE — Application Configuration (loaded from .env)."""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os

# Ensure .env is resolved relative to this file
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pulsyce.db")


class Settings(BaseSettings):
    """Centralized settings read from environment / .env file."""

    # Ollama (local AI)
    ollama_host: str = "127.0.0.1"
    ollama_port: int = 11434

    # Database
    database_url: str = f"sqlite:///{_DB_PATH}"

    # Cloud API — generic (any provider)
    cloud_api_key: str = ""
    cloud_provider: str = ""      # auto-detected or manual: openai, anthropic, groq, etc.

    # Default model names
    local_model: str = "mistral"
    cloud_model: str = "gpt-4o"

    # Token pricing (USD per 1K tokens) for ROI calculation
    cloud_input_price: float = 0.005   # $5 / 1M input tokens
    cloud_output_price: float = 0.015  # $15 / 1M output tokens

    class Config:
        env_file = _ENV_PATH
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()
