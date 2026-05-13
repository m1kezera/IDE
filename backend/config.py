"""Project Y — Application Configuration (loaded from .env)."""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os
import sys

# ─── Path resolution for both dev and PyInstaller bundled builds ─────
def _get_base_dir():
    """Return the directory where the backend files live.
    
    In dev: the backend/ source directory (where __file__ is).
    In PyInstaller: the directory where the .exe is located.
    """
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle — use exe's directory
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def _get_data_dir():
    """Return writable data directory for DB and user data.
    
    Uses %APPDATA%/projecty-ide/ on Windows so data persists across updates.
    """
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
        data_dir = os.path.join(appdata, "projecty-ide")
    else:
        data_dir = os.path.join(os.path.expanduser("~"), ".projecty-ide")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

_BASE_DIR = _get_base_dir()
_DATA_DIR = _get_data_dir()

_ENV_PATH = os.path.join(_BASE_DIR, ".env")
_DB_PATH = os.path.join(_DATA_DIR, "pulsyce.db")


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


# ─── Cloud Config Persistence ───────────────────────────────────────
_CLOUD_CONFIG_PATH = os.path.join(_DATA_DIR, "cloud_config.json")


def load_cloud_config() -> dict:
    """Load persisted cloud config from disk (API keys, model, provider)."""
    import json
    try:
        if os.path.exists(_CLOUD_CONFIG_PATH):
            with open(_CLOUD_CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def save_cloud_config(data: dict) -> None:
    """Persist cloud config to disk so it survives restarts."""
    import json
    try:
        # Merge with existing
        existing = load_cloud_config()
        existing.update(data)
        with open(_CLOUD_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
    except Exception as e:
        import logging
        logging.getLogger("projecty.config").warning(f"Failed to save cloud config: {e}")


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton. Auto-loads persisted cloud config."""
    s = Settings()
    # Hydrate cloud fields from persisted config if not set via .env
    cloud = load_cloud_config()
    if not s.cloud_api_key and cloud.get("cloud_api_key"):
        s.cloud_api_key = cloud["cloud_api_key"]
    if not s.cloud_provider and cloud.get("cloud_provider"):
        s.cloud_provider = cloud["cloud_provider"]
    if cloud.get("cloud_model"):
        s.cloud_model = cloud["cloud_model"]
    return s
