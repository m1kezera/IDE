"""Lumina IDE — Cloud API Handler.

Handles all cloud LLM providers: OpenAI, Anthropic, Groq, Google, xAI,
NVIDIA, DeepSeek, Together, Mistral, HuggingFace, Replicate.

Moved from router.py to keep provider-specific logic isolated.
"""

from __future__ import annotations

import json
import logging
import requests
from typing import Optional, List, Generator

from config import Settings

log = logging.getLogger("projecty.handler.cloud")


# ─── Cloud Provider Base URLs ───────────────────────────────────────
CLOUD_BASE_URLS = {
    "openai":     "https://api.openai.com/v1",
    "anthropic":  "https://api.anthropic.com/v1",
    "groq":       "https://api.groq.com/openai/v1",
    "google":     "https://generativelanguage.googleapis.com/v1beta/openai",
    "xai":        "https://api.x.ai/v1",
    "nvidia":     "https://integrate.api.nvidia.com/v1",
    "deepseek":   "https://api.deepseek.com/v1",
    "together":   "https://api.together.xyz/v1",
    "mistralai":  "https://api.mistral.ai/v1",
    "huggingface":"https://api-inference.huggingface.co/v1",
    "replicate":  "https://api.replicate.com/v1",
    "custom":     "https://api.openai.com/v1",
}


def _detect_provider(api_key: str) -> str:
    """Guess the cloud provider from the API key prefix."""
    if not api_key:
        return ""
    k = api_key.strip()
    if k.startswith("sk-ant-"):   return "anthropic"
    if k.startswith("sk-"):       return "openai"
    if k.startswith("gsk_"):      return "groq"
    if k.startswith("AIza"):      return "google"
    if k.startswith("r8_") or k.startswith("p_"): return "replicate"
    if k.startswith("hf_"):       return "huggingface"
    if k.startswith("xai-"):      return "xai"
    if k.startswith("nvapi-"):    return "nvidia"
    return "custom"


def stream(
    prompt: str,
    model: str,
    settings: Settings,
    fmt: Optional[str],
    enhanced_system_prompt: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> Generator[str, None, None]:
    """Stream SSE events from a cloud LLM provider.

    Supports OpenAI-compatible format and Anthropic Messages API.
    """
    from agent import SYSTEM_PROMPT_TOOLS

    api_key = getattr(settings, 'cloud_api_key', '')
    if not api_key:
        yield f"data: {json.dumps({'error': '❌ Nenhuma API key configurada. Vá em Configurações → Cloud API.', 'done': True})}\n\n"
        return

    provider = _detect_provider(api_key)
    base_url = CLOUD_BASE_URLS.get(provider, CLOUD_BASE_URLS["custom"])
    system_prompt = enhanced_system_prompt or SYSTEM_PROMPT_TOOLS

    if history is None:
        history = []

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    total_prompt = 0
    total_completion = 0

    try:
        if provider == "anthropic":
            yield from _stream_anthropic(base_url, api_key, model, messages, system_prompt)
        else:
            yield from _stream_openai_compat(base_url, api_key, provider, model, messages)

    except requests.ConnectionError:
        yield f"data: {json.dumps({'error': f'Não foi possível conectar ao {provider}.', 'done': True})}\n\n"
    except requests.Timeout:
        yield f"data: {json.dumps({'error': f'Timeout na conexão com {provider}.', 'done': True})}\n\n"
    except Exception as exc:
        log.error(f"Cloud stream error: {exc}")
        yield f"data: {json.dumps({'error': f'Erro cloud: {exc}', 'done': True})}\n\n"


def _stream_anthropic(base_url, api_key, model, messages, system_text):
    """Anthropic Messages API streaming."""
    log.info(f"☁️ Cloud stream: Anthropic, model={model}")
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    anthropic_messages = [m for m in messages if m["role"] != "system"]

    payload = {
        "model": model,
        "max_tokens": 8192,
        "system": system_text,
        "messages": anthropic_messages,
        "stream": True,
    }

    total_prompt = 0
    total_completion = 0

    with requests.post(
        f"{base_url}/messages", headers=headers, json=payload,
        stream=True, timeout=(30, 600),
    ) as resp:
        if resp.status_code != 200:
            yield f"data: {json.dumps({'error': f'Anthropic API error ({resp.status_code}): {resp.text[:500]}', 'done': True})}\n\n"
            return

        resp.encoding = 'utf-8'
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str.strip() == "[DONE]":
                break
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            event_type = data.get("type", "")

            if event_type == "content_block_delta":
                token = data.get("delta", {}).get("text", "")
                yield f"data: {json.dumps({'token': token, 'done': False}, ensure_ascii=False)}\n\n"
            elif event_type == "message_start":
                total_prompt = data.get("message", {}).get("usage", {}).get("input_tokens", 0)
            elif event_type == "message_delta":
                total_completion = data.get("usage", {}).get("output_tokens", 0)
            elif event_type == "message_stop":
                yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"

    yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"


def _stream_openai_compat(base_url, api_key, provider, model, messages):
    """OpenAI-compatible API streaming (OpenAI, Groq, xAI, etc.)."""
    log.info(f"☁️ Cloud stream: {provider} (OpenAI-compatible), model={model}")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "max_tokens": 8192,
    }

    total_prompt = 0
    total_completion = 0

    with requests.post(
        f"{base_url}/chat/completions", headers=headers, json=payload,
        stream=True, timeout=(30, 600),
    ) as resp:
        if resp.status_code != 200:
            yield f"data: {json.dumps({'error': f'{provider} API error ({resp.status_code}): {resp.text[:500]}', 'done': True})}\n\n"
            return

        resp.encoding = 'utf-8'
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data: "):
                continue
            data_str = line[6:]
            if data_str.strip() == "[DONE]":
                yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"
                break
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue

            choices = data.get("choices", [])
            if choices:
                token = choices[0].get("delta", {}).get("content", "")
                if token:
                    yield f"data: {json.dumps({'token': token, 'done': False}, ensure_ascii=False)}\n\n"

            usage = data.get("usage")
            if usage:
                total_prompt = usage.get("prompt_tokens", 0)
                total_completion = usage.get("completion_tokens", 0)

    yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"
