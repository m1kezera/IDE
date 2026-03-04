"""Lumina IDE — Workspace & File System API.

Provides endpoints for browsing, reading, and editing files
within a user-selected workspace directory. Workspace path
is persisted in the DB config so it survives restarts.
"""

from __future__ import annotations

import os
import pathlib
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/workspace", tags=["workspace"])

# In-memory cache (loaded from DB on first access)
_workspace_path: Optional[str] = None
_loaded = False

# Extensions to treat as text
TEXT_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".scss",
    ".json", ".yaml", ".yml", ".toml", ".xml", ".md", ".txt", ".rst",
    ".sh", ".bat", ".ps1", ".cmd", ".env", ".gitignore", ".editorconfig",
    ".csv", ".sql", ".r", ".java", ".c", ".cpp", ".h", ".hpp", ".cs",
    ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".lua", ".vim",
    ".cfg", ".ini", ".conf", ".dockerfile", ".makefile",
    ".svelte", ".vue", ".astro",
}

SKIP_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv",
    ".next", ".nuxt", "dist", "build", ".cache", ".idea",
    ".vs", ".vscode", "target", "bin", "obj", ".svelte-kit",
}

MAX_FILE_SIZE = 1_000_000
MAX_TREE_DEPTH = 5
MAX_TREE_ITEMS = 500


class OpenFolderRequest(BaseModel):
    path: str


class SaveFileRequest(BaseModel):
    path: str
    content: str


def _load_workspace_from_db():
    """Load persisted workspace path from AppConfig."""
    global _workspace_path, _loaded
    if _loaded:
        return
    _loaded = True
    try:
        from database import get_session_direct
        from models import AppConfig
        from sqlmodel import select
        with get_session_direct() as session:
            stmt = select(AppConfig).where(AppConfig.key == "workspace_path")
            cfg = session.exec(stmt).first()
            if cfg and cfg.value and os.path.isdir(cfg.value):
                _workspace_path = cfg.value
    except Exception:
        pass


def _save_workspace_to_db(path: str):
    """Persist workspace path to AppConfig."""
    try:
        from database import get_session_direct
        from models import AppConfig
        from sqlmodel import select
        with get_session_direct() as session:
            stmt = select(AppConfig).where(AppConfig.key == "workspace_path")
            cfg = session.exec(stmt).first()
            if cfg:
                cfg.value = path
                session.add(cfg)
            else:
                session.add(AppConfig(key="workspace_path", value=path))
            session.commit()
    except Exception:
        pass


def _is_text_file(filename: str) -> bool:
    ext = pathlib.Path(filename).suffix.lower()
    name = pathlib.Path(filename).name.lower()
    if name in {"makefile", "dockerfile", "procfile", "gemfile", "rakefile",
                "license", "readme", "changelog", "authors", "contributors"}:
        return True
    return ext in TEXT_EXTENSIONS or ext == ""


def _build_tree(base: str, rel: str = "", depth: int = 0, counter: Optional[List[int]] = None):
    if counter is None:
        counter = [0]
    if depth > MAX_TREE_DEPTH or counter[0] > MAX_TREE_ITEMS:
        return []

    full = os.path.join(base, rel) if rel else base
    items = []

    try:
        entries = sorted(os.listdir(full), key=lambda x: (not os.path.isdir(os.path.join(full, x)), x.lower()))
    except PermissionError:
        return []

    for name in entries:
        if counter[0] > MAX_TREE_ITEMS:
            break
        if name.startswith(".") and name not in {".env", ".gitignore", ".editorconfig"}:
            continue

        entry_path = os.path.join(full, name)
        rel_path = os.path.join(rel, name) if rel else name
        rel_path = rel_path.replace("\\", "/")

        if os.path.isdir(entry_path):
            if name in SKIP_DIRS:
                continue
            counter[0] += 1  # type: ignore
            children = _build_tree(base, rel_path, depth + 1, counter)
            items.append({"name": name, "path": rel_path, "type": "dir", "children": children})
        else:
            counter[0] += 1  # type: ignore
            ext = pathlib.Path(name).suffix.lower()
            try:
                size = os.path.getsize(entry_path)
            except OSError:
                size = 0
            items.append({  # type: ignore
                "name": name, "path": rel_path, "type": "file",
                "ext": ext, "size": size, "is_text": _is_text_file(name),
            })

    return items


# ─── Endpoints ──────────────────────────────────────────────────────

@router.get("/current")
async def get_workspace():
    _load_workspace_from_db()
    return {"path": _workspace_path, "is_open": _workspace_path is not None}


@router.post("/open")
async def open_folder(body: OpenFolderRequest):
    global _workspace_path, _loaded
    _loaded = True

    path = os.path.abspath(body.path)
    if not os.path.isdir(path):
        raise HTTPException(status_code=400, detail=f"Pasta não encontrada: {path}")

    _workspace_path = path
    _save_workspace_to_db(path)
    return {"path": _workspace_path, "status": "opened"}


@router.get("/browse")
async def browse_folder():
    import threading
    result = {"path": None}

    def _pick():
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            folder = filedialog.askdirectory(title="Selecionar pasta do projeto")
            root.destroy()
            if folder:
                result["path"] = folder  # type: ignore
        except Exception:
            pass

    t = threading.Thread(target=_pick, daemon=True)
    t.start()
    t.join(timeout=120)

    folder_path = result.get("path")
    if isinstance(folder_path, str):
        global _workspace_path, _loaded
        _loaded = True
        ws_path = os.path.abspath(folder_path)
        _workspace_path = ws_path
        _save_workspace_to_db(ws_path)
        return {"path": ws_path, "status": "opened"}

    return {"path": None, "status": "cancelled"}


@router.get("/tree")
async def get_tree():
    _load_workspace_from_db()
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="Nenhuma pasta aberta.")
    tree = _build_tree(_workspace_path)
    return {"root": os.path.basename(_workspace_path), "path": _workspace_path, "tree": tree}


@router.get("/file")
async def read_file(path: str = Query(...)):
    _load_workspace_from_db()
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="Nenhuma pasta aberta.")
    full_path = os.path.normpath(os.path.join(_workspace_path, path))
    if not full_path.startswith(os.path.normpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail=f"Arquivo não encontrado: {path}")
    size = os.path.getsize(full_path)
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"Arquivo muito grande ({size} bytes).")
    if not _is_text_file(full_path):
        return {"path": path, "content": None, "binary": True, "size": size}
    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao ler: {exc}")
    ext = pathlib.Path(full_path).suffix.lower()
    return {"path": path, "content": content, "binary": False, "size": size, "ext": ext, "lines": content.count("\n") + 1}


@router.put("/file")
async def write_file(body: SaveFileRequest):
    _load_workspace_from_db()
    if not _workspace_path:
        raise HTTPException(status_code=400, detail="Nenhuma pasta aberta.")
    full_path = os.path.normpath(os.path.join(_workspace_path, body.path))
    if not full_path.startswith(os.path.normpath(_workspace_path)):
        raise HTTPException(status_code=403, detail="Acesso negado.")
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(body.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar: {exc}")
    return {"path": body.path, "status": "saved", "size": len(body.content.encode("utf-8"))}
