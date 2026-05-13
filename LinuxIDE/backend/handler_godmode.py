"""Lumina IDE — God Mode Handler (llama-cpp) with ReAct Agent Loop.

Runs GGUF models natively via llama-cpp-python with full tool calling support.
The agent loop detects JSON tool calls in the model's output, executes them
locally, and feeds the result back for multi-turn reasoning.

SSE Events emitted:
  - {"content": "..."} — text tokens for the CLI to render
  - {"tool_call": {"name": "...", "arguments": {...}}} — tool invocation
  - {"tool_result": {"result": {...}}} — tool execution result
  - {"metrics": {"prompt_tokens": N, "completion_tokens": N}} — usage stats
  - {"error": "..."} — fatal error
"""

import os
import re
import json
import logging
from typing import Optional, List, Generator
from config import Settings
from local_engine import engine

log = logging.getLogger("projecty.handler_godmode")

# Maximum agent loop iterations to prevent infinite loops
MAX_AGENT_ROUNDS = 8

# Default model file if "god-mode" is passed as model name
DEFAULT_GODMODE_MODEL = "qwen2.5-coder-14b-instruct.gguf"


def _extract_tool_call(text: str) -> Optional[dict]:
    """Try to extract a JSON tool call from the model's output.
    
    Looks for patterns like:
      ```json\n{"name": "bash", "arguments": {"command": "ls"}}\n```
    Or raw JSON blocks with "name" and "arguments" keys.
    """
    # Strategy 1: Find ```json ... ``` blocks
    json_blocks = re.findall(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    for block in json_blocks:
        try:
            parsed = json.loads(block.strip())
            if isinstance(parsed, dict) and "name" in parsed and "arguments" in parsed:
                return parsed
        except json.JSONDecodeError:
            continue
    
    # Strategy 2: Find raw JSON objects with tool call signature
    # Look for {"name": "...", "arguments": {...}}
    json_pattern = re.findall(r'\{[^{}]*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[^}]*\}[^{}]*\}', text)
    for match in json_pattern:
        try:
            parsed = json.loads(match)
            if "name" in parsed and "arguments" in parsed:
                return parsed
        except json.JSONDecodeError:
            continue
    
    return None


def _resolve_model_path(model: str) -> str:
    """Resolve a model name to a full filesystem path."""
    models_dir = "/home/m1kezera/LuminaIDE/LinuxIDE/models"
    
    # "god-mode" is a virtual name → resolve to default GGUF
    if model in ("god-mode", "godmode", "god_mode"):
        model = DEFAULT_GODMODE_MODEL
    
    if model.startswith("/"):
        return model
    
    return os.path.join(models_dir, model)


def stream(prompt: str, model: str, settings: Settings, fmt: Optional[str] = None,
           enhanced_system_prompt: Optional[str] = None,
           history: Optional[List[dict]] = None) -> Generator[str, None, None]:
    """Streams output using the integrated llama-cpp engine with ReAct agent loop."""
    
    model_path = _resolve_model_path(model)
    
    try:
        engine.load_model(model_path, context_size=8192, gpu_layers=-1)
    except Exception as e:
        log.error(f"God Mode load failed: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        return

    # ── Build tools prompt ──
    from agent import LUMINA_TOOLS, execute_tool_call
    
    tools_prompt = (
        "\n\nYou have access to tools. To call a tool, respond with a JSON block:\n"
        "```json\n"
        '{"name": "tool_name", "arguments": {"param1": "value"}}\n'
        "```\n\n"
        "Available Tools:\n"
    )
    for tool in LUMINA_TOOLS:
        tools_prompt += json.dumps(tool["function"], ensure_ascii=False, indent=2) + "\n\n"
    
    tools_prompt += (
        "IMPORTANT RULES:\n"
        "1. ALWAYS use file_read before editing a file.\n"
        "2. Use file_write for new files, file_edit for modifications.\n"
        "3. For bash, always provide the full command.\n"
        "4. After calling a tool, WAIT for the result before proceeding.\n"
        "5. When you are done (no more tools needed), respond with regular text.\n"
    )

    base_system = enhanced_system_prompt or "You are Lumina, an expert AI coding assistant."
    full_system = f"{base_system}\n{tools_prompt}"

    # ── Resolve workspace path ──
    workspace_path = "/home/m1kezera"
    try:
        import workspace as ws
        ws._load_workspace_from_db()
        if ws._workspace_path:
            workspace_path = ws._workspace_path
    except Exception:
        pass

    # ── Build initial ChatML prompt ──
    def build_prompt(system: str, messages: list, current_prompt: str) -> str:
        p = f"<|im_start|>system\n{system}<|im_end|>\n"
        for msg in (messages or []):
            role = msg.get("role", "user")
            content = msg.get("content", "")
            p += f"<|im_start|>{role}\n{content}<|im_end|>\n"
        p += f"<|im_start|>user\n{current_prompt}<|im_end|>\n<|im_start|>assistant\n"
        return p

    # ── Context Shifting ──
    def apply_context_shift(p: str, max_chars: int = 30000) -> str:
        if len(p) > max_chars:
            log.info(f"Context Shifting: {len(p)} → {max_chars} chars")
            return p[:8000] + "\n\n... [Context truncated] ...\n\n" + p[-20000:]
        return p

    log.info(f"⚡ God Mode → Agent loop starting with {model}")

    total_tokens = 0
    agent_messages = list(history or [])

    # ── ReAct Agent Loop ──
    for round_num in range(MAX_AGENT_ROUNDS):
        full_prompt = build_prompt(full_system, agent_messages, prompt if round_num == 0 else "")
        full_prompt = apply_context_shift(full_prompt)

        # Stream the model's response
        accumulated = ""
        try:
            for text_chunk in engine.stream_text(full_prompt, max_tokens=2048):
                total_tokens += 1
                accumulated += text_chunk
                # Emit content event (CLI renders this as Markdown)
                yield f"data: {json.dumps({'content': text_chunk})}\n\n"
        except Exception as e:
            log.error(f"God Mode generation failed: {e}")
            yield f"data: {json.dumps({'error': f'Generation failed: {e}'})}\n\n"
            return

        # ── Check for tool call in output ──
        tool_call = _extract_tool_call(accumulated)
        
        if tool_call is None:
            # No tool call — model is done reasoning, break the loop
            log.info(f"⚡ God Mode → Round {round_num + 1}: No tool call, done.")
            break

        tool_name = tool_call["name"]
        tool_args = tool_call["arguments"]
        
        log.info(f"🔧 God Mode → Round {round_num + 1}: Tool call: {tool_name}")

        # Emit tool_call event for CLI
        yield f"data: {json.dumps({'tool_call': {'name': tool_name, 'arguments': tool_args}})}\n\n"

        # Execute the tool locally
        try:
            result = execute_tool_call(tool_name, tool_args, workspace_path)
        except Exception as e:
            result = {"status": "error", "error": str(e)}

        # Emit tool_result event for CLI
        yield f"data: {json.dumps({'tool_result': {'result': result}})}\n\n"

        # Inject the tool result back into conversation for the next round
        agent_messages.append({"role": "assistant", "content": accumulated})
        agent_messages.append({
            "role": "user",
            "content": f"Tool `{tool_name}` returned:\n```json\n{json.dumps(result, ensure_ascii=False, indent=2)}\n```\nContinue with your task based on this result."
        })

        # Reset prompt for next round (already in agent_messages)
        prompt = ""

    # ── Emit final metrics ──
    prompt_tokens = sum(len(m.get("content", "")) for m in agent_messages) // 4
    yield f"data: {json.dumps({'metrics': {'prompt_tokens': prompt_tokens, 'completion_tokens': total_tokens}})}\n\n"
