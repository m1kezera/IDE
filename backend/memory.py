"""Lumina IDE — Memory System v2.0 (SQLite-backed).

Persistent memory that helps the agent learn about the user over time.
Four memory types:
  - user:     Profile, expertise, preferences
  - feedback: Corrections and validated approaches
  - project:  Ongoing work, deadlines, context
  - reference: External resources and links

v2.0: All data stored in SQLite (agent_memories table) instead of flat JSON.
Memory recall uses Brain vector search for semantic matching when available,
with keyword fallback.
"""

from __future__ import annotations

import logging
import re
import time
from datetime import datetime

log = logging.getLogger(__name__)

MEMORY_TYPES = ("user", "feedback", "project", "reference")

# Patterns that indicate the user is giving feedback
FEEDBACK_PATTERNS = [
    r"\bnão\s+(faça|use|coloque|adicione|crie)\b",
    r"\bpare\s+de\b",
    r"\bnunca\b",
    r"\bsempre\s+(use|faça|coloque|prefira)\b",
    r"\bprefiro\b",
    r"\buse\s+\w+\s+ao\s+invés\b",
    r"\bnão\s+quero\b",
    r"\bpor\s+favor\s+não\b",
    r"\bstop\b",
    r"\bdon'?t\b",
    r"\balways\s+use\b",
    r"\bnever\b",
    r"\bprefer\b",
]

_feedback_re = re.compile("|".join(FEEDBACK_PATTERNS), re.IGNORECASE)


def save_memory(memory_type: str, content: str, source: str = "auto") -> bool:
    """Save a persistent memory to SQLite.
    
    Args:
        memory_type: One of 'user', 'feedback', 'project', 'reference'
        content: The memory content text
        source: Where this memory came from ('auto', 'user', 'agent')
    
    Returns:
        True if saved, False if duplicate or invalid
    """
    if memory_type not in MEMORY_TYPES:
        log.warning(f"[Memory] Invalid type: {memory_type}")
        return False

    content_clean = content.strip()
    if not content_clean:
        return False

    try:
        from database import get_session_direct
        from models import AgentMemory
        from sqlmodel import select

        with get_session_direct() as session:
            # Dedup: skip if exact same content exists
            existing = session.exec(
                select(AgentMemory).where(AgentMemory.content == content_clean)
            ).first()
            if existing:
                log.debug(f"[Memory] Duplicate skipped: {content_clean[:50]}")
                return False

            session.add(AgentMemory(
                memory_type=memory_type,
                content=content_clean,
                source=source,
            ))

            # Limit total memories (keep most recent 500)
            MAX_MEMORIES = 500
            all_memories = session.exec(select(AgentMemory).order_by(AgentMemory.created_at)).all()
            if len(all_memories) > MAX_MEMORIES:
                # Prune oldest non-feedback entries
                to_prune = [m for m in all_memories if m.memory_type != "feedback"]
                prune_count = len(all_memories) - MAX_MEMORIES
                for m in to_prune[:prune_count]:
                    session.delete(m)

            session.commit()
            log.info(f"[Memory] 💾 Saved {memory_type} memory: {content_clean[:60]}...")
            return True
    except Exception as e:
        log.error(f"[Memory] Failed to save: {e}")
        return False


def get_all_memories() -> list[dict]:
    """Return all memories from SQLite."""
    try:
        from database import get_session_direct
        from models import AgentMemory
        from sqlmodel import select

        with get_session_direct() as session:
            memories = session.exec(select(AgentMemory).order_by(AgentMemory.created_at.desc())).all()
            return [{
                "id": m.id,
                "type": m.memory_type,
                "content": m.content,
                "source": m.source,
                "timestamp": m.created_at.isoformat() if m.created_at else "",
            } for m in memories]
    except Exception as e:
        log.error(f"[Memory] Failed to load: {e}")
        return []


def delete_memory(memory_id: int) -> bool:
    """Delete a specific memory by ID."""
    try:
        from database import get_session_direct
        from models import AgentMemory

        with get_session_direct() as session:
            mem = session.get(AgentMemory, memory_id)
            if not mem:
                return False
            session.delete(mem)
            session.commit()
            log.info(f"[Memory] 🗑️ Deleted memory #{memory_id}")
            return True
    except Exception as e:
        log.error(f"[Memory] Failed to delete: {e}")
        return False


def recall_relevant(query: str, limit: int = 5) -> list[dict]:
    """Recall memories relevant to the given query.
    
    Uses keyword matching from SQLite.
    Future: integrate with Brain vector search for semantic matching.
    """
    try:
        from database import get_session_direct
        from models import AgentMemory
        from sqlmodel import select

        with get_session_direct() as session:
            memories = session.exec(select(AgentMemory)).all()
            if not memories:
                return []

            query_words = set(query.lower().split())
            scored = []
            for mem in memories:
                mem_words = set(mem.content.lower().split())
                overlap = len(query_words & mem_words)
                # Boost feedback memories (they're behavioral guidance)
                if mem.memory_type == "feedback":
                    overlap *= 1.5
                if overlap > 0:
                    scored.append((overlap, {
                        "type": mem.memory_type,
                        "content": mem.content,
                        "source": mem.source,
                    }))

            scored.sort(key=lambda x: -x[0])
            return [m for _, m in scored[:limit]]
    except Exception as e:
        log.error(f"[Memory] Recall failed: {e}")
        return []


def detect_feedback(user_message: str) -> str | None:
    """Detect if user message contains feedback/correction to save.
    
    Returns the cleaned feedback text, or None if no feedback detected.
    """
    if _feedback_re.search(user_message):
        return user_message.strip()
    return None


def inject_memories_to_prompt(user_prompt: str, system_prompt: str) -> str:
    """Inject relevant memories into the system prompt.
    
    Called before each LLM request to add persistent context.
    """
    relevant = recall_relevant(user_prompt, limit=5)
    if not relevant:
        return system_prompt

    memory_lines = []
    for mem in relevant:
        icon = {"user": "👤", "feedback": "📝", "project": "📋", "reference": "🔗"}.get(mem["type"], "💭")
        memory_lines.append(f"{icon} [{mem['type']}] {mem['content']}")

    memory_block = "\n\n═══ MEMÓRIAS PERSISTENTES ═══\nLembre-se destas informações de conversas anteriores:\n" + "\n".join(memory_lines)
    return system_prompt + memory_block


def auto_extract_and_save(user_message: str, assistant_response: str = "") -> None:
    """Automatically detect and save memories from conversation.
    
    Called after each exchange to capture:
    - User feedback/corrections
    - User profile info (if mentioned)
    """
    # Detect feedback
    feedback = detect_feedback(user_message)
    if feedback:
        save_memory("feedback", feedback, source="auto-detected")

    # Detect user profile mentions
    profile_patterns = [
        (r"\bsou\s+(dev|desenvolvedor|programador|designer|fullstack|frontend|backend)\b", "user"),
        (r"\btrabalho\s+com\s+(\w+)\b", "user"),
        (r"\bmeu\s+projeto\s+(\w+)\b", "project"),
    ]
    for pattern, mem_type in profile_patterns:
        match = re.search(pattern, user_message, re.IGNORECASE)
        if match:
            save_memory(mem_type, user_message, source="auto-detected")
            break
