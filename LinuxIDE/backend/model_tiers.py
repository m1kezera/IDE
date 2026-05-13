"""Lumina IDE — Model Tier Detection & Configuration (v8.1).

Classifies Ollama models into tiers (SMALL / MEDIUM / LARGE) based on
parameter count and adjusts system prompt, context window, agent loop
limits, and tool sets accordingly.

The goal is to make even the smallest models useful through
Lumina's Brain system — every tier gets tools, but the approach
is adapted to the model's capability.
"""

from __future__ import annotations

import re
import logging
from dataclasses import dataclass, field
from typing import List

log = logging.getLogger("projecty.tiers")


# ═══════════════════════════════════════════════════════════════════════
# TIER DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════

class ModelTier:
    SMALL  = "small"    # ≤8B  — dolphin3:8b, phi3, gemma:7b, qwen2.5:7b
    MEDIUM = "medium"   # 9–20B — qwen2.5:14b, dolphincoder:15b
    LARGE  = "large"    # >20B — qwen2.5:32b, llama3:70b, mixtral, command-r
    CLOUD  = "cloud"    # External APIs (Groq, OpenAI, Anthropic, etc.)


@dataclass
class TierConfig:
    """Runtime configuration for a model tier."""
    tier: str
    num_ctx: int                    # Ollama context window size
    agent_max_rounds: int           # Max tool-calling agent loop iterations
    temperature: float              # Default temperature
    tools_mode: str                 # "full" | "simplified" | "none"
    prompt_style: str               # "tools" | "legacy" | "hybrid"
    use_fuzzy_parser: bool          # Enable fuzzy file block recovery
    retry_attempts: int             # Max HTTP retry attempts
    endpoint_order: List[str] = field(default_factory=list)  # /api/chat, /api/generate order


# ═══════════════════════════════════════════════════════════════════════
# TIER CONFIGS
# ═══════════════════════════════════════════════════════════════════════

TIER_CONFIGS = {
    ModelTier.SMALL: TierConfig(
        tier=ModelTier.SMALL,
        num_ctx=4096,
        agent_max_rounds=3,         # Small models degrade fast in multi-turn
        temperature=0.3,            # More deterministic = fewer hallucinations
        tools_mode="simplified",    # Reduced tool set (file_write, file_read, bash, list_directory)
        prompt_style="hybrid",      # TOOLS prompt with FILE: examples as fallback instructions
        use_fuzzy_parser=True,      # Always try fuzzy recovery
        retry_attempts=2,
        endpoint_order=["chat", "generate"],
    ),
    ModelTier.MEDIUM: TierConfig(
        tier=ModelTier.MEDIUM,
        num_ctx=8192,
        agent_max_rounds=5,
        temperature=0.5,
        tools_mode="full",          # All 7 tools
        prompt_style="tools",       # Standard TOOLS prompt
        use_fuzzy_parser=True,      # Fuzzy as safety net
        retry_attempts=3,
        endpoint_order=["chat", "generate"],
    ),
    ModelTier.LARGE: TierConfig(
        tier=ModelTier.LARGE,
        num_ctx=16384,
        agent_max_rounds=10,
        temperature=0.7,
        tools_mode="full",
        prompt_style="tools",
        use_fuzzy_parser=False,     # Large models follow instructions reliably
        retry_attempts=3,
        endpoint_order=["chat", "generate"],
    ),
    ModelTier.CLOUD: TierConfig(
        tier=ModelTier.CLOUD,
        num_ctx=0,                  # Managed by provider
        agent_max_rounds=0,         # No local agent loop for cloud
        temperature=0.7,
        tools_mode="none",          # Cloud uses its own tool format
        prompt_style="tools",
        use_fuzzy_parser=False,
        retry_attempts=1,
        endpoint_order=["cloud"],
    ),
}


# ═══════════════════════════════════════════════════════════════════════
# SIMPLIFIED TOOLS — For small models that can't handle 7 tools
# ═══════════════════════════════════════════════════════════════════════

def get_simplified_tools() -> list:
    """Return a reduced tool set for small models.
    
    Only 4 tools (vs 7 for full):
    - file_write: Create files (no file_edit — too complex for 8B)
    - file_read: Read files before acting
    - list_directory: Explore workspace
    - bash: Run commands
    
    Descriptions are shorter and have concrete examples
    to fit in the smaller context window.
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "file_write",
                "description": (
                    "Cria ou sobrescreve um arquivo. "
                    "Exemplo: file_write(path='app.py', content='print(\"hello\")'). "
                    "SEMPRE forneça o conteúdo COMPLETO. Path relativo ao workspace."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Caminho relativo (ex: src/app.py)"},
                        "content": {"type": "string", "description": "Conteúdo completo do arquivo"}
                    },
                    "required": ["path", "content"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "file_read",
                "description": (
                    "Lê um arquivo do workspace. Retorna conteúdo com line numbers. "
                    "Use ANTES de modificar arquivos."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Caminho relativo do arquivo"}
                    },
                    "required": ["path"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_directory",
                "description": "Lista arquivos e pastas. Use path='.' para raiz do workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "Caminho do diretório (default: '.')"}
                    },
                    "required": []
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "bash",
                "description": (
                    "Executa um comando no terminal. "
                    "Exemplos: 'pip install flask', 'npm install', 'python main.py'. "
                    "Retorna stdout e stderr."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "Comando a executar"},
                        "timeout": {"type": "integer", "description": "Timeout em segundos (default: 30)"}
                    },
                    "required": ["command"]
                }
            }
        },
    ]


# ═══════════════════════════════════════════════════════════════════════
# TIER DETECTION
# ═══════════════════════════════════════════════════════════════════════

# Models we know the exact tier for — overrides heuristic
_TIER_OVERRIDES = {
    # ── SMALL (≤8B) ──
    "tinyllama":        ModelTier.SMALL,
    "phi":              ModelTier.SMALL,
    "phi-2":            ModelTier.SMALL,
    "phi3:mini":        ModelTier.SMALL,
    "phi3:3.8b":        ModelTier.SMALL,
    "gemma:2b":         ModelTier.SMALL,
    "gemma:7b":         ModelTier.SMALL,
    "gemma2:2b":        ModelTier.SMALL,
    "gemma2:9b":        ModelTier.SMALL,
    "llama3.2:1b":      ModelTier.SMALL,
    "llama3.2:3b":      ModelTier.SMALL,
    "qwen2.5:0.5b":     ModelTier.SMALL,
    "qwen2.5:1.5b":     ModelTier.SMALL,
    "qwen2.5:3b":       ModelTier.SMALL,
    "qwen2.5:7b":       ModelTier.SMALL,
    "dolphin3:8b":      ModelTier.SMALL,
    "dolphin3:latest":  ModelTier.SMALL,
    "dolphin-venice:latest": ModelTier.SMALL,
    "mistral:7b":       ModelTier.SMALL,
    "mistral:latest":   ModelTier.SMALL,
    "codellama:7b":     ModelTier.SMALL,
    "codegemma:7b":     ModelTier.SMALL,
    "deepseek-coder:6.7b": ModelTier.SMALL,
    "starcoder2:7b":    ModelTier.SMALL,

    # ── MEDIUM (9–20B) ──
    "qwen2.5:14b":          ModelTier.MEDIUM,
    "qwen2.5:14b-instruct": ModelTier.MEDIUM,
    "qwen2.5-coder:14b":    ModelTier.MEDIUM,
    "dolphincoder:15b":     ModelTier.MEDIUM,
    "codellama:13b":        ModelTier.MEDIUM,
    "deepseek-coder:16b":   ModelTier.MEDIUM,
    "starcoder2:15b":       ModelTier.MEDIUM,
    "gemma2:27b":           ModelTier.MEDIUM,  # 27B but not fully "large"

    # ── LARGE (>20B) ──
    "qwen2.5:32b":          ModelTier.LARGE,
    "qwen2.5:72b":          ModelTier.LARGE,
    "qwen2.5-coder:32b":    ModelTier.LARGE,
    "llama3:70b":           ModelTier.LARGE,
    "llama3.1:70b":         ModelTier.LARGE,
    "llama3.3:70b":         ModelTier.LARGE,
    "mixtral:8x7b":         ModelTier.LARGE,
    "mixtral:8x22b":        ModelTier.LARGE,
    "mistral-large":        ModelTier.LARGE,
    "command-r":            ModelTier.LARGE,
    "command-r-plus":       ModelTier.LARGE,
    "deepseek-coder:33b":   ModelTier.LARGE,
    "deepseek-v2":          ModelTier.LARGE,
    "codestral":            ModelTier.LARGE,
}


def detect_tier(model: str) -> str:
    """Detect the capability tier of an Ollama model.
    
    Priority:
    1. Exact match in override table
    2. Partial match in override table (handles variants like :instruct, :q4_0)
    3. Parameter count extracted from model name
    4. Default to MEDIUM (safe middle ground)
    
    Returns ModelTier.SMALL | MEDIUM | LARGE
    """
    name = model.lower().strip()
    
    # 1. Exact match
    if name in _TIER_OVERRIDES:
        tier = _TIER_OVERRIDES[name]
        log.info(f"🎯 [Tier] {model} → {tier} (exact match)")
        return tier
    
    # 2. Partial match — check if any known model is a prefix of this one
    #    e.g., "qwen2.5:14b-instruct-q4_0" should match "qwen2.5:14b"
    for known, tier in _TIER_OVERRIDES.items():
        if name.startswith(known) or known in name:
            log.info(f"🎯 [Tier] {model} → {tier} (partial match: {known})")
            return tier
    
    # 3. Heuristic: extract parameter count from name
    m = re.search(r'[:\-](\d+(?:\.\d+)?)b', name)
    if m:
        param_b = float(m.group(1))
        if param_b <= 8:
            tier = ModelTier.SMALL
        elif param_b <= 20:
            tier = ModelTier.MEDIUM
        else:
            tier = ModelTier.LARGE
        log.info(f"🎯 [Tier] {model} → {tier} (heuristic: {param_b}B params)")
        return tier
    
    # 4. Default — MEDIUM is safe (has tools but with fuzzy fallback)
    log.info(f"🎯 [Tier] {model} → {ModelTier.MEDIUM} (default)")
    return ModelTier.MEDIUM


def get_config(model: str, mode: str = "local") -> TierConfig:
    """Get the full tier config for a model.
    
    If mode='cloud', always returns CLOUD config regardless of model name.
    """
    if mode == "cloud":
        return TIER_CONFIGS[ModelTier.CLOUD]
    
    tier = detect_tier(model)
    return TIER_CONFIGS[tier]
