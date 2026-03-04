"""Lumina IDE — Database engine & session management."""

from contextlib import contextmanager
from sqlmodel import SQLModel, Session, create_engine
from config import get_settings

# Import models so SQLModel.metadata registers all tables
import models  # noqa: F401 — UsageLog, AppConfig, ChatSession, ChatMessage

_settings = get_settings()
_engine = create_engine(_settings.database_url, echo=False)


def init_db() -> None:
    """Create all tables if they don't exist yet."""
    SQLModel.metadata.create_all(_engine)


def get_session():
    """FastAPI dependency — yields a DB session per request."""
    with Session(_engine) as session:
        yield session


@contextmanager
def get_session_direct():
    """Context manager for non-request DB access (e.g. background logging)."""
    session = Session(_engine)
    try:
        yield session
    finally:
        session.close()
