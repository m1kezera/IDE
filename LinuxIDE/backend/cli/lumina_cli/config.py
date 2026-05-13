import os
import json
from pathlib import Path

CONFIG_DIR = Path.home() / ".lumina"
CONFIG_FILE = CONFIG_DIR / "config.json"

def load_config():
    if not CONFIG_FILE.exists():
        return {}
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def save_config(config):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

def get_api_key():
    env_key = os.getenv("ANTHROPIC_API_KEY")
    if env_key:
        return env_key
    return load_config().get("anthropic_api_key")

def set_api_key(key):
    config = load_config()
    config["anthropic_api_key"] = key
    save_config(config)
