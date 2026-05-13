"""Project Y — SQLModel database models."""

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
    model: str = Field(default="")               # last LLM model used
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

class AgentPermissions(SQLModel, table=True):
    """Stores the autonomy level of the agent (Manual, Hybrid, Agent)."""
    __tablename__ = "agent_permissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    level: str = Field(default="Hybrid") # Manual, Hybrid, Agent
    override_protection: bool = Field(default=False)

class ProjectYIdentity(SQLModel, table=True):
    """Stores the identity signature bound to hardware."""
    __tablename__ = "projecty_identity"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_name: str = Field(index=True)
    hwid_hash: str = Field(unique=True) # Hashed HWID + Name
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LibraryDocument(SQLModel, table=True):
    """Documents uploaded to the knowledge library."""
    __tablename__ = "library_documents"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)             # filename
    path: str = Field(default="")             # original file path
    doc_type: str = Field(default="md")       # pdf, docx, md, txt
    folder: str = Field(default="Geral")      # folder name
    pages: int = Field(default=0)
    words: int = Field(default=0)
    tables_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LibraryFolder(SQLModel, table=True):
    """Folders for organizing library documents."""
    __tablename__ = "library_folders"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PersonalityConfig(SQLModel, table=True):
    """Custom system prompt that shapes the agent's behavior."""
    __tablename__ = "personality_config"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="")              # e.g. "personality_dev_br.txt"
    prompt: str = Field(default="")            # the full text
    is_active: bool = Field(default=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AgentMemory(SQLModel, table=True):
    """Persistent memories extracted from conversations."""
    __tablename__ = "agent_memories"

    id: Optional[int] = Field(default=None, primary_key=True)
    memory_type: str = Field(index=True)       # user, feedback, project, reference
    content: str = Field(default="")
    source: str = Field(default="auto")        # auto, user, agent
    created_at: datetime = Field(default_factory=datetime.utcnow)

