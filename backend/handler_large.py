"""Lumina IDE — Large Model Handler (>20B parameters).

Handles models like qwen2.5:32b, llama3:70b, mixtral, command-r, codestral.

Strategy:
- Full tool set (all 7 tools)
- Standard TOOLS system prompt
- Large context window (16384)
- Full agent loop up to 10 rounds with model fallback
- Strict parser only (large models follow instructions reliably)
- Temperature 0.7 — more creative
"""

from __future__ import annotations

import json
import logging
import time
import requests
from typing import Optional, List, Generator

from config import Settings
from model_tiers import TierConfig, TIER_CONFIGS, ModelTier

log = logging.getLogger("projecty.handler.large")


def stream(
    prompt: str,
    model: str,
    settings: Settings,
    fmt: Optional[str],
    enhanced_system_prompt: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> Generator[str, None, None]:
    """Stream SSE events from a large model via Ollama.

    Full tools, full agent loop, large context, model fallback.
    """
    from agent import SYSTEM_PROMPT_TOOLS, LUMINA_TOOLS, execute_tool_call
    import workspace as ws
    ws._load_workspace_from_db()

    tier_config = TIER_CONFIGS[ModelTier.LARGE]
    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
    system_prompt = enhanced_system_prompt or SYSTEM_PROMPT_TOOLS

    if history is None:
        history = []

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    chat_payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "tools": LUMINA_TOOLS,
        "options": {
            "num_ctx": tier_config.num_ctx,
            "temperature": tier_config.temperature,
        },
    }

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

    log.info(f"🔵 [Large Handler] {model} — {len(LUMINA_TOOLS)} tools, ctx={tier_config.num_ctx}")

    total_prompt = 0
    total_completion = 0
    tool_calls_accumulated = []

    # Large models: try fallback to other available models if primary fails
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

    endpoints = [
        (f"{base_url}/api/chat", chat_payload, "message"),
        (f"{base_url}/api/generate", generate_payload, "generate"),
    ]

    last_error = None

    for attempt_model in fallback_models:
        chat_payload["model"] = attempt_model
        generate_payload["model"] = attempt_model
        chat_payload["messages"][0]["content"] = system_prompt

        for url, payload, mode in endpoints:
            for attempt in range(tier_config.retry_attempts):
                try:
                    with requests.post(url, json=payload, stream=True, timeout=(30, 600)) as resp:
                        if resp.status_code == 404:
                            break

                        resp.raise_for_status()

                        if attempt > 0 or attempt_model != model:
                            yield f"data: {json.dumps({'token': f'[Usando {attempt_model}] ', 'done': False})}\n\n"

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
                                    log.info(f"🔵 [Large] Tool calls: {len(msg['tool_calls'])}")
                            else:
                                token = data.get("response", "")

                            if data.get("done"):
                                total_prompt = data.get("prompt_eval_count", 0)
                                total_completion = data.get("eval_count", 0)

                            yield f"data: {json.dumps({'token': token, 'done': data.get('done', False)})}\n\n"

                        # ── Full Agent Loop (10 rounds) ──
                        agent_round = 0
                        while (
                            tool_calls_accumulated
                            and ws._workspace_path
                            and agent_round < tier_config.agent_max_rounds
                        ):
                            agent_round += 1
                            log.info(f"🔵 [Large Agent] Round {agent_round}/{tier_config.agent_max_rounds}: {len(tool_calls_accumulated)} tool call(s)")

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

                                is_destructive = tool_name == "file_delete"
                                if is_destructive:
                                    yield f"data: {json.dumps({'pending_tool': {'name': tool_name, 'arguments': tool_args}})}\n\n"
                                    result = {"status": "blocked", "message": f"Operação {tool_name} requer confirmação"}
                                else:
                                    result = execute_tool_call(tool_name, tool_args, ws._workspace_path)

                                all_tool_results.append({"name": tool_name, "result": result})
                                yield f"data: {json.dumps({'tool_result': {'name': tool_name, 'result': result}})}\n\n"

                                if tool_name == "bash" and (result.get("stdout") or result.get("stderr")):
                                    yield f"data: {json.dumps({'bash_output': {'command': result.get('command', ''), 'stdout': result.get('stdout', ''), 'stderr': result.get('stderr', ''), 'exit_code': result.get('exit_code', -1), 'status': result.get('status', 'error')}})}\n\n"

                                if result.get("status") == "ok" and result.get("action") in ("created", "modified", "edited", "deleted"):
                                    file_result = {"path": result.get("path", ""), "status": result["action"], "size": result.get("size", 0)}
                                    if result.get("diff"):
                                        file_result["diff"] = result["diff"]
                                    yield f"data: {json.dumps({'files': [file_result]})}\n\n"

                            messages.append({"role": "assistant", "tool_calls": tool_calls_accumulated})
                            for tr in all_tool_results:
                                messages.append({"role": "tool", "content": json.dumps(tr["result"], ensure_ascii=False)})

                            followup_payload = {
                                "model": attempt_model,
                                "messages": messages,
                                "stream": True,
                                "tools": LUMINA_TOOLS,
                                "options": {"num_ctx": tier_config.num_ctx, "temperature": tier_config.temperature},
                            }

                            log.info(f"🔵 [Large Agent] Re-querying (round {agent_round}) with {len(all_tool_results)} result(s)")
                            tool_calls_accumulated = []

                            try:
                                with requests.post(f"{base_url}/api/chat", json=followup_payload, stream=True, timeout=(30, 600)) as followup_resp:
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
                                                log.info(f"🔵 [Large Agent] More calls: {len(fmsg['tool_calls'])}")
                                            if fdata.get("done"):
                                                total_prompt += fdata.get("prompt_eval_count", 0)
                                                total_completion += fdata.get("eval_count", 0)
                                            yield f"data: {json.dumps({'token': ftoken, 'done': fdata.get('done', False)})}\n\n"
                            except Exception as fe:
                                log.error(f"[Large Agent] Follow-up failed (round {agent_round}): {fe}")
                                break

                        if agent_round >= tier_config.agent_max_rounds:
                            log.warning(f"[Large Agent] Hit max rounds ({tier_config.agent_max_rounds})")
                            limit_msg = f"\n\n⚠️ Limite de {tier_config.agent_max_rounds} ciclos atingido."
                            yield f"data: {json.dumps({'token': limit_msg, 'done': False})}\n\n"

                        yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"
                        return

                except requests.ConnectionError:
                    last_error = f"Não foi possível conectar ao Ollama em {base_url}."
                except requests.Timeout:
                    last_error = "Timeout — o modelo pode estar carregando na GPU."
                except requests.RequestException as exc:
                    last_error = f"Erro do Ollama: {exc}"
                except Exception as exc:
                    last_error = f"Erro inesperado: {exc}"

                if attempt < tier_config.retry_attempts - 1:
                    time.sleep(2 ** attempt)

    yield f"data: {json.dumps({'error': last_error or 'Erro desconhecido', 'done': True})}\n\n"
    yield f"data: {json.dumps({'metrics': {'prompt_tokens': 0, 'completion_tokens': 0}})}\n\n"
