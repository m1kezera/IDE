"""Project Y — Module A: Hybrid Provider Router.

Routes generation requests to either the local Ollama instance or
a cloud API based on the active mode.
Supports SSE streaming for real-time output.
"""

from __future__ import annotations

import json
import logging
import os
import requests
import uuid
import torch
import subprocess
from datetime import datetime
from typing import Optional, List, Set, Dict, Any
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, UploadFile, File
import shutil
from fastapi.responses import StreamingResponse
from logger_utils import LOG_SUBSCRIBERS
from pydantic import BaseModel
from sqlmodel import Session, select

# Store pending file changes for Manual validation
PENDING_CHANGES_STORE = {}

from config import get_settings, Settings
from database import get_session, get_session_direct
from watcher import get_watcher
from chunker import count_tokens, chunk_code, merge_results
from telemetry import log_usage, get_dashboard_data
from models import ChatSession, ChatMessage, ProjectYIdentity
from identity import get_hwid, generate_master_key
from brain import brain
import sentinel
from security_vault import protect_project_secrets
import predictor

log = logging.getLogger("projecty.router")

router = APIRouter(prefix="/api", tags=["core"])


# ─── Request / Response schemas ────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str
    mode: str = "local"           # "local" | "cloud"
    model: Optional[str] = None      # override default model
    format: Optional[str] = None     # "json" for structured output
    stream: bool = True
    history: Optional[List[dict]] = []
    strict_library_mode: bool = False
    thinking_mode: bool = False      # Chain-of-thought reasoning (recommended for local models)


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
    model: str = ""


class ChatUpdate(BaseModel):
    title: Optional[str] = None
    model: Optional[str] = None


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


class MeshConfigToggle(BaseModel):
    enabled: bool
    port: int = 8000


# ─── Identity Schemas ───────────────────────────────────────────
class IdentityRegister(BaseModel):
    user_name: str

class IdentityStatus(BaseModel):
    is_registered: bool
    user_name: Optional[str] = None
    hwid: str
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


# ═══════════════════════════════════════════════════════════════════════
# LEGACY FUNCTIONS REMOVED (v8.1)
# The following functions have been moved to dedicated handler files:
#   - _model_supports_tools()  → model_tiers.py::detect_tier()
#   - _stream_ollama()         → handler_small/medium/large.py::stream()
#   - _stream_cloud()          → handler_cloud.py::stream()
#   - CLOUD_BASE_URLS          → handler_cloud.py::CLOUD_BASE_URLS
# ═══════════════════════════════════════════════════════════════════════


def _compact_history(history: List[dict], model: str, settings: Settings, keep_recent: int = 10) -> List[dict]:
    """Compact old messages into a summary to prevent token overflow.
    
    Inspired by Claude Code's context compaction system.
    Keeps the most recent `keep_recent` messages intact, and summarizes the rest
    into a single system message.
    """
    if len(history) <= keep_recent:
        return history

    to_compact = history[:-keep_recent]
    to_keep = history[-keep_recent:]

    # Build a compact summary request
    compact_text = "Resuma esta conversa anterior em 3-5 bullet points. Mantenha decisões técnicas, nomes de arquivos, e contexto importante:\n\n"
    for msg in to_compact:
        role = msg.get("role", "user").upper()
        content = msg.get("content", "")[:300]
        compact_text += f"{role}: {content}\n"

    # Quick non-streaming call to summarize
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
    try:
        resp = requests.post(
            f"{base_url}/api/generate",
            json={"model": model, "prompt": compact_text, "stream": False, "options": {"num_predict": 200}},
            timeout=(10, 30),
        )
        if resp.ok:
            summary = resp.json().get("response", "").strip()
            if summary:
                log.info(f"[Compaction] Compacted {len(to_compact)} messages into {len(summary)} char summary")
                return [
                    {"role": "system", "content": f"[Resumo da conversa anterior]\n{summary}"}
                ] + to_keep
    except Exception as e:
        log.warning(f"[Compaction] Summarization failed: {e}")

    # Fallback: just keep recent messages
    return to_keep


def _library_map_reduce(user_prompt: str, model: str, settings: Settings, mode: str = "local") -> str:
    """Multi-pass chunked processing for large library documents.
    
    When library content exceeds the model's context window, this function:
    1. MAP: Splits all docs into equal token chunks (sliding window + overlap)
    2. MAP: Sends each chunk + user question to the model for extraction
    3. REDUCE: Aggregates all chunk responses into a unified context string
    
    This allows even 4k-context models to consume entire PDFs/DOCXs.
    
    Returns:
        Aggregated library context string ready for final prompt injection.
    """
    from library import library as lib_instance
    from chunker import count_tokens
    
    # Determine chunk size based on model context (conservative: 60% of estimated ctx)
    # Small local models ≈ 4k, medium ≈ 8k, large ≈ 32k
    if mode == "cloud":
        chunk_size = 4000  # cloud models handle large chunks
    else:
        try:
            from model_tiers import detect_tier, ModelTier
            tier = detect_tier(model)
            chunk_sizes = {
                ModelTier.SMALL: 1200,
                ModelTier.MEDIUM: 2500,
                ModelTier.LARGE: 4000,
            }
            chunk_size = chunk_sizes.get(tier, 1200)
        except Exception:
            chunk_size = 1200  # safe default for 4k models
    
    chunks = lib_instance.get_chunked_content(chunk_size_tokens=chunk_size, overlap=150)
    if not chunks:
        return ""
    
    # If only 1 chunk, no need for map-reduce — return directly
    if len(chunks) == 1:
        return chunks[0]["content"]
    
    log.info(
        f"📚 [MapReduce] Processing {len(chunks)} chunks ({chunk_size} tokens/chunk) "
        f"for query: {user_prompt[:60]}..."
    )
    
    MAP_PROMPT = (
        "Você é um extrator de informações. Dado o trecho de documento abaixo, "
        "extraia APENAS as informações relevantes para a pergunta do usuário. "
        "Se o trecho não contém informação relevante, responda exatamente: [SEM_INFO]. "
        "Preserve citações, números, nomes e dados factuais. Seja conciso.\n\n"
        f"PERGUNTA DO USUÁRIO: {user_prompt}\n\n"
    )
    
    extracts = []
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
    
    for i, chunk in enumerate(chunks):
        chunk_prompt = MAP_PROMPT + f"TRECHO {i+1}/{len(chunks)}:\n{chunk['content']}"
        
        try:
            if mode == "cloud":
                # Cloud MAP call
                from handler_cloud import CLOUD_BASE_URLS
                api_key = getattr(settings, 'cloud_api_key', '')
                provider = _detect_provider(api_key)
                cloud_base = CLOUD_BASE_URLS.get(provider, "")
                
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                resp = requests.post(
                    f"{cloud_base}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "Extraia informações relevantes do documento. Seja conciso."},
                            {"role": "user", "content": chunk_prompt},
                        ],
                        "max_tokens": 500,
                        "stream": False,
                    },
                    timeout=(10, 60),
                )
                if resp.ok:
                    data = resp.json()
                    extract = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                else:
                    extract = "[ERRO_CLOUD]"
            else:
                # Local Ollama MAP call
                resp = requests.post(
                    f"{base_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": chunk_prompt,
                        "stream": False,
                        "options": {"num_predict": 500},
                    },
                    timeout=(10, 120),
                )
                if resp.ok:
                    extract = resp.json().get("response", "").strip()
                else:
                    extract = "[ERRO_LOCAL]"
            
            if extract and extract != "[SEM_INFO]":
                extracts.append(f"[Chunk {i+1}] {extract}")
                log.info(f"📚 [Map] Chunk {i+1}/{len(chunks)}: {len(extract)} chars extracted")
            else:
                log.info(f"📚 [Map] Chunk {i+1}/{len(chunks)}: no relevant info")
                
        except Exception as e:
            log.warning(f"📚 [Map] Chunk {i+1}/{len(chunks)} failed: {e}")
    
    if not extracts:
        log.warning("📚 [MapReduce] No relevant info found in any chunk")
        return ""
    
    # REDUCE: Aggregate all extracts into a single context block
    doc_list = lib_instance.get_document_list_summary()
    reduced = f"\n\n═══ BIBLIOTECA (processada em {len(chunks)} fatias) ═══\n"
    reduced += f"Documentos: {doc_list}\n"
    reduced += f"{'═' * 60}\n"
    reduced += "\n\n".join(extracts)
    reduced += f"\n═══ FIM DA BIBLIOTECA ═══\n"
    
    log.info(
        f"📚 [Reduce] Aggregated {len(extracts)}/{len(chunks)} chunks → "
        f"{count_tokens(reduced)} tokens"
    )
    return reduced

def _stream_with_logging_and_files(prompt: str, model: str, settings: Settings, fmt: Optional[str], enhanced_system_prompt: Optional[str] = None, history: Optional[List[dict]] = None, mode: str = "local"):
    """Dispatches to the correct tiered handler, logs usage, and writes file blocks after stream.
    
    v8.1: Routes to handler_small/medium/large/cloud based on model tier.
    Also handles memory injection, skills expansion, and context compaction.
    """
    from agent import parse_file_blocks, write_file_blocks, filter_blocks
    import workspace as ws
    ws._load_workspace_from_db()

    # ── Skills: Expand /commands ──
    try:
        from skills import is_skill_command, expand_skill, get_skills_list
        if is_skill_command(prompt):
            context = {"file_name": "", "file_content": ""}
            # Try to get active file content from workspace
            try:
                import workspace as ws2
                if ws2._workspace_path:
                    context["workspace_path"] = ws2._workspace_path
            except Exception:
                pass

            expanded = expand_skill(prompt, context)
            if expanded:
                # /ajuda is a builtin — return directly without LLM
                if prompt.strip().startswith("/ajuda"):
                    yield f"data: {json.dumps({'token': expanded, 'done': False})}\n\n"
                    yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
                    yield f"data: {json.dumps({'metrics': {'prompt_tokens': 0, 'completion_tokens': 0}})}\n\n"
                    return
                prompt = expanded
                log.info(f"[Skills] Expanded command → {len(prompt)} chars")
    except ImportError:
        pass
    except Exception as e:
        log.warning(f"[Skills] Expansion failed: {e}")

    # ── Memory: Inject relevant memories into system prompt ──
    if True:  # v10.1: enabled in all modes (was cloud-gated)
        try:
            from memory import inject_memories_to_prompt, auto_extract_and_save
            if enhanced_system_prompt:
                enhanced_system_prompt = inject_memories_to_prompt(prompt, enhanced_system_prompt)
            # Auto-save feedback from user message
            auto_extract_and_save(prompt)
        except ImportError:
            pass
        except Exception as e:
            log.warning(f"[Memory] Injection failed: {e}")

    # ── Context Compaction: Summarize old messages if history too long ──
    if mode != "cloud" and history and len(history) > 20:
        try:
            history = _compact_history(history, model, settings)
        except Exception as e:
            log.warning(f"[Compaction] Failed: {e}")

    # ── Cloud: Final safety cap — hard-truncate if system prompt still too big ──
    if mode == "cloud" and enhanced_system_prompt:
        final_tokens = count_tokens(enhanced_system_prompt)
        # Provider-specific hard limits (tiktoken tokens — some providers use different tokenizers)
        # Groq/Llama tokenizer counts ~3x more than tiktoken cl100k
        # 3000 tiktoken ≈ 9000 Groq tokens, leaves room for user prompt + response within 12k TPM
        HARD_LIMITS = {"groq": 3000, "huggingface": 2000, "replicate": 2000}
        detected = _detect_provider(getattr(settings, 'cloud_api_key', ''))
        hard_limit = HARD_LIMITS.get(detected, 25000)
        if final_tokens > hard_limit:
            # Truncate by character ratio
            ratio = hard_limit / final_tokens
            enhanced_system_prompt = enhanced_system_prompt[:int(len(enhanced_system_prompt) * ratio)]
            log.info(f"☁️ [SafetyCap] Truncated system prompt from {final_tokens}t → ~{hard_limit}t for {detected}")

    total_prompt = 0
    total_completion = 0
    full_response = []   # accumulate tokens for file parsing
    user_prompt = prompt  # Save original prompt for guardrail
    had_tool_calls = False  # Track if tool calls were executed (skip regex fallback)

    # ── v8.1: Tiered Handler Dispatch ──────────────────────────────
    # Each tier has its own handler file with optimized streaming logic
    from model_tiers import detect_tier, get_config, ModelTier
    import handler_small, handler_medium, handler_large, handler_cloud

    if mode == "cloud":
        active_tier = ModelTier.CLOUD
        stream_gen = handler_cloud.stream(prompt, model, settings, fmt, enhanced_system_prompt=enhanced_system_prompt, history=history)
    else:
        active_tier = detect_tier(model)
        handler_map = {
            ModelTier.SMALL:  handler_small,
            ModelTier.MEDIUM: handler_medium,
            ModelTier.LARGE:  handler_large,
        }
        handler = handler_map.get(active_tier, handler_medium)
        stream_gen = handler.stream(prompt, model, settings, fmt, enhanced_system_prompt=enhanced_system_prompt, history=history)
    
    tier_config = get_config(model, mode)

    # Emit tier info to frontend (useful for debugging and UI indicators)
    yield f"data: {json.dumps({'tier_info': {'tier': active_tier, 'num_ctx': tier_config.num_ctx, 'agent_max_rounds': tier_config.agent_max_rounds, 'tools_mode': tier_config.tools_mode}})}\n\n"

    for event in stream_gen:
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

        # Track tool_call events to skip regex fallback later
        if '"tool_call"' in event or '"tool_result"' in event:
            had_tool_calls = True

        yield event

    # ── Post-stream: parse and write file blocks (REGEX FALLBACK only)
    # Skip this entirely if tool calls were executed — they already handled file ops directly.
    # Running both would cause duplicate creates/overwrites.
    if had_tool_calls:
        log.info(f"[CRUD] Skipping regex fallback — {had_tool_calls} tool call(s) already executed")
    else:
        response_text = "".join(full_response)
        log.info(f"[CRUD] Post-stream (regex fallback): response_text length={len(response_text)}, workspace={ws._workspace_path}")
        file_blocks = parse_file_blocks(response_text)
        log.info(f"[CRUD] Parsed {len(file_blocks)} file blocks: {[{'op': b.get('op'), 'path': b.get('path')} for b in file_blocks]}")

        # Apply guardrails — filter hallucinated operations
        file_blocks = filter_blocks(file_blocks, user_prompt, ws._workspace_path or "")

        if file_blocks and ws._workspace_path:
            from models import AgentPermissions

            level = "Hybrid"
            override = False
            try:
                with get_session_direct() as session:
                    perm = session.query(AgentPermissions).first()
                    if perm:
                        level = perm.level
                        override = perm.override_protection
            except Exception as e:
                log.error(f"Error reading AgentPermissions: {e}")

            log.info(f"[CRUD] Permission level={level}, override={override}")

            needs_approval = False
            dangerous_blocks = []
            safe_blocks = []
            
            if level == "Manual":
                needs_approval = True
                dangerous_blocks = file_blocks
            elif level == "Hybrid":
                for b in file_blocks:
                    if b.get("op") in ("delete", "command", "template"):
                        dangerous_blocks.append(b)
                    else:
                        safe_blocks.append(b)
                needs_approval = len(dangerous_blocks) > 0
            else:
                safe_blocks = file_blocks

            log.info(f"[CRUD] safe={len(safe_blocks)}, dangerous={len(dangerous_blocks)}, needs_approval={needs_approval}")

            # Execute safe operations immediately (writes, plans, reads)
            if safe_blocks:
                results = write_file_blocks(ws._workspace_path, safe_blocks, override_protection=override)
                log.info(f"[CRUD] ✅ Safe blocks executed: {results}")
                yield f"data: {json.dumps({'files': results})}\n\n"

            # Hold dangerous operations for user approval
            if needs_approval and dangerous_blocks:
                change_id = str(uuid.uuid4())
                PENDING_CHANGES_STORE[change_id] = dangerous_blocks
                log.info(f"[CRUD] ⚠️ Dangerous blocks held for approval: change_id={change_id}")
                yield f"data: {json.dumps({'pending_confirmation': change_id, 'blocks': dangerous_blocks})}\n\n"
            elif not needs_approval and level != "Hybrid":
                # Agent Total mode — all blocks already handled above as safe_blocks
                pass

    # ── Log telemetry
    if total_prompt > 0 or total_completion > 0:
        try:
            from database import get_session_direct
            with get_session_direct() as session:
                log_usage(
                    session,
                    provider="cloud" if mode == "cloud" else "local",
                    model=model,
                    prompt_tokens=total_prompt,
                    completion_tokens=total_completion,
                )
        except Exception as e:
            log.error(f"❌ Telemetry background error: {e}")

    # ── Hive v2.0: Cache the streamed response
    if mode != "cloud" and response_text and len(response_text) >= 10:
        try:
            import swarm_mesh as mesh
            mesh.cache_put(user_prompt, model, response_text)
        except Exception:
            pass


def _generate_ollama_sync(prompt: str, model: str, settings: Settings, fmt: Optional[str], enhanced_system_prompt: Optional[str] = None, history: Optional[List[dict]] = None) -> dict:
    """Non-streaming Ollama call — used for chunked processing.
    Tries /api/chat first, falls back to /api/generate. 3x retry.
    """
    import time
    from agent import SYSTEM_PROMPT_TOOLS, SYSTEM_PROMPT_LEGACY
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"

    if history is None:
        history = []

    messages = [{"role": "system", "content": enhanced_system_prompt or SYSTEM_PROMPT_TOOLS}]
    messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    full_prompt = prompt
    if history:
        history_text = "\n".join([f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in history])
        full_prompt = f"Histórico Anterior:\n{history_text}\n\nUSER PROMPT ATUAL:\n{prompt}"

    endpoints = [
        (f"{base_url}/api/chat", {
            "model": model,
            "messages": messages,
            "stream": False,
            **({"format": fmt} if fmt else {}),
        }, "chat"),
        (f"{base_url}/api/generate", {
            "model": model, "prompt": full_prompt, "stream": False,
            "system": enhanced_system_prompt or SYSTEM_PROMPT_LEGACY,
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

# ─── Agent Permissions ──────────────────────────────────────────────
from models import AgentPermissions

class PermissionsUpdate(BaseModel):
    level: str
    override_protection: bool

@router.get("/permissions")
def get_permissions(session: Session = Depends(get_session)):
    perm = session.query(AgentPermissions).first()
    if not perm:
        perm = AgentPermissions()
        session.add(perm)
        session.commit()
        session.refresh(perm)
    return {"level": perm.level, "override_protection": perm.override_protection}

@router.put("/permissions")
def update_permissions(body: PermissionsUpdate, session: Session = Depends(get_session)):
    perm = session.query(AgentPermissions).first()
    if not perm:
        perm = AgentPermissions()
        session.add(perm)
    perm.level = body.level
    perm.override_protection = body.override_protection
    session.commit()
    return {"status": "ok"}

class ConfirmChangesRequest(BaseModel):
    change_id: str

@router.post("/confirm_changes")
def confirm_changes(body: ConfirmChangesRequest, session: Session = Depends(get_session)):
    import workspace as ws
    ws._load_workspace_from_db()
    from agent import write_file_blocks
    if body.change_id not in PENDING_CHANGES_STORE:
        raise HTTPException(status_code=404, detail="Mudanças expiradas ou não encontradas.")
    
    file_blocks = PENDING_CHANGES_STORE.pop(body.change_id)
    perm = session.query(AgentPermissions).first()
    override = perm.override_protection if perm else False
    
    results = write_file_blocks(ws._workspace_path, file_blocks, override_protection=override)
    return {"files": results}


# ─── Skills API ─────────────────────────────────────────────────────
@router.get("/skills")
def list_skills():
    """Return list of available /commands for frontend autocomplete."""
    try:
        from skills import get_skills_list
        return {"skills": get_skills_list()}
    except ImportError:
        return {"skills": []}




# ─── Generate ───────────────────────────────────────────────────────
@router.post("/generate")
async def generate(
    body: GenerateRequest,
    session: Session = Depends(get_session),
):
    """Main generation endpoint with optional SSE streaming."""
    settings = get_settings()
    model = body.model or (
        settings.cloud_model if body.mode == "cloud" else settings.local_model
    )
    log.info(f"📨 /generate — mode={body.mode}, model={model}, stream={body.stream}, prompt_len={len(body.prompt)}")

    # ─── Project Y Brain Context (v6.0)
    from brain import brain
    import workspace as ws
    
    context_str = ""
    try:
        # Busca contexto baseado no prompt do usuário
        memories = await brain.search_context(body.prompt, limit=3)
        if memories:
            context_str = "\n\n═══ PAST_CONTEXT (Memory) ═══\nAqui estão trechos de códigos que você já escreveu e que podem ajudar nesta tarefa:\n"
            for m in memories:
                context_str += f"\n--- De: {m['file']} ---\n{m['content']}\n"
    except Exception as e:
        log.error(f"Brain search failed: {e}")

    # ─── Library Content Injection (v10.1) ────────────────────────
    # When strict_library_mode is ON: inject ALL library documents content
    # If content exceeds model context → falls back to Map-Reduce chunking
    # When OFF but library has docs: inject keyword-matched passages
    library_context_str = ""
    is_strict = getattr(body, "strict_library_mode", False)
    try:
        from library import library as lib_instance
        from chunker import count_tokens
        lib_docs = lib_instance.get_documents()
        if lib_docs:
            if is_strict:
                # Try full injection first
                full_content = lib_instance.get_all_content_for_injection()
                full_tokens = count_tokens(full_content)
                
                # Estimate model context window
                if body.mode == "cloud":
                    model_ctx = 120000  # cloud models have large windows
                else:
                    try:
                        from model_tiers import detect_tier, ModelTier
                        tier = detect_tier(model)
                        ctx_sizes = {ModelTier.SMALL: 4000, ModelTier.MEDIUM: 8000, ModelTier.LARGE: 32000}
                        model_ctx = ctx_sizes.get(tier, 4000)
                    except Exception:
                        model_ctx = 4000
                
                # If content fits in ~70% of model context → inject directly
                if full_tokens <= int(model_ctx * 0.7):
                    library_context_str = full_content
                    log.info(f"📚 [StrictMode] Full injection: {full_tokens} tokens, {len(lib_docs)} docs (fits in {model_ctx} ctx)")
                else:
                    # Content too large → Map-Reduce chunking
                    log.info(
                        f"📚 [StrictMode] Content too large ({full_tokens} tokens) for model ctx ({model_ctx}). "
                        f"Falling back to Map-Reduce chunking..."
                    )
                    library_context_str = _library_map_reduce(body.prompt, model, settings, mode=body.mode)
            else:
                # In normal mode, inject relevant passages via keyword search
                passages = lib_instance.search_by_keywords(body.prompt, max_results=3)
                if passages:
                    library_context_str = "\n\n═══ REFERÊNCIAS DA BIBLIOTECA ═══\n"
                    for p in passages:
                        library_context_str += f"\n--- De: {p['doc_name']} ---\n{p['content']}\n"
                    library_context_str += "═══ FIM DAS REFERÊNCIAS ═══\n"
                    log.info(f"📚 [NormalMode] Keyword library injection: {len(passages)} passages")
    except Exception as e:
        log.warning(f"Library injection failed: {e}")

    # Inject Workspace File Tree
    ws._load_workspace_from_db()
    tree_str = "[Nenhum workspace aberto]"
    if ws._workspace_path and os.path.exists(ws._workspace_path):
        tree_lines = []
        base_depth = ws._workspace_path.rstrip(os.sep).count(os.sep)
        for root, dirs, files in os.walk(ws._workspace_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in getattr(ws, 'SKIP_DIRS', set())]
            depth = root.rstrip(os.sep).count(os.sep) - base_depth
            if depth > 3:
                del dirs[:]
                continue
            indent = "  " * depth
            folder_name = os.path.basename(root) or root
            if depth == 0:
                tree_lines.append(f"📦 ROOT/  (= {folder_name})")
                tree_lines.append(f"  ⚠️ ATENÇÃO: Use APENAS os nomes dos arquivos abaixo como path. NÃO inclua '{folder_name}/' no início!")
            else:
                tree_lines.append(f"{indent}📂 {folder_name}/")
            sub_indent = "  " * (depth + 1)
            for f in files:
                if not f.startswith('.'):
                    tree_lines.append(f"{sub_indent}📄 {f}")
        tree_str = "\n".join(tree_lines[:200])
        if len(tree_lines) > 200:
            tree_str += "\n  ... (arquivos omitidos)"

    # ── Smart File Content Injection: if user mentions filenames, inject their content
    file_content_str = ""
    if ws._workspace_path and os.path.exists(ws._workspace_path):
        # Collect all filenames in the workspace (up to depth 3)
        workspace_files = {}
        for root, dirs, files in os.walk(ws._workspace_path):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in getattr(ws, 'SKIP_DIRS', set())]
            rel_root = os.path.relpath(root, ws._workspace_path)
            depth = 0 if rel_root == '.' else rel_root.count(os.sep) + 1
            if depth > 3:
                del dirs[:]
                continue
            for fname in files:
                if not fname.startswith('.'):
                    rel_path = os.path.join(rel_root, fname).replace("\\", "/")
                    if rel_path.startswith("./"):
                        rel_path = rel_path[2:]
                    workspace_files[fname.lower()] = rel_path

        # Check if the user's prompt mentions any filenames
        prompt_lower = body.prompt.lower()
        injected_files = []
        for fname_lower, rel_path in workspace_files.items():
            # Match filename (with or without extension) in user's prompt
            fname_no_ext = os.path.splitext(fname_lower)[0]
            if fname_lower in prompt_lower or (len(fname_no_ext) > 2 and fname_no_ext in prompt_lower):
                if len(injected_files) < 3:  # Max 3 files to avoid prompt bloat
                    full_path = os.path.join(ws._workspace_path, rel_path)
                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as fh:
                            content = fh.read()
                        # Limit to 300 lines to avoid overwhelming the context
                        lines = content.split("\n")
                        if len(lines) > 300:
                            content = "\n".join(lines[:300]) + "\n... (truncado)"
                        file_content_str += f"\n\n═══ CONTEÚDO ATUAL DE: {rel_path} ═══\n```\n{content}\n```\n"
                        injected_files.append(rel_path)
                        log.info(f"[SmartInject] Injected file content: {rel_path} ({len(lines)} lines)")
                    except Exception as e:
                        log.warning(f"[SmartInject] Failed to read {rel_path}: {e}")

    from agent import SYSTEM_PROMPT_TOOLS, CHAT_ONLY_PROMPT, classify_intent
    
    # ── Pre-flight Intent Classification (Guardrail Layer 1) ──
    intent = "ACTION"
    if body.mode != "cloud":
        intent = classify_intent(body.prompt, model, settings.ollama_host, settings.ollama_port)
    
    # Choose base prompt based on intent
    base_prompt = SYSTEM_PROMPT_TOOLS if intent == "ACTION" else CHAT_ONLY_PROMPT

    # Inject Personality prompt from Library (if set)
    personality_str = ""
    try:
        from library import library as lib_instance
        personality_text = lib_instance.get_personality_chunked(max_tokens=2048)
        if personality_text:
            personality_str = f"\n\n═══ PERSONALITY / CUSTOM INSTRUCTIONS ═══\n{personality_text}\n"
    except Exception as e:
        log.warning(f"Personality injection failed: {e}")
    
    # ── Cloud-mode: Adaptive Token Budgeting ──────────────────────────
    # Measures prompt tokens and progressively trims context to fit model limits
    if body.mode == "cloud":
        # Token budgets per provider (input tokens per request, conservative)
        CLOUD_TOKEN_LIMITS = {
            # Free tiers — Groq Llama tokenizer counts ~3x more than tiktoken
            # 3500 tiktoken ≈ 10500 Groq tokens (under 12k TPM limit)
            "groq":       {"default": 3000, "llama-3.3-70b-versatile": 3500, "llama-3.1-8b-instant": 2000, "mixtral-8x7b-32768": 8000},
            # Paid tiers (generous)
            "openai":     {"default": 120000, "gpt-4o": 120000, "gpt-4o-mini": 120000, "o3-mini": 120000},
            "anthropic":  {"default": 180000, "claude-sonnet-4-20250514": 180000, "claude-3-5-haiku-20241022": 180000},
            "google":     {"default": 30000, "gemini-2.0-flash": 100000, "gemini-1.5-pro": 100000, "gemini-1.5-flash": 100000},
            "xai":        {"default": 120000},
            "deepseek":   {"default": 60000},
            "nvidia":     {"default": 30000},
            "together":   {"default": 30000},
            "mistralai":  {"default": 30000},
            "huggingface":{"default": 8000},
            "replicate":  {"default": 8000},
            "custom":     {"default": 30000},
        }

        detected_provider = _detect_provider(getattr(settings, 'cloud_api_key', ''))
        provider_limits = CLOUD_TOKEN_LIMITS.get(detected_provider, CLOUD_TOKEN_LIMITS["custom"])
        token_budget = provider_limits.get(model, provider_limits.get("default", 30000))
        # Reserve 20% for response + user prompt
        max_system_tokens = int(token_budget * 0.7)

        # Build layers from highest to lowest priority
        # Tree is HIGH priority — the AI needs to see what files exist
        # v10.1: In strict mode, library has HIGHEST priority and tree/brain are deprioritized
        if is_strict:
            layers = [
                ("base", base_prompt),
                ("library", library_context_str),
                ("personality", personality_str),
                ("files", file_content_str),
                ("tree", f"\n\n═══ WORKSPACE TREE ═══\n{tree_str}\n" if tree_str != "[Nenhum workspace aberto]" else ""),
                ("brain", context_str),
            ]
        else:
            layers = [
                ("base", base_prompt),
                ("tree", f"\n\n═══ WORKSPACE TREE ═══\n{tree_str}\n" if tree_str != "[Nenhum workspace aberto]" else ""),
                ("personality", personality_str),
                ("library", library_context_str),
                ("files", file_content_str),
                ("brain", context_str),
            ]

        # Start with all layers, progressively strip from lowest priority
        enhanced_system_prompt = ""
        total_tokens = 0
        included = []
        stripped = []

        for name, content in layers:
            if not content:
                continue
            layer_tokens = count_tokens(content)
            # v10.1: In strict mode, library content is NEVER truncated
            if is_strict and name == "library":
                enhanced_system_prompt += content
                total_tokens += layer_tokens
                included.append(f"{name}({layer_tokens}t/FULL)")
            elif total_tokens + layer_tokens <= max_system_tokens:
                enhanced_system_prompt += content
                total_tokens += layer_tokens
                included.append(f"{name}({layer_tokens}t)")
            else:
                # Try a truncated version (first 40% of content)
                truncated = content[:int(len(content) * 0.4)]
                trunc_tokens = count_tokens(truncated)
                if total_tokens + trunc_tokens <= max_system_tokens and trunc_tokens > 50:
                    enhanced_system_prompt += truncated + "\n... (truncado para caber no limite)\n"
                    total_tokens += trunc_tokens
                    included.append(f"{name}({trunc_tokens}t/trunc)")
                else:
                    stripped.append(f"{name}({layer_tokens}t)")

        user_prompt_tokens = count_tokens(body.prompt)
        history_tokens = sum(count_tokens(m.get("content", "")) for m in (body.history or []))

        log.info(
            f"☁️ [TokenBudget] provider={detected_provider}, model={model}, "
            f"budget={token_budget}, system={total_tokens}t, user={user_prompt_tokens}t, "
            f"history={history_tokens}t, included=[{', '.join(included)}], "
            f"stripped=[{', '.join(stripped) or 'none'}]"
        )
    else:
        # v10.1: In local mode, inject library content inline with other context
        if is_strict:
            enhanced_system_prompt = base_prompt + personality_str + library_context_str + f"\n\n═══ CURRENT WORKSPACE TREE ═══\n{tree_str}\n" + file_content_str + context_str
        else:
            enhanced_system_prompt = base_prompt + personality_str + f"\n\n═══ CURRENT WORKSPACE TREE ═══\n{tree_str}\n" + library_context_str + file_content_str + context_str

    if is_strict:
        # v10.1: Structured citation prompt with document list
        try:
            doc_list = lib_instance.get_document_list_summary()
        except Exception:
            doc_list = "[erro ao listar documentos]"

        STRICT_LIBRARY_PROMPT = f"""

═══ MODO BIBLIOTECA ATIVO ═══

Você é um assistente de pesquisa especializado. Responda EXCLUSIVAMENTE
com base nos documentos da biblioteca fornecidos acima.

REGRAS OBRIGATÓRIAS:
1. Cite SEMPRE a fonte usando o formato: [Fonte: nome_do_documento]
   Para PDFs, inclua a página: [Fonte: nome_do_documento, Página X]
2. Se a informação NÃO está nos documentos, diga claramente:
   "Não encontrei essa informação nos documentos da biblioteca."
3. NÃO invente, extrapole ou use conhecimento externo.
4. Ao resumir, inclua referências inline aos documentos relevantes.
5. Se múltiplos documentos cobrem o tema, cruze as informações e
   cite cada fonte separadamente.
6. Ao listar informações, agrupe por documento de origem.

DOCUMENTOS DISPONÍVEIS NA BIBLIOTECA:
{doc_list}
"""
        enhanced_system_prompt += STRICT_LIBRARY_PROMPT

    # ── Thinking Mode: Chain-of-Thought reasoning for better quality ──
    if getattr(body, "thinking_mode", False):
        THINKING_PROMPT = """

═══ THINKING MODE (Chain-of-Thought) ═══

ANTES de responder, você DEVE raciocinar passo a passo dentro de tags <thinking>.
O conteúdo dentro de <thinking> é seu rascunho mental — o usuário pode optar por ver ou ocultar.

Formato OBRIGATÓRIO:
<thinking>
1. Analisar o pedido do usuário...
2. Identificar a abordagem ideal...
3. Considerar edge cases e alternativas...
4. Planejar a implementação passo a passo...
</thinking>

[Sua resposta final aqui, clara e direta]

REGRAS:
- SEMPRE abra <thinking> ANTES da resposta final
- Pense em pelo menos 3 passos antes de responder
- Dentro de <thinking>: analise, compare opções, identifique riscos
- Fora de <thinking>: resposta final limpa, sem repetir o raciocínio
"""
        enhanced_system_prompt += THINKING_PROMPT
        log.info("🧠 [ThinkingMode] Chain-of-thought prompt injected")

    # ── Hive v2.0: LLM Cache check (before any processing)
    if body.mode != "cloud":
        try:
            import swarm_mesh as mesh
            cached = mesh.cache_get(body.prompt, model)
            if cached:
                log.info(f"⚡ Cache HIT — returning instant response")
                if body.stream:
                    def _cache_stream():
                        yield f"data: {json.dumps({'token': '[⚡ Cache] ', 'done': False})}\n\n"
                        yield f"data: {json.dumps({'token': cached, 'done': False})}\n\n"
                        yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
                    return StreamingResponse(_cache_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
                return {"response": cached, "provider": "cache", "model": model}
        except Exception:
            pass

    # ── Hive v2.0: Intelligent delegation + context split + enforcement
    if body.mode != "cloud":
        try:
            import swarm_mesh as mesh
            
            # Step 1: Check if we should delegate
            if mesh.should_delegate():
                prompt_tokens = count_tokens(body.prompt)
                
                # Step 2: Try context splitting for large contexts with 3+ machines
                splits = mesh.split_context_across_nodes(
                    prompt=body.prompt,
                    context=context_str + file_content_str,
                    system_prompt=enhanced_system_prompt
                )
                
                if splits:
                    # Parallel split execution
                    log.info(f"🕸️ Hive v2.0: Splitting context across {len(splits)} nodes")
                    result = await mesh.execute_split_and_merge(splits)
                    if result.get("status") != "error":
                        prediction = result.get("prediction", {})
                        response_text = prediction.get("response", "")
                        if response_text:
                            nodes_used = prediction.get("nodes_used", [])
                            log_usage(session, provider="swarm-split", model=model, prompt_tokens=prompt_tokens, completion_tokens=count_tokens(response_text))
                            if body.stream:
                                def _split_stream():
                                    yield f"data: {json.dumps({'token': f'[🕸️ Hive Split → {len(nodes_used)} nodes] ', 'done': False})}\n\n"
                                    yield f"data: {json.dumps({'token': response_text, 'done': False})}\n\n"
                                    yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
                                return StreamingResponse(_split_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
                            return {"response": response_text, "provider": "swarm-split", "model": model}
                
                # Step 3: Single-node delegation with round-robin
                target_node = mesh.select_node_for_task(prompt_tokens)
                if target_node:
                    log.info(f"🕸️ Hive v2.0: Delegating to {target_node.ip} (round-robin)")
                    ctx_limit = mesh.get_effective_context_limit()
                    truncated_context = (enhanced_system_prompt + "\n\n" + body.prompt)[:ctx_limit * 4]  # ~4 chars per token
                    
                    delegation_payload = {
                        "task_id": f"gen-{id(body)}",
                        "compiled_context": truncated_context,
                        "prompt": body.prompt,
                        "model_tier": "high",
                    }
                    result = await mesh.proxy_prediction(target_node, delegation_payload)
                    if result.get("status") != "error":
                        prediction = result.get("prediction", {})
                        response_text = prediction.get("response", prediction.get("ghost_block", ""))
                        if response_text:
                            metrics = prediction.get("metrics", {})
                            log_usage(session, provider="swarm", model=metrics.get("model", model), prompt_tokens=metrics.get("prompt_tokens", 0), completion_tokens=metrics.get("completion_tokens", 0))
                            if body.stream:
                                def _swarm_stream():
                                    yield f"data: {json.dumps({'token': f'[🕸️ Swarm → {target_node.ip}] ', 'done': False})}\n\n"
                                    yield f"data: {json.dumps({'token': response_text, 'done': False})}\n\n"
                                    yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
                                    yield f"data: {json.dumps({'metrics': {'prompt_tokens': metrics.get('prompt_tokens', 0), 'completion_tokens': metrics.get('completion_tokens', 0)}})}\n\n"
                                return StreamingResponse(_swarm_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
                            return {"response": response_text, "provider": "swarm", "model": model}
                    log.warning(f"🕸️ Swarm delegation failed, falling back to local")
            
            # Step 4: Even if not delegating, enforce context limit
            ctx_limit = mesh.get_effective_context_limit()
            if ctx_limit < 32000:
                # Truncate the enhanced system prompt to stay within limits
                max_chars = ctx_limit * 4
                if len(enhanced_system_prompt) > max_chars:
                    enhanced_system_prompt = enhanced_system_prompt[:max_chars] + "\n\n[... context truncated by Hive resource limits ...]"
                    log.info(f"🕸️ Hive v2.0: Context truncated to {ctx_limit} tokens (limit: {mesh.compute_resource_limits()['max_vram_pct']}%)")
        except Exception as e:
            log.error(f"🕸️ Hive delegation error: {e}")

    # ── Chunking logic
    token_count = count_tokens(body.prompt)

    if token_count > 1200 and body.mode != "cloud":
        chunks = chunk_code(body.prompt)
        chunk_results = []
        for chunk in chunks:
            result = _generate_ollama_sync(chunk["content"], model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt, history=body.history)
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

    # ── Streaming (default) — uses logging wrapper for both local and cloud
    if body.stream:
        return StreamingResponse(
            _stream_with_logging_and_files(body.prompt, model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt, history=body.history, mode=body.mode),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Non-streaming fallback (local only)
    result = _generate_ollama_sync(body.prompt, model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt, history=body.history)
    log_usage(
        session,
        provider="local",
        model=model,
        prompt_tokens=result["prompt_tokens"],
        completion_tokens=result["completion_tokens"],
    )
    
    # Cache the response for future identical prompts
    try:
        import swarm_mesh as mesh
        resp_text = result.get("response", result.get("ghost_block", ""))
        if resp_text and body.mode != "cloud":
            mesh.cache_put(body.prompt, model, resp_text)
    except Exception:
        pass
    
    return result


# ─── Autocomplete ──────────────────────────────────────────────────
AUTOCOMPLETE_SYSTEM = """You are a code autocomplete engine. Given the code context up to the cursor position, predict the NEXT code that should be written. Rules:
- Output ONLY the completion code, nothing else
- No markdown, no explanations, no backticks
- Complete the current line and optionally the next 1-2 lines
- Match the existing code style and indentation
- If unsure, output an empty string"""


@router.post("/autocomplete")
async def autocomplete(body: AutocompleteRequest):
    """Return a short code completion suggestion — Brain-first, Ollama fallback."""
    settings = get_settings()

    lines = body.code.split("\n")
    cursor_line = min(body.cursor_line, len(lines) - 1)

    # Build context: up to 10 lines before cursor for embedding query
    start = max(0, cursor_line - 10)
    context_lines = lines[start:cursor_line + 1]
    if context_lines:
        context_lines[-1] = context_lines[-1][:body.cursor_col]
    context = "\n".join(context_lines)

    # ─── Strategy 1: Brain Embedding Search (instant, no Ollama) ───
    from brain import brain
    if brain.is_ready and brain.table is not None:
        try:
            query_vector = brain.model.encode(context).tolist()
            results = brain.table.search(query_vector).limit(5).to_list()

            for res in results:
                chunk_text = res.get("text", "")
                score = res.get("_distance", 99.0)

                if score > 1.0:
                    continue  # too different

                # Find where our context matches within the chunk
                # Use the last line (partial) as the anchor
                current_partial = context_lines[-1].strip() if context_lines else ""
                if not current_partial or len(current_partial) < 3:
                    continue

                # Try to find the partial line in the chunk
                idx = chunk_text.find(current_partial)
                if idx < 0:
                    # Try with just the last few tokens
                    tokens = current_partial.split()
                    if len(tokens) >= 2:
                        short_query = " ".join(tokens[-3:])
                        idx = chunk_text.find(short_query)
                        if idx >= 0:
                            idx += len(short_query)
                    if idx < 0:
                        continue
                else:
                    idx += len(current_partial)

                # Extract the continuation
                continuation = chunk_text[idx:]
                # Take only the first meaningful line(s) of continuation
                cont_lines = continuation.split("\n")
                suggestion_parts = []
                for cl in cont_lines:
                    if cl.strip():
                        suggestion_parts.append(cl)
                        if len(suggestion_parts) >= 2:
                            break
                    elif suggestion_parts:
                        break

                suggestion = "\n".join(suggestion_parts).strip()
                if suggestion and len(suggestion) >= 3:
                    log.info(f"[Autocomplete] Brain match (score={score:.2f}): {suggestion[:60]}...")
                    return {"suggestion": suggestion, "used_brain": True}

        except Exception as e:
            log.warning(f"[Autocomplete] Brain search failed: {e}")

    # No Brain match found — return empty (instant, no Ollama delay)
    return {"suggestion": "", "used_brain": False}

# ─── Brain Status (v7.0) ───────────────────────────────────────────
@router.get("/brain/status")
async def get_brain_status():
    from brain import brain
    status = brain.get_status()
    return {
        "status": "READY" if brain.is_ready else "INDEXING",
        "is_ready": brain.is_ready,
        "cache_size": status.get("cache_size", 0),
        "last_pulse": status.get("last_pulse", 0),
        "analysis_latency_ms": 0
    }

# ─── Shield Report (v7.0) ─────────────────────────────────────────
@router.get("/shield/report")
async def shield_report():
    """Returns Sentinel shield telemetry for the frontend."""
    from sentinel import get_shield_report
    return get_shield_report()

# ─── Library Endpoints (v7.0) ──────────────────────────────────────
@router.post("/library/upload")
async def library_upload(file: UploadFile = File(...)):
    """Upload and index a PDF or Text documentation file."""
    from library import library
    import os
    
    # Ensure temporary storage
    temp_dir = os.path.join(os.getcwd(), "temp_docs")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        success = False
        folder = None
        # Check if a folder was specified via query param
        if file.filename.lower().endswith(".pdf"):
            success = await library.process_pdf(file_path)
        elif file.filename.lower().endswith((".docx", ".doc")):
            success = await library.process_docx(file_path)
        elif file.filename.lower().endswith((".md", ".txt")):
            success = await library.process_markdown(file_path)
            
        return {"success": success, "filename": file.filename}
    except Exception as e:
        log.error(f"❌ Upload error: {e}")
        return {"success": False, "error": str(e)}

@router.get("/library/list")
async def library_list():
    """List all ingested documentation with folder structure."""
    from library import library
    return {
        "documents": library.get_documents(),
        "folders": library.get_folders()
    }

@router.post("/library/folder")
async def create_library_folder(body: dict):
    """Create a new library folder."""
    from library import library
    name = body.get("name", "").strip()
    if not name:
        return {"success": False, "error": "Folder name is required"}
    library.create_folder(name)
    return {"success": True, "name": name}

@router.delete("/library/folder/{folder_name}")
async def delete_library_folder(folder_name: str):
    """Delete a library folder. Moves docs back to 'Geral'."""
    from library import library
    if folder_name == "Geral":
        return {"success": False, "error": "Cannot delete default folder"}
    success = library.delete_folder(folder_name)
    return {"success": success}

@router.put("/library/folder/rename")
async def rename_library_folder(body: dict):
    """Rename a library folder."""
    from library import library
    old_name = body.get("old_name", "")
    new_name = body.get("new_name", "").strip()
    if not old_name or not new_name:
        return {"success": False, "error": "Both old_name and new_name are required"}
    if old_name == "Geral":
        return {"success": False, "error": "Cannot rename default folder"}
    success = library.rename_folder(old_name, new_name)
    return {"success": success}

@router.put("/library/document/move")
async def move_library_document(body: dict):
    """Move a document into a folder."""
    from library import library
    doc_name = body.get("doc_name", "")
    folder_name = body.get("folder", "")
    success = library.move_to_folder(doc_name, folder_name)
    return {"success": success}

@router.delete("/library/document/{doc_name}")
async def delete_library_document(doc_name: str):
    """Remove a document from the library."""
    from library import library
    success = library.remove_document(doc_name)
    return {"success": success}

# ─── Library Search (v7.0) — Vector search restricted to library docs ──
@router.post("/library/search")
async def library_search(body: dict):
    """Search library-only content via Brain vector DB."""
    from brain import brain
    query = body.get("query", "")
    limit = body.get("limit", 5)
    if not query:
        return {"results": []}
    results = await brain.search_library(query, limit=limit)
    return {"results": results}

# ─── Library — Personality Prompt ──────────────────────────────────
@router.get("/library/personality")
async def get_personality():
    """Get the current personality prompt."""
    from library import library
    return library.get_personality()

@router.post("/library/personality")
async def set_personality(file: UploadFile = File(...)):
    """Upload a .txt file as a personality prompt."""
    from library import library
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")
        if not text.strip():
            return {"success": False, "error": "File is empty"}
        library.set_personality(text, name=file.filename or "personality.txt")
        return {"success": True, "name": file.filename, "char_count": len(text.strip())}
    except Exception as e:
        log.error(f"❌ Personality upload error: {e}")
        return {"success": False, "error": str(e)}

@router.delete("/library/personality")
async def clear_personality():
    """Remove the personality prompt."""
    from library import library
    library.clear_personality()
    return {"success": True}

@router.put("/library/personality/text")
async def set_personality_text(body: dict):
    """Set personality prompt from inline text (no file upload needed)."""
    from library import library
    text = body.get("text", "").strip()
    name = body.get("name", "inline-personality")
    if not text:
        library.clear_personality()
        return {"success": True, "action": "cleared"}
    library.set_personality(text, name=name)
    return {"success": True, "name": name, "char_count": len(text)}

# ─── Memory CRUD ──────────────────────────────────────────────────

@router.get("/memories")
async def list_memories():
    """Return all agent memories."""
    from memory import get_all_memories
    return {"memories": get_all_memories()}

@router.post("/memories")
async def create_memory(body: dict):
    """Manually add a memory."""
    from memory import save_memory
    memory_type = body.get("type", "user")
    content = body.get("content", "").strip()
    if not content:
        return {"success": False, "error": "Content is required"}
    success = save_memory(memory_type, content, source="manual")
    return {"success": success}

@router.delete("/memories/{memory_id}")
async def remove_memory(memory_id: int):
    """Delete a specific memory by ID."""
    from memory import delete_memory
    success = delete_memory(memory_id)
    return {"success": success}


# ─── Identity ──────────────────────────────────────────────────────
@router.get("/identity/check", response_model=IdentityStatus)
def check_identity(db: Session = Depends(get_session)):
    identity = db.exec(select(ProjectYIdentity).where(ProjectYIdentity.is_active == True)).first()
    hwid = get_hwid()
    log.info(f"🛡️ identity/check → found={identity is not None}, hwid={hwid[:8]}...")
    if identity:
        return {
            "is_registered": True,
            "user_name": identity.user_name,
            "hwid": hwid
        }
    return {"is_registered": False, "hwid": hwid}

@router.post("/identity/register")
def register_identity(reg: IdentityRegister, db: Session = Depends(get_session)):
    # Check if already registered — return success if so
    existing = db.exec(select(ProjectYIdentity)).first()
    if existing:
        return {"success": True, "user_name": existing.user_name}
    
    hwid = get_hwid()
    hwid_hash = generate_master_key(reg.user_name, hwid)
    
    new_id = ProjectYIdentity(
        user_name=reg.user_name,
        hwid_hash=hwid_hash,
        is_active=True
    )
    db.add(new_id)
    db.commit()
    db.refresh(new_id)
    
    # Unlock Brain and Protect secrets immediately after registration
    if brain.verify_identity(new_id.user_name, new_id.hwid_hash):
        protect_project_secrets("c:/pulsyce/backend", new_id.user_name)
    
    return {"success": True, "user_name": reg.user_name}

# ─── Configuration ───────────────────────────────────────────────
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
    """Update runtime configuration (in-memory + persist cloud to disk)."""
    from config import save_cloud_config

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

    # Persist cloud config to disk so it survives restarts
    cloud_data = {}
    if settings.cloud_api_key:
        cloud_data["cloud_api_key"] = settings.cloud_api_key
    if settings.cloud_model:
        cloud_data["cloud_model"] = settings.cloud_model
    if detected:
        cloud_data["cloud_provider"] = detected
        settings.cloud_provider = detected
    if cloud_data:
        save_cloud_config(cloud_data)
        log.info(f"☁️ Cloud config persisted: provider={detected}, model={settings.cloud_model}")

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
    return {"chats": [{"uid": c.uid, "title": c.title, "model": c.model or "", "updated_at": str(c.updated_at)} for c in chats]}


@router.post("/chats")
async def create_chat(body: ChatCreate, session: Session = Depends(get_session)):
    """Create a new chat session."""
    chat = ChatSession(uid=body.uid, title=body.title, model=body.model)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return {"uid": chat.uid, "title": chat.title, "model": chat.model}


@router.put("/chats/{uid}")
async def update_chat(uid: str, body: ChatUpdate, session: Session = Depends(get_session)):
    """Update chat title."""
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if body.title is not None:
        chat.title = body.title
    if body.model is not None:
        chat.model = body.model
    chat.updated_at = datetime.utcnow()
    session.add(chat)
    session.commit()
    return {"uid": chat.uid, "title": chat.title, "model": chat.model}


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


# ─── Proactive Predictive Cache (Module C) ──────────────────────────
@router.post("/predict/next-steps", response_model=Dict[str, Any])
async def predict_next_steps(req: predictor.PredictionRequest):
    """(v4.0) Speculative execution buffer based on hardware load."""
    try:
        prediction = await predictor.generate_prediction(req)
        return {"status": "success", "prediction": prediction}
    except Exception as e:
        log.error(f"Predictor error: {e}")
        return {"status": "error", "message": str(e)}

# ─── Project Y Mesh (Module A v7.0) ────────────────────────────────────
@router.get("/mesh/ping", response_model=Dict[str, Any])
async def ping_mesh():
    """(Swarm v7.0) Lightweight endpoint to verify node reachability."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@router.get("/mesh/ping-node", response_model=Dict[str, Any])
async def ping_remote_node(ip: str, port: int = 8000):
    """(Swarm v7.0) Backend proxy to ping a remote mesh node.
    
    The browser can't directly ping remote nodes due to CORS restrictions
    when running from Electron's file:// protocol. This endpoint does the
    request server-side and tries both common ports (8000, 8001).
    """
    import httpx
    ports_to_try = [port]
    if port == 8000:
        ports_to_try.append(8001)
    elif port == 8001:
        ports_to_try.append(8000)
    
    async with httpx.AsyncClient(timeout=2.0) as client:
        for p in ports_to_try:
            try:
                resp = await client.get(f"http://{ip}:{p}/api/mesh/ping")
                if resp.status_code == 200:
                    return {"reachable": True, "ip": ip, "port": p}
            except Exception:
                continue
    return {"reachable": False, "ip": ip, "port": port}


def _get_gpu_info() -> dict:
    """Robustly detects GPU name, total VRAM, and free VRAM (GiB)."""
    info = {"gpu_name": "N/A", "vram_total_gb": 0.0, "vram_free_gb": 0.0}
    
    # 1. Try Torch first (fastest if CUDA works)
    if torch.cuda.is_available():
        try:
            free, total = torch.cuda.mem_get_info()
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["vram_total_gb"] = round(total / (1024**3), 2)
            info["vram_free_gb"] = round(free / (1024**3), 2)
            return info
        except Exception:
            pass
    
    # 2. nvidia-smi fallback (reliable for NVIDIA hardware)
    try:
        cmd = ["nvidia-smi", "--query-gpu=name,memory.total,memory.free", "--format=csv,noheader,nounits"]
        output = subprocess.check_output(cmd, encoding='utf-8', timeout=3)
        parts = output.strip().split(',')
        if len(parts) >= 3:
            info["gpu_name"] = parts[0].strip()
            info["vram_total_gb"] = round(float(parts[1].strip()) / 1024.0, 2)
            info["vram_free_gb"] = round(float(parts[2].strip()) / 1024.0, 2)
    except Exception:
        pass
    
    return info

# Cache for model info (avoid hammering Ollama on every poll)
_model_info_cache = {"loaded_model": "", "installed_models": [], "ts": 0.0}
_MODEL_INFO_TTL = 30  # seconds

@router.get("/mesh/status", response_model=Dict[str, Any])
async def get_mesh_status():
    """Returns local hardware status (GPU VRAM, RAM, CPU) for swarm peering."""
    import swarm_mesh as mesh
    try:
        gpu = _get_gpu_info()
        sys_stats = mesh.get_local_system_stats()
        
        # Swarm v6.0: A node is a Cortex if its PHYSICAL hardware has >= 4GB VRAM total
        is_cortex = gpu["vram_total_gb"] >= 4.0
        limits = mesh.compute_resource_limits()
        
        # Get local model info (cached to avoid hammering Ollama every 5s)
        import time as _time
        now = _time.time()
        if now - _model_info_cache["ts"] > _MODEL_INFO_TTL:
            loaded_model = ""
            installed_models = []
            try:
                import httpx
                from ollama_orchestrator import get_orchestrator
                orch = get_orchestrator()
                if orch.is_running():
                    async with httpx.AsyncClient(timeout=2.0) as hc:
                        try:
                            ps_resp = await hc.get(f"{orch.base_url}/api/ps")
                            if ps_resp.status_code == 200:
                                running = ps_resp.json().get("models", [])
                                if running:
                                    loaded_model = running[0].get("name", "")
                        except Exception:
                            pass
                        try:
                            tags_resp = await hc.get(f"{orch.base_url}/api/tags")
                            if tags_resp.status_code == 200:
                                installed_models = [m.get("name", "") for m in tags_resp.json().get("models", []) if m.get("name")]
                        except Exception:
                            pass
            except Exception:
                pass
            _model_info_cache["loaded_model"] = loaded_model
            _model_info_cache["installed_models"] = installed_models
            _model_info_cache["ts"] = now
        
        # v7.0: Get the user's nickname from identity (shield)
        nickname = ""
        try:
            from database import get_session_direct
            from models import ProjectYIdentity
            from sqlmodel import select as _sel
            with get_session_direct() as db:
                identity = db.exec(_sel(ProjectYIdentity).where(ProjectYIdentity.is_active == True)).first()
                if identity:
                    nickname = identity.user_name or ""
        except Exception:
            pass
        
        return {
            "gpu_name": gpu["gpu_name"],
            "vram_total_gb": gpu["vram_total_gb"],
            "vram_free_gb": gpu["vram_free_gb"],
            "is_cortex": is_cortex,
            "is_running": mesh._zc is not None,
            "port": mesh.MESH_PORT,
            "ram_total_gb": sys_stats["ram_total_gb"],
            "ram_free_gb": sys_stats["ram_free_gb"],
            "ram_used_pct": sys_stats["ram_used_pct"],
            "cpu_usage_pct": sys_stats["cpu_usage_pct"],
            "loaded_model": _model_info_cache["loaded_model"],
            "installed_models": _model_info_cache["installed_models"],
            "resource_limits": limits,
            "effective_context_limit": mesh.get_effective_context_limit(),
            "cache_stats": mesh.cache_stats(),
            "nickname": nickname,
        }
    except Exception as e:
        log.error(f"Mesh status error: {e}")
        return {"gpu_name": "N/A", "vram_total_gb": 0.0, "vram_free_gb": 0.0, "is_cortex": False, "is_running": False, "port": 8000, "ram_total_gb": 0, "ram_free_gb": 0, "ram_used_pct": 0, "cpu_usage_pct": 0, "loaded_model": "", "installed_models": [], "resource_limits": {"connected_nodes": 0, "cortex_nodes": 0, "light_nodes": 0, "total_machines": 1, "total_gpu_machines": 1, "max_vram_pct": 100, "max_ram_pct": 100, "max_cpu_pct": 100, "throttle_active": False}, "effective_context_limit": 32000, "cache_stats": {"entries": 0, "valid": 0, "max": 50, "ttl_seconds": 1800}}


@router.post("/mesh/config", response_model=Dict[str, Any])
async def config_mesh(body: MeshConfigToggle):
    """Enable or disable the swarm ZeroConf broadcaster, and change the port.
    
    When enabled: starts mesh broadcast AND restarts Ollama with network mode (0.0.0.0)
    When disabled: stops mesh AND restarts Ollama in local-only mode (127.0.0.1)
    """
    import swarm_mesh as mesh
    from ollama_orchestrator import get_orchestrator
    orch = get_orchestrator()
    try:
        if body.enabled:
            mesh.stop_mesh()
            # v7.0: If port is 0 (frontend default), use the last known mesh port
            # MESH_PORT is set correctly during initial startup in main.py lifespan
            actual_port = body.port if body.port > 0 else mesh.MESH_PORT or 8001
            mesh.start_mesh(port=actual_port)
            # Restart Ollama to accept network connections
            orch.restart_for_network(network_mode=True)
            return {"status": "started", "port": actual_port, "network_mode": True}
        else:
            mesh.stop_mesh()
            # Restart Ollama to local-only
            orch.restart_for_network(network_mode=False)
            return {"status": "stopped", "network_mode": False}
    except Exception as e:
        log.error(f"Mesh config error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mesh/nodes", response_model=Dict[str, Any])
async def get_mesh_nodes():
    """Returns list of discovered swarm nodes with resource limits."""
    try:
        import swarm_mesh as mesh
        nodes = []
        for nid, node in mesh.discovered_nodes.items():
            nodes.append({
                "id": nid,
                "ip": node.ip,
                "port": node.port,
                "hostname": node.hostname,
                "nickname": node.nickname,
                "vram_free_gb": node.vram_free_gb,
                "is_cortex": node.is_cortex,
                "last_seen": node.last_seen
            })
        limits = mesh.compute_resource_limits()
        return {"nodes": nodes, "count": len(nodes), "resource_limits": limits}
    except Exception as e:
        log.error(f"Mesh nodes error: {e}")
        return {"nodes": [], "count": 0, "resource_limits": {"connected_nodes": 0, "total_machines": 1, "max_vram_pct": 100, "max_ram_pct": 100, "max_cpu_pct": 100, "throttle_active": False}}

# ─── Live Preview (Static Server + Dev Server) ─────────────────────────
from fastapi.responses import FileResponse, Response
import mimetypes
import subprocess as _preview_subprocess
import socket as _preview_socket

_preview_dev_servers: Dict[str, Dict[str, Any]] = {}  # folder -> {process, port}

def _find_free_port() -> int:
    """Find a free TCP port."""
    with _preview_socket.socket(_preview_socket.AF_INET, _preview_socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

@router.get("/preview/folders")
async def preview_folders():
    """List workspace subfolders that could be projects."""
    from workspace import _workspace_path
    if not _workspace_path:
        return {"folders": []}
    
    folders = []
    try:
        for entry in os.scandir(_workspace_path):
            if entry.is_dir() and not entry.name.startswith('.') and entry.name != 'node_modules':
                has_entry = os.path.exists(os.path.join(entry.path, 'index.html')) or \
                            os.path.exists(os.path.join(entry.path, 'package.json'))
                folders.append({
                    "name": entry.name,
                    "path": entry.name,
                    "has_entry": has_entry
                })
    except Exception as e:
        log.warning(f"[Preview] Error listing folders: {e}")
    
    # Check root too
    root_has_entry = os.path.exists(os.path.join(_workspace_path, 'index.html')) or \
                     os.path.exists(os.path.join(_workspace_path, 'package.json'))
    folders.insert(0, {"name": "/ (root)", "path": ".", "has_entry": root_has_entry})
    
    return {"folders": folders}

@router.post("/preview/dev-server")
async def api_start_dev_server(body: Dict[str, Any]):
    """Start a dev server (npm run dev) for a project subfolder."""
    from workspace import _workspace_path, _load_workspace_from_db
    _load_workspace_from_db()
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="No workspace set")
    
    subfolder = body.get("folder", ".")
    project_path = os.path.join(_workspace_path, subfolder) if subfolder != "." else _workspace_path
    log.info(f"[Preview] dev-server request for: {project_path}")
    
    # Check if already running for this folder
    if subfolder in _preview_dev_servers:
        info = _preview_dev_servers[subfolder]
        if info.get("process") and info["process"].poll() is None:
            return {"status": "running", "port": info["port"], "url": f"http://localhost:{info['port']}"}
    
    # Detect project type from package.json
    pkg_path = os.path.join(project_path, "package.json")
    if not os.path.exists(pkg_path):
        # Auto-search subdirectories for package.json
        found = False
        for entry in os.listdir(project_path):
            sub = os.path.join(project_path, entry)
            if os.path.isdir(sub) and os.path.exists(os.path.join(sub, "package.json")):
                log.info(f"[Preview] package.json found in subdirectory: {entry}")
                project_path = sub
                pkg_path = os.path.join(sub, "package.json")
                found = True
                break
        if not found:
            raise HTTPException(status_code=400, detail="No package.json found — use static preview instead")
    
    import json as _json
    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg = _json.load(f)
    
    scripts = pkg.get("scripts", {})
    all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
    
    # Auto npm install if node_modules is missing
    nm_path = os.path.join(project_path, "node_modules")
    if not os.path.isdir(nm_path):
        log.info(f"[Preview] node_modules missing, running npm install in {project_path}")
        try:
            install_proc = _preview_subprocess.run(
                "npm install",
                cwd=project_path,
                shell=True,
                capture_output=True,
                text=True,
                timeout=120
            )
            if install_proc.returncode != 0:
                log.warning(f"[Preview] npm install failed: {install_proc.stderr[:500]}")
                raise HTTPException(status_code=500, detail=f"npm install failed: {install_proc.stderr[:200]}")
            log.info("[Preview] npm install completed successfully")
        except _preview_subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="npm install timed out (120s)")
    
    # Determine the dev command and port
    port = _find_free_port()
    cmd = None
    env_extra = {}
    
    if "dev" in scripts:
        dev_script = scripts.get("dev", "")
        if "vite" in all_deps or "vite" in dev_script:
            cmd = f"npx vite --port {port} --host"
        elif "next" in all_deps:
            cmd = f"npx next dev -p {port}"
        else:
            cmd = f"npm run dev -- --port {port}"
    elif "start" in scripts:
        start_script = scripts.get("start", "")
        if "react-scripts" in all_deps or "react-scripts" in start_script:
            # CRA uses PORT env var, not --port flag
            env_extra["PORT"] = str(port)
            env_extra["BROWSER"] = "none"  # Don't open browser
            cmd = "npm start"
        elif "vite" in all_deps:
            cmd = f"npx vite --port {port} --host"
        else:
            env_extra["PORT"] = str(port)
            cmd = "npm start"
    
    if not cmd:
        raise HTTPException(status_code=400, detail="No dev/start script found in package.json")
    
    log.info(f"[Preview] Starting dev server: {cmd} in {project_path} on port {port}")
    
    try:
        # Merge extra env vars (e.g. PORT for CRA) with current environment
        proc_env = {**os.environ, **env_extra} if env_extra else None
        proc = _preview_subprocess.Popen(
            cmd,
            cwd=project_path,
            shell=True,
            # CRITICAL: use DEVNULL, NOT PIPE — on Windows, unread PIPE buffer
            # fills up (~4KB) and blocks the child process (Vite hangs silently)
            stdout=_preview_subprocess.DEVNULL,
            stderr=_preview_subprocess.DEVNULL,
            env=proc_env,
            creationflags=_preview_subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        _preview_dev_servers[subfolder] = {"process": proc, "port": port, "cmd": cmd}
        
        # Brief wait for the server to start binding
        import asyncio
        await asyncio.sleep(1)
        
        return {
            "status": "started",
            "port": port,
            "url": f"http://localhost:{port}",
            "framework": "next" if "next" in all_deps else "vite" if "vite" in all_deps else "node"
        }
    except Exception as e:
        log.error(f"[Preview] Failed to start dev server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/preview/dev-server")
async def stop_dev_server(body: dict = None):
    """Stop all running dev servers."""
    stopped = []
    for folder, info in list(_preview_dev_servers.items()):
        proc = info.get("process")
        if proc and proc.poll() is None:
            try:
                if os.name == 'nt':
                    _preview_subprocess.call(['taskkill', '/F', '/T', '/PID', str(proc.pid)],
                                             stdout=_preview_subprocess.DEVNULL, stderr=_preview_subprocess.DEVNULL)
                else:
                    proc.terminate()
                stopped.append(folder)
            except Exception:
                pass
        del _preview_dev_servers[folder]
    return {"status": "stopped", "folders": stopped}

@router.get("/preview/qr")
async def preview_qr():
    """Generate a QR code for the active preview URL."""
    try:
        import qrcode
        from io import BytesIO
        # Get local IP
        hostname = _preview_socket.gethostname()
        local_ip = _preview_socket.gethostbyname(hostname)
        
        # Use first active dev server, or fallback to edge preview
        port = 8000
        for info in _preview_dev_servers.values():
            if info.get("process") and info["process"].poll() is None:
                port = info["port"]
                break
        
        url = f"http://{local_ip}:{port}"
        qr = qrcode.QRCode(version=1, box_size=8, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return Response(
            content=buf.getvalue(),
            media_type="image/png",
            headers={"X-Preview-URL": url}
        )
    except ImportError:
        return {"url": "QR code library not installed (pip install qrcode)"}
    except Exception as e:
        return {"url": f"Error: {e}"}

@router.get("/preview/{file_path:path}")
async def preview_static_file(file_path: str):
    """Serve static files from the workspace for preview."""
    from workspace import _workspace_path
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="No workspace set")
    
    if not file_path:
        file_path = "index.html"
    
    full_path = os.path.join(_workspace_path, file_path)
    
    # Security: prevent directory traversal
    full_path = os.path.normpath(full_path)
    if not full_path.startswith(os.path.normpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    content_type, _ = mimetypes.guess_type(full_path)
    return FileResponse(full_path, media_type=content_type or "application/octet-stream")

# ─── Project Y Edge (Module B v5.5) ────────────────────────────────────
from edge_runtime import edge_manager

@router.post("/edge/start", response_model=Dict[str, Any])
async def start_edge_sandbox():
    """Starts the WASM/Sandbox execution for the current workspace."""
    from workspace import _workspace_path
    if not _workspace_path:
        return {"status": "error", "message": "Nenhum workspace ativo para rodar no Edge."}
    return await edge_manager.start_sandbox(_workspace_path)

@router.delete("/edge/stop/{sandbox_id}")
async def stop_edge_sandbox(sandbox_id: str):
    edge_manager.stop_sandbox(sandbox_id)
    return {"status": "success"}

@router.get("/edge/preview/{sandbox_id}/{file_path:path}")
async def edge_preview(sandbox_id: str, file_path: str):
    """Serves the sandbox files as if it were a Wasm Edge runtime."""
    sandbox = edge_manager.get_sandbox(sandbox_id)
    if not sandbox:
        raise HTTPException(status_code=404, detail="Sandbox inativo ou inexistente")
    
    import os
    # Default to index.html if pointing to root/empty file_path
    if not file_path or file_path == "":
        file_path = "index.html"
        
    full_path = os.path.join(sandbox["workspace"], file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no sandbox")
        
    return FileResponse(full_path)
# ─── Git Integration ────────────────────────────────────────────────
import subprocess

def _run_git(args: list, cwd: str = None) -> dict:
    """Runs a git command and returns stdout/stderr."""
    from workspace import _workspace_path
    work_dir = cwd or _workspace_path
    if not work_dir:
        return {"ok": False, "error": "No workspace set"}
    try:
        r = subprocess.run(
            ["git"] + args,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=30,
            encoding="utf-8",
            errors="replace"
        )
        return {"ok": r.returncode == 0, "stdout": r.stdout, "stderr": r.stderr}
    except FileNotFoundError:
        return {"ok": False, "error": "Git not found. Install git first."}
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": "Git command timed out"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@router.get("/git/status")
async def git_status():
    """Returns current branch and list of changed files."""
    from workspace import _workspace_path
    # Get branch
    br = _run_git(["rev-parse", "--abbrev-ref", "HEAD"])
    branch = br["stdout"].strip() if br["ok"] else ""

    # Get status (porcelain for machine-readable)
    st = _run_git(["status", "--porcelain", "-uall"])
    files = []
    if st["ok"]:
        for line in st["stdout"].strip().split("\n"):
            if not line.strip():
                continue
            code = line[:2].strip()
            path = line[3:].strip()
            status_map = {"M": "modified", "A": "added", "D": "deleted", "??": "untracked", "R": "renamed", "U": "conflict"}
            files.append({"path": path, "status": status_map.get(code, code), "code": code})

    # Is it a git repo?
    is_repo = _run_git(["rev-parse", "--is-inside-work-tree"])

    return {
        "is_repo": is_repo.get("ok", False),
        "branch": branch,
        "files": files,
        "file_count": len(files),
    }

@router.get("/git/branch")
async def git_branches():
    """Returns list of all branches."""
    r = _run_git(["branch", "-a", "--no-color"])
    if not r["ok"]:
        return {"branches": [], "current": "", "error": r.get("error", r.get("stderr", ""))}

    branches = []
    current = ""
    for line in r["stdout"].strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("* "):
            current = line[2:]
            branches.append(current)
        else:
            branches.append(line)
    return {"branches": branches, "current": current}

@router.get("/git/diff")
async def git_diff(file: str = ""):
    """Returns diff for a file or all changes."""
    args = ["diff", "--no-color"]
    if file:
        args.append(file)
    r = _run_git(args)

    # Also get diff for staged files
    args_staged = ["diff", "--cached", "--no-color"]
    if file:
        args_staged.append(file)
    staged = _run_git(args_staged)

    # For untracked files, show full content
    diff_text = r.get("stdout", "") + staged.get("stdout", "")
    if not diff_text and file:
        # Might be untracked — show file content
        show = _run_git(["show", f":{file}"])
        if not show["ok"]:
            from workspace import _workspace_path
            full = os.path.join(_workspace_path, file) if _workspace_path else file
            if os.path.isfile(full):
                try:
                    with open(full, "r", encoding="utf-8", errors="replace") as f:
                        diff_text = f"--- /dev/null\n+++ b/{file}\n" + "".join(f"+{l}" for l in f.readlines()[:200])
                except:
                    pass

    return {"ok": True, "diff": diff_text}

@router.post("/git/commit")
async def git_commit(body: dict):
    """Stages all changes and commits with message."""
    msg = body.get("message", "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Commit message required")

    # Stage all
    add = _run_git(["add", "-A"])
    if not add["ok"]:
        return {"ok": False, "error": add.get("stderr", "Failed to stage")}

    # Commit
    r = _run_git(["commit", "-m", msg])
    return {"ok": r["ok"], "output": r.get("stdout", ""), "error": r.get("stderr", "")}

@router.post("/git/push")
async def git_push():
    """Pushes to remote."""
    r = _run_git(["push"])
    if not r["ok"]:
        # Try setting upstream
        br = _run_git(["rev-parse", "--abbrev-ref", "HEAD"])
        if br["ok"]:
            r = _run_git(["push", "--set-upstream", "origin", br["stdout"].strip()])
    return {"ok": r["ok"], "output": r.get("stdout", ""), "error": r.get("stderr", "")}

@router.post("/git/pull")
async def git_pull():
    """Pulls from remote."""
    r = _run_git(["pull"])
    return {"ok": r["ok"], "output": r.get("stdout", ""), "error": r.get("stderr", "")}

@router.post("/git/checkout")
async def git_checkout(body: dict):
    """Switches or creates a branch."""
    branch = body.get("branch", "").strip()
    create = body.get("create", False)
    if not branch:
        raise HTTPException(status_code=400, detail="Branch name required")

    args = ["checkout"]
    if create:
        args.append("-b")
    args.append(branch)

    r = _run_git(args)
    return {"ok": r["ok"], "output": r.get("stdout", ""), "error": r.get("stderr", "")}

@router.get("/git/log")
async def git_log(count: int = 20):
    """Returns recent commits."""
    r = _run_git(["log", f"--oneline", f"-{min(count, 50)}", "--no-color"])
    commits = []
    if r["ok"]:
        for line in r["stdout"].strip().split("\n"):
            if line.strip():
                parts = line.strip().split(" ", 1)
                commits.append({"hash": parts[0], "message": parts[1] if len(parts) > 1 else ""})
    return {"commits": commits}

@router.post("/git/init")
async def git_init():
    """Initializes a git repo in the workspace."""
    r = _run_git(["init"])
    return {"ok": r["ok"], "output": r.get("stdout", ""), "error": r.get("stderr", "")}

# ─── Shield Blacklist CRUD ──────────────────────────────────────────
@router.get("/shield/blacklist")
async def get_shield_blacklist():
    """Returns the current shield blacklist."""
    return {"blacklist": sentinel.get_blacklist()}

@router.post("/shield/blacklist")
async def add_shield_blacklist(body: dict):
    """Adds a name to the shield blacklist."""
    name = body.get("name", "")
    added = sentinel.add_to_blacklist(name)
    return {"success": added, "blacklist": sentinel.get_blacklist()}

@router.delete("/shield/blacklist/{name}")
async def remove_shield_blacklist(name: str):
    """Removes a name from the shield blacklist."""
    removed = sentinel.remove_from_blacklist(name)
    return {"success": removed, "blacklist": sentinel.get_blacklist()}

# ─── File Operations (Context Menu) ─────────────────────────────────
@router.post("/workspace/rename")
async def rename_file(body: dict):
    """Renames a file or folder in the workspace."""
    old_path = body.get("old_path", "")
    new_name = body.get("new_name", "")
    if not old_path or not new_name:
        raise HTTPException(status_code=400, detail="old_path and new_name required")
    
    from workspace import _workspace_path
    full_old = os.path.join(_workspace_path, old_path) if _workspace_path else old_path
    new_path = os.path.join(os.path.dirname(full_old), new_name)
    
    # Security check
    if not os.path.realpath(full_old).startswith(os.path.realpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Path outside workspace")
    
    try:
        os.rename(full_old, new_path)
        return {"success": True, "new_path": os.path.relpath(new_path, _workspace_path)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/workspace/file")
async def delete_file(path: str):
    """Deletes a file or empty folder from the workspace."""
    from workspace import _workspace_path
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="No workspace")
    
    full_path = os.path.join(_workspace_path, path)
    if not os.path.realpath(full_path).startswith(os.path.realpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Path outside workspace")
    
    try:
        if os.path.isfile(full_path):
            os.remove(full_path)
        elif os.path.isdir(full_path):
            import shutil
            shutil.rmtree(full_path)
        else:
            raise HTTPException(status_code=404, detail="Not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workspace/create-file")
async def create_file(body: dict):
    """Creates an empty file at the specified path inside the workspace."""
    file_path = body.get("path", "")
    if not file_path:
        raise HTTPException(status_code=400, detail="path required")
    
    from workspace import _workspace_path
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="No workspace")
    
    full_path = os.path.join(_workspace_path, file_path)
    if not os.path.realpath(full_path).startswith(os.path.realpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Path outside workspace")
    
    if os.path.exists(full_path):
        raise HTTPException(status_code=409, detail="File already exists")
    
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write('')
        return {"success": True, "path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workspace/create-folder")
async def create_folder(body: dict):
    """Creates a folder at the specified path inside the workspace."""
    folder_path = body.get("path", "")
    if not folder_path:
        raise HTTPException(status_code=400, detail="path required")
    
    from workspace import _workspace_path
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="No workspace")
    
    full_path = os.path.join(_workspace_path, folder_path)
    if not os.path.realpath(full_path).startswith(os.path.realpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Path outside workspace")
    
    if os.path.exists(full_path):
        raise HTTPException(status_code=409, detail="Folder already exists")
    
    try:
        os.makedirs(full_path, exist_ok=False)
        return {"success": True, "path": folder_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/workspace/move")
async def move_file(body: dict):
    """Moves a file to a new location within the workspace."""
    src = body.get("src", "")
    dest = body.get("dest", "")
    if not src or not dest:
        raise HTTPException(status_code=400, detail="src and dest required")
    
    from workspace import _workspace_path
    full_src = os.path.join(_workspace_path, src) if _workspace_path else src
    full_dest = os.path.join(_workspace_path, dest) if _workspace_path else dest
    
    if not os.path.realpath(full_src).startswith(os.path.realpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Path outside workspace")
    
    try:
        import shutil
        shutil.move(full_src, full_dest)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Problems / Syntax Check ───────────────────────────────────────
@router.post("/workspace/check")
async def check_file(body: dict):
    """Syntax checking for multiple file types."""
    file_path = body.get("path", "")
    code = body.get("code", "")
    
    if not file_path:
        raise HTTPException(status_code=400, detail="path required")
    
    ext = os.path.splitext(file_path)[1].lower()
    diagnostics = []
    
    try:
        # ── Python ──────────────────────────────────────────────
        if ext == ".py":
            import ast
            try:
                ast.parse(code, filename=file_path)
            except SyntaxError as e:
                diagnostics.append({
                    "line": e.lineno or 1, "col": e.offset or 0,
                    "severity": "error", "message": str(e.msg),
                })
        
        # ── JSON ────────────────────────────────────────────────
        elif ext == ".json":
            import json as json_mod
            try:
                json_mod.loads(code)
            except json_mod.JSONDecodeError as e:
                diagnostics.append({
                    "line": e.lineno, "col": e.colno,
                    "severity": "error", "message": e.msg,
                })
        
        # ── XML / SVG ───────────────────────────────────────────
        elif ext in (".xml", ".svg"):
            import xml.etree.ElementTree as ET
            try:
                ET.fromstring(code)
            except ET.ParseError as e:
                pos = e.position if hasattr(e, 'position') else (1, 0)
                diagnostics.append({
                    "line": pos[0], "col": pos[1],
                    "severity": "error", "message": str(e),
                })
        
        # ── HTML ────────────────────────────────────────────────
        elif ext in (".html", ".htm"):
            from html.parser import HTMLParser
            class HTMLLint(HTMLParser):
                def __init__(self):
                    super().__init__()
                    self.tag_stack = []
                    self.errors = []
                    self.void_tags = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
                def handle_starttag(self, tag, attrs):
                    if tag.lower() not in self.void_tags:
                        self.tag_stack.append((tag.lower(), self.getpos()))
                def handle_endtag(self, tag):
                    if self.tag_stack and self.tag_stack[-1][0] == tag.lower():
                        self.tag_stack.pop()
                    elif self.tag_stack:
                        ln, col = self.getpos()
                        self.errors.append({
                            "line": ln, "col": col, "severity": "error",
                            "message": f"Mismatched tag: </{tag}>, expected </{self.tag_stack[-1][0]}>",
                        })
            try:
                parser = HTMLLint()
                parser.feed(code)
                diagnostics.extend(parser.errors)
                for tag, (ln, col) in parser.tag_stack:
                    diagnostics.append({
                        "line": ln, "col": col, "severity": "warning",
                        "message": f"Unclosed tag: <{tag}>",
                    })
            except Exception as e:
                diagnostics.append({"line": 1, "col": 0, "severity": "error", "message": str(e)})
        
        # ── CSS / SCSS / LESS ───────────────────────────────────
        elif ext in (".css", ".scss", ".less"):
            _bracket_check(code, diagnostics)
            # Check for common CSS errors
            lines = code.split("\n")
            in_block = 0
            for i, line in enumerate(lines, 1):
                stripped = line.strip()
                if '{' in stripped: in_block += stripped.count('{')
                if '}' in stripped: in_block -= stripped.count('}')
                # Property without semicolon (inside rule block)
                if in_block > 0 and ':' in stripped and not stripped.endswith((';', '{', '}', ',', '*/')) and not stripped.startswith(('/', '*', '@', '&')):
                    if stripped and not stripped.endswith('{'):
                        diagnostics.append({
                            "line": i, "col": len(line),
                            "severity": "warning", "message": "Missing semicolon",
                        })
        
        # ── YAML ────────────────────────────────────────────────
        elif ext in (".yaml", ".yml"):
            lines = code.split("\n")
            for i, line in enumerate(lines, 1):
                if line and not line.strip().startswith('#'):
                    leading = len(line) - len(line.lstrip())
                    if leading > 0 and '\t' in line[:leading]:
                        diagnostics.append({
                            "line": i, "col": 1, "severity": "error",
                            "message": "YAML does not allow tabs for indentation",
                        })
                    if line.rstrip().endswith(':') and i < len(lines):
                        next_line = lines[i] if i < len(lines) else ''
                        next_leading = len(next_line) - len(next_line.lstrip()) if next_line.strip() else 0
                        if next_line.strip() and next_leading <= leading and not next_line.strip().startswith('#'):
                            diagnostics.append({
                                "line": i + 1, "col": 1, "severity": "warning",
                                "message": "Expected indented block after ':'",
                            })
        
        # ── TOML ────────────────────────────────────────────────
        elif ext == ".toml":
            try:
                import tomllib
                tomllib.loads(code)
            except Exception as e:
                msg = str(e)
                line_num = 1
                import re
                m = re.search(r'line (\d+)', msg)
                if m: line_num = int(m.group(1))
                diagnostics.append({
                    "line": line_num, "col": 0,
                    "severity": "error", "message": msg,
                })
        
        # ── Markdown ────────────────────────────────────────────
        elif ext in (".md", ".mdx"):
            import re
            lines = code.split("\n")
            for i, line in enumerate(lines, 1):
                # Broken links: [text](  or [text]()
                if re.search(r'\[.*?\]\(\s*\)', line):
                    diagnostics.append({
                        "line": i, "col": 1, "severity": "warning",
                        "message": "Empty link URL",
                    })
                # Broken images: ![alt]()
                if re.search(r'!\[.*?\]\(\s*\)', line):
                    diagnostics.append({
                        "line": i, "col": 1, "severity": "warning",
                        "message": "Empty image URL",
                    })
                # Unclosed code fence
                if line.strip().startswith('```') and line.strip() != '```':
                    # Count code fences up to this point
                    fences = sum(1 for l in lines[:i] if l.strip().startswith('```'))
                    if fences % 2 != 0:
                        pass  # Will be caught after loop
            # Check unclosed code fences
            fence_count = sum(1 for l in lines if l.strip().startswith('```'))
            if fence_count % 2 != 0:
                diagnostics.append({
                    "line": len(lines), "col": 1, "severity": "warning",
                    "message": "Unclosed code fence (```) detected",
                })
        
        # ── JS / TS / JSX / TSX / Java / C / Go / Rust / etc ───
        elif ext in (".js", ".ts", ".jsx", ".tsx", ".java", ".c", ".cpp", ".h",
                      ".hpp", ".cs", ".go", ".rs", ".swift", ".kt", ".dart",
                      ".php", ".rb", ".lua", ".r", ".sql"):
            _bracket_check(code, diagnostics)
    
    except Exception as e:
        diagnostics.append({
            "line": 1, "col": 0, "severity": "error",
            "message": f"Check failed: {str(e)}"
        })
    
    return {"diagnostics": diagnostics, "path": file_path}

def _bracket_check(code: str, diagnostics: list):
    """Bracket matching for C-style languages."""
    stack = []
    pairs = {"(": ")", "[": "]", "{": "}"}
    closers = {")", "]", "}"}
    lines = code.split("\n")
    in_string = False
    string_char = None
    in_line_comment = False
    in_block_comment = False
    
    for line_num, line in enumerate(lines, 1):
        in_line_comment = False
        for col in range(len(line)):
            ch = line[col]
            prev = line[col-1] if col > 0 else ''
            nxt = line[col+1] if col + 1 < len(line) else ''
            
            # Block comment end
            if in_block_comment:
                if ch == '*' and nxt == '/':
                    in_block_comment = False
                continue
            # Line comment
            if in_line_comment:
                continue
            # Block comment start
            if ch == '/' and nxt == '*':
                in_block_comment = True
                continue
            # Line comment start
            if ch == '/' and nxt == '/': 
                in_line_comment = True
                continue
            # String handling
            if in_string:
                if ch == string_char and prev != '\\':
                    in_string = False
                continue
            if ch in ("'", '"', '`'):
                in_string = True
                string_char = ch
                continue
            
            if ch in pairs:
                stack.append((ch, line_num, col))
            elif ch in closers:
                if stack and pairs.get(stack[-1][0]) == ch:
                    stack.pop()
                else:
                    expected = pairs.get(stack[-1][0], "?") if stack else "none"
                    diagnostics.append({
                        "line": line_num, "col": col + 1,
                        "severity": "error",
                        "message": f"Unexpected '{ch}', expected '{expected}'",
                    })
    
    for opener, ln, cl in stack:
        diagnostics.append({
            "line": ln, "col": cl + 1,
            "severity": "error",
            "message": f"Unclosed '{opener}'",
        })

# ─── Live Preview — Static File Server ─────────────────────────────
import mimetypes

PREVIEW_CONSOLE_INJECT = """<script>
(function(){
  var _l=console.log,_e=console.error,_w=console.warn;
  function _n(t,a){try{window.parent.postMessage({type:'console',method:t,content:Array.from(a).map(function(x){return typeof x==='object'?JSON.stringify(x):String(x)}).join(' ')},'*')}catch(e){}}
  console.log=function(){_n('log',arguments);_l.apply(console,arguments)};
  console.error=function(){_n('error',arguments);_e.apply(console,arguments)};
  console.warn=function(){_n('warn',arguments);_w.apply(console,arguments)};
  window.onerror=function(m,u,l){_n('error',[m+' (line '+l+')'])};
})();
</script>"""


@router.get("/preview/folders")
async def preview_folders():
    """Lists workspace subdirectories for project folder picker."""
    from workspace import _workspace_path
    if not _workspace_path:
        return {"folders": []}

    SKIP = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', '.next', 'dist', 'build', '.cache'}
    folders = [{"name": "/ (raiz)", "path": ".", "has_entry": os.path.isfile(os.path.join(_workspace_path, "index.html"))}]

    try:
        for item in sorted(os.listdir(_workspace_path)):
            full = os.path.join(_workspace_path, item)
            if os.path.isdir(full) and item not in SKIP and not item.startswith('.'):
                has_entry = (
                    os.path.isfile(os.path.join(full, "index.html")) or
                    os.path.isfile(os.path.join(full, "package.json"))
                )
                folders.append({"name": item, "path": item, "has_entry": has_entry})
    except Exception as e:
        log.error(f"Preview folders error: {e}")

    return {"folders": folders}

@router.get("/preview/qr")
async def preview_qr():
    """Generates a QR code PNG for mobile preview on same Wi-Fi."""
    from workspace import _workspace_path
    from swarm_mesh import get_local_ip
    import io

    if not _workspace_path:
        raise HTTPException(status_code=400, detail="Nenhum workspace aberto")

    local_ip = get_local_ip()
    port = int(os.environ.get("LUMINA_PORT", 8000))
    preview_url = f"http://{local_ip}:{port}/api/preview/index.html"

    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=8, border=2)
        qr.add_data(preview_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="white", back_color="#1e1e2e")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        from starlette.responses import Response
        return Response(content=buf.getvalue(), media_type="image/png", headers={
            "X-Preview-URL": preview_url,
        })
    except ImportError:
        # qrcode not installed — return URL as JSON
        return {"url": preview_url, "message": "Install 'qrcode[pil]' for QR image"}


@router.get("/preview/{file_path:path}")
async def preview_file(file_path: str):
    """Serves workspace files as static content for Live Preview."""
    from workspace import _workspace_path

    if not _workspace_path:
        raise HTTPException(status_code=400, detail="Nenhum workspace aberto")

    # Default to index.html
    if not file_path or file_path == "":
        file_path = "index.html"

    # Search order: root → public/ → dist/ → src/
    search_dirs = [
        _workspace_path,
        os.path.join(_workspace_path, "public"),
        os.path.join(_workspace_path, "dist"),
        os.path.join(_workspace_path, "src"),
    ]

    full_path = None
    for base in search_dirs:
        candidate = os.path.join(base, file_path)
        # Security: prevent path traversal
        real_candidate = os.path.realpath(candidate)
        real_workspace = os.path.realpath(_workspace_path)
        if real_candidate.startswith(real_workspace) and os.path.isfile(real_candidate):
            full_path = real_candidate
            break

    if not full_path:
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(full_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    # For HTML files: inject console interceptor
    if mime_type == "text/html":
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            # Inject after <head> or at the start
            if "<head>" in html_content:
                html_content = html_content.replace("<head>", "<head>" + PREVIEW_CONSOLE_INJECT, 1)
            elif "<HEAD>" in html_content:
                html_content = html_content.replace("<HEAD>", "<HEAD>" + PREVIEW_CONSOLE_INJECT, 1)
            else:
                html_content = PREVIEW_CONSOLE_INJECT + html_content

            from starlette.responses import Response
            return Response(content=html_content, media_type="text/html")
        except Exception:
            pass  # fallback to FileResponse

    return FileResponse(full_path, media_type=mime_type)


# ─── Ollama LLM Management ──────────────────────────────────────────

OLLAMA_CATALOG = [
    # ─── Llama Family ────────────────────────────────────────────────
    {"id": "llama3.2:1b", "name": "Llama 3.2 1B", "params": "1b", "desc": "Ultra leve, respostas rápidas", "ram": "4GB", "vram": "2GB", "disk": "1.3GB", "tags": ["fast", "light"]},
    {"id": "llama3.2:3b", "name": "Llama 3.2 3B", "params": "3b", "desc": "Equilíbrio velocidade/qualidade", "ram": "6GB", "vram": "4GB", "disk": "2GB", "tags": ["balanced"]},
    {"id": "llama3.1:8b", "name": "Llama 3.1 8B", "params": "8b", "desc": "Recomendado — ótima qualidade", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["recommended"]},
    {"id": "llama3.1:70b", "name": "Llama 3.1 70B", "params": "70b", "desc": "Profissional — hardware potente", "ram": "64GB", "vram": "48GB", "disk": "40GB", "tags": ["pro"]},
    {"id": "llama3.1:405b", "name": "Llama 3.1 405B", "params": "405b", "desc": "Maior modelo aberto do mundo", "ram": "256GB+", "vram": "128GB+", "disk": "230GB", "tags": ["pro"]},
    # ─── Qwen Family ─────────────────────────────────────────────────
    {"id": "qwen2.5:0.5b", "name": "Qwen 2.5 0.5B", "params": "0.5b", "desc": "Nano — extremamente leve", "ram": "2GB", "vram": "1GB", "disk": "0.4GB", "tags": ["fast", "light"]},
    {"id": "qwen2.5:1.5b", "name": "Qwen 2.5 1.5B", "params": "1.5b", "desc": "Compacto e eficiente", "ram": "4GB", "vram": "2GB", "disk": "1.0GB", "tags": ["light"]},
    {"id": "qwen2.5:3b", "name": "Qwen 2.5 3B", "params": "3b", "desc": "Leve com boa qualidade", "ram": "6GB", "vram": "4GB", "disk": "2.0GB", "tags": ["balanced"]},
    {"id": "qwen2.5:7b", "name": "Qwen 2.5 7B", "params": "7b", "desc": "Bom em código e raciocínio", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["code", "balanced"]},
    {"id": "qwen2.5:14b", "name": "Qwen 2.5 14B", "params": "14b", "desc": "Alta qualidade, excelente código", "ram": "16GB", "vram": "12GB", "disk": "9.0GB", "tags": ["code", "quality"]},
    {"id": "qwen2.5:32b", "name": "Qwen 2.5 32B", "params": "32b", "desc": "Top tier — quase GPT-4", "ram": "32GB", "vram": "24GB", "disk": "20GB", "tags": ["pro", "quality"]},
    {"id": "qwen2.5:72b", "name": "Qwen 2.5 72B", "params": "72b", "desc": "Frontier — nível GPT-4", "ram": "64GB", "vram": "48GB", "disk": "42GB", "tags": ["pro"]},
    {"id": "qwen2.5-coder:7b", "name": "Qwen 2.5 Coder 7B", "params": "7b", "desc": "Otimizado para código", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["code"]},
    {"id": "qwen2.5-coder:14b", "name": "Qwen 2.5 Coder 14B", "params": "14b", "desc": "Código avançado", "ram": "16GB", "vram": "12GB", "disk": "9.0GB", "tags": ["code", "quality"]},
    {"id": "qwen2.5-coder:32b", "name": "Qwen 2.5 Coder 32B", "params": "32b", "desc": "Melhor coder open source", "ram": "32GB", "vram": "24GB", "disk": "20GB", "tags": ["code", "pro"]},
    # ─── DeepSeek Family ─────────────────────────────────────────────
    {"id": "deepseek-r1:1.5b", "name": "DeepSeek R1 1.5B", "params": "1.5b", "desc": "Reasoning leve", "ram": "4GB", "vram": "2GB", "disk": "1.1GB", "tags": ["light", "reasoning"]},
    {"id": "deepseek-r1:7b", "name": "DeepSeek R1 7B", "params": "7b", "desc": "Raciocínio chain-of-thought", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["reasoning"]},
    {"id": "deepseek-r1:8b", "name": "DeepSeek R1 8B", "params": "8b", "desc": "Distillado do R1 671B", "ram": "8GB", "vram": "6GB", "disk": "4.9GB", "tags": ["reasoning"]},
    {"id": "deepseek-r1:14b", "name": "DeepSeek R1 14B", "params": "14b", "desc": "Forte em matemática e lógica", "ram": "16GB", "vram": "12GB", "disk": "9.0GB", "tags": ["reasoning", "quality"]},
    {"id": "deepseek-r1:32b", "name": "DeepSeek R1 32B", "params": "32b", "desc": "Raciocínio avançado", "ram": "32GB", "vram": "24GB", "disk": "20GB", "tags": ["reasoning", "pro"]},
    {"id": "deepseek-r1:70b", "name": "DeepSeek R1 70B", "params": "70b", "desc": "Competing com o1", "ram": "64GB", "vram": "48GB", "disk": "42GB", "tags": ["reasoning", "pro"]},
    {"id": "deepseek-coder-v2:16b", "name": "DeepSeek Coder V2 16B", "params": "16b", "desc": "Código de alta qualidade", "ram": "16GB", "vram": "12GB", "disk": "9.4GB", "tags": ["code", "quality"]},
    {"id": "deepseek-coder:6.7b", "name": "DeepSeek Coder 6.7B", "params": "7b", "desc": "Focado em programação", "ram": "8GB", "vram": "6GB", "disk": "3.8GB", "tags": ["code"]},
    {"id": "deepseek-coder:33b", "name": "DeepSeek Coder 33B", "params": "33b", "desc": "Código profissional", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["code", "pro"]},
    # ─── Mistral Family ──────────────────────────────────────────────
    {"id": "mistral:7b", "name": "Mistral 7B", "params": "7b", "desc": "Versátil e eficiente", "ram": "8GB", "vram": "6GB", "disk": "4.1GB", "tags": ["versatile"]},
    {"id": "mistral-small:24b", "name": "Mistral Small 24B", "params": "24b", "desc": "Compacto e poderoso", "ram": "24GB", "vram": "18GB", "disk": "14GB", "tags": ["quality"]},
    {"id": "mistral-large:123b", "name": "Mistral Large 123B", "params": "123b", "desc": "Frontier da Mistral", "ram": "128GB", "vram": "80GB", "disk": "69GB", "tags": ["pro"]},
    {"id": "mixtral:8x7b", "name": "Mixtral 8x7B", "params": "47b", "desc": "Mixture of Experts", "ram": "48GB", "vram": "32GB", "disk": "26GB", "tags": ["pro", "moe"]},
    {"id": "mixtral:8x22b", "name": "Mixtral 8x22B", "params": "141b", "desc": "MoE massivo", "ram": "128GB+", "vram": "80GB+", "disk": "80GB", "tags": ["pro", "moe"]},
    # ─── Code Llama Family ───────────────────────────────────────────
    {"id": "codellama:7b", "name": "Code Llama 7B", "params": "7b", "desc": "Código Meta", "ram": "8GB", "vram": "6GB", "disk": "3.8GB", "tags": ["code"]},
    {"id": "codellama:13b", "name": "Code Llama 13B", "params": "13b", "desc": "Código avançado", "ram": "16GB", "vram": "10GB", "disk": "7.4GB", "tags": ["code"]},
    {"id": "codellama:34b", "name": "Code Llama 34B", "params": "34b", "desc": "Melhor qualidade", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["code", "pro"]},
    {"id": "codellama:70b", "name": "Code Llama 70B", "params": "70b", "desc": "Pro máximo", "ram": "64GB", "vram": "48GB", "disk": "38GB", "tags": ["code", "pro"]},
    # ─── Google Gemma Family ─────────────────────────────────────────
    {"id": "gemma2:2b", "name": "Gemma 2 2B", "params": "2b", "desc": "Google — leve e rápido", "ram": "4GB", "vram": "2GB", "disk": "1.6GB", "tags": ["light", "fast"]},
    {"id": "gemma2:9b", "name": "Gemma 2 9B", "params": "9b", "desc": "Google — boa qualidade", "ram": "12GB", "vram": "8GB", "disk": "5.4GB", "tags": ["quality"]},
    {"id": "gemma2:27b", "name": "Gemma 2 27B", "params": "27b", "desc": "Google — top tier", "ram": "28GB", "vram": "20GB", "disk": "16GB", "tags": ["quality", "pro"]},
    # ─── Microsoft Phi Family ────────────────────────────────────────
    {"id": "phi3:mini", "name": "Phi-3 Mini 3.8B", "params": "3.8b", "desc": "Microsoft — compacto", "ram": "4GB", "vram": "2GB", "disk": "2.3GB", "tags": ["light", "fast"]},
    {"id": "phi3:medium", "name": "Phi-3 Medium 14B", "params": "14b", "desc": "Microsoft — equilibrado", "ram": "16GB", "vram": "12GB", "disk": "7.9GB", "tags": ["balanced"]},
    {"id": "phi4:14b", "name": "Phi-4 14B", "params": "14b", "desc": "Microsoft — mais recente", "ram": "16GB", "vram": "12GB", "disk": "9.1GB", "tags": ["quality"]},
    # ─── StarCoder / Code ────────────────────────────────────────────
    {"id": "starcoder2:3b", "name": "StarCoder2 3B", "params": "3b", "desc": "Autocomplete rápido", "ram": "6GB", "vram": "4GB", "disk": "1.7GB", "tags": ["code", "light"]},
    {"id": "starcoder2:7b", "name": "StarCoder2 7B", "params": "7b", "desc": "Código versátil", "ram": "8GB", "vram": "6GB", "disk": "4.0GB", "tags": ["code"]},
    {"id": "starcoder2:15b", "name": "StarCoder2 15B", "params": "15b", "desc": "Código de alta qualidade", "ram": "16GB", "vram": "12GB", "disk": "9.0GB", "tags": ["code", "quality"]},
    # ─── Others ──────────────────────────────────────────────────────
    {"id": "command-r:35b", "name": "Command R 35B", "params": "35b", "desc": "Cohere — RAG otimizado", "ram": "32GB", "vram": "24GB", "disk": "20GB", "tags": ["quality"]},
    {"id": "command-r-plus:104b", "name": "Command R+ 104B", "params": "104b", "desc": "Cohere — enterprise", "ram": "128GB", "vram": "80GB+", "disk": "60GB", "tags": ["pro"]},
    {"id": "yi:6b", "name": "Yi 6B", "params": "6b", "desc": "01.AI — multilíngue", "ram": "8GB", "vram": "6GB", "disk": "3.5GB", "tags": ["balanced"]},
    {"id": "yi:34b", "name": "Yi 34B", "params": "34b", "desc": "01.AI — alta qualidade", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["quality", "pro"]},
    {"id": "solar:10.7b", "name": "Solar 10.7B", "params": "11b", "desc": "Upstage — eficiente", "ram": "12GB", "vram": "8GB", "disk": "6.1GB", "tags": ["balanced"]},
    {"id": "nous-hermes2:34b", "name": "Nous Hermes 2 34B", "params": "34b", "desc": "Nous — instruct afinado", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["quality"]},
    {"id": "wizardcoder:33b", "name": "WizardCoder 33B", "params": "33b", "desc": "Wizard — coding expert", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["code", "pro"]},
    {"id": "vicuna:7b", "name": "Vicuna 7B", "params": "7b", "desc": "LMSYS — chat versátil", "ram": "8GB", "vram": "6GB", "disk": "3.8GB", "tags": ["versatile"]},
    {"id": "vicuna:13b", "name": "Vicuna 13B", "params": "13b", "desc": "LMSYS — chat avançado", "ram": "16GB", "vram": "10GB", "disk": "7.4GB", "tags": ["versatile"]},
    {"id": "orca-mini:3b", "name": "Orca Mini 3B", "params": "3b", "desc": "Microsoft — leve reasoning", "ram": "6GB", "vram": "4GB", "disk": "1.9GB", "tags": ["light", "reasoning"]},
    {"id": "orca-mini:7b", "name": "Orca Mini 7B", "params": "7b", "desc": "Microsoft — reasoning", "ram": "8GB", "vram": "6GB", "disk": "3.8GB", "tags": ["reasoning"]},
    {"id": "orca-mini:13b", "name": "Orca Mini 13B", "params": "13b", "desc": "Microsoft — reasoning+", "ram": "16GB", "vram": "10GB", "disk": "7.4GB", "tags": ["reasoning"]},
    # ─── ChatGLM (Zhipu) ────────────────────────────────────────────
    {"id": "glm4:9b", "name": "GLM-4 9B", "params": "9b", "desc": "Zhipu — forte em chinês e inglês", "ram": "12GB", "vram": "8GB", "disk": "5.5GB", "tags": ["balanced", "quality"]},
    # ─── InternLM (Shanghai AI Lab) ─────────────────────────────────
    {"id": "internlm2:7b", "name": "InternLM2 7B", "params": "7b", "desc": "Shanghai AI Lab — multilíngue", "ram": "8GB", "vram": "6GB", "disk": "4.5GB", "tags": ["balanced"]},
    {"id": "internlm2:20b", "name": "InternLM2 20B", "params": "20b", "desc": "Shanghai AI Lab — qualidade alta", "ram": "24GB", "vram": "16GB", "disk": "12GB", "tags": ["quality"]},
    # ─── NVIDIA Nemotron ────────────────────────────────────────────
    {"id": "nemotron-mini:4b", "name": "Nemotron Mini 4B", "params": "4b", "desc": "NVIDIA — compacto e eficiente", "ram": "6GB", "vram": "4GB", "disk": "2.7GB", "tags": ["light", "fast"]},
    {"id": "nemotron:70b", "name": "Nemotron 70B", "params": "70b", "desc": "NVIDIA — frontier model", "ram": "64GB", "vram": "48GB", "disk": "42GB", "tags": ["pro"]},
    # ─── Dolphin (Cognitivecomputing) ───────────────────────────────
    {"id": "dolphin-mixtral:8x7b", "name": "Dolphin Mixtral 8x7B", "params": "47b", "desc": "Uncensored MoE — muito capaz", "ram": "48GB", "vram": "32GB", "disk": "26GB", "tags": ["pro", "moe"]},
    {"id": "dolphin-llama3:8b", "name": "Dolphin Llama3 8B", "params": "8b", "desc": "Uncensored — baseado Llama3", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["versatile"]},
    {"id": "dolphin-llama3:70b", "name": "Dolphin Llama3 70B", "params": "70b", "desc": "Uncensored — pro", "ram": "64GB", "vram": "48GB", "disk": "40GB", "tags": ["pro"]},
    # ─── Zephyr (HuggingFace) ───────────────────────────────────────
    {"id": "zephyr:7b", "name": "Zephyr 7B", "params": "7b", "desc": "HuggingFace — DPO afinado", "ram": "8GB", "vram": "6GB", "disk": "4.1GB", "tags": ["balanced"]},
    # ─── OpenHermes (Teknium) ───────────────────────────────────────
    {"id": "openhermes:7b", "name": "OpenHermes 2.5 7B", "params": "7b", "desc": "Teknium — instruct otimizado", "ram": "8GB", "vram": "6GB", "disk": "4.1GB", "tags": ["balanced"]},
    # ─── TinyLlama ──────────────────────────────────────────────────
    {"id": "tinyllama:1.1b", "name": "TinyLlama 1.1B", "params": "1.1b", "desc": "Ultra leve — edge/mobile", "ram": "2GB", "vram": "1GB", "disk": "0.6GB", "tags": ["fast", "light"]},
    # ─── IBM Granite ────────────────────────────────────────────────
    {"id": "granite-code:3b", "name": "Granite Code 3B", "params": "3b", "desc": "IBM — código enterprise", "ram": "6GB", "vram": "4GB", "disk": "2.0GB", "tags": ["code", "light"]},
    {"id": "granite-code:8b", "name": "Granite Code 8B", "params": "8b", "desc": "IBM — código robusto", "ram": "8GB", "vram": "6GB", "disk": "4.6GB", "tags": ["code"]},
    {"id": "granite-code:20b", "name": "Granite Code 20B", "params": "20b", "desc": "IBM — código avançado", "ram": "24GB", "vram": "16GB", "disk": "12GB", "tags": ["code", "quality"]},
    {"id": "granite-code:34b", "name": "Granite Code 34B", "params": "34b", "desc": "IBM — código pro", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["code", "pro"]},
    # ─── Falcon (TII) ───────────────────────────────────────────────
    {"id": "falcon:7b", "name": "Falcon 7B", "params": "7b", "desc": "TII UAE — multilíngue", "ram": "8GB", "vram": "6GB", "disk": "3.9GB", "tags": ["balanced"]},
    {"id": "falcon:40b", "name": "Falcon 40B", "params": "40b", "desc": "TII UAE — alta qualidade", "ram": "40GB", "vram": "30GB", "disk": "23GB", "tags": ["pro"]},
    {"id": "falcon2:11b", "name": "Falcon 2 11B", "params": "11b", "desc": "TII UAE — versão 2", "ram": "12GB", "vram": "8GB", "disk": "6.4GB", "tags": ["balanced"]},
    # ─── MiniCPM (OpenBMB) ──────────────────────────────────────────
    {"id": "minicpm-v:8b", "name": "MiniCPM-V 8B", "params": "8b", "desc": "OpenBMB — visão + texto", "ram": "8GB", "vram": "6GB", "disk": "4.9GB", "tags": ["balanced"]},
    # ─── Stable Code (Stability AI) ─────────────────────────────────
    {"id": "stable-code:3b", "name": "Stable Code 3B", "params": "3b", "desc": "Stability AI — autocomplete", "ram": "6GB", "vram": "4GB", "disk": "1.6GB", "tags": ["code", "light"]},
    # ─── OpenChat ───────────────────────────────────────────────────
    {"id": "openchat:7b", "name": "OpenChat 3.5 7B", "params": "7b", "desc": "C-RLFT — chat otimizado", "ram": "8GB", "vram": "6GB", "disk": "4.1GB", "tags": ["versatile"]},
    # ─── Intel Neural Chat ──────────────────────────────────────────
    {"id": "neural-chat:7b", "name": "Neural Chat 7B", "params": "7b", "desc": "Intel — otimizado para diálogo", "ram": "8GB", "vram": "6GB", "disk": "4.1GB", "tags": ["versatile"]},
    # ─── Vision Models ──────────────────────────────────────────────
    {"id": "llava:7b", "name": "LLaVA 7B", "params": "7b", "desc": "Visão — descreve imagens", "ram": "8GB", "vram": "6GB", "disk": "4.5GB", "tags": ["balanced"]},
    {"id": "llava:13b", "name": "LLaVA 13B", "params": "13b", "desc": "Visão — imagens detalhadas", "ram": "16GB", "vram": "10GB", "disk": "8.0GB", "tags": ["quality"]},
    {"id": "llava:34b", "name": "LLaVA 34B", "params": "34b", "desc": "Visão — alta qualidade", "ram": "32GB", "vram": "24GB", "disk": "19GB", "tags": ["pro"]},
    {"id": "bakllava:7b", "name": "BakLLaVA 7B", "params": "7b", "desc": "Visão — Mistral base", "ram": "8GB", "vram": "6GB", "disk": "4.5GB", "tags": ["balanced"]},
    # ─── Safety / Guard ─────────────────────────────────────────────
    {"id": "llama-guard3:8b", "name": "Llama Guard 3 8B", "params": "8b", "desc": "Meta — moderação de conteúdo", "ram": "8GB", "vram": "6GB", "disk": "4.7GB", "tags": ["balanced"]},
    # ─── CodeGemma ──────────────────────────────────────────────────
    {"id": "codegemma:2b", "name": "CodeGemma 2B", "params": "2b", "desc": "Google — código leve", "ram": "4GB", "vram": "2GB", "disk": "1.6GB", "tags": ["code", "light"]},
    {"id": "codegemma:7b", "name": "CodeGemma 7B", "params": "7b", "desc": "Google — código versátil", "ram": "8GB", "vram": "6GB", "disk": "5.0GB", "tags": ["code"]},
]

@router.get("/ollama/sysinfo")
async def ollama_sysinfo():
    """Return system RAM, disk, and VRAM info for model compatibility."""
    import shutil, subprocess
    info = {"ram_total": "?", "ram_free": "?", "disk_total": "?", "disk_free": "?", "vram_total": "?", "vram_free": "?"}
    try:
        import psutil
        mem = psutil.virtual_memory()
        info["ram_total"] = f"{mem.total / (1024**3):.1f}GB"
        info["ram_free"] = f"{mem.available / (1024**3):.1f}GB"
    except ImportError:
        pass
    try:
        usage = shutil.disk_usage("C:\\")
        info["disk_total"] = f"{usage.total / (1024**3):.0f}GB"
        info["disk_free"] = f"{usage.free / (1024**3):.0f}GB"
    except Exception:
        pass
    try:
        r = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.total,memory.free", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=5
        )
        if r.returncode == 0 and r.stdout.strip():
            parts = r.stdout.strip().split(",")
            if len(parts) >= 2:
                info["vram_total"] = f"{int(parts[0].strip()) / 1024:.1f}GB"
                info["vram_free"] = f"{int(parts[1].strip()) / 1024:.1f}GB"
    except Exception:
        info["vram_total"] = "N/A (CPU)"
        info["vram_free"] = "N/A"
    return info

@router.get("/ollama/models")
async def ollama_list_models():
    """List locally installed Ollama models."""
    import subprocess
    try:
        result = subprocess.run(
            ["ollama", "list"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            return {"installed": [], "error": "Ollama not running or not installed"}

        models = []
        lines = result.stdout.strip().split("\n")
        for line in lines[1:]:  # Skip header
            parts = line.split()
            if len(parts) >= 2:
                name = parts[0]
                size = parts[2] + " " + parts[3] if len(parts) >= 4 else parts[2] if len(parts) >= 3 else "?"
                models.append({"id": name, "size": size})
        return {"installed": models}
    except FileNotFoundError:
        return {"installed": [], "error": "Ollama not found. Install from https://ollama.ai"}
    except Exception as e:
        return {"installed": [], "error": str(e)}


@router.get("/ollama/available")
async def ollama_available():
    """Return catalog of available models with hardware specs."""
    import re as _re
    # Get installed model names from Ollama API
    installed_names: list = []
    try:
        import httpx
        from ollama_orchestrator import get_orchestrator
        orch = get_orchestrator()
        if orch.is_running():
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{orch.base_url}/api/tags")
                if resp.status_code == 200:
                    models_data = resp.json().get("models", [])
                    for m in models_data:
                        name = m.get("name", "")
                        if name:
                            installed_names.append(name)
        else:
            import subprocess
            result = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n")[1:]:
                    parts = line.split()
                    if parts:
                        installed_names.append(parts[0].strip())
    except Exception as e:
        log.warning(f"Failed to fetch installed models: {e}")

    log.info(f"🧠 LLM Panel: Installed models from Ollama: {installed_names}")

    def _check_installed(catalog_id: str):
        """Precise matching: base name + size portion must match.
        E.g. catalog 'qwen2.5:14b' matches 'qwen2.5:14b-instruct' but NOT 'qwen2.5:32b-instruct'."""
        cat_base = catalog_id.split(":")[0]
        cat_tag = catalog_id.split(":")[-1] if ":" in catalog_id else ""
        
        for inst_name in installed_names:
            norm = inst_name.replace(":latest", "") if inst_name.endswith(":latest") else inst_name
            if norm == catalog_id:
                return True, inst_name
            
            inst_base = inst_name.split(":")[0]
            inst_tag = inst_name.split(":")[-1] if ":" in inst_name else ""
            
            if cat_base != inst_base:
                continue
            
            # Extract size part: '14b-instruct' → '14b', '7b' → '7b'
            cat_size = _re.match(r'^[\d.]+[bBmM]?', cat_tag)
            inst_size = _re.match(r'^[\d.]+[bBmM]?', inst_tag)
            
            if cat_size and inst_size:
                if cat_size.group(0).lower() == inst_size.group(0).lower():
                    return True, inst_name
            elif cat_tag and inst_tag and inst_tag.startswith(cat_tag):
                return True, inst_name
        
        return False, None

    catalog = []
    for model in OLLAMA_CATALOG:
        is_installed, actual_name = _check_installed(model["id"])
        entry = {**model, "installed": is_installed}
        if actual_name:
            entry["installed_name"] = actual_name
        catalog.append(entry)
    
    installed_count = sum(1 for c in catalog if c["installed"])
    log.info(f"🧠 LLM Panel: {installed_count} catalog models matched as installed")
    return {"catalog": catalog, "installed_count": installed_count}


@router.post("/ollama/pull")
async def ollama_pull(body: dict):
    """Pull/download an Ollama model with streaming progress via SSE."""
    import httpx
    model_id = body.get("model", "")
    if not model_id:
        raise HTTPException(status_code=400, detail="model is required")

    log.info(f"📥 Pulling Ollama model: {model_id}")

    async def progress_stream():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    "http://127.0.0.1:11434/api/pull",
                    json={"name": model_id, "stream": True},
                ) as resp:
                    async for line in resp.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            import json as _json
                            data = _json.loads(line)
                            status = data.get("status", "")
                            total = data.get("total", 0)
                            completed = data.get("completed", 0)
                            pct = int((completed / total) * 100) if total > 0 else 0
                            evt = _json.dumps({
                                "status": status,
                                "percent": pct,
                                "completed": completed,
                                "total": total,
                            })
                            yield f"data: {evt}\n\n"
                        except Exception:
                            yield f"data: {{\"status\":\"{line}\",\"percent\":0}}\n\n"
            yield f"data: {{\"status\":\"done\",\"percent\":100}}\n\n"
        except Exception as e:
            yield f"data: {{\"status\":\"error\",\"error\":\"{str(e)}\"}}\n\n"

    return StreamingResponse(progress_stream(), media_type="text/event-stream")


@router.delete("/ollama/delete")
async def ollama_delete(body: dict):
    """Delete an installed Ollama model via Ollama API."""
    model_id = body.get("model", "")
    if not model_id:
        raise HTTPException(status_code=400, detail="model is required")

    log.info(f"🗑️ Deleting Ollama model: {model_id}")
    try:
        # Try API first (more reliable)
        import httpx
        from ollama_orchestrator import get_orchestrator
        orch = get_orchestrator()
        if orch.is_running():
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.request(
                    "DELETE",
                    f"{orch.base_url}/api/delete",
                    json={"name": model_id}
                )
                if resp.status_code == 200:
                    log.info(f"✅ Model {model_id} deleted via API")
                    return {"status": "deleted", "model": model_id}
                else:
                    log.warning(f"API delete failed ({resp.status_code}), trying CLI...")
        
        # Fallback to CLI
        import subprocess
        result = subprocess.run(
            ["ollama", "rm", model_id],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return {"status": "error", "message": result.stderr}
        return {"status": "deleted", "model": model_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Unload Model from VRAM ─────────────────────────────────────────
@router.post("/ollama/unload")
async def ollama_unload_model(body: dict):
    """Unload a model from Ollama VRAM without stopping the server.
    Uses keep_alive=0 trick to force immediate unload."""
    model = body.get("model", "").strip()
    if not model:
        return {"status": "error", "detail": "No model specified"}
    log.info(f"⏹ Unloading model: '{model}'")
    
    try:
        settings = get_settings()
        host = settings.ollama_host
        port = settings.ollama_port
        ollama_url = f"http://{host}:{port}"
        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            # keep_alive=0 with stream=false tells Ollama to unload immediately
            resp = await client.post(
                f"{ollama_url}/api/generate",
                json={"model": model, "prompt": "", "keep_alive": 0, "stream": False}
            )
            log.info(f"⏹ Ollama unload response: {resp.status_code} — {resp.text[:200]}")
            
            if resp.status_code == 200:
                # Verify it actually unloaded (Ollama needs time to release VRAM)
                try:
                    import asyncio as _aio
                    await _aio.sleep(2)  # Give Ollama time to release the model
                    ps_resp = await client.get(f"{ollama_url}/api/ps")
                    ps_data = ps_resp.json()
                    loaded = [m.get("name", "") for m in ps_data.get("models", [])]
                    if model not in loaded:
                        log.info(f"✅ Modelo {model} descarregado da VRAM com sucesso")
                        return {"status": "ok", "message": f"Modelo {model} descarregado da VRAM"}
                    else:
                        log.warning(f"⚠️ Modelo {model} ainda aparece em /api/ps após unload")
                        return {"status": "ok", "message": f"Comando enviado, modelo pode demorar para descarregar"}
                except Exception:
                    return {"status": "ok", "message": f"Modelo {model} — comando de unload enviado"}
            else:
                return {"status": "error", "detail": f"Ollama returned {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        log.error(f"❌ Falha ao descarregar modelo: {e}")
        return {"status": "error", "detail": str(e)}

@router.get("/ollama/ps")
async def ollama_ps():
    """Check which models are currently loaded in Ollama VRAM."""
    try:
        settings = get_settings()
        host = settings.ollama_host
        port = settings.ollama_port
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://{host}:{port}/api/ps")
            return resp.json()
    except Exception as e:
        return {"models": [], "error": str(e)}


@router.get("/ollama/probe")
async def ollama_probe(host: str = "127.0.0.1", port: int = 11434):
    """Check if Ollama is reachable on a given host:port (used by Hive node selection)."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"http://{host}:{port}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                return {"reachable": True, "host": host, "port": port, "models": models}
            return {"reachable": False, "host": host, "port": port, "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"reachable": False, "host": host, "port": port, "error": str(e)}


# ─── Health ─────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    """Simple health check."""
    log.info("💓 /health — OK")
    return {"status": "ok", "service": "lumina-backend"}

# ─── Frontend Log Receiver ──────────────────────────────────────────
@router.post("/frontend-log")
async def frontend_log(request: Request):
    """Receives frontend error logs and persists them to backend log file."""
    try:
        body = await request.json()
        level = body.get("level", "INFO").upper()
        message = body.get("message", "")
        source = body.get("source", "")
        timestamp = body.get("timestamp", "")
        
        log_msg = f"[FRONTEND:{level}] {message}"
        if source:
            log_msg += f" (source: {source})"
        if timestamp:
            log_msg += f" @ {timestamp}"
        
        if level in ("ERROR", "FATAL"):
            log.error(log_msg)
        elif level == "WARNING":
            log.warning(log_msg)
        else:
            log.info(log_msg)
        
        return {"status": "logged"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# ─── System Logs ────────────────────────────────────────────────────
@router.get("/system/logs")
async def system_logs_sse(request: Request):
    """Stream backend logs via SSE to the frontend."""
    q = asyncio.Queue()
    LOG_SUBSCRIBERS.append(q)
    
    async def log_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=2.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            if q in LOG_SUBSCRIBERS:
                LOG_SUBSCRIBERS.remove(q)
    return StreamingResponse(log_generator(), media_type="text/event-stream")

# ─── Watcher (Nervo Óptico) ─────────────────────────────────────────

# Global set of active websocket connections for the watcher
WATCHER_SUBSCRIBERS: Set[WebSocket] = set()

async def notify_watcher_clients(file_path: str):
    """Callback fired by watchdog when a file is modified."""
    from healer import heal_file
    
    if not WATCHER_SUBSCRIBERS:
        return
        
    # Run silent syntax validation (Auto-Healing Cérebro Proativo v4.0)
    analysis_result = await asyncio.to_thread(heal_file, file_path)
    
    # Trigger Project Y Brain Indexing (v6.0)
    from brain import brain
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        asyncio.create_task(brain.index_code(file_path, content))
    except Exception as e:
        log.error(f"Brain indexing failed: {e}")
    
    if analysis_result:
        msg = {
            "event": "ANALYSIS_RESULT",
            "path": file_path,
            "error": analysis_result,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        msg = {
            "event": "file_modified",
            "path": file_path,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    dead_sockets = set()
    for ws in WATCHER_SUBSCRIBERS:
        try:
            await ws.send_json(msg)
        except Exception:
            dead_sockets.add(ws)
            
    for ws in dead_sockets:
        WATCHER_SUBSCRIBERS.discard(ws)

@router.websocket("/ws/watcher")
async def watcher_websocket(websocket: WebSocket):
    """Frontend connects here to receive real-time file modification events."""
    from workspace import _workspace_path, SKIP_DIRS
    
    await websocket.accept()
    WATCHER_SUBSCRIBERS.add(websocket)
    
    # Start the watcher if it isn't running and we have a workspace
    watcher = get_watcher(notify_watcher_clients)
    if _workspace_path and not watcher.observer:
        loop = asyncio.get_running_loop()
        watcher.start(_workspace_path, SKIP_DIRS, loop)
        
    try:
        while True:
            # Keep alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        WATCHER_SUBSCRIBERS.discard(websocket)
    except Exception as e:
        log.error(f"Watcher WS Error: {e}")
        WATCHER_SUBSCRIBERS.discard(websocket)

@router.get("/sentinel/status")
async def get_sentinel_status():
    """Reports the current status of the active defense sentinel."""
    return {
        "is_active": sentinel._sentinel_running,
        "panic_triggered": sentinel.PANIC_TRIGGERED,
        "reason": sentinel.LAST_REASON
    }


# ─── Canvas Image Upload ──────────────────────────────────────────
@router.post("/canvas/upload-image")
async def canvas_upload_image(file: UploadFile = File(...)):
    """Upload an image for use in canvas nodes.

    Saves to <workspace>/canvas-images/<uuid>.<ext> and returns the
    relative path to use in the .canvas JSON.
    """
    import workspace as ws
    ws._load_workspace_from_db()

    if not ws._workspace_path:
        raise HTTPException(400, "Nenhum workspace ativo")

    img_dir = os.path.join(ws._workspace_path, "canvas-images")
    os.makedirs(img_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "img.png")[1] or ".png"
    name = f"{uuid.uuid4().hex[:12]}{ext}"
    dest = os.path.join(img_dir, name)

    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)

    rel_path = f"canvas-images/{name}"
    log.info(f"[Canvas] Image saved: {rel_path} ({len(content)} bytes)")
    return {"path": rel_path, "full_path": dest, "size": len(content)}


@router.get("/canvas/images/{filename}")
async def canvas_serve_image(filename: str):
    """Serve a canvas image from the workspace's canvas-images folder."""
    from fastapi.responses import FileResponse
    import workspace as ws
    ws._load_workspace_from_db()

    if not ws._workspace_path:
        raise HTTPException(400, "Nenhum workspace ativo")

    filepath = os.path.join(ws._workspace_path, "canvas-images", filename)
    if not os.path.isfile(filepath):
        raise HTTPException(404, f"Imagem nao encontrada: {filename}")

    return FileResponse(filepath)
