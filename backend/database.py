"""Project Y — Database engine & session management."""

from contextlib import contextmanager
from sqlmodel import SQLModel, Session, create_engine, select
from config import get_settings
import logging

log = logging.getLogger("projecty.database")

# Import models so SQLModel.metadata registers all tables
import models  # noqa: F401 — UsageLog, AppConfig, ChatSession, ChatMessage, Library*, AgentMemory

_settings = get_settings()
_engine = create_engine(_settings.database_url, echo=False)


def init_db() -> None:
    """Create all tables if they don't exist yet."""
    SQLModel.metadata.create_all(_engine)
    # Lightweight migration: add 'model' column if missing (v5.2+)
    from sqlalchemy import text
    with Session(_engine) as s:
        try:
            s.exec(text("ALTER TABLE chat_sessions ADD COLUMN model TEXT DEFAULT ''"))  # type: ignore
            s.commit()
        except Exception:
            s.rollback()  # Column already exists — safe to ignore
    
    # Ensure default "Geral" folder exists
    _ensure_default_folder()
    
    # Auto-migrate JSON files → SQLite (one-time)
    _migrate_json_to_sqlite()


def _ensure_default_folder() -> None:
    """Ensure the default 'Geral' library folder exists."""
    try:
        with Session(_engine) as s:
            existing = s.exec(select(models.LibraryFolder).where(models.LibraryFolder.name == "Geral")).first()
            if not existing:
                s.add(models.LibraryFolder(name="Geral"))
                s.commit()
                log.info("📁 Default 'Geral' folder created in library_folders")
    except Exception as e:
        log.warning(f"⚠️ Failed to ensure default folder: {e}")


def _migrate_json_to_sqlite() -> None:
    """One-time migration: library_state.json + memories.json → SQLite.
    Renames original files to .bak after successful migration."""
    import os, json
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # ── Migrate library_state.json ──
    lib_json = os.path.join(base_dir, "library_state.json")
    lib_bak = lib_json + ".migrated.bak"
    if os.path.exists(lib_json) and not os.path.exists(lib_bak):
        try:
            with open(lib_json, "r", encoding="utf-8") as f:
                state = json.load(f)
            
            with Session(_engine) as s:
                # Migrate folders
                for folder_data in state.get("folders", []):
                    fname = folder_data.get("name", "")
                    if not fname:
                        continue
                    existing = s.exec(select(models.LibraryFolder).where(models.LibraryFolder.name == fname)).first()
                    if not existing:
                        s.add(models.LibraryFolder(name=fname))
                
                # Migrate documents
                for doc in state.get("doc_registry", []):
                    doc_name = doc.get("name", "")
                    if not doc_name:
                        continue
                    existing = s.exec(select(models.LibraryDocument).where(models.LibraryDocument.name == doc_name)).first()
                    if not existing:
                        s.add(models.LibraryDocument(
                            name=doc_name,
                            path=doc.get("path", ""),
                            doc_type=doc.get("type", "md"),
                            folder=doc.get("folder", "Geral"),
                            pages=doc.get("pages", 0),
                            words=doc.get("words", 0),
                            tables_count=doc.get("tables", 0),
                        ))
                
                # Migrate personality
                personality_text = state.get("personality_prompt", "")
                personality_name = state.get("personality_name", "")
                if personality_text:
                    existing_p = s.exec(select(models.PersonalityConfig)).first()
                    if not existing_p:
                        s.add(models.PersonalityConfig(
                            name=personality_name,
                            prompt=personality_text,
                            is_active=True,
                        ))
                
                s.commit()
            
            # Rename to .bak
            os.rename(lib_json, lib_bak)
            log.info(f"✅ Migrated library_state.json → SQLite ({lib_bak})")
        except Exception as e:
            log.error(f"❌ Failed to migrate library_state.json: {e}")
    
    # ── Migrate memories.json ──
    mem_json = os.path.join(base_dir, "memories.json")
    mem_bak = mem_json + ".migrated.bak"
    if os.path.exists(mem_json) and not os.path.exists(mem_bak):
        try:
            with open(mem_json, "r", encoding="utf-8") as f:
                memories = json.load(f)
            
            from datetime import datetime
            with Session(_engine) as s:
                for mem in memories:
                    content = mem.get("content", "").strip()
                    if not content:
                        continue
                    existing = s.exec(
                        select(models.AgentMemory).where(models.AgentMemory.content == content)
                    ).first()
                    if not existing:
                        ts = mem.get("timestamp", 0)
                        created = datetime.fromtimestamp(ts) if ts else datetime.utcnow()
                        s.add(models.AgentMemory(
                            memory_type=mem.get("type", "user"),
                            content=content,
                            source=mem.get("source", "migrated"),
                            created_at=created,
                        ))
                s.commit()
            
            os.rename(mem_json, mem_bak)
            log.info(f"✅ Migrated memories.json → SQLite ({mem_bak})")
        except Exception as e:
            log.error(f"❌ Failed to migrate memories.json: {e}")


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
