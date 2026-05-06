import psutil
import logging
import requests
from typing import Dict, Any
from pydantic import BaseModel
from config import get_settings

# Hardware boundaries for local execution vs swarm delegation
VRAM_SAFE_LIMIT_GB = 4.0
CPU_SAFE_LIMIT_PERCENT = 85.0

logger = logging.getLogger("projecty.predictor")

class PredictionRequest(BaseModel):
    """(Swarm v5.0) Stateless payload for decoupled offloading."""
    task_id: str
    compiled_context: str  # Code context assembled by the origin node
    prompt: str           # User instruction
    model_tier: str = "high"

def get_system_load() -> str:
    """Evaluates current system load to decide on local vs remote execution."""
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        ram_free = psutil.virtual_memory().available / (1024**3)
        
        if cpu > CPU_SAFE_LIMIT_PERCENT or ram_free < 2.0:
            return "critical"
        elif cpu > 60.0 or ram_free < 4.0:
            return "low"
        return "high"
    except Exception:
        return "low"

async def generate_prediction(req: PredictionRequest) -> Dict[str, Any]:
    """(Swarm v6.0) Generates prediction by calling the LOCAL Ollama instance.

    This runs on the Cortex node that received the delegated task.
    It uses whatever model is installed on this machine.
    """
    settings = get_settings()
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
    model = settings.local_model

    # Build the messages for Ollama /api/chat
    system_prompt = (
        "You are a senior software engineer. You receive code context and a prompt. "
        "Respond with clean, correct code or analysis. Be concise."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"CONTEXT:\n{req.compiled_context}\n\nTASK: {req.prompt}"},
    ]

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
    }

    logger.info(f"🧠 Cortex Processing: task={req.task_id}, model={model}, context={len(req.compiled_context)} chars")

    # Try /api/chat first, fallback to /api/generate
    endpoints = [
        (f"{base_url}/api/chat", payload, "chat"),
        (f"{base_url}/api/generate", {
            "model": model,
            "prompt": f"CONTEXT:\n{req.compiled_context}\n\nTASK: {req.prompt}",
            "system": system_prompt,
            "stream": False,
        }, "generate"),
    ]

    last_error = None
    for url, body, mode in endpoints:
        try:
            resp = requests.post(url, json=body, timeout=(30, 300))
            if resp.status_code == 404:
                continue  # try next endpoint
            resp.raise_for_status()
            data = resp.json()

            if mode == "chat":
                text = data.get("message", {}).get("content", "")
            else:
                text = data.get("response", "")

            prompt_tokens = data.get("prompt_eval_count", 0)
            completion_tokens = data.get("eval_count", 0)

            logger.info(f"✅ Cortex Done: task={req.task_id}, tokens={prompt_tokens}+{completion_tokens}")

            return {
                "task_id": req.task_id,
                "status": "success",
                "tier": req.model_tier,
                "response": text,
                "ghost_block": text,  # backward compat
                "metrics": {
                    "context_length": len(req.compiled_context),
                    "prompt_length": len(req.prompt),
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "model": model,
                }
            }
        except requests.ConnectionError:
            last_error = f"Cannot connect to Ollama at {base_url}"
        except requests.Timeout:
            last_error = "Ollama timeout — model may be loading"
        except requests.RequestException as exc:
            last_error = f"Ollama error: {exc}"

    logger.error(f"❌ Cortex Failed: task={req.task_id}, error={last_error}")
    return {
        "task_id": req.task_id,
        "status": "error",
        "tier": req.model_tier,
        "response": "",
        "ghost_block": None,
        "metrics": {"context_length": len(req.compiled_context), "prompt_length": len(req.prompt)},
        "error": last_error or "Unknown Ollama error",
    }
