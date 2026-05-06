"""Lumina IDE — Small Model Handler (≤8B parameters).

Handles models like dolphin3:8b, phi3, gemma:7b, mistral:7b, qwen2.5:7b.

Strategy:
- Tools ARE enabled (simplified set: file_write, file_read, list_directory, bash)
- No file_edit (too complex — 8B models can't match old_string precisely)
- No search_files or file_delete (simplify cognitive load)
- Hybrid system prompt: TOOLS format + FILE: syntax examples as fallback
- Smaller context window (4096) — keeps model fast and focused
- Agent loop limited to 3 rounds — small models degrade in multi-turn
- Fuzzy parser always active as safety net
- Temperature 0.3 — more deterministic, fewer hallucinations
"""

from __future__ import annotations

import json
import logging
import time
import requests
from typing import Optional, List, Generator

from config import Settings
from model_tiers import TierConfig, get_simplified_tools, TIER_CONFIGS, ModelTier

log = logging.getLogger("projecty.handler.small")

# ═══════════════════════════════════════════════════════════════════════
# HYBRID SYSTEM PROMPT — Tools + FILE: syntax examples
# ═══════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT_SMALL = """You are Lumina, an AI coding assistant in the Lumina IDE.
ALWAYS respond in Portuguese (pt-BR).

═══ SUAS TOOLS ═══

Você tem 4 tools para trabalhar com arquivos:
- `file_write(path, content)` → Cria/sobrescreve arquivo
- `file_read(path)` → Lê arquivo com line numbers
- `list_directory(path)` → Lista arquivos/pastas
- `bash(command)` → Executa comando no terminal

═══ COMO AGIR ═══

Quando o usuário pedir para criar arquivos ou rodar comandos:
1. Use as tools acima para criar os arquivos
2. Use `bash` para instalar dependências e rodar comandos

═══ ALTERNATIVA (se tools não funcionarem) ═══

Se não conseguir chamar tools, use esta sintaxe:

FILE: nome_do_arquivo.py
```python
conteúdo completo aqui
```

COMMAND: pip install flask

═══ REGRAS ═══
- AÇÃO DIRETA: Quando pedirem para criar algo, FAÇA.
- CONTEÚDO COMPLETO: Sempre forneça o arquivo inteiro.
- PATHS RELATIVOS: Use caminhos relativos (ex: src/app.py).
- CONVERSAS: Se for só uma pergunta, responda em texto sem tools.
- Seja CONCISO e direto.
"""


def stream(
    prompt: str,
    model: str,
    settings: Settings,
    fmt: Optional[str],
    enhanced_system_prompt: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> Generator[str, None, None]:
    """Stream SSE events from a small model via Ollama.

    Uses simplified tools + fuzzy parser fallback.
    """
    from agent import execute_tool_call
    import workspace as ws
    ws._load_workspace_from_db()

    tier_config = TIER_CONFIGS[ModelTier.SMALL]
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
    system_prompt = enhanced_system_prompt or SYSTEM_PROMPT_SMALL
    simplified_tools = get_simplified_tools()

    if history is None:
        history = []

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    # ── Build payloads ──
    # Primary: /api/chat with simplified tools
    chat_payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "tools": simplified_tools,
        "options": {
            "num_ctx": tier_config.num_ctx,
            "temperature": tier_config.temperature,
        },
    }

    # Fallback: /api/generate with LEGACY-style prompt
    full_prompt = prompt
    if history:
        history_text = "\n".join(
            [f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}" for msg in history]
        )
        full_prompt = f"Histórico:\n{history_text}\n\nUSER:\n{prompt}"

    generate_payload = {
        "model": model,
        "system": system_prompt,
        "prompt": full_prompt,
        "stream": True,
        "options": {
            "num_ctx": tier_config.num_ctx,
            "temperature": tier_config.temperature,
        },
    }

    if fmt:
        chat_payload["format"] = fmt
        generate_payload["format"] = fmt

    log.info(f"🐤 [Small Handler] {model} — {len(simplified_tools)} tools, ctx={tier_config.num_ctx}")

    total_prompt = 0
    total_completion = 0
    tool_calls_accumulated = []

    endpoints = [
        (f"{base_url}/api/chat", chat_payload, "message"),
        (f"{base_url}/api/generate", generate_payload, "generate"),
    ]

    last_error = None

    for url, payload, mode in endpoints:
        for attempt in range(tier_config.retry_attempts):
            try:
                with requests.post(url, json=payload, stream=True, timeout=(30, 300)) as resp:
                    if resp.status_code == 404:
                        break  # Try next endpoint

                    resp.raise_for_status()
                    tool_calls_accumulated = []

                    for line in resp.iter_lines(decode_unicode=True):
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        if mode == "message":
                            msg = data.get("message", {})
                            token = msg.get("content", "")
                            if msg.get("tool_calls"):
                                tool_calls_accumulated.extend(msg["tool_calls"])
                                log.info(f"🐤 [Small] Tool calls received: {len(msg['tool_calls'])}")
                        else:
                            token = data.get("response", "")

                        if data.get("done"):
                            total_prompt = data.get("prompt_eval_count", 0)
                            total_completion = data.get("eval_count", 0)

                        yield f"data: {json.dumps({'token': token, 'done': data.get('done', False)})}\n\n"

                    # ── Agent Loop (limited to 3 rounds for small models) ──
                    agent_round = 0
                    while (
                        tool_calls_accumulated
                        and ws._workspace_path
                        and agent_round < tier_config.agent_max_rounds
                    ):
                        agent_round += 1
                        log.info(f"🐤 [Small Agent] Round {agent_round}/{tier_config.agent_max_rounds}")

                        yield f"data: {json.dumps({'agent_cycle': {'round': agent_round, 'max_rounds': tier_config.agent_max_rounds, 'tool_count': len(tool_calls_accumulated)}})}\n\n"

                        all_tool_results = []
                        for tc in tool_calls_accumulated:
                            func = tc.get("function", {})
                            tool_name = func.get("name", "unknown")
                            tool_args = func.get("arguments", {})

                            if isinstance(tool_args, str):
                                try:
                                    tool_args = json.loads(tool_args)
                                except json.JSONDecodeError:
                                    tool_args = {}

                            yield f"data: {json.dumps({'tool_call': {'name': tool_name, 'arguments': tool_args}})}\n\n"

                            # Small models: block file_delete always
                            if tool_name in ("file_delete", "file_edit"):
                                result = {"status": "blocked", "message": f"Operação {tool_name} não disponível para este modelo. Use file_write."}
                            else:
                                result = execute_tool_call(tool_name, tool_args, ws._workspace_path)

                            all_tool_results.append({"name": tool_name, "result": result})
                            yield f"data: {json.dumps({'tool_result': {'name': tool_name, 'result': result}})}\n\n"

                            if tool_name == "bash" and (result.get("stdout") or result.get("stderr")):
                                yield f"data: {json.dumps({'bash_output': {'command': result.get('command', ''), 'stdout': result.get('stdout', ''), 'stderr': result.get('stderr', ''), 'exit_code': result.get('exit_code', -1), 'status': result.get('status', 'error')}})}\n\n"

                            if result.get("status") == "ok" and result.get("action") in ("created", "modified", "edited", "deleted"):
                                file_result = {
                                    "path": result.get("path", ""),
                                    "status": result["action"],
                                    "size": result.get("size", 0),
                                }
                                if result.get("diff"):
                                    file_result["diff"] = result["diff"]
                                yield f"data: {json.dumps({'files': [file_result]})}\n\n"

                        # Re-query
                        messages.append({"role": "assistant", "tool_calls": tool_calls_accumulated})
                        for tr in all_tool_results:
                            messages.append({"role": "tool", "content": json.dumps(tr["result"], ensure_ascii=False)})

                        followup_payload = {
                            "model": model,
                            "messages": messages,
                            "stream": True,
                            "tools": simplified_tools,
                            "options": {"num_ctx": tier_config.num_ctx, "temperature": tier_config.temperature},
                        }

                        tool_calls_accumulated = []
                        try:
                            with requests.post(f"{base_url}/api/chat", json=followup_payload, stream=True, timeout=(30, 300)) as followup_resp:
                                if followup_resp.ok:
                                    for fline in followup_resp.iter_lines(decode_unicode=True):
                                        if not fline:
                                            continue
                                        try:
                                            fdata = json.loads(fline)
                                        except json.JSONDecodeError:
                                            continue
                                        fmsg = fdata.get("message", {})
                                        ftoken = fmsg.get("content", "")
                                        if fmsg.get("tool_calls"):
                                            tool_calls_accumulated.extend(fmsg["tool_calls"])
                                        if fdata.get("done"):
                                            total_prompt += fdata.get("prompt_eval_count", 0)
                                            total_completion += fdata.get("eval_count", 0)
                                        yield f"data: {json.dumps({'token': ftoken, 'done': fdata.get('done', False)})}\n\n"
                        except Exception as fe:
                            log.error(f"[Small Agent] Follow-up failed (round {agent_round}): {fe}")
                            break

                    # Success
                    yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"
                    return

            except requests.ConnectionError:
                last_error = f"Não foi possível conectar ao Ollama em {base_url}."
            except requests.Timeout:
                last_error = "Timeout — o modelo pode estar carregando."
            except Exception as exc:
                last_error = f"Erro: {exc}"

            if attempt < tier_config.retry_attempts - 1:
                time.sleep(1)

    yield f"data: {json.dumps({'error': last_error or 'Erro desconhecido', 'done': True})}\n\n"
    yield f"data: {json.dumps({'metrics': {'prompt_tokens': 0, 'completion_tokens': 0}})}\n\n"
