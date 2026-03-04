"""Lumina IDE — SQLModel database models."""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class UsageLog(SQLModel, table=True):
    """Tracks every AI generation call for telemetry & billing."""

    __tablename__ = "usage_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str = Field(index=True)          # "local" | "cloud"
    model: str = Field(default="")             # e.g. "mistral", "gpt-4o"
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    cost_usd: float = Field(default=0.0)       # 0 for local
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AppConfig(SQLModel, table=True):
    """Dynamic key/value configuration store."""

    __tablename__ = "app_config"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: str = Field(default="")


class ChatSession(SQLModel, table=True):
    """Lightweight chat session — stores title + summary, not full output."""

    __tablename__ = "chat_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    uid: str = Field(index=True, unique=True)    # frontend-generated UID
    title: str = Field(default="Novo Chat")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatMessage(SQLModel, table=True):
    """Individual messages in a chat — stored as compact role+content pairs.

    Keeping messages separate (not one giant blob) lets us:
    - Paginate / lazy-load older messages
    - Prune or summarize old messages without losing the whole chat
    - Query / search across messages efficiently
    """

    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    chat_uid: str = Field(index=True)            # FK to ChatSession.uid
    role: str = Field(default="user")            # "user" | "assistant"
    content: str = Field(default="")             # the actual text
    tokens: int = Field(default=0)               # token count for smart pruning
    created_at: datetime = Field(default_factory=datetime.utcnow)
