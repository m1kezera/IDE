"""Lumina IDE — Skills System (inspired by Claude Code skills).

Slash commands that activate pre-built workflows in the agent.
Usage: user types "/corrigir" → expands to full prompt with context.

Skills are registered in the SKILLS dict and expanded before sending to the LLM.
"""

from __future__ import annotations

import logging
import re

log = logging.getLogger(__name__)

SKILLS: dict[str, dict] = {
    "/corrigir": {
        "description": "Analisa e corrige bugs no arquivo aberto",
        "prompt": (
            "Analise o seguinte código cuidadosamente e corrija TODOS os bugs que encontrar. "
            "Use file_edit para fazer correções cirúrgicas sem reescrever o arquivo inteiro. "
            "Explique cada bug encontrado e a correção aplicada.\n\n"
            "Arquivo: {file_name}\n```\n{file_content}\n```"
        ),
        "needs_file": True,
    },
    "/testar": {
        "description": "Gera testes unitários para o arquivo aberto",
        "prompt": (
            "Gere testes unitários completos para este código. "
            "Crie um arquivo de teste adequado (test_{file_name} ou {file_name}.test.ts). "
            "Cubra os casos principais, edge cases, e erros esperados.\n\n"
            "Arquivo: {file_name}\n```\n{file_content}\n```"
        ),
        "needs_file": True,
    },
    "/documentar": {
        "description": "Adiciona documentação ao código",
        "prompt": (
            "Adicione documentação completa a este código: docstrings, type hints, "
            "e comentários para trechos complexos. Use file_edit para não alterar a lógica.\n\n"
            "Arquivo: {file_name}\n```\n{file_content}\n```"
        ),
        "needs_file": True,
    },
    "/otimizar": {
        "description": "Sugere otimizações de performance",
        "prompt": (
            "Analise este código e identifique oportunidades de otimização: "
            "performance, legibilidade, DRY, e boas práticas. "
            "Aplique as melhorias usando file_edit quando possível.\n\n"
            "Arquivo: {file_name}\n```\n{file_content}\n```"
        ),
        "needs_file": True,
    },
    "/explicar": {
        "description": "Explica o código detalhadamente",
        "prompt": (
            "Explique este código em detalhes para um desenvolvedor. "
            "Descreva o que cada parte faz, o fluxo de execução, e possíveis pontos de atenção.\n\n"
            "Arquivo: {file_name}\n```\n{file_content}\n```"
        ),
        "needs_file": True,
    },
    "/commit": {
        "description": "Gera uma mensagem de commit baseada nas mudanças",
        "prompt": (
            "Analise as mudanças pendentes no repositório Git e gere uma mensagem "
            "de commit clara e concisa seguindo conventional commits (feat:, fix:, refactor:, etc). "
            "Use o comando 'git diff --staged' para ver as mudanças.\n\n"
            "Mudanças recentes:\n{file_content}"
        ),
        "needs_file": False,
    },
    "/ajuda": {
        "description": "Lista todos os comandos disponíveis",
        "prompt": "",
        "needs_file": False,
        "is_builtin": True,
    },
}


def is_skill_command(message: str) -> bool:
    """Check if the message starts with a known skill command."""
    first_word = message.strip().split()[0] if message.strip() else ""
    return first_word in SKILLS


def expand_skill(message: str, context: dict) -> str | None:
    """Expand a /command into a full prompt with context.
    
    Args:
        message: The user message starting with /
        context: Dict with optional keys: file_name, file_content, workspace_path
    
    Returns:
        Expanded prompt string, or None if not a skill
    """
    parts = message.strip().split(maxsplit=1)
    command = parts[0]
    extra = parts[1] if len(parts) > 1 else ""

    skill = SKILLS.get(command)
    if not skill:
        return None

    # Special: /ajuda returns list of commands
    if skill.get("is_builtin") and command == "/ajuda":
        lines = ["**Comandos disponíveis:**\n"]
        for cmd, info in SKILLS.items():
            if cmd == "/ajuda":
                continue
            lines.append(f"• `{cmd}` — {info['description']}")
        return "\n".join(lines)

    # Build context for template
    file_name = context.get("file_name", "arquivo")
    file_content = context.get("file_content", "")

    if skill.get("needs_file") and not file_content:
        return f"⚠️ O comando `{command}` precisa de um arquivo aberto. Abra um arquivo no editor e tente novamente."

    prompt = skill["prompt"].format(
        file_name=file_name,
        file_content=file_content[:20000],  # Limit to 20K chars
    )

    # Append extra user instructions if provided
    if extra:
        prompt += f"\n\nInstrução adicional do usuário: {extra}"

    log.info(f"[Skills] Expanded {command} → {len(prompt)} chars")
    return prompt


def get_skills_list() -> list[dict]:
    """Return list of skills for frontend autocomplete."""
    return [
        {"command": cmd, "description": info["description"]}
        for cmd, info in SKILLS.items()
    ]
