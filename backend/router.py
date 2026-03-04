"""Lumina IDE — Module A: Hybrid Provider Router.

Routes generation requests to either the local Ollama instance or
a cloud API based on the active mode.
Supports SSE streaming for real-time output.
"""

from __future__ import annotations

import json
import logging
import requests
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from config import get_settings, Settings
from database import get_session, get_session_direct
from chunker import count_tokens, chunk_code, merge_results
from telemetry import log_usage, get_dashboard_data
from models import ChatSession, ChatMessage

log = logging.getLogger("lumina.router")

router = APIRouter(prefix="/api", tags=["core"])


# ─── Request / Response schemas ────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str
    mode: str = "local"           # "local" | "cloud"
    model: Optional[str] = None      # override default model
    format: Optional[str] = None     # "json" for structured output
    stream: bool = True


class ConfigPayload(BaseModel):
    ollama_host: Optional[str] = None
    ollama_port: Optional[int] = None
    local_model: Optional[str] = None
    cloud_model: Optional[str] = None
    cloud_api_key: Optional[str] = None      # generic — any provider
    cloud_provider: Optional[str] = None     # auto-detected or manual


class ChatCreate(BaseModel):
    uid: str
    title: str = "Novo Chat"


class ChatUpdate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    role: str = "user"
    content: str = ""
    tokens: int = 0


class AutocompleteRequest(BaseModel):
    code: str               # The full file content (or partial context)
    cursor_line: int = 0    # 0-indexed line where cursor is
    cursor_col: int = 0     # 0-indexed column
    filename: str = ""      # e.g. "app.py"
    mode: str = "local"     # "local" | "cloud"


# ─── Helpers ────────────────────────────────────────────────────────
def _ollama_url(settings: Settings, path: str = "/api/generate") -> str:
    return f"http://{settings.ollama_host}:{settings.ollama_port}{path}"


def _detect_provider(api_key: str) -> str:
    """Guess the cloud provider from the API key prefix."""
    if not api_key:
        return ""
    k = api_key.strip()
    if k.startswith("sk-ant-"):
        return "anthropic"
    if k.startswith("sk-"):
        return "openai"
    if k.startswith("gsk_"):
        return "groq"
    if k.startswith("AIza"):
        return "google"
    if k.startswith("r8_") or k.startswith("p_"):
        return "replicate"
    if k.startswith("hf_"):
        return "huggingface"
    if k.startswith("xai-"):
        return "xai"
    if k.startswith("nvapi-"):
        return "nvidia"
    # Fallback — could be deepseek, mistral, together, etc.
    return "custom"


def _mask_key(key: str) -> str:
    """Show only last 4 chars of an API key."""
    if not key or len(key) < 8:
        return ""
    return "•" * min(len(key) - 4, 20) + key[-4:]  # type: ignore


def _stream_ollama(prompt: str, model: str, settings: Settings, fmt: Optional[str]):
    """Generator that yields SSE events from the Ollama stream.

    Tries /api/chat first (messages format), falls back to /api/generate.
    Includes 3-attempt retry with exponential backoff and model fallback.
    """
    import time
    from agent import SYSTEM_PROMPT

    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"

    # Build payloads for both endpoints
    chat_payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
    }
    generate_payload: dict = {
        "model": model,
        "system": SYSTEM_PROMPT,
        "prompt": prompt,
        "stream": True,
    }
    if fmt:
        chat_payload["format"] = fmt
        generate_payload["format"] = fmt

    total_prompt = 0
    total_completion = 0

    # Detect available models for fallback
    fallback_models = [model]
    try:
        resp = requests.get(f"{base_url}/api/tags", timeout=5)
        if resp.ok:
            available = [m["name"] for m in resp.json().get("models", [])]
            for fb in ["llama3", "llama3:latest", "mistral", "mistral:latest"]:
                if fb in available and fb != model:
                    fallback_models.append(fb)
                    break
    except Exception:
        pass

    # Try endpoints in order: /api/chat, /api/generate
    endpoints = [
        (f"{base_url}/api/chat",     chat_payload,     "message"),
        (f"{base_url}/api/generate", generate_payload,  "generate"),
    ]

    last_error = None

    for attempt_model in fallback_models:
        chat_payload["model"] = attempt_model
        generate_payload["model"] = attempt_model
        chat_payload["messages"][0]["content"] = SYSTEM_PROMPT

        for url, payload, mode in endpoints:
            for attempt in range(3):
                try:
                    with requests.post(
                        url,
                        json=payload,
                        stream=True,
                        timeout=(30, 600),
                    ) as resp:
                        if resp.status_code == 404:
                            # This endpoint doesn't exist, try next
                            break

                        resp.raise_for_status()

                        if attempt > 0 or attempt_model != model:
                            yield f"data: {json.dumps({'token': f'[Usando {attempt_model}] ', 'done': False})}\n\n"

                        for line in resp.iter_lines(decode_unicode=True):
                            if not line:
                                continue
                            try:
                                data = json.loads(line)
                            except json.JSONDecodeError:
                                continue

                            # Extract token depending on endpoint format
                            if mode == "message":
                                msg = data.get("message", {})
                                token = msg.get("content", "")
                            else:
                                token = data.get("response", "")

                            if data.get("done"):
                                total_prompt = data.get("prompt_eval_count", 0)
                                total_completion = data.get("eval_count", 0)

                            yield f"data: {json.dumps({'token': token, 'done': data.get('done', False)})}\n\n"

                        # Success — emit metrics and return
                        yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"
                        return

                except requests.ConnectionError:
                    last_error = f"Não foi possível conectar ao Ollama em {base_url}. Verifique se o ollama serve está rodando."
                except requests.Timeout:
                    last_error = "Timeout na conexão com o Ollama. O modelo pode estar carregando na GPU."
                except requests.RequestException as exc:
                    last_error = f"Erro do Ollama: {exc}"
                except Exception as exc:
                    last_error = f"Erro inesperado: {exc}"

                # Wait before retry (exponential backoff)
                if attempt < 2:
                    time.sleep(2 ** attempt)

    # All retries and fallbacks exhausted
    yield f"data: {json.dumps({'error': last_error or 'Erro desconhecido', 'done': True})}\n\n"
    yield f"data: {json.dumps({'metrics': {'prompt_tokens': 0, 'completion_tokens': 0}})}\n\n"


def _stream_with_logging_and_files(prompt: str, model: str, settings: Settings, fmt: Optional[str]):
    """Wraps _stream_ollama — logs usage AND writes file blocks after stream."""
    from agent import parse_file_blocks, write_file_blocks
    import workspace as ws

    total_prompt = 0
    total_completion = 0
    full_response = []   # accumulate tokens for file parsing

    for event in _stream_ollama(prompt, model, settings, fmt):
        # Extract metrics
        if '"metrics"' in event:
            try:
                data_str = event.split("data: ", 1)[1].strip()
                metrics = json.loads(data_str).get("metrics", {})
                total_prompt = metrics.get("prompt_tokens", 0)
                total_completion = metrics.get("completion_tokens", 0)
            except (IndexError, json.JSONDecodeError):
                pass
        # Accumulate tokens for file parsing
        elif '"token"' in event:
            try:
                data_str = event.split("data: ", 1)[1].strip()
                token = json.loads(data_str).get("token", "")
                full_response.append(token)
            except (IndexError, json.JSONDecodeError):
                pass

        yield event

    # ── Post-stream: parse and write file blocks
    response_text = "".join(full_response)
    file_blocks = parse_file_blocks(response_text)

    if file_blocks and ws._workspace_path:
        results = write_file_blocks(ws._workspace_path, file_blocks)
        # Send file operation results as a special SSE event
        yield f"data: {json.dumps({'files': results})}\n\n"

    # ── Log telemetry
    if total_prompt > 0 or total_completion > 0:
        try:
            with get_session_direct() as session:
                log_usage(
                    session,
                    provider="local",
                    model=model,
                    prompt_tokens=total_prompt,
                    completion_tokens=total_completion,
                )
        except Exception:
            pass


def _generate_ollama_sync(prompt: str, model: str, settings: Settings, fmt: Optional[str]) -> dict:
    """Non-streaming Ollama call — used for chunked processing.
    Tries /api/chat first, falls back to /api/generate. 3x retry.
    """
    import time
    from agent import SYSTEM_PROMPT

    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"

    endpoints = [
        (f"{base_url}/api/chat", {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            **({"format": fmt} if fmt else {}),
        }, "chat"),
        (f"{base_url}/api/generate", {
            "model": model, "prompt": prompt, "stream": False,
            "system": SYSTEM_PROMPT,
            **({"format": fmt} if fmt else {}),
        }, "generate"),
    ]

    last_error = None
    for url, payload, mode in endpoints:
        for attempt in range(3):
            try:
                resp = requests.post(url, json=payload, timeout=(30, 600))
                if resp.status_code == 404:
                    break  # try next endpoint
                resp.raise_for_status()
                data = resp.json()

                if mode == "chat":
                    text = data.get("message", {}).get("content", "")
                else:
                    text = data.get("response", "")

                return {
                    "response": text,
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                }
            except requests.ConnectionError:
                last_error = f"Não foi possível conectar ao Ollama em {base_url}"
            except requests.Timeout:
                last_error = "Timeout na conexão com o Ollama"
            except requests.RequestException as exc:
                last_error = f"Erro do Ollama: {exc}"

            if attempt < 2:
                time.sleep(2 ** attempt)

    raise HTTPException(status_code=502, detail=last_error or "Erro desconhecido do Ollama")


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

# ─── Generate ───────────────────────────────────────────────────────
@router.post("/generate")
async def generate(
    body: GenerateRequest,
    session: Session = Depends(get_session),
):
    """Main generation endpoint with optional SSE streaming."""
    settings = get_settings()
    model = body.model or (
        settings.local_model if body.mode == "local" else settings.cloud_model
    )
    log.info(f"📨 /generate — mode={body.mode}, model={model}, stream={body.stream}, prompt_len={len(body.prompt)}")

    # ── Chunking logic
    token_count = count_tokens(body.prompt)

    if token_count > 1200 and body.mode == "local":
        chunks = chunk_code(body.prompt)
        chunk_results = []
        for chunk in chunks:
            result = _generate_ollama_sync(chunk["content"], model, settings, body.format)
            chunk_results.append(result)

        merged = merge_results(chunk_results)
        log_usage(
            session,
            provider="local",
            model=model,
            prompt_tokens=merged["prompt_tokens"],
            completion_tokens=merged["completion_tokens"],
        )
        return merged

    # ── Streaming (default) — uses logging wrapper
    if body.stream and body.mode == "local":
        return StreamingResponse(
            _stream_with_logging_and_files(body.prompt, model, settings, body.format),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Non-streaming fallback
    if body.mode == "local":
        result = _generate_ollama_sync(body.prompt, model, settings, body.format)
        log_usage(
            session,
            provider="local",
            model=model,
            prompt_tokens=result["prompt_tokens"],
            completion_tokens=result["completion_tokens"],
        )
        return result

    # ── Cloud mode placeholder
    return {
        "response": "Cloud mode is not yet configured. Please add your API key in Settings.",
        "provider": "cloud",
        "model": model,
    }


# ─── Autocomplete ──────────────────────────────────────────────────
AUTOCOMPLETE_SYSTEM = """You are a code autocomplete engine. Given the code context up to the cursor position, predict the NEXT code that should be written. Rules:
- Output ONLY the completion code, nothing else
- No markdown, no explanations, no backticks
- Complete the current line and optionally the next 1-2 lines
- Match the existing code style and indentation
- If unsure, output an empty string"""


@router.post("/autocomplete")
async def autocomplete(body: AutocompleteRequest):
    """Return a short code completion suggestion."""
    settings = get_settings()
    model = body.mode == "local" and (settings.local_model or "llama3") or settings.cloud_model

    # Build context: lines before cursor + current partial line
    lines = body.code.split("\n")
    cursor_line = min(body.cursor_line, len(lines) - 1)

    # Take up to 30 lines of context before cursor
    start = max(0, cursor_line - 30)
    context_lines = lines[start:cursor_line + 1]  # type: ignore

    # The partial current line up to cursor column
    if context_lines:
        last = context_lines[-1]
        context_lines[-1] = last[:body.cursor_col]

    context = "\n".join(context_lines)
    prompt = f"File: {body.filename}\n\n```\n{context}"

    try:
        base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
        resp = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "system": AUTOCOMPLETE_SYSTEM,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 80,
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "stop": ["\n\n", "```"],
                },
            },
            timeout=(10, 30),
        )
        if resp.ok:
            data = resp.json()
            suggestion = data.get("response", "").rstrip()
            # Clean any markdown artifacts
            suggestion = suggestion.replace("```", "").strip()
            return {"suggestion": suggestion}
        return {"suggestion": ""}
    except Exception:
        return {"suggestion": ""}


# ─── Config ─────────────────────────────────────────────────────────
@router.get("/config")
async def get_config():
    """Return current runtime configuration (API key is masked)."""
    settings = get_settings()
    provider = _detect_provider(settings.cloud_api_key) if hasattr(settings, 'cloud_api_key') else ""
    return {
        "ollama_host": settings.ollama_host,
        "ollama_port": settings.ollama_port,
        "local_model": settings.local_model,
        "cloud_model": settings.cloud_model,
        "cloud_api_key": _mask_key(getattr(settings, 'cloud_api_key', '')),
        "cloud_provider": provider,
        "has_cloud_key": bool(getattr(settings, 'cloud_api_key', '')),
    }


@router.put("/config")
async def update_config(payload: ConfigPayload):
    """Update runtime configuration (in-memory)."""
    settings = get_settings()
    if payload.ollama_host is not None:
        settings.ollama_host = payload.ollama_host
    if payload.ollama_port is not None:
        settings.ollama_port = payload.ollama_port
    if payload.local_model is not None:
        settings.local_model = payload.local_model
    if payload.cloud_model is not None:
        settings.cloud_model = payload.cloud_model
    if payload.cloud_api_key is not None:
        settings.cloud_api_key = payload.cloud_api_key
    if payload.cloud_provider is not None:
        settings.cloud_provider = payload.cloud_provider

    # Auto-detect provider from key prefix
    detected = _detect_provider(getattr(settings, 'cloud_api_key', ''))

    return {"status": "updated", "config": {
        "ollama_host": settings.ollama_host,
        "ollama_port": settings.ollama_port,
        "local_model": settings.local_model,
        "cloud_model": settings.cloud_model,
        "has_cloud_key": bool(getattr(settings, 'cloud_api_key', '')),
        "cloud_provider": detected,
    }}


# ─── Dashboard ──────────────────────────────────────────────────────
@router.get("/dashboard")
async def dashboard(session: Session = Depends(get_session)):
    """Return aggregated telemetry data for the frontend dashboard."""
    return get_dashboard_data(session)


# ─── Models (Ollama detection) ──────────────────────────────────────
@router.get("/models")
async def list_models():
    """Query the Ollama instance for all locally downloaded models."""
    settings = get_settings()
    try:
        resp = requests.get(
            _ollama_url(settings, "/api/tags"),
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        models = []
        for m in data.get("models", []):
            size_gb = round(m.get("size", 0) / (1024 ** 3), 2)
            models.append({
                "name": m.get("name", ""),
                "model": m.get("model", m.get("name", "")),
                "size_gb": size_gb,
                "modified_at": m.get("modified_at", ""),
                "family": m.get("details", {}).get("family", ""),
                "parameter_size": m.get("details", {}).get("parameter_size", ""),
                "quantization": m.get("details", {}).get("quantization_level", ""),
            })
        return {"models": models, "count": len(models), "status": "connected"}
    except requests.ConnectionError:
        return {"models": [], "count": 0, "status": "offline", "error": "Cannot connect to Ollama"}
    except requests.RequestException as exc:
        return {"models": [], "count": 0, "status": "error", "error": str(exc)}


# ─── Chat CRUD ──────────────────────────────────────────────────────
@router.get("/chats")
async def list_chats(session: Session = Depends(get_session)):
    """Return all chat sessions ordered by most recent."""
    chats = session.exec(
        select(ChatSession).order_by(ChatSession.updated_at.desc())  # type: ignore
    ).all()
    return {"chats": [{"uid": c.uid, "title": c.title, "updated_at": str(c.updated_at)} for c in chats]}


@router.post("/chats")
async def create_chat(body: ChatCreate, session: Session = Depends(get_session)):
    """Create a new chat session."""
    chat = ChatSession(uid=body.uid, title=body.title)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return {"uid": chat.uid, "title": chat.title}


@router.put("/chats/{uid}")
async def update_chat(uid: str, body: ChatUpdate, session: Session = Depends(get_session)):
    """Update chat title."""
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if body.title is not None:
        chat.title = body.title
    chat.updated_at = datetime.utcnow()
    session.add(chat)
    session.commit()
    return {"uid": chat.uid, "title": chat.title}


@router.delete("/chats/{uid}")
async def delete_chat(uid: str, session: Session = Depends(get_session)):
    """Delete a chat and all its messages."""
    # Delete messages first
    messages = session.exec(select(ChatMessage).where(ChatMessage.chat_uid == uid)).all()
    for msg in messages:
        session.delete(msg)
    # Delete the chat
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if chat:
        session.delete(chat)
    session.commit()
    return {"status": "deleted", "uid": uid}


@router.get("/chats/{uid}/messages")
async def get_messages(uid: str, limit: int = 100, session: Session = Depends(get_session)):
    """Return messages for a chat, limited for performance."""
    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.chat_uid == uid)
        .order_by(ChatMessage.created_at.asc())  # type: ignore
        .limit(limit)
    ).all()
    return {"messages": [
        {"role": m.role, "content": m.content, "tokens": m.tokens, "created_at": str(m.created_at)}
        for m in messages
    ]}


@router.post("/chats/{uid}/messages")
async def add_message(uid: str, body: MessageCreate, session: Session = Depends(get_session)):
    """Add a message to a chat."""
    msg = ChatMessage(
        chat_uid=uid,
        role=body.role,
        content=body.content,
        tokens=body.tokens,
    )
    session.add(msg)

    # Touch the chat's updated_at
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if chat:
        chat.updated_at = datetime.utcnow()
        session.add(chat)

    session.commit()
    session.refresh(msg)
    return {"id": msg.id, "role": msg.role, "content": msg.content}


# ─── Health ─────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    """Simple health check."""
    log.info("💓 /health — OK")
    return {"status": "ok", "service": "lumina-backend"}
