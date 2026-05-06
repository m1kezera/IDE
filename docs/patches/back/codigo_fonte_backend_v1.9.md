# Código Fonte Backend Completo - Lumina IDE (v1.9)

> Este documento contém o dump de todo o código-fonte atual exclusivo do Backend em Python da Lumina IDE, refletindo a versão 1.9 com watchdog (Optical Nerve), healer.py (Auto-Healing API), e Websockets Preditivos.

## Backend - Motor Python FastAPI da Lumina IDE v1.9 (Auto-Healing & Optical Nerve)

### `backend/agent.py`

```python
"""Lumina IDE — Agentic File Operations.

Parses AI model responses for file blocks and writes them to the workspace.
This is what makes Lumina IDE act like a coding agent instead of a chatbot.

File block format in model output:
    📄 FILE: relative/path/to/file.ext
    ```lang
    content here
    ```
"""

from __future__ import annotations

import os
import re
import json
from terminal import run_command_in_terminal  # type: ignore[import]

try:
    kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
    with open(kb_path, "r", encoding="utf-8") as f:
        KNOWLEDGE_BASE = json.dumps(json.load(f), indent=2)
except Exception:
    KNOWLEDGE_BASE = "{}"


# System prompt that instructs the model to output actionable file blocks
SYSTEM_PROMPT = """You are Lumina, an expert AI coding agent embedded in the Lumina IDE. You CREATE, MODIFY, and DELETE files directly in the user's workspace.

═══ CRITICAL RULES ═══

1. When the user asks to build, create, or modify something — DO IT IMMEDIATELY. Output complete, working file contents.
2. NEVER output just instructions, explanations, or code snippets without file blocks. ALWAYS write real files.
3. BEFORE emitting file commands, ALWAYS explain your interpretation and strategy within a <thought>...</thought> block.
4. MANDATORY PLANNING: Before any code modification, generate or update a plan using this format:
📝 PLAN:
[ ] Write a task...
[ ] Another task...
(The system will write this to LUMINA_PLAN.md automatically)
5. For EVERY file you create or modify, use this EXACT format:

📄 FILE: relative/path/to/file.ext
```language
complete file content here
```

6. To DELETE a file, use:
🗑️ DELETE: relative/path/to/file.ext

7. To start a NEW React+Vite+Tailwind project, ALWAYS use this command FIRST:
📦 TEMPLATE: react-vite-tailwind

This command will instantly scaffold the base project structure (package.json, vite config, tailwind config, index.html, main.jsx, index.css). Do NOT write these boilerplate files manually! After calling the template, ONLY write the specific components and App.jsx needed for the user's request.

8. Use relative paths from workspace root (e.g., src/App.jsx, not C:/full/path).
9. Write COMPLETE file contents — never partial snippets.
10. If editing existing files, output the COMPLETE new version.

═══ V4.0 OPTICAL NERVE (PREEMPTIVE STRIKE) ═══
You live in a state of continuous monitoring. You will be fed code snippets as the user types or saves files.
DO NOT WAIT FOR PROMPTS. If you receive an autocomplete request or a file change, "feel" the code and project the future.
Suggest the next logical architectural step directly at the cursor position. Your "Ghost Text" will be injected.

═══ AUTONOMOUS FILE EXPLORATION ═══
If you need to know what files exist or what is inside a file before you can write the code:
1. To SEARCH for files by name or list a directory:
🔍 SEARCH: components
2. To READ the contents of a specific file:
📖 READ: src/App.jsx
(The system will automatically provide the search results or file contents to you so you can continue working.)

═══ WHEN USER SAYS "DELETE/APAGUE TUDO" ═══
If the user asks to clear/delete existing files and start fresh:
1. Use 🗑️ DELETE: for each existing file to remove
2. Then use 📦 TEMPLATE: react-vite-tailwind
3. Then write your specific component code.

After file blocks, add a brief summary of what you created/modified/deleted.

═══ ENGINEERING DICTIONARY (KNOWLEDGE BASE) ═══
""" + KNOWLEDGE_BASE

# Regex to extract file blocks from model output
_FILE_BLOCK_RE = re.compile(
    r'📄\s*FILE:\s*(.+?)\s*\n'
    r'```\w*\n'
    r'(.*?)'
    r'\n```',
    re.DOTALL
)

# Regex to extract PLAN blocks
_PLAN_RE = re.compile(
    r'📝\s*PLAN:\s*\n(.*?)(?=\n(?:📄|🗑️|📦|⚙️|🔍|📖|```|<thought>|$))',
    re.DOTALL
)

# Regex to extract DELETE operations
_DELETE_RE = re.compile(
    r'🗑️\s*DELETE:\s*(.+?)(?:\n|$)'
)

# Regex to extract TEMPLATE operations
_TEMPLATE_RE = re.compile(
    r'📦\s*TEMPLATE:\s*(.+?)(?:\n|$)'
)

# Regex to extract COMMAND operations
_COMMAND_RE = re.compile(
    r'⚙️\s*COMMAND:\s*(.+?)(?:\n|$)'
)

# Regex to extract SEARCH operations
_SEARCH_RE = re.compile(
    r'🔍\s*SEARCH:\s*(.+?)(?:\n|$)'
)

# Regex to extract READ operations
_READ_RE = re.compile(
    r'📖\s*READ:\s*(.+?)(?:\n|$)'
)

def parse_file_blocks(text: str) -> list[dict]:
    """Extract file operations from model output.

    Returns list of {'path': str, 'content': str, 'op': 'write'|'delete'|'template'|'plan'}
    """
    blocks = []

    # Parse PLAN operations
    for match in _PLAN_RE.finditer(text):
        plan_content = match.group(1).strip()
        if plan_content:
            blocks.append({"path": "LUMINA_PLAN.md", "content": plan_content, "op": "plan"})

    # Parse TEMPLATE operations
    for match in _TEMPLATE_RE.finditer(text):
        name = match.group(1).strip()
        blocks.append({"path": f"Template: {name}", "content": name, "op": "template"})

    # Parse COMMAND operations
    for match in _COMMAND_RE.finditer(text):
        cmd = match.group(1).strip()
        blocks.append({"path": f"Command: {cmd}", "content": cmd, "op": "command"})

    # Parse SEARCH operations
    for match in _SEARCH_RE.finditer(text):
        query = match.group(1).strip()
        blocks.append({"path": f"Search: {query}", "content": query, "op": "search"})

    # Parse READ operations
    for match in _READ_RE.finditer(text):
        file_path = match.group(1).strip()
        blocks.append({"path": f"Read: {file_path}", "content": file_path, "op": "read"})

    # Parse DELETE operations
    for match in _DELETE_RE.finditer(text):
        path = match.group(1).strip().strip('"').strip("'").replace("\\", "/").lstrip("/")
        while path.startswith("../"):
            path = path.removeprefix("../")
        if path:
            blocks.append({"path": path, "content": "", "op": "delete"})

    # Parse FILE blocks (write operations)
    for match in _FILE_BLOCK_RE.finditer(text):
        path = match.group(1).strip().strip('"').strip("'")
        content = match.group(2)
        path = path.replace("\\", "/").lstrip("/")
        while path.startswith("../"):
            path = path.removeprefix("../")
        if path:
            blocks.append({"path": path, "content": content, "op": "write"})
    return blocks


def write_file_blocks(workspace_path: str, blocks: list[dict]) -> list[dict]:
    """Write/delete/scaffold extracted file blocks in the workspace.

    Returns list of {'path': str, 'status': 'created'|'modified'|'deleted'|'error', 'size': int}
    """
    results = []
    
    # Core Protection List: Hard-lock against modifications
    PROTECTED_FILES = ["main.py", "pulsyce.db", "config.py", ".env", "sqlite3.exe"]
    PROTECTED_DIRS = ["backend/"]

    for block in blocks:
        
        # Handle TEMPLATE
        if block.get("op") == "template":
            name = block["content"].lower()
            if name == "react-vite-tailwind":
                try:
                    _scaffold_react_vite_tailwind(workspace_path)
                    results.append({"path": "React+Vite+Tailwind Template", "status": "created", "size": 0})
                except Exception as exc:
                    results.append({"path": "Template Error", "status": "error", "error": str(exc)})
            else:
                results.append({"path": f"Template {name} not found", "status": "error", "error": "Unknown template"})
            continue

        # Handle COMMAND
        if block.get("op") == "command":
            cmd = block["content"]
            # To be safe, try to get port 'cmd', or fallback if we implement multiple ports later.
            success = run_command_in_terminal(cmd, port="cmd")
            if success:
                results.append({"path": f"> {cmd}", "status": "created", "size": 0})
            else:
                results.append({"path": f"Failed to run: {cmd}", "status": "error", "error": "Terminal unavailable"})
            continue

        # Skip SEARCH and READ (handled via frontend intercept, but if passed here, return as status)
        if block.get("op") in ("search", "read"):
            results.append({"path": block["path"], "status": "created", "size": 0})
            continue

        # Handle PLAN
        if block.get("op") == "plan":
            try:
                plan_path = os.path.join(workspace_path, "LUMINA_PLAN.md")
                existed = os.path.isfile(plan_path)
                with open(plan_path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(block["content"])
                results.append({"path": "LUMINA_PLAN.md", "status": "modified" if existed else "created", "size": len(block["content"])})
            except Exception as exc:
                results.append({"path": "LUMINA_PLAN.md", "status": "error", "error": str(exc)})
            continue

        full_path = os.path.normpath(os.path.join(workspace_path, block["path"]))

        # Security: ensure path stays within workspace
        if not full_path.startswith(os.path.normpath(workspace_path)):
            continue

        # Core Protection List Check
        rel_path = block["path"].replace("\\", "/")
        is_protected = False
        if os.path.basename(rel_path) in PROTECTED_FILES:
            is_protected = True
        for pdir in PROTECTED_DIRS:
            if rel_path.startswith(pdir) or rel_path == pdir.rstrip("/"):
                is_protected = True
        
        if is_protected:
            results.append({"path": block["path"], "status": "error", "error": "Protected file (Core Protection List)"})
            continue

        # Handle DELETE
        if block.get("op") == "delete":
            try:
                if os.path.isfile(full_path):
                    os.remove(full_path)
                    results.append({"path": block["path"], "status": "deleted", "size": 0})
                elif os.path.isdir(full_path):
                    import shutil
                    shutil.rmtree(full_path)
                    results.append({"path": block["path"], "status": "deleted", "size": 0})
                else:
                    results.append({"path": block["path"], "status": "not_found", "size": 0})
            except Exception as exc:
                results.append({"path": block["path"], "status": "error", "error": str(exc)})
            continue

        # Handle WRITE (create/modify)
        existed = os.path.isfile(full_path)
        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(block["content"])
            results.append({
                "path": block["path"],
                "status": "modified" if existed else "created",
                "size": len(block["content"].encode("utf-8")),
            })
        except Exception as exc:
            results.append({
                "path": block["path"],
                "status": "error",
            })

    # Check off modified files in LUMINA_PLAN.md
    try:
        plan_path = os.path.join(workspace_path, "LUMINA_PLAN.md")
        if os.path.isfile(plan_path):
            with open(plan_path, "r", encoding="utf-8") as f:
                plan_text = f.read()

            new_plan_text = plan_text
            for res in results:
                if res["status"] in ("created", "modified", "deleted") and res["path"] != "LUMINA_PLAN.md":
                    pattern = re.compile(r'\[\s*\](.*?' + re.escape(str(res["path"])) + r'.*)', re.IGNORECASE)
                    new_plan_text = pattern.sub(r'[x]\1', new_plan_text)
            
            if new_plan_text != plan_text:
                with open(plan_path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(new_plan_text)
    except Exception:
        pass

    return results


def _scaffold_react_vite_tailwind(workspace_path: str):
    """Creates a basic React + Vite + Tailwind project instantly."""
    files = {
        "package.json": """{
  "name": "lumina-generated-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0",
    "gsap": "^3.12.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}""",
        "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})""",
        "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
        "postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
        "index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lumina Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
        "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
        "src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}"""
    }

    for rel_path, content in files.items():
        full_path = os.path.join(workspace_path, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)

```

### `backend/chunker.py`

```python
"""Lumina IDE — Module B: Smart Context Processor (Chunking).

Implements sliding-window code splitting so local 7B models
(Mistral / Llama) don't lose accuracy on long files.
"""

from __future__ import annotations

import tiktoken

# Use cl100k_base — same encoder used by GPT-4 / GPT-3.5
_ENCODING = tiktoken.get_encoding("cl100k_base")

DEFAULT_MAX_TOKENS = 1200
DEFAULT_OVERLAP = 150


def count_tokens(text: str) -> int:
    """Return the exact token count for *text*."""
    return len(_ENCODING.encode(text))


def chunk_code(
    text: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    overlap: int = DEFAULT_OVERLAP,
) -> list[dict]:
    """Split *text* into overlapping token windows.

    Returns a list of dicts: ``[{"index": 0, "content": "...", "tokens": 800}, ...]``
    Files with ≤ *max_tokens* are returned as a single chunk.
    """
    tokens = _ENCODING.encode(text)
    total = len(tokens)

    if total <= max_tokens:
        return [{"index": 0, "content": text, "tokens": total}]

    chunks: list[dict] = []
    start = 0
    idx = 0

    while start < total:
        end = min(start + max_tokens, total)
        chunk_tokens = tokens[start:end]
        chunk_text = _ENCODING.decode(chunk_tokens)

        chunks.append({
            "index": idx,
            "content": chunk_text,
            "tokens": len(chunk_tokens),
        })

        # Advance the window, keeping *overlap* tokens from the previous chunk
        start += max_tokens - overlap
        idx += 1

    return chunks


def merge_results(chunks_output: list[dict]) -> dict:
    """Unify multiple chunked JSON responses into a single report.

    Each item in *chunks_output* is expected to have at least a
    ``"response"`` key (string) and optionally ``"prompt_tokens"``
    and ``"completion_tokens"`` integers.
    """
    merged_text_parts: list[str] = []
    total_prompt = 0
    total_completion = 0

    for chunk in chunks_output:
        merged_text_parts.append(chunk.get("response", ""))
        total_prompt += chunk.get("prompt_tokens", 0)
        total_completion += chunk.get("completion_tokens", 0)

    return {
        "response": "\n".join(merged_text_parts),
        "total_chunks": len(chunks_output),
        "prompt_tokens": total_prompt,
        "completion_tokens": total_completion,
        "total_tokens": total_prompt + total_completion,
    }

```

### `backend/config.py`

```python
"""Lumina IDE — Application Configuration (loaded from .env)."""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os
import sys

# ─── Path resolution for both dev and PyInstaller bundled builds ─────
def _get_base_dir():
    """Return the directory where the backend files live.
    
    In dev: the backend/ source directory (where __file__ is).
    In PyInstaller: the directory where the .exe is located.
    """
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle — use exe's directory
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def _get_data_dir():
    """Return writable data directory for DB and user data.
    
    Uses %APPDATA%/lumina-ide/ on Windows so data persists across updates.
    """
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
        data_dir = os.path.join(appdata, "lumina-ide")
    else:
        data_dir = os.path.join(os.path.expanduser("~"), ".lumina-ide")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir

_BASE_DIR = _get_base_dir()
_DATA_DIR = _get_data_dir()

_ENV_PATH = os.path.join(_BASE_DIR, ".env")
_DB_PATH = os.path.join(_DATA_DIR, "pulsyce.db")


class Settings(BaseSettings):
    """Centralized settings read from environment / .env file."""

    # Ollama (local AI)
    ollama_host: str = "127.0.0.1"
    ollama_port: int = 11434

    # Database
    database_url: str = f"sqlite:///{_DB_PATH}"

    # Cloud API — generic (any provider)
    cloud_api_key: str = ""
    cloud_provider: str = ""      # auto-detected or manual: openai, anthropic, groq, etc.

    # Default model names
    local_model: str = "mistral"
    cloud_model: str = "gpt-4o"

    # Token pricing (USD per 1K tokens) for ROI calculation
    cloud_input_price: float = 0.005   # $5 / 1M input tokens
    cloud_output_price: float = 0.015  # $15 / 1M output tokens

    class Config:
        env_file = _ENV_PATH
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings singleton."""
    return Settings()

```

### `backend/database.py`

```python
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

```

### `backend/extensions.py`

```python
"""Lumina IDE — Extensions API.

Handles loading, enabling, and disabling extensions from the workspace.
Extensions are standard folders with an `extension.json` manifest.

In packaged builds, extensions live in %APPDATA%/lumina-ide/extensions/
so that users can install/remove extensions freely.  During development,
set LUMINA_EXTENSIONS_DIR to override the path.
"""

import os
import json
import sys
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/extensions", tags=["extensions"])


def _resolve_extensions_dir() -> str:
    """Return the extensions directory, creating it if needed.

    Priority:
      1. LUMINA_EXTENSIONS_DIR env-var (dev override)
      2. %APPDATA%/lumina-ide/extensions  (Windows standard)
      3. Fallback next to this file (legacy)
    """
    env_override = os.environ.get("LUMINA_EXTENSIONS_DIR")
    if env_override:
        target = env_override
    elif sys.platform == "win32":
        appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
        target = os.path.join(appdata, "lumina-ide", "extensions")
    else:
        # macOS / Linux fallback
        target = os.path.join(os.path.expanduser("~"), ".lumina-ide", "extensions")

    os.makedirs(target, exist_ok=True)
    return target


EXTENSIONS_DIR = _resolve_extensions_dir()


def _get_installed():
    """Scan the extensions directory for valid extension manifests."""
    extensions = []
    try:
        for item in os.listdir(EXTENSIONS_DIR):
            ext_path = os.path.join(EXTENSIONS_DIR, item)
            if os.path.isdir(ext_path):
                manifest_path = os.path.join(ext_path, "extension.json")
                if os.path.isfile(manifest_path):
                    try:
                        with open(manifest_path, "r", encoding="utf-8") as f:
                            manifest = json.load(f)
                            manifest["id"] = item  # Folder name as ID

                            # Defaults if missing
                            manifest.setdefault("name", item)
                            manifest.setdefault("version", "1.0.0")
                            manifest.setdefault("description", "Sem descrição.")
                            manifest.setdefault("author", "Desconhecido")
                            manifest.setdefault("enabled", True)

                            extensions.append(manifest)
                    except json.JSONDecodeError:
                        pass  # Skip invalid JSON
    except OSError:
        pass

    return extensions


@router.get("/path")
async def get_extensions_path():
    """Return the resolved extensions directory so the UI can display it."""
    return {"path": EXTENSIONS_DIR}


@router.get("/")
async def list_extensions():
    return {"extensions": _get_installed()}


@router.post("/{extension_id}/toggle")
async def toggle_extension(extension_id: str):
    ext_path = os.path.join(EXTENSIONS_DIR, extension_id)
    manifest_path = os.path.join(ext_path, "extension.json")

    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Extensão não encontrada.")

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        # Toggle state
        current_state = manifest.get("enabled", True)
        manifest["enabled"] = not current_state

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=4)

        return {"status": "success", "enabled": manifest["enabled"]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao alterar extensão: {exc}")

```

### `backend/healer.py`

```python
import os
import ast
import subprocess
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("lumina.healer")

def check_python_syntax(code: str) -> Optional[Dict[str, Any]]:
    """Runs a fast ast.parse on Python code to catch syntax issues."""
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return {
            "type": "error",
            "lang": "python",
            "line": getattr(e, "lineno", 1),
            "col": getattr(e, "offset", 1),
            "msg": str(e.msg),
            "suggestion": f"# Falha detectada: {e.msg}\n# A inteligência sugere revisar esta linha."
        }
    except Exception as e:
        return None

def check_js_syntax(code: str) -> Optional[Dict[str, Any]]:
    """Basic structural JS/JSX check (unclosed braces, trailing imports).
    For a perfect check, we'd spawn `node` but for performance we do simple regex
    or shell out to a lightweight linter. Here we use an extreme fallback heuristic.
    """
    # Quick unclosed braces check
    open_b = code.count('{')
    close_b = code.count('}')
    if open_b > close_b:
        return {
            "type": "error",
            "lang": "javascript",
            "line": code[:code.rfind('{')].count('\n') + 1 if open_b > close_b else 1,
            "col": 1,
            "msg": f"Erro de Estrutura: {open_b} chaves abertas, mas apenas {close_b} fechadas.",
            "suggestion": "Verifique o fechamento da última função ou objeto."
        }
    elif close_b > open_b:
        return {
            "type": "error",
            "lang": "javascript",
            "line": code.count('\n'),
            "col": 1,
            "msg": f"Erro de Estrutura: chaves fechadas demais ({close_b} contra {open_b}).",
            "suggestion": "Remova a chave extra."
        }
    return None

def heal_file(file_path: str) -> Optional[Dict[str, Any]]:
    """Entry point from watcher. Reads the file and validates it."""
    if not os.path.exists(file_path):
        return None

    ext = file_path.split('.')[-1].lower()
    if ext not in ['py', 'js', 'jsx', 'ts', 'tsx']:
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception:
        return None

    if ext == 'py':
        return check_python_syntax(code)
    else:
        return check_js_syntax(code)

```

### `backend/knowledge_base.json`

```json
{
    "project_name": "Lumina IDE",
    "version": "1.2",
    "stack": {
        "backend": {
            "framework": "FastAPI (Async)",
            "orm": "SQLModel",
            "database": "SQLite (pulsyce.db)",
            "language": "Python 3.10+"
        },
        "frontend": {
            "framework": "React 18",
            "build_tool": "Vite",
            "styling": "Tailwind CSS",
            "animations": "GSAP",
            "language": "JavaScript/JSX (or TypeScript/TSX if configured)"
        },
        "devops": {
            "dependency_management": "Python dependencies via automatic pip install detected by AI agent during import errors."
        }
    },
    "architecture_rules": [
        "Idempotency in file operations: always check if files/directories exist or handle creations gracefully.",
        "Path sanity: use os.path.normpath and absolute/relative boundaries carefully to construct safe paths.",
        "Logging: mandatory telemetry logging for model usage.",
        "Agentic flow: AI should always generate a LUMINA_PLAN.md before extensive autonomous execution (Chain of Thought).",
        "Self-Healing: Se o terminal retornar um erro de 'ModuleNotFoundError' ou 'Could not find import', você DEVE analisar a dependência e rodar `pip install <pacote>` ou `npm install <pacote>` de forma autônoma e imediata sem perguntar."
    ]
}
```

### `backend/logger_utils.py`

```python
import asyncio
import json
import logging
from typing import List

LOG_SUBSCRIBERS: List[asyncio.Queue] = []

class SSELoggingHandler(logging.Handler):
    def emit(self, record):
        try:
            msg = self.format(record)
            log_entry = json.dumps({
                "level": record.levelname,
                "message": msg,
                "source": record.name
            })
            for q in LOG_SUBSCRIBERS:
                try:
                    q.put_nowait(log_entry)
                except BaseException:
                    pass
        except Exception:
            self.handleError(record)

def setup_sse_logger():
    sse_handler = SSELoggingHandler()
    sse_handler.setFormatter(logging.Formatter("%(message)s"))
    # Hook into our main logger
    logging.getLogger("lumina").addHandler(sse_handler)
    # Could hook others like uvicorn as well if desired
    # logging.getLogger("uvicorn.error").addHandler(sse_handler)

```

### `backend/main.py`

```python
"""Lumina IDE — Backend Entrypoint.

Run with:  uvicorn main:app --reload --port 8000
"""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Logging setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s → %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger("lumina")

try:
    from logger_utils import setup_sse_logger
    setup_sse_logger()
except Exception as e:
    log.error(f"Failed to setup SSE logger: {e}")

# ─── Import modules (with diagnostic logging) ──────────────────────
_import_ok = True

try:
    from database import init_db
    log.info("✅ database — importado com sucesso")
except Exception as e:
    log.error(f"❌ database — falha ao importar: {e}")
    _import_ok = False

try:
    from router import router as api_router
    log.info("✅ router — importado com sucesso")
except Exception as e:
    log.error(f"❌ router — falha ao importar: {e}")
    _import_ok = False

try:
    from workspace import router as workspace_router
    log.info("✅ workspace — importado com sucesso")
except Exception as e:
    log.error(f"❌ workspace — falha ao importar: {e}")
    _import_ok = False

try:
    from extensions import router as extensions_router
    log.info("✅ extensions — importado com sucesso")
except Exception as e:
    log.error(f"❌ extensions — falha ao importar: {e}")
    _import_ok = False

try:
    from terminal import router as terminal_router
    log.info("✅ terminal — importado com sucesso")
except Exception as e:
    log.error(f"❌ terminal — falha ao importar: {e}")
    _import_ok = False

try:
    from setup_manager import router as setup_router
    log.info("✅ setup_manager — importado com sucesso")
except Exception as e:
    log.error(f"❌ setup_manager — falha ao importar: {e}")
    _import_ok = False

if _import_ok:
    log.info("🟢 Todos os módulos importados com sucesso!")
else:
    log.warning("🟡 Alguns módulos falharam — verifique os erros acima")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    log.info("═══════════════════════════════════════════════")
    log.info("   🚀 Lumina IDE Backend — Iniciando...")
    log.info("═══════════════════════════════════════════════")

    # 1. Database
    try:
        init_db()
        log.info("✅ Banco de dados inicializado (tabelas criadas/verificadas)")
    except Exception as e:
        log.error(f"❌ Falha ao inicializar banco de dados: {e}")

    # 2. Config check
    try:
        from config import get_settings
        settings = get_settings()
        log.info(f"✅ Configuração carregada — Ollama: {settings.ollama_host}:{settings.ollama_port}, Modelo: {settings.local_model}")
    except Exception as e:
        log.error(f"❌ Falha ao carregar configuração: {e}")

    # 3. Ollama connectivity check
    try:
        import requests
        resp = requests.get(f"http://{settings.ollama_host}:{settings.ollama_port}/api/tags", timeout=5)
        if resp.ok:
            models = [m["name"] for m in resp.json().get("models", [])]
            log.info(f"✅ Ollama conectado — {len(models)} modelo(s): {', '.join(models[:5])}")
        else:
            log.warning(f"⚠️  Ollama respondeu com status {resp.status_code}")
    except requests.ConnectionError:
        log.warning("⚠️  Ollama não está rodando (conexão recusada) — o Agent não funcionará até iniciar o Ollama")
    except Exception as e:
        log.warning(f"⚠️  Não foi possível verificar Ollama: {e}")

    # 4. Routes summary
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    log.info(f"✅ {len(routes)} rotas registradas")
    log.info("═══════════════════════════════════════════════")
    log.info("   ✅ Backend pronto! http://127.0.0.1:8000")
    log.info("═══════════════════════════════════════════════")

    yield

    log.info("🔴 Lumina IDE Backend — Encerrando...")


app = FastAPI(
    title="Lumina IDE API",
    description="Hybrid Coding Environment — Local Intelligence, Global Performance.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS (allow the Vite dev server) ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register routes ───────────────────────────────────────────────
if 'api_router' in dir():
    app.include_router(api_router)
if 'workspace_router' in dir():
    app.include_router(workspace_router)
if 'extensions_router' in dir():
    app.include_router(extensions_router)
if 'terminal_router' in dir():
    app.include_router(terminal_router, prefix="/api")
if 'setup_router' in dir():
    app.include_router(setup_router)

# ─── Direct execution (PyInstaller .exe) ───────────────────────────
# In dev mode, uvicorn is invoked externally via `python -m uvicorn main:app`.
# In the packaged .exe, this file IS the entrypoint, so we must start uvicorn here.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

```

### `backend/models.py`

```python
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

class AgentPermissions(SQLModel, table=True):
    """Stores the autonomy level of the agent (Manual, Hybrid, Agent)."""
    __tablename__ = "agent_permissions"

    id: Optional[int] = Field(default=None, primary_key=True)
    level: str = Field(default="Hybrid") # Manual, Hybrid, Agent
    override_protection: bool = Field(default=False)

```

### `backend/pyrightconfig.json`

```json
{
    "venvPath": ".",
    "venv": ".venv",
    "extraPaths": [
        "."
    ]
}
```

### `backend/requirements.txt`

```text
fastapi
uvicorn
sqlmodel
requests
tiktoken
python-dotenv
pydantic-settings
websockets

```

### `backend/router.py`

```python
"""Lumina IDE — Module A: Hybrid Provider Router.

Routes generation requests to either the local Ollama instance or
a cloud API based on the active mode.
Supports SSE streaming for real-time output.
"""

from __future__ import annotations

import json
import logging
import requests
import uuid
from datetime import datetime
from typing import Optional, List, Set, Dict, Any
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from logger_utils import LOG_SUBSCRIBERS
from pydantic import BaseModel
from sqlmodel import Session, select

# Store pending file changes for Manual validation
PENDING_CHANGES_STORE = {}

from config import get_settings, Settings
from database import get_session, get_session_direct
from watcher import get_watcher
from chunker import count_tokens, chunk_code, merge_results
from telemetry import log_usage, get_dashboard_data
from models import ChatSession, ChatMessage

log = logging.getLogger("lumina.router")

router = APIRouter(prefix="/api", tags=["core"])


# ─── Request / Response schemas ────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str
    mode: str = "local"           # "local" | "cloud"
    model: Optional[str] = None      # override default model
    format: Optional[str] = None     # "json" for structured output
    stream: bool = True


class ConfigPayload(BaseModel):
    ollama_host: Optional[str] = None
    ollama_port: Optional[int] = None
    local_model: Optional[str] = None
    cloud_model: Optional[str] = None
    cloud_api_key: Optional[str] = None      # generic — any provider
    cloud_provider: Optional[str] = None     # auto-detected or manual


class ChatCreate(BaseModel):
    uid: str
    title: str = "Novo Chat"


class ChatUpdate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    role: str = "user"
    content: str = ""
    tokens: int = 0


class AutocompleteRequest(BaseModel):
    code: str               # The full file content (or partial context)
    cursor_line: int = 0    # 0-indexed line where cursor is
    cursor_col: int = 0     # 0-indexed column
    filename: str = ""      # e.g. "app.py"
    mode: str = "local"     # "local" | "cloud"


# ─── Helpers ────────────────────────────────────────────────────────
def _ollama_url(settings: Settings, path: str = "/api/generate") -> str:
    return f"http://{settings.ollama_host}:{settings.ollama_port}{path}"


def _detect_provider(api_key: str) -> str:
    """Guess the cloud provider from the API key prefix."""
    if not api_key:
        return ""
    k = api_key.strip()
    if k.startswith("sk-ant-"):
        return "anthropic"
    if k.startswith("sk-"):
        return "openai"
    if k.startswith("gsk_"):
        return "groq"
    if k.startswith("AIza"):
        return "google"
    if k.startswith("r8_") or k.startswith("p_"):
        return "replicate"
    if k.startswith("hf_"):
        return "huggingface"
    if k.startswith("xai-"):
        return "xai"
    if k.startswith("nvapi-"):
        return "nvidia"
    # Fallback — could be deepseek, mistral, together, etc.
    return "custom"


def _mask_key(key: str) -> str:
    """Show only last 4 chars of an API key."""
    if not key or len(key) < 8:
        return ""
    return "•" * min(len(key) - 4, 20) + key[-4:]  # type: ignore


def _stream_ollama(prompt: str, model: str, settings: Settings, fmt: Optional[str]):
    """Generator that yields SSE events from the Ollama stream.

    Tries /api/chat first (messages format), falls back to /api/generate.
    Includes 3-attempt retry with exponential backoff and model fallback.
    """
    import time
    from agent import SYSTEM_PROMPT

    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"

    # Build payloads for both endpoints
    chat_payload: dict = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
    }
    generate_payload: dict = {
        "model": model,
        "system": SYSTEM_PROMPT,
        "prompt": prompt,
        "stream": True,
    }
    if fmt:
        chat_payload["format"] = fmt
        generate_payload["format"] = fmt

    total_prompt = 0
    total_completion = 0

    # Detect available models for fallback
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

    # Try endpoints in order: /api/chat, /api/generate
    endpoints = [
        (f"{base_url}/api/chat",     chat_payload,     "message"),
        (f"{base_url}/api/generate", generate_payload,  "generate"),
    ]

    last_error = None

    for attempt_model in fallback_models:
        chat_payload["model"] = attempt_model
        generate_payload["model"] = attempt_model
        chat_payload["messages"][0]["content"] = SYSTEM_PROMPT

        for url, payload, mode in endpoints:
            for attempt in range(3):
                try:
                    with requests.post(
                        url,
                        json=payload,
                        stream=True,
                        timeout=(30, 600),
                    ) as resp:
                        if resp.status_code == 404:
                            # This endpoint doesn't exist, try next
                            break

                        resp.raise_for_status()

                        if attempt > 0 or attempt_model != model:
                            yield f"data: {json.dumps({'token': f'[Usando {attempt_model}] ', 'done': False})}\n\n"

                        for line in resp.iter_lines(decode_unicode=True):
                            if not line:
                                continue
                            try:
                                data = json.loads(line)
                            except json.JSONDecodeError:
                                continue

                            # Extract token depending on endpoint format
                            if mode == "message":
                                msg = data.get("message", {})
                                token = msg.get("content", "")
                            else:
                                token = data.get("response", "")

                            if data.get("done"):
                                total_prompt = data.get("prompt_eval_count", 0)
                                total_completion = data.get("eval_count", 0)

                            yield f"data: {json.dumps({'token': token, 'done': data.get('done', False)})}\n\n"

                        # Success — emit metrics and return
                        yield f"data: {json.dumps({'metrics': {'prompt_tokens': total_prompt, 'completion_tokens': total_completion}})}\n\n"
                        return

                except requests.ConnectionError:
                    last_error = f"Não foi possível conectar ao Ollama em {base_url}. Verifique se o ollama serve está rodando."
                except requests.Timeout:
                    last_error = "Timeout na conexão com o Ollama. O modelo pode estar carregando na GPU."
                except requests.RequestException as exc:
                    last_error = f"Erro do Ollama: {exc}"
                except Exception as exc:
                    last_error = f"Erro inesperado: {exc}"

                # Wait before retry (exponential backoff)
                if attempt < 2:
                    time.sleep(2 ** attempt)

    # All retries and fallbacks exhausted
    yield f"data: {json.dumps({'error': last_error or 'Erro desconhecido', 'done': True})}\n\n"
    yield f"data: {json.dumps({'metrics': {'prompt_tokens': 0, 'completion_tokens': 0}})}\n\n"


def _stream_with_logging_and_files(prompt: str, model: str, settings: Settings, fmt: Optional[str]):
    """Wraps _stream_ollama — logs usage AND writes file blocks after stream."""
    from agent import parse_file_blocks, write_file_blocks
    import workspace as ws

    total_prompt = 0
    total_completion = 0
    full_response = []   # accumulate tokens for file parsing

    for event in _stream_ollama(prompt, model, settings, fmt):
        # Extract metrics
        if '"metrics"' in event:
            try:
                data_str = event.split("data: ", 1)[1].strip()
                metrics = json.loads(data_str).get("metrics", {})
                total_prompt = metrics.get("prompt_tokens", 0)
                total_completion = metrics.get("completion_tokens", 0)
            except (IndexError, json.JSONDecodeError):
                pass
        # Accumulate tokens for file parsing
        elif '"token"' in event:
            try:
                data_str = event.split("data: ", 1)[1].strip()
                token = json.loads(data_str).get("token", "")
                full_response.append(token)
            except (IndexError, json.JSONDecodeError):
                pass

        yield event

    # ── Post-stream: parse and write file blocks
    response_text = "".join(full_response)
    file_blocks = parse_file_blocks(response_text)

    if file_blocks and ws._workspace_path:
        from models import AgentPermissions

        level = "Hybrid"
        override = False
        try:
            with get_session_direct() as session:
                perm = session.query(AgentPermissions).first()
                if perm:
                    level = perm.level
                    override = perm.override_protection
        except Exception as e:
            log.error(f"Error reading AgentPermissions: {e}")

        if level == "Manual":
            change_id = str(uuid.uuid4())
            PENDING_CHANGES_STORE[change_id] = file_blocks
            yield f"data: {json.dumps({'pending_confirmation': change_id, 'blocks': file_blocks})}\n\n"
        else:
            results = write_file_blocks(ws._workspace_path, file_blocks, override_protection=override)
            # Send file operation results as a special SSE event
            yield f"data: {json.dumps({'files': results})}\n\n"

    # ── Log telemetry
    if total_prompt > 0 or total_completion > 0:
        try:
            with get_session_direct() as session:
                log_usage(
                    session,
                    provider="local",
                    model=model,
                    prompt_tokens=total_prompt,
                    completion_tokens=total_completion,
                )
        except Exception:
            pass


def _generate_ollama_sync(prompt: str, model: str, settings: Settings, fmt: Optional[str]) -> dict:
    """Non-streaming Ollama call — used for chunked processing.
    Tries /api/chat first, falls back to /api/generate. 3x retry.
    """
    import time
    from agent import SYSTEM_PROMPT

    base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"

    endpoints = [
        (f"{base_url}/api/chat", {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            **({"format": fmt} if fmt else {}),
        }, "chat"),
        (f"{base_url}/api/generate", {
            "model": model, "prompt": prompt, "stream": False,
            "system": SYSTEM_PROMPT,
            **({"format": fmt} if fmt else {}),
        }, "generate"),
    ]

    last_error = None
    for url, payload, mode in endpoints:
        for attempt in range(3):
            try:
                resp = requests.post(url, json=payload, timeout=(30, 600))
                if resp.status_code == 404:
                    break  # try next endpoint
                resp.raise_for_status()
                data = resp.json()

                if mode == "chat":
                    text = data.get("message", {}).get("content", "")
                else:
                    text = data.get("response", "")

                return {
                    "response": text,
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                }
            except requests.ConnectionError:
                last_error = f"Não foi possível conectar ao Ollama em {base_url}"
            except requests.Timeout:
                last_error = "Timeout na conexão com o Ollama"
            except requests.RequestException as exc:
                last_error = f"Erro do Ollama: {exc}"

            if attempt < 2:
                time.sleep(2 ** attempt)

    raise HTTPException(status_code=502, detail=last_error or "Erro desconhecido do Ollama")


# ═══════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

# ─── Agent Permissions ──────────────────────────────────────────────
from models import AgentPermissions

class PermissionsUpdate(BaseModel):
    level: str
    override_protection: bool

@router.get("/permissions")
def get_permissions(session: Session = Depends(get_session)):
    perm = session.query(AgentPermissions).first()
    if not perm:
        perm = AgentPermissions()
        session.add(perm)
        session.commit()
        session.refresh(perm)
    return {"level": perm.level, "override_protection": perm.override_protection}

@router.put("/permissions")
def update_permissions(body: PermissionsUpdate, session: Session = Depends(get_session)):
    perm = session.query(AgentPermissions).first()
    if not perm:
        perm = AgentPermissions()
        session.add(perm)
    perm.level = body.level
    perm.override_protection = body.override_protection
    session.commit()
    return {"status": "ok"}

class ConfirmChangesRequest(BaseModel):
    change_id: str

@router.post("/confirm_changes")
def confirm_changes(body: ConfirmChangesRequest, session: Session = Depends(get_session)):
    import workspace as ws
    from agent import write_file_blocks
    if body.change_id not in PENDING_CHANGES_STORE:
        raise HTTPException(status_code=404, detail="Mudanças expiradas ou não encontradas.")
    
    file_blocks = PENDING_CHANGES_STORE.pop(body.change_id)
    perm = session.query(AgentPermissions).first()
    override = perm.override_protection if perm else False
    
    results = write_file_blocks(ws._workspace_path, file_blocks, override_protection=override)
    return {"files": results}

# ─── Generate ───────────────────────────────────────────────────────
@router.post("/generate")
async def generate(
    body: GenerateRequest,
    session: Session = Depends(get_session),
):
    """Main generation endpoint with optional SSE streaming."""
    settings = get_settings()
    model = body.model or (
        settings.local_model if body.mode == "local" else settings.cloud_model
    )
    log.info(f"📨 /generate — mode={body.mode}, model={model}, stream={body.stream}, prompt_len={len(body.prompt)}")

    # ── Chunking logic
    token_count = count_tokens(body.prompt)

    if token_count > 1200 and body.mode == "local":
        chunks = chunk_code(body.prompt)
        chunk_results = []
        for chunk in chunks:
            result = _generate_ollama_sync(chunk["content"], model, settings, body.format)
            chunk_results.append(result)

        merged = merge_results(chunk_results)
        log_usage(
            session,
            provider="local",
            model=model,
            prompt_tokens=merged["prompt_tokens"],
            completion_tokens=merged["completion_tokens"],
        )
        return merged

    # ── Streaming (default) — uses logging wrapper
    if body.stream and body.mode == "local":
        return StreamingResponse(
            _stream_with_logging_and_files(body.prompt, model, settings, body.format),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Non-streaming fallback
    if body.mode == "local":
        result = _generate_ollama_sync(body.prompt, model, settings, body.format)
        log_usage(
            session,
            provider="local",
            model=model,
            prompt_tokens=result["prompt_tokens"],
            completion_tokens=result["completion_tokens"],
        )
        return result

    # ── Cloud mode placeholder
    return {
        "response": "Cloud mode is not yet configured. Please add your API key in Settings.",
        "provider": "cloud",
        "model": model,
    }


# ─── Autocomplete ──────────────────────────────────────────────────
AUTOCOMPLETE_SYSTEM = """You are a code autocomplete engine. Given the code context up to the cursor position, predict the NEXT code that should be written. Rules:
- Output ONLY the completion code, nothing else
- No markdown, no explanations, no backticks
- Complete the current line and optionally the next 1-2 lines
- Match the existing code style and indentation
- If unsure, output an empty string"""


@router.post("/autocomplete")
async def autocomplete(body: AutocompleteRequest):
    """Return a short code completion suggestion."""
    settings = get_settings()
    model = body.mode == "local" and (settings.local_model or "llama3") or settings.cloud_model

    # Build context: lines before cursor + current partial line
    lines = body.code.split("\n")
    cursor_line = min(body.cursor_line, len(lines) - 1)

    # Take up to 30 lines of context before cursor
    start = max(0, cursor_line - 30)
    context_lines = lines[start:cursor_line + 1]  # type: ignore

    # The partial current line up to cursor column
    if context_lines:
        last = context_lines[-1]
        context_lines[-1] = last[:body.cursor_col]

    context = "\n".join(context_lines)
    prompt = f"File: {body.filename}\n\n```\n{context}"

    try:
        base_url = f"http://{settings.ollama_host}:{settings.ollama_port}"
        resp = requests.post(
            f"{base_url}/api/generate",
            json={
                "model": model,
                "system": AUTOCOMPLETE_SYSTEM,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 80,
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "stop": ["\n\n", "```"],
                },
            },
            timeout=(10, 30),
        )
        if resp.ok:
            data = resp.json()
            suggestion = data.get("response", "").rstrip()
            # Clean any markdown artifacts
            suggestion = suggestion.replace("```", "").strip()
            return {"suggestion": suggestion}
        return {"suggestion": ""}
    except Exception:
        return {"suggestion": ""}


# ─── Config ─────────────────────────────────────────────────────────
@router.get("/config")
async def get_config():
    """Return current runtime configuration (API key is masked)."""
    settings = get_settings()
    provider = _detect_provider(settings.cloud_api_key) if hasattr(settings, 'cloud_api_key') else ""
    return {
        "ollama_host": settings.ollama_host,
        "ollama_port": settings.ollama_port,
        "local_model": settings.local_model,
        "cloud_model": settings.cloud_model,
        "cloud_api_key": _mask_key(getattr(settings, 'cloud_api_key', '')),
        "cloud_provider": provider,
        "has_cloud_key": bool(getattr(settings, 'cloud_api_key', '')),
    }


@router.put("/config")
async def update_config(payload: ConfigPayload):
    """Update runtime configuration (in-memory)."""
    settings = get_settings()
    if payload.ollama_host is not None:
        settings.ollama_host = payload.ollama_host
    if payload.ollama_port is not None:
        settings.ollama_port = payload.ollama_port
    if payload.local_model is not None:
        settings.local_model = payload.local_model
    if payload.cloud_model is not None:
        settings.cloud_model = payload.cloud_model
    if payload.cloud_api_key is not None:
        settings.cloud_api_key = payload.cloud_api_key
    if payload.cloud_provider is not None:
        settings.cloud_provider = payload.cloud_provider

    # Auto-detect provider from key prefix
    detected = _detect_provider(getattr(settings, 'cloud_api_key', ''))

    return {"status": "updated", "config": {
        "ollama_host": settings.ollama_host,
        "ollama_port": settings.ollama_port,
        "local_model": settings.local_model,
        "cloud_model": settings.cloud_model,
        "has_cloud_key": bool(getattr(settings, 'cloud_api_key', '')),
        "cloud_provider": detected,
    }}


# ─── Dashboard ──────────────────────────────────────────────────────
@router.get("/dashboard")
async def dashboard(session: Session = Depends(get_session)):
    """Return aggregated telemetry data for the frontend dashboard."""
    return get_dashboard_data(session)


# ─── Models (Ollama detection) ──────────────────────────────────────
@router.get("/models")
async def list_models():
    """Query the Ollama instance for all locally downloaded models."""
    settings = get_settings()
    try:
        resp = requests.get(
            _ollama_url(settings, "/api/tags"),
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        models = []
        for m in data.get("models", []):
            size_gb = round(m.get("size", 0) / (1024 ** 3), 2)
            models.append({
                "name": m.get("name", ""),
                "model": m.get("model", m.get("name", "")),
                "size_gb": size_gb,
                "modified_at": m.get("modified_at", ""),
                "family": m.get("details", {}).get("family", ""),
                "parameter_size": m.get("details", {}).get("parameter_size", ""),
                "quantization": m.get("details", {}).get("quantization_level", ""),
            })
        return {"models": models, "count": len(models), "status": "connected"}
    except requests.ConnectionError:
        return {"models": [], "count": 0, "status": "offline", "error": "Cannot connect to Ollama"}
    except requests.RequestException as exc:
        return {"models": [], "count": 0, "status": "error", "error": str(exc)}


# ─── Chat CRUD ──────────────────────────────────────────────────────
@router.get("/chats")
async def list_chats(session: Session = Depends(get_session)):
    """Return all chat sessions ordered by most recent."""
    chats = session.exec(
        select(ChatSession).order_by(ChatSession.updated_at.desc())  # type: ignore
    ).all()
    return {"chats": [{"uid": c.uid, "title": c.title, "updated_at": str(c.updated_at)} for c in chats]}


@router.post("/chats")
async def create_chat(body: ChatCreate, session: Session = Depends(get_session)):
    """Create a new chat session."""
    chat = ChatSession(uid=body.uid, title=body.title)
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return {"uid": chat.uid, "title": chat.title}


@router.put("/chats/{uid}")
async def update_chat(uid: str, body: ChatUpdate, session: Session = Depends(get_session)):
    """Update chat title."""
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if body.title is not None:
        chat.title = body.title
    chat.updated_at = datetime.utcnow()
    session.add(chat)
    session.commit()
    return {"uid": chat.uid, "title": chat.title}


@router.delete("/chats/{uid}")
async def delete_chat(uid: str, session: Session = Depends(get_session)):
    """Delete a chat and all its messages."""
    # Delete messages first
    messages = session.exec(select(ChatMessage).where(ChatMessage.chat_uid == uid)).all()
    for msg in messages:
        session.delete(msg)
    # Delete the chat
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if chat:
        session.delete(chat)
    session.commit()
    return {"status": "deleted", "uid": uid}


@router.get("/chats/{uid}/messages")
async def get_messages(uid: str, limit: int = 100, session: Session = Depends(get_session)):
    """Return messages for a chat, limited for performance."""
    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.chat_uid == uid)
        .order_by(ChatMessage.created_at.asc())  # type: ignore
        .limit(limit)
    ).all()
    return {"messages": [
        {"role": m.role, "content": m.content, "tokens": m.tokens, "created_at": str(m.created_at)}
        for m in messages
    ]}


@router.post("/chats/{uid}/messages")
async def add_message(uid: str, body: MessageCreate, session: Session = Depends(get_session)):
    """Add a message to a chat."""
    msg = ChatMessage(
        chat_uid=uid,
        role=body.role,
        content=body.content,
        tokens=body.tokens,
    )
    session.add(msg)

    # Touch the chat's updated_at
    chat = session.exec(select(ChatSession).where(ChatSession.uid == uid)).first()
    if chat:
        chat.updated_at = datetime.utcnow()
        session.add(chat)

    session.commit()
    session.refresh(msg)
    return {"id": msg.id, "role": msg.role, "content": msg.content}


# ─── Health ─────────────────────────────────────────────────────────
@router.get("/health")
async def health():
    """Simple health check."""
    log.info("💓 /health — OK")
    return {"status": "ok", "service": "lumina-backend"}

# ─── System Logs ────────────────────────────────────────────────────
@router.get("/system/logs")
async def system_logs_sse(request: Request):
    """Stream backend logs via SSE to the frontend."""
    q = asyncio.Queue()
    LOG_SUBSCRIBERS.append(q)
    
    async def log_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=2.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            if q in LOG_SUBSCRIBERS:
                LOG_SUBSCRIBERS.remove(q)
    return StreamingResponse(log_generator(), media_type="text/event-stream")

# ─── Watcher (Nervo Óptico) ─────────────────────────────────────────

# Global set of active websocket connections for the watcher
WATCHER_SUBSCRIBERS: Set[WebSocket] = set()

async def notify_watcher_clients(file_path: str):
    """Callback fired by watchdog when a file is modified."""
    from healer import heal_file
    
    if not WATCHER_SUBSCRIBERS:
        return
        
    # Run silent syntax validation (Auto-Healing Cérebro Proativo v4.0)
    analysis_result = await asyncio.to_thread(heal_file, file_path)
    
    if analysis_result:
        msg = {
            "event": "ANALYSIS_RESULT",
            "path": file_path,
            "error": analysis_result,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        msg = {
            "event": "file_modified",
            "path": file_path,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    dead_sockets = set()
    for ws in WATCHER_SUBSCRIBERS:
        try:
            await ws.send_json(msg)
        except Exception:
            dead_sockets.add(ws)
            
    for ws in dead_sockets:
        WATCHER_SUBSCRIBERS.discard(ws)

@router.websocket("/ws/watcher")
async def watcher_websocket(websocket: WebSocket):
    """Frontend connects here to receive real-time file modification events."""
    from workspace import _workspace_path, SKIP_DIRS
    
    await websocket.accept()
    WATCHER_SUBSCRIBERS.add(websocket)
    
    # Start the watcher if it isn't running and we have a workspace
    watcher = get_watcher(notify_watcher_clients)
    if _workspace_path and not watcher.observer:
        loop = asyncio.get_running_loop()
        watcher.start(_workspace_path, SKIP_DIRS, loop)
        
    try:
        while True:
            # Keep alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        WATCHER_SUBSCRIBERS.discard(websocket)
    except Exception as e:
        log.error(f"Watcher WS Error: {e}")
        WATCHER_SUBSCRIBERS.discard(websocket)

```

### `backend/setup_manager.py`

```python
"""Lumina IDE — Setup Manager for Ollama Onboarding."""

import os
import shutil
import asyncio
import httpx
import tempfile
import subprocess
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

log = logging.getLogger("lumina.setup")
router = APIRouter(prefix="/api/setup", tags=["setup"])

class PullRequest(BaseModel):
    model: str

def check_ollama_installed() -> bool:
    """Check if Ollama is accessible in the system PATH."""
    return shutil.which("ollama") is not None

def _download_and_install_ollama():
    """Background task to download and silently install Ollama on Windows."""
    try:
        url = "https://ollama.com/download/OllamaSetup.exe"
        installer_path = os.path.join(tempfile.gettempdir(), "OllamaSetup.exe")
        
        log.info(f"Downloading Ollama from {url}...")
        with httpx.Client(follow_redirects=True) as client:
            with client.stream("GET", url) as response:
                response.raise_for_status()
                with open(installer_path, "wb") as f:
                    for chunk in response.iter_bytes(chunk_size=8192):
                        f.write(chunk)
                        
        log.info("Downloaded successfully. Running silent install...")
        # /S for silent installation (NSIS) or equivalent for OllamaSetup if it supports it
        # Note: OllamaSetup.exe is an InnoSetup or squirrel installer, usually /S or /VERYSILENT /SUPPRESSMSGBOXES works.
        try:
            subprocess.run([installer_path, "/S"], check=True)
            log.info("Ollama silent install completed.")
        except subprocess.CalledProcessError as e:
            log.error(f"Failed to install Ollama silently: {e}")
    except Exception as e:
        log.error(f"Error during Ollama download/install: {e}")

@router.get("/status")
def get_setup_status():
    """Returns whether Ollama is installed and needs onboarding."""
    installed = check_ollama_installed()
    return {"installed": installed, "needs_onboarding": not installed}

@router.post("/install")
def trigger_install(background_tasks: BackgroundTasks):
    """Triggers the silent background installation of Ollama."""
    if check_ollama_installed():
        return {"status": "already_installed"}
    background_tasks.add_task(_download_and_install_ollama)
    return {"status": "install_started"}

import json
from fastapi.responses import StreamingResponse

@router.post("/pull")
async def pull_model(body: PullRequest):
    """Pulls a model using 'ollama pull' and streams progress."""
    import asyncio
    
    async def stream_pull():
        # Requires Ollama to be running. Usually the service starts automatically.
        try:
            import subprocess
            process = await asyncio.create_subprocess_exec(
                "ollama", "pull", body.model,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace').strip()
                if text:
                    yield f"data: {json.dumps({'status': text})}\n\n"
                    
            await process.wait()
            yield f"data: {json.dumps({'done': True, 'status': 'Concluído'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_pull(), media_type="text/event-stream")

```

### `backend/telemetry.py`

```python
"""Lumina IDE — Module C: Telemetry & Cost Analytics.

Persists token usage per call and computes dashboard aggregations
(monthly spend, local vs cloud split, ROI / savings).
"""

from __future__ import annotations

from datetime import datetime, timedelta
from sqlmodel import Session, select, func
from models import UsageLog
from config import get_settings


def log_usage(
    session: Session,
    *,
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
) -> UsageLog:
    """Persist a single usage record and return it."""
    settings = get_settings()

    # Local calls are free; cloud calls use configured pricing
    if provider == "local":
        cost = 0.0
    else:
        cost = (
            (prompt_tokens / 1000) * settings.cloud_input_price
            + (completion_tokens / 1000) * settings.cloud_output_price
        )

    entry = UsageLog(
        provider=provider,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        cost_usd=round(cost, 6),  # type: ignore
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry


def get_dashboard_data(session: Session) -> dict:
    """Aggregate telemetry for the frontend dashboard."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # --- Monthly totals ---
    monthly_logs = session.exec(
        select(UsageLog).where(UsageLog.created_at >= month_start)
    ).all()

    monthly_cost = sum(log.cost_usd for log in monthly_logs)
    monthly_tokens_local = sum(
        log.total_tokens for log in monthly_logs if log.provider == "local"
    )
    monthly_tokens_cloud = sum(
        log.total_tokens for log in monthly_logs if log.provider == "cloud"
    )

    # --- ROI Calculation ---
    # "What would these local tokens have cost on the cloud?"
    settings = get_settings()
    avg_price_per_token = (settings.cloud_input_price + settings.cloud_output_price) / 2 / 1000
    estimated_savings = round(monthly_tokens_local * avg_price_per_token, 4)

    # --- Daily breakdown (last 30 days) for the savings chart ---
    thirty_days_ago = now - timedelta(days=30)
    recent_logs = session.exec(
        select(UsageLog).where(UsageLog.created_at >= thirty_days_ago)
    ).all()

    daily_savings: dict[str, float] = {}
    for log in recent_logs:
        day_key = log.created_at.strftime("%Y-%m-%d")
        if log.provider == "local":
            daily_savings[day_key] = daily_savings.get(day_key, 0) + round(
                log.total_tokens * avg_price_per_token, 6
            )

    # --- All-time totals ---
    all_logs = session.exec(select(UsageLog)).all()
    all_time_cost = sum(log.cost_usd for log in all_logs)
    all_time_local = sum(log.total_tokens for log in all_logs if log.provider == "local")
    all_time_cloud = sum(log.total_tokens for log in all_logs if log.provider == "cloud")
    all_time_savings = round(all_time_local * avg_price_per_token, 4)

    return {
        "total_tokens": all_time_local + all_time_cloud,
        "prompt_tokens": sum(log.prompt_tokens for log in all_logs),
        "completion_tokens": sum(log.completion_tokens for log in all_logs),
        "monthly": {
            "cost_usd": round(monthly_cost, 4),
            "tokens_local": monthly_tokens_local,
            "tokens_cloud": monthly_tokens_cloud,
            "estimated_savings_usd": estimated_savings,
        },
        "all_time": {
            "cost_usd": round(all_time_cost, 4),
            "tokens_local": all_time_local,
            "tokens_cloud": all_time_cloud,
            "estimated_savings_usd": all_time_savings,
        },
        "daily_savings": daily_savings,
    }

```

### `backend/terminal.py`

```python
import asyncio
import os
import subprocess
import threading
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect  # type: ignore[import]

router = APIRouter()

# Global registry of active terminal processes mapped by port identifier
# Example: {"cmd": process_obj, "node": process_obj}
ACTIVE_TERMINALS: Dict[str, subprocess.Popen] = {}
TERMINAL_HISTORY: Dict[str, str] = {}

def run_command_in_terminal(command: str, port: str = "cmd") -> bool:
    """Injects a command string into a specific active terminal's stdin."""
    process: Optional[subprocess.Popen] = ACTIVE_TERMINALS.get(port)
    if not process or process.poll() is not None:
        return False
    stdin = process.stdin  # type: ignore[union-attr]
    if stdin:
        if not command.endswith('\n'):
            command += '\n'
        try:
            stdin.write(command.encode('utf-8'))
            stdin.flush()
            return True
        except Exception:
            return False
    return False

@router.get("/terminal/logs/{port}")
def get_terminal_logs(port: str):
    """Returns the recent history buffer for a given terminal port."""
    return {"port": port, "logs": TERMINAL_HISTORY.get(port, "")}

@router.websocket("/ws/{port}")
async def terminal_endpoint(websocket: WebSocket, port: str):
    await websocket.accept()
    
    # We allow the user to define a "port" which we use as a terminal identifier or routing param.
    # In a real environment, you might start different services on different ports.
    # Here, we will just use bash/cmd.exe and echo the port context.
    try:
        process = subprocess.Popen(
            ["powershell.exe", "-NoExit", "-Command", "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::InputEncoding = [System.Text.Encoding]::UTF8;"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=False,
            cwd=os.getcwd(),
            bufsize=0,
        )
        
        # Register the terminal process globally
        ACTIVE_TERMINALS[port] = process
        TERMINAL_HISTORY[port] = ""
        
        # Inject an initial message simulating the port bind
        stdin = process.stdin
        if stdin:
            stdin.write(f"echo [Lumina IDE] Terminal bound to logical port {port}\n".encode('utf-8'))  # type: ignore[arg-type]
            stdin.flush()
        
        def read_output(pipe):
            try:
                # Read chunks of bytes to get partial lines and prompt characters
                while True:
                    data = pipe.read(1)
                    if not data:
                        break
                    
                    # Windows PowerShell with UTF-8 setup
                    text = data.decode('utf-8', errors='replace')
                    
                    # Accumulate history with a sliding window (~10,000 chars)
                    TERMINAL_HISTORY[port] += text
                    if len(TERMINAL_HISTORY[port]) > 10000:
                        TERMINAL_HISTORY[port] = TERMINAL_HISTORY[port][-10000:]  # type: ignore[misc]
                    
                    # Schedule sending to websocket
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_text(text), 
                        asyncio.get_running_loop()
                    )
            except Exception as e:
                pass

        # Start a thread to read stdout/stderr continuously
        reader_thread = threading.Thread(target=read_output, args=(process.stdout,), daemon=True)
        reader_thread.start()

        # Keep receiving inputs from the frontend
        while True:
            data = await websocket.receive_text()
            if process.poll() is not None:
                await websocket.send_text("\r\n[Process terminated]\r\n")
                break
                
            if process.stdin:
                stdin_pipe = process.stdin  # type: ignore[union-attr]
                # Send raw data from xterm
                # Translate \r to \n for windows pipe
                if data == '\r':
                    data = '\n'
                stdin_pipe.write(data.encode('utf-8'))  # type: ignore[union-attr]
                stdin_pipe.flush()  # type: ignore[union-attr]

    except WebSocketDisconnect:
        if process and process.poll() is None:
            process.terminate()
    except Exception as e:
        if process and process.poll() is None:
            process.terminate()

```

### `backend/watcher.py`

```python
import os
import asyncio
import logging
from typing import Set, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger("lumina.watcher")

class FileWatcherHandler(FileSystemEventHandler):
    def __init__(self, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop, callback):
        super().__init__()
        self.skip_dirs = skip_dirs
        self.loop = loop
        self.callback = callback
        self._debounce_tasks = {}

    def _should_ignore(self, path: str) -> bool:
        # Ignore files within skipped directories
        parts = os.path.normpath(path).split(os.sep)
        for part in parts:
            if part in self.skip_dirs:
                return True
        return False

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
            
        def trigger_callback():
            # Run the async callback in the background
            asyncio.run_coroutine_threadsafe(self.callback(event.src_path), self.loop)

        # Cancel existing debounce task for this file
        if event.src_path in self._debounce_tasks:
            self._debounce_tasks[event.src_path].cancel()
            
        # Schedule a new callback after 500ms debounce
        self._debounce_tasks[event.src_path] = self.loop.call_later(0.5, trigger_callback)


class LuminaWatcher:
    def __init__(self, callback):
        self.observer = None
        self.callback = callback
        self.current_path = None

    def start(self, path: str, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop):
        if self.observer:
            self.stop()
            
        if not path or not os.path.isdir(path):
            return

        self.current_path = path
        handler = FileWatcherHandler(skip_dirs, loop, self.callback)
        self.observer = Observer()
        self.observer.schedule(handler, path, recursive=True)
        self.observer.start()
        logger.info(f"O Nervo Óptico foi ativado no diretório: {path}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join(timeout=2)
            self.observer = None
            logger.info("O Nervo Óptico foi desativado.")
            self.current_path = None

watcher_instance = None

def get_watcher(callback=None) -> LuminaWatcher:
    global watcher_instance
    if watcher_instance is None and callback is not None:
        watcher_instance = LuminaWatcher(callback)
    return watcher_instance

```

### `backend/workspace.py`

```python
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

```

