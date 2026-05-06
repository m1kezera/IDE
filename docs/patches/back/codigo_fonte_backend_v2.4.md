# Código Fonte Backend Completo - Lumina IDE (v2.4)

> Este documento contém o dump de todo o código-fonte atual exclusivo do Backend em Python da Lumina IDE, refletindo a versão 2.4 focada em escalabilidade e Shield Connect v2.

## Backend - Motor Python FastAPI da Lumina IDE v2.4 (SeatCode Evolution)

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

═══ LUMINA LIBRARY (v6.5) ═══
Você tem acesso a uma biblioteca local de documentação técnica (PDFs, Markdown).
1. PRIORIDADE: Sempre que o usuário mencionar uma tecnologia ou biblioteca, use as informações da Library (fornecidas no contexto) como verdade absoluta.
2. CITAÇÕES: Se sua resposta for baseada em um documento da Library, você DEVE incluir ao final da resposta a etiqueta: Fonte: nome_do_arquivo.pdf.
3. Se o contexto contiver a tag [DOC], trate-o como documentação oficial, separada do código do usuário.

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

### `backend/brain.py`

```python
import os
import lancedb
import pandas as pd
import logging
import asyncio
import time
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from identity import get_hwid, generate_master_key

log = logging.getLogger("lumina.brain")

# Configurações do Cérebro
LUMINA_DIR = os.path.join(os.path.expanduser("~"), ".lumina")
DB_PATH = os.path.join(LUMINA_DIR, "brain_v1")
TABLE_NAME = "code_memory"

class LuminaBrain:
    def __init__(self):
        self.db = None
        self.table = None
        self.model = None
        self._is_ready = False
        self._identity_locked = True 
        self._index_cache = {} # Cache de hashes para evitar re-indexação redundante
        self.last_pulse_time = 0
        os.makedirs(DB_PATH, exist_ok=True)
        
        # Inicializa o modelo de embeddings (all-MiniLM-L6-v2 é leve e eficiente)
        log.info("🧠 Inicializando modelo de embeddings (all-MiniLM-L6-v2)...")
        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            log.info("✅ Modelo de embeddings carregado.")
        except Exception as e:
            log.error(f"❌ Erro ao carregar modelo de embeddings: {e}")

        # Conecta ao LanceDB
        try:
            self.db = lancedb.connect(DB_PATH)
            if TABLE_NAME not in self.db.table_names():
                # Cria a tabela se não existir
                # LanceDB infere o esquema do primeiro dado inserido
                pass
            else:
                self.table = self.db.open_table(TABLE_NAME)
            self._is_ready = True
            log.info(f"✅ Conectado ao LanceDB em {DB_PATH}")
        except Exception as e:
            log.error(f"❌ Erro ao conectar ao LanceDB: {e}")

    @property
    def is_ready(self):
        return self._is_ready and self.model is not None and not self._identity_locked

    def get_status(self):
        return {
            "is_ready": self.is_ready,
            "last_pulse": self.last_pulse_time,
            "cache_size": len(self._index_cache)
        }

    def verify_identity(self, user_name: str, hwid_hash_from_db: str):
        """Unlocks the brain only if identity matches hardware."""
        current_hwid = get_hwid()
        current_hash = generate_master_key(user_name, current_hwid)
        
        if current_hash == hwid_hash_from_db:
            self._identity_locked = False
            log.info(f"🛡️ Brain Unlocked for user: {user_name}")
            return True
        else:
            self._identity_locked = True
            log.error(f"⚠️ IDENTITY MISMATCH: Brain access BLOCKED for {user_name}")
            return False

    def _chunk_code(self, content: str, max_lines: int = 50) -> List[str]:
        """Fragmenta o código em blocos lógicos (simples por enquanto)."""
        lines = content.split('\n')
        chunks = []
        for i in range(0, len(lines), max_lines):
            chunk = '\n'.join(lines[i:i + max_lines])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    async def index_code(self, file_path: str, content: str, source_type: str = "code", tag: str = ""):
        """Indexa o conteúdo do arquivo/doc no banco de vetores."""
        if not self.is_ready:
            return

        try:
            import hashlib
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            # Smart Filtering: Skip if content hasn't changed
            if self._index_cache.get(file_path) == content_hash:
                # logger.debug(f"⏭️  Indexing skipped (no change): {file_path}")
                return
            
            log.info(f"🧠 Indexando ({source_type}) [Pulse]: {file_path}")
            chunks = self._chunk_code(content)
            
            if not chunks:
                return

            # Gera embeddings para cada pedaço
            embeddings = self.model.encode(chunks)
            
            data = []
            for i, chunk in enumerate(chunks):
                data.append({
                    "vector": embeddings[i].tolist(),
                    "text": chunk,
                    "file_path": file_path,
                    "chunk_id": i,
                    "source_type": source_type,
                    "tag": tag,
                    "timestamp": pd.Timestamp.now().isoformat()
                })

            df = pd.DataFrame(data)
            
            if TABLE_NAME not in self.db.table_names():
                self.table = self.db.create_table(TABLE_NAME, data=df)
            else:
                # Remove entradas antigas do mesmo arquivo/doc para evitar duplicatas
                self.table.delete(f'file_path = "{file_path}"')
                self.table.add(data=df)
            
            # Update cache and pulse time
            self._index_cache[file_path] = content_hash
            self.last_pulse_time = time.time()
            
            log.info(f"✅ {len(chunks)} pedaços indexados para {file_path} [{source_type}]")
        except Exception as e:
            log.error(f"❌ Erro ao indexar {file_path}: {e}")

    async def search_context(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Busca os trechos de código mais parecidos com a query."""
        if not self.is_ready or self.table is None:
            return []

        try:
            query_vector = self.model.encode(query).tolist()
            
            # Busca vetorial
            results = self.table.search(query_vector).limit(limit).to_list()
            
            # Formata os resultados
            formatted = []
            for res in results:
                formatted.append({
                    "content": res["text"],
                    "file": res["file_path"],
                    "source_type": res.get("source_type", "code"),
                    "tag": res.get("tag", ""),
                    "score": res.get("_distance", 1.0)
                })
            return formatted
        except Exception as e:
            log.error(f"❌ Erro na busca do Brain: {e}")
            return []

# Singleton
brain = LuminaBrain()

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

### `backend/edge_runtime.py`

```python
import os
import qrcode
import base64
import logging
import asyncio
import psutil
from io import BytesIO
from typing import Dict, Any, Optional

log = logging.getLogger("lumina.edge")

class EdgeRuntime:
    def __init__(self):
        self.active_sandboxes: Dict[str, Dict[str, Any]] = {}
        self._wasm_engine_ready = False
        
        # Tenta carregar wasmtime (lazy load concept)
        try:
            from wasmtime import Engine, Store, Module, Instance
            self.engine = Engine()
            self._wasm_engine_ready = True
            log.info("✅ Wasmtime Engine (v1.0) carregado para Lumina Edge.")
        except ImportError:
            self.engine = None
            log.warning("⚠️ Wasmtime não encontrado. Edge rodando em modo Estático.")

    async def start_sandbox(self, workspace_path: str) -> Dict[str, Any]:
        """
        Inicia o isolamento Wasm para o workspace alvo.
        Implementa o offloading P2P se a VRAM/CPU local for escassa.
        """
        try:
            cpu_usage = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            free_ram_gb = mem.available / (1024**3)
            
            # Offloading condition (PRD: < 500MB free RAM or extreme CPU)
            is_overloaded = free_ram_gb < 0.5 or cpu_usage > 90.0
            
            # Se sobrecarregado, tenta encontrar um nó Cortex via Mesh
            delegated_to = None
            if is_overloaded:
                try:
                    import mesh
                    cortex = mesh.get_best_cortex_node()
                    if cortex:
                        delegated_to = cortex.hostname
                        log.info(f"🕸️ Edge Offloading: Despachando execução Wasm para {delegated_to}")
                except Exception as e:
                    log.error(f"Falha ao carregar mesh no Edge: {e}")
            # Simula um Build Wasm em background (Module B v5.5)
            # No mundo real, aqui compilaríamos JS para Wasm usando QuickJS or Python via MicroPython Wasm
            await self._simulate_build(workspace_path)

            sandbox_id = base64.urlsafe_b64encode(os.urandom(6)).decode('utf-8')
            
            # A URL do túnel será roteada por router.py via /edge/preview/{sandbox_id}
            local_url = f"http://127.0.0.1:8000/api/edge/preview/{sandbox_id}/index.html"
            tunnel_url = f"http://[USER-LOCAL-IP]:8000/api/edge/preview/{sandbox_id}/index.html" # Placeholder to be replaced
            
            self.active_sandboxes[sandbox_id] = {
                "workspace": workspace_path,
                "status": "running",
                "engine": "wasmtime" if self._wasm_engine_ready else "emulated",
                "delegated_to": delegated_to
            }
            
            log.info(f"🚀 Lumina Edge Sandbox iniciado [{sandbox_id}] para {workspace_path}")
            
            # Gera QR Code do túnel P2P
            qr_base64 = self.generate_tunnel_qr(tunnel_url)

            return {
                "status": "success",
                "sandbox_id": sandbox_id,
                "preview_url": local_url,
                "qr_code": qr_base64,
                "delegated_to": delegated_to,
                "is_emulated": not self._wasm_engine_ready
            }

        except Exception as e:
            log.error(f"Erro ao iniciar Edge Sandbox: {e}")
            return {"status": "error", "message": str(e)}

    async def _simulate_build(self, path: str):
        """Simula o uso de CPU ociosa para 'compilar' o sandbox."""
        log.info(f"🏗️ Building Edge Sandbox for {path}...")
        # Simula carga de CPU por 1.5s
        await asyncio.sleep(1.5)
        log.info("✅ Build completo: Binários Wasm prontos.")

    def generate_tunnel_qr(self, url: str) -> str:
        """Gera um QR Code em Base64 para acesso mobile no túnel P2P."""
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            log.error(f"Erro ao gerar QR Code: {e}")
            return ""

    def get_sandbox(self, sandbox_id: str) -> Optional[Dict[str, Any]]:
        return self.active_sandboxes.get(sandbox_id)

    def stop_sandbox(self, sandbox_id: str):
        if sandbox_id in self.active_sandboxes:
            del self.active_sandboxes[sandbox_id]
            log.info(f"🛑 Lumina Edge Sandbox [{sandbox_id}] encerrado.")

edge_manager = EdgeRuntime()

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

### `backend/identity.py`

```python
import uuid
import hashlib
import os
import secrets
from typing import Optional, List

# Global storage for key fragments (Anti-Memory Scraping)
_MASTER_KEY_FRAGMENTS = [None] * 4

def get_local_salt() -> str:
    """Gets or creates a machine-specific salt for identity hashing."""
    salt_path = os.path.join(os.path.expanduser("~"), ".lumina_salt")
    if not os.path.exists(salt_path):
        salt = secrets.token_hex(16)
        with open(salt_path, "w") as f:
            f.write(salt)
        return salt
    with open(salt_path, "r") as f:
        return f.read().strip()

def get_hwid() -> str:
    """Returns a unique identifier based on the machine's hardware (MAC + Salt)."""
    node = uuid.getnode()
    salt = get_local_salt()
    return hashlib.sha256(f"{node}:{salt}".encode()).hexdigest()

def generate_master_key_fragments(user_name: str, hwid: str):
    """
    Combines username and hardware ID, generates a 32-byte hash,
    and shards it into 4 fragments in memory.
    """
    global _MASTER_KEY_FRAGMENTS
    secret = f"{user_name}:{hwid}:{get_local_salt()}"
    full_hash = hashlib.sha256(secret.encode()).digest() # 32 bytes
    
    # Shard into 4 parts of 8 bytes
    for i in range(4):
        _MASTER_KEY_FRAGMENTS[i] = full_hash[i*8 : (i+1)*8]
    
    # We return the hex string for DB comparison, but the fragments stay in RAM
    return hashlib.sha256(secret.encode()).hexdigest()

def get_reconstructed_key() -> bytes:
    """Reconstructs the full 32-byte key from fragments on-demand."""
    if any(f is None for f in _MASTER_KEY_FRAGMENTS):
        raise ValueError("Lumina Shield: Identity key not initialized or memory wiped.")
    return b"".join(_MASTER_KEY_FRAGMENTS)

def clear_key_fragments():
    """Wipes fragments from RAM (Zero-Trace)."""
    global _MASTER_KEY_FRAGMENTS
    for i in range(len(_MASTER_KEY_FRAGMENTS)):
        _MASTER_KEY_FRAGMENTS[i] = b'\x00' * 8

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

### `backend/library.py`

```python
import os
import fitz  # PyMuPDF
import logging
import asyncio
from typing import List, Dict
from brain import brain

log = logging.getLogger("lumina")

class LuminaLibrary:
    """O Bibliotecário da Lumina: Processa documentos e os envia para a memória persistente."""
    
    def __init__(self):
        self.indexing_queue = []
        self.is_processing = False
        self.doc_registry = [] # Lista de documentos processados nesta sessão

    async def process_pdf(self, file_path: str):
        """Extrai texto de um PDF e o indexa no Brain."""
        if not os.path.exists(file_path):
            log.error(f"❌ Arquivo não encontrado: {file_path}")
            return False

        file_name = os.path.basename(file_path)
        log.info(f"📚 Processando PDF: {file_name}")

        try:
            doc = fitz.open(file_path)
            full_text = ""
            
            # Processa página por página para manter estrutura ou metadados se necessário
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                if text.strip():
                    # Adiciona marcador de página para ajudar na recuperação
                    full_text += f"\n--- [Página {page_num + 1}] ---\n{text}\n"
            
            if full_text.strip():
                # Envia para o Brain com tag [DOC] e tipo "documentation"
                await brain.index_code(
                    file_path=file_path, 
                    content=full_text, 
                    source_type="documentation", 
                    tag="[DOC]"
                )
                
                if file_name not in [d['name'] for d in self.doc_registry]:
                    self.doc_registry.append({
                        "name": file_name,
                        "path": file_path,
                        "pages": len(doc),
                        "type": "pdf"
                    })
                
                log.info(f"✅ PDF '{file_name}' processado e indexado.")
                return True
            else:
                log.warning(f"⚠️ PDF '{file_name}' não contém texto extraível.")
                return False
        except Exception as e:
            log.error(f"❌ Erro ao processar PDF {file_name}: {e}")
            return False
        finally:
            if 'doc' in locals():
                doc.close()

    async def process_markdown(self, file_path: str):
        """Processa arquivos Markdown ou Texto."""
        if not os.path.exists(file_path): return False
        
        file_name = os.path.basename(file_path)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if content.strip():
                await brain.index_code(
                    file_path=file_path,
                    content=content,
                    source_type="documentation",
                    tag="[DOC]"
                )
                
                if file_name not in [d['name'] for d in self.doc_registry]:
                    self.doc_registry.append({
                        "name": file_name,
                        "path": file_path,
                        "type": "md" if file_path.endswith('.md') else "txt"
                    })
                return True
        except Exception as e:
            log.error(f"❌ Erro ao processar doc {file_name}: {e}")
            return False
        return False

    def get_documents(self) -> List[Dict]:
        """Retorna lista de documentos na biblioteca."""
        return self.doc_registry

# Singleton
library = LuminaLibrary()

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

import os
import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Shield Hotfix: Windowed Mode Redirect ──────────────────────────
# Prevents AttributeError: 'NoneType' object has no attribute 'isatty'
if sys.stdout is None or sys.stderr is None:
    f = open(os.devnull, 'w')
    sys.stdout = f
    sys.stderr = f

# ─── Logging setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s → %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger("lumina")
 
# ─── Frozen Environment Path Fix ──────────────────────────────────
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))
    # If running from inside 'lumina-backend' subfolder, move up to where resources are
    if not os.path.exists(".env") and os.path.exists("../.env"):
        os.chdir("..")
    log.info(f"❄️  Frozen environment detected. CWD set to: {os.getcwd()}")

# Ensure support directories exist
for folder in ["brain", "logs", "workspace"]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)
        log.info(f"📁 Created directory: {folder}")

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

try:
    import mesh
    log.info("✅ mesh — importado com sucesso")
except Exception as e:
    log.error(f"❌ mesh — falha ao importar: {e}")
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
        
        # Identity Check & Brain Unlock (v1.16/v2.1)
        from database import get_session_direct
        from models import LuminaIdentity
        from brain import brain
        from sqlmodel import select
        from security_vault import protect_project_secrets
        from identity import generate_master_key_fragments
        from sentinel import start_sentinel
        
        start_sentinel() # Start Active Defense (v2.1)
        
        with get_session_direct() as session:
            identity = session.exec(select(LuminaIdentity).where(LuminaIdentity.is_active == True)).first()
            if identity:
                # Comparison hash generated using salted fragments
                from identity import get_hwid
                current_hwid = get_hwid()
                comp_hash = generate_master_key_fragments(identity.user_name, current_hwid)
                if brain.verify_identity(identity.user_name, comp_hash):
                    log.info(f"🛡️ Lumina Identity Verified: {identity.user_name}")
                    # Automatic protection of .env in current working directory (dynamic)
                    current_workdir = os.getcwd().replace("\\", "/")
                    protect_project_secrets(current_workdir, identity.user_name)
                    log.info(f"🛡️ Project secrets protected in: {current_workdir}")
                else:
                    log.error("⚠️ HARDWARE MISMATCH: Security lockdown active.")
            else:
                log.warning("ℹ️ No identity registered. Waiting for onboarding...")
                
    except Exception as e:
        log.error(f"❌ Falha ao inicializar banco de dados ou identidade: {e}")

    # 2. Config check
    try:
        from config import get_settings
        settings = get_settings()
        log.info(f"✅ Configuração carregada — Ollama: {settings.ollama_host}:{settings.ollama_port}, Modelo: {settings.local_model}")
    except Exception as e:
        log.error(f"❌ Falha ao carregar configuração: {e}")

    # 3. Ollama Orchestrator (v2.3)
    try:
        from ollama_orchestrator import get_orchestrator
        orchestrator = get_orchestrator()
        log.info("🎮 Lumina Orchestrator: Verificando status do motor Ollama...")
        if orchestrator.start_motor():
            log.info("✅ Ollama motor ativo e pronto.")
        else:
            log.warning("⚠️  Falha ao iniciar o motor Ollama automaticamente.")
    except Exception as e:
        log.warning(f"⚠️  Erro no Orchestrator: {e}")

    # 4. Routes summary
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    log.info(f"✅ {len(routes)} rotas registradas")
    log.info("═══════════════════════════════════════════════")
    log.info("   ✅ Backend pronto! http://127.0.0.1:8000")
    log.info("═══════════════════════════════════════════════")

    # Start Lumina Swarm Mesh (Module A)
    try:
        import mesh
        mesh.start_mesh(port=8000)
    except Exception as e:
        log.error(f"❌ Falha ao iniciar Lumina Mesh: {e}")

    yield

    log.info("🔴 Lumina IDE Backend — Encerrando...")
    try:
        from watcher import get_watcher
        w = get_watcher()
        if w:
            w.stop()
            log.info("✅ Watcher (Nervo Óptico) Encerrado")
        
        import mesh
        mesh.stop_mesh()
        log.info("✅ Mesh Encerrado")
        
        from ollama_orchestrator import get_orchestrator
        get_orchestrator().stop_motor()
        log.info("✅ Ollama motor encerrado e VRAM liberada.")
    except Exception as e:
        log.error(f"Erro ao desligar componentes: {e}")


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
def start_stable_server(start_port=8001, max_tries=10):
    import socket
    import uvicorn

    port = start_port
    while port < start_port + max_tries:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            # Tenta ocupar a porta por 1ms para ver se está livre
            if s.connect_ex(('127.0.0.1', port)) != 0:
                logging.info(f"🚀 Porto Seguro Encontrado: {port}")
                # Blindagem contra isatty/formatter continua ativa
                uvicorn.run(
                    app, 
                    host="127.0.0.1", 
                    port=port, 
                    log_config=None,  # OBRIGATÓRIO: Mata o erro 'formatter default'
                    access_log=False  # OBRIGATÓRIO: Mata o erro 'isatty'
                )
                return
            else:
                logging.warning(f"⚠️ Porto {port} ocupado. Tentando próximo...")
                port += 1
    logging.error("❌ Falha crítica: Nenhum porto disponível no range de segurança.")

if __name__ == "__main__":
    start_stable_server()

```

### `backend/mesh.py`

```python
import time
import socket
import logging
import asyncio
from typing import Dict, Any, Optional
from zeroconf import ServiceInfo, Zeroconf, ServiceBrowser, ServiceStateChange
from pydantic import BaseModel

import predictor

logger = logging.getLogger("lumina.mesh")

class MeshNode(BaseModel):
    ip: str
    port: int
    hostname: str
    vram_free_gb: float = 0.0
    is_cortex: bool = False
    last_seen: float = 0.0

# Global registry of discovered peers
discovered_nodes: Dict[str, MeshNode] = {}
_zc: Optional[Zeroconf] = None
_browser: Optional[ServiceBrowser] = None
_info: Optional[ServiceInfo] = None

SERVICE_TYPE = "_lumina-ide._tcp.local."
MESH_PORT = 8000 # Default, should ideally be dynamically injected

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def on_service_state_change(zeroconf: Zeroconf, service_type: str, name: str, state_change: ServiceStateChange) -> None:
    if state_change is ServiceStateChange.Added:
        info = zeroconf.get_service_info(service_type, name)
        if info:
            addresses = [socket.inet_ntoa(a) for a in info.addresses]
            if not addresses:
                return
            ip = addresses[0]
            port = info.port
            # Prevent self-discovery if same IP and Port
            if ip == get_local_ip() and port == MESH_PORT:
                return
                
            node_id = f"{ip}:{port}"
            
            # Fetch remote hardware status
            # We'll update this asynchronously or lazily
            discovered_nodes[node_id] = MeshNode(
                ip=ip, 
                port=port, 
                hostname=info.server,
                last_seen=time.time()
            )
            logger.info(f"🕸️ Swarm Node Joined: {node_id} ({info.server})")
            
    elif state_change is ServiceStateChange.Removed:
        info = zeroconf.get_service_info(service_type, name)
        # We need to find the node and remove it
        # The name usually contains the hostname
        to_remove = []
        for nid, node in discovered_nodes.items():
            if node.hostname in name:
                to_remove.append(nid)
        for nid in to_remove:
            del discovered_nodes[nid]
            logger.info(f"🕸️ Swarm Node Left: {nid}")

def start_mesh(port: int = 8000):
    global _zc, _browser, _info, MESH_PORT
    MESH_PORT = port
    try:
        _zc = Zeroconf()
        local_ip = get_local_ip()
        hostname = socket.gethostname() + ".local."
        
        _info = ServiceInfo(
            SERVICE_TYPE,
            f"LuminaInstance-{local_ip.replace('.', '-')}.{SERVICE_TYPE}",
            addresses=[socket.inet_aton(local_ip)],
            port=port,
            server=hostname,
            properties={"version": "5.0", "type": "agent"}
        )
        
        _zc.register_service(_info)
        _browser = ServiceBrowser(_zc, SERVICE_TYPE, handlers=[on_service_state_change])
        logger.info(f"🚀 Lumina Mesh (v5.0) Broadcast Active on {local_ip}:{port}")
    except Exception as e:
        logger.error(f"Failed to start Lumina Mesh: {e}")

def stop_mesh():
    global _zc, _browser, _info
    try:
        if _zc:
            if _info:
                _zc.unregister_service(_info)
                _info = None
            _zc.close()
            _zc = None
        if _browser:
            _browser.cancel()
            _browser = None
        logger.info("✅ Lumina Mesh (Zeroconf) cleaned up successfully.")
    except Exception as e:
        logger.error(f"Error stopping Lumina Mesh: {e}")

async def refresh_node_status():
    """Polls discovered nodes to update their VRAM and Cortex status."""
    import httpx
    async with httpx.AsyncClient(timeout=3.0) as client:
        for nid, node in list(discovered_nodes.items()):
            try:
                resp = await client.get(f"http://{node.ip}:{node.port}/api/mesh/status")
                if resp.status_code == 200:
                    data = resp.json()
                    node.vram_free_gb = data.get("vram_free_gb", 0.0)
                    node.is_cortex = data.get("is_cortex", False)
                    node.last_seen = time.time()
            except Exception:
                # Node might be offline or unreachable
                pass

def get_best_cortex_node() -> Optional[MeshNode]:
    """Finds the most potent node in the swarm (highest VRAM > 4GB)."""
    best_node = None
    highest_vram = 0.0
    for node in discovered_nodes.values():
        if node.is_cortex and node.vram_free_gb > 4.0:
            if node.vram_free_gb > highest_vram:
                highest_vram = node.vram_free_gb
                best_node = node
    return best_node

async def proxy_prediction(node: MeshNode, payload: dict) -> dict:
    """Sends a prediction task to a Cortex node."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"http://{node.ip}:{node.port}/api/predict/next-steps",
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                # Decorate the prediction to let the UI know it was solved by the swarm
                if "prediction" in data:
                    data["prediction"]["solved_by_swarm"] = True
                    data["prediction"]["cortex_node"] = f"{node.ip}"
                return data
    except Exception as e:
        logger.error(f"Proxy prediction failed: {e}")
    return {"status": "error", "message": "Swarm node failed to predict"}

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

class LuminaIdentity(SQLModel, table=True):
    """Stores the identity signature bound to hardware."""
    __tablename__ = "lumina_identity"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_name: str = Field(index=True)
    hwid_hash: str = Field(unique=True) # Hashed HWID + Name
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

```

### `backend/ollama_orchestrator.py`

```python
import subprocess
import time
import os
import requests
import logging
import psutil
from typing import Optional

logger = logging.getLogger("lumina.orchestrator")

class OllamaOrchestrator:
    def __init__(self, host: str = "127.0.0.1", port: int = 11434):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"
        self._process: Optional[subprocess.Popen] = None

    def is_running(self) -> bool:
        """Checks if Ollama is responding on the target port."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return resp.ok
        except requests.ConnectionError:
            return False
        except Exception as e:
            logger.debug(f"Ollama status check error: {e}")
            return False

    def start_motor(self):
        """Starts 'ollama serve' if not already running."""
        if self.is_running():
            logger.info("✅ Ollama motor already running.")
            return True

        logger.info("🟡 Starting Ollama motor (ollama serve)...")
        try:
            # Creationflags=subprocess.CREATE_NO_WINDOW for Windows silent start
            # We use shell=True for simpler command execution if needed, but list is safer
            startup_info = None
            if os.name == 'nt':
                startup_info = subprocess.STARTUPINFO()
                startup_info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                
            self._process = subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                startupinfo=startup_info,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
            )
            
            # Wait for motor to warm up
            retries = 10
            while retries > 0:
                if self.is_running():
                    logger.info("🔵 Ollama motor is READY.")
                    return True
                time.sleep(1)
                retries -= 1
            
            logger.error("❌ Ollama motor failed to start within timeout.")
            return False
        except Exception as e:
            logger.error(f"❌ Error launching Ollama: {e}")
            return False

    def stop_motor(self):
        """Stops the Ollama process and releases resources."""
        logger.info("🔴 Stopping Ollama motor...")
        
        # 1. Try to terminate the process we started
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None
            logger.info("✅ Ollama process terminated.")
            return True

        # 2. Aggressive cleanup using psutil for ANY orphaned ollama processes
        found = False
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if proc.info['name'] and 'ollama' in proc.info['name'].lower():
                    logger.info(f"🔪 Found orphaned Ollama (PID {proc.info['pid']}). Killing...")
                    proc.kill()
                    found = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        if found:
            logger.info("✅ All Ollama instances cleared.")
        else:
            logger.info("ℹ️ No Ollama processes found to stop.")
        
        return True

    def get_status_label(self) -> str:
        """Returns visual status for the frontend (offline, starting, ready)."""
        if self.is_running():
            return "ready"
        if self._process and self._process.poll() is None:
            return "starting"
        return "offline"

# Global singleton
_orchestrator = OllamaOrchestrator()

def get_orchestrator() -> OllamaOrchestrator:
    return _orchestrator

```

### `backend/predictor.py`

```python
import os
import json
import psutil
import asyncio
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import mesh

# Hardware boundaries
VRAM_SAFE_LIMIT_GB = 6.0
CPU_SAFE_LIMIT_PERCENT = 80.0

class PredictionRequest(BaseModel):
    workspace: str
    focused_file: str # Path currently hovered/clicked but not fully active
    knowledge_base: Optional[Dict[str, Any]] = None

def get_system_load() -> str:
    """Evaluates current system load to scale prediction."""
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory().percent
        
        if cpu > CPU_SAFE_LIMIT_PERCENT or mem > 85.0:
            return "critical"
        elif cpu > 50.0 or mem > 60.0:
            return "low"
        else:
            return "high"
    except Exception:
        return "low"

async def generate_prediction(req: PredictionRequest) -> Dict[str, Any]:
    """Generates speculative next steps based on hardware tier."""
    load_tier = get_system_load()
    
    if load_tier == "critical":
        # Check if we can delegate to the swarm (Module A)
        cortex = mesh.get_best_cortex_node()
        if cortex:
            import logging
            logging.getLogger("lumina.predictor").info(f"🕸️ Swarm Delegation: Proxying prediction to {cortex.ip}:{cortex.port}")
            # Serialize the request
            return await mesh.proxy_prediction(cortex, req.model_dump())

        # If no cortex node is available and we are melting, abort
        return {
            "tier": load_tier,
            "suggestions": [],
            "ghost_block": None
        }
        
    # Also aggressively delegate if RAM is low (Simulating VRAM constraint for the PRD < 4GB)
    free_ram_gb = psutil.virtual_memory().available / (1024**3)
    if free_ram_gb < 4.0:
        cortex = mesh.get_best_cortex_node()
        if cortex:
            import logging
            logging.getLogger("lumina.predictor").info(f"🕸️ Swarm Delegation (< 4GB VRAM): Proxying prediction to {cortex.ip}:{cortex.port}")
            return await mesh.proxy_prediction(cortex, req.model_dump())
        
    # Analyze knowledge base for context
    context_keys = []
    kb = req.knowledge_base
    if isinstance(kb, dict) and "files" in kb:
        fk = kb.get("files", [])
        if isinstance(fk, list):
            for f in fk:
                if isinstance(f, dict) and "key" in f:
                    context_keys.append(f["key"])
                
    file_name = req.focused_file.split("/")[-1].split("\\")[-1]
    name_base = file_name.split(".")[0]
    
    # ─── Projections (File Name Suggestions) ──────────────────────
    suggestions = []
    if "route" in file_name.lower() or "controller" in file_name.lower():
        suggestions = [f"{name_base}.test.js", f"{name_base}.spec.js"]
    elif "test" not in file_name.lower() and file_name.endswith('.js'):
        suggestions = [f"{name_base}.test.js"]
        
    # ─── Ghost Block Generation (Hardware Aware) ──────────────────
    ghost_block = None
    if load_tier == "high":
        # Simulate an LLM call or fast static template generation
        if file_name.endswith('.js') or file_name.endswith('.jsx'):
            ghost_block = f"// Holographic Projection\nexport const make{name_base.capitalize()} = () => {{\n    // Pre-computed logic for {name_base}\n    return true;\n}};"
        elif file_name.endswith('.py'):
            ghost_block = f"# Holographic Projection\ndef init_{name_base.lower()}():\n    \"\"\"Pre-computed context\"\"\"\n    pass"

    return {
        "tier": load_tier,
        "suggestions": suggestions,
        "ghost_block": ghost_block,
        "related_context": context_keys[:3]
    }

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
cryptography

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
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, UploadFile, File
import shutil
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
from models import ChatSession, ChatMessage, LuminaIdentity
from identity import get_hwid, generate_master_key
from brain import brain
import sentinel
from security_vault import protect_project_secrets
import predictor

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


# ─── Identity Schemas ───────────────────────────────────────────
class IdentityRegister(BaseModel):
    user_name: str

class IdentityStatus(BaseModel):
    is_registered: bool
    user_name: Optional[str] = None
    hwid: str
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


def _stream_ollama(prompt: str, model: str, settings: Settings, fmt: Optional[str], enhanced_system_prompt: Optional[str] = None):
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
            {"role": "system", "content": enhanced_system_prompt or SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
    }
    generate_payload: dict = {
        "model": model,
        "system": enhanced_system_prompt or SYSTEM_PROMPT,
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


def _stream_with_logging_and_files(prompt: str, model: str, settings: Settings, fmt: Optional[str], enhanced_system_prompt: Optional[str] = None):
    """Wraps _stream_ollama — logs usage AND writes file blocks after stream."""
    from agent import parse_file_blocks, write_file_blocks
    import workspace as ws

    total_prompt = 0
    total_completion = 0
    full_response = []   # accumulate tokens for file parsing

    for event in _stream_ollama(prompt, model, settings, fmt, enhanced_system_prompt=enhanced_system_prompt):
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


def _generate_ollama_sync(prompt: str, model: str, settings: Settings, fmt: Optional[str], enhanced_system_prompt: Optional[str] = None) -> dict:
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
                {"role": "system", "content": enhanced_system_prompt or SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "stream": False,
            **({"format": fmt} if fmt else {}),
        }, "chat"),
        (f"{base_url}/api/generate", {
            "model": model, "prompt": prompt, "stream": False,
            "system": enhanced_system_prompt or SYSTEM_PROMPT,
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

    # ─── Lumina Brain Context (v6.0)
    from brain import brain
    context_str = ""
    try:
        # Busca contexto baseado no prompt do usuário
        memories = await brain.search_context(body.prompt, limit=3)
        if memories:
            context_str = "\n\n═══ PAST_CONTEXT (Memory) ═══\nAqui estão trechos de códigos que você já escreveu e que podem ajudar nesta tarefa:\n"
            for m in memories:
                context_str += f"\n--- De: {m['file']} ---\n{m['content']}\n"
    except Exception as e:
        log.error(f"Brain search failed: {e}")

    from agent import SYSTEM_PROMPT
    enhanced_system_prompt = SYSTEM_PROMPT + context_str

    # ── Chunking logic
    token_count = count_tokens(body.prompt)

    if token_count > 1200 and body.mode == "local":
        chunks = chunk_code(body.prompt)
        chunk_results = []
        for chunk in chunks:
            result = _generate_ollama_sync(chunk["content"], model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt)
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
            _stream_with_logging_and_files(body.prompt, model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    # ── Non-streaming fallback
    if body.mode == "local":
        result = _generate_ollama_sync(body.prompt, model, settings, body.format, enhanced_system_prompt=enhanced_system_prompt)
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

    # ─── Lumina Brain Context (v6.0)
    from brain import brain
    context_str = ""
    try:
        memories = await brain.search_context(body.code, limit=3)
        if memories:
            context_str = "\n\n═══ PAST_CONTEXT (Memory) ═══\nPadrões similares encontrados:\n"
            for m in memories:
                context_str += f"\nSnippet: {m['content']}\n"
    except Exception:
        pass

    prompt_system = AUTOCOMPLETE_SYSTEM + context_str
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
                "system": prompt_system,
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
            return {
                "suggestion": suggestion,
                "used_brain": bool(context_str)
            }
        return {"suggestion": "", "used_brain": False}
    except Exception:
        return {"suggestion": "", "used_brain": False}

# ─── Brain Status (v6.0) ───────────────────────────────────────────
@router.get("/brain/status")
async def get_brain_status():
    from brain import brain
    return {
        "status": "READY" if brain.is_ready else "INDEXING",
        "is_ready": brain.is_ready
    }

# ─── Library Endpoints (v6.5) ──────────────────────────────────────
@router.post("/library/upload")
async def library_upload(file: UploadFile = File(...)):
    """Upload and index a PDF or Text documentation file."""
    from library import library
    import os
    
    # Ensure temporary storage
    temp_dir = os.path.join(os.getcwd(), "temp_docs")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        success = False
        if file.filename.lower().endswith(".pdf"):
            success = await library.process_pdf(file_path)
        elif file.filename.lower().endswith((".md", ".txt")):
            success = await library.process_markdown(file_path)
            
        return {"success": success, "filename": file.filename}
    except Exception as e:
        log.error(f"❌ Upload error: {e}")
        return {"success": False, "error": str(e)}

@router.get("/library/list")
async def library_list():
    """List all ingested documentation."""
    from library import library
    return {"documents": library.get_documents()}




# ─── Identity ──────────────────────────────────────────────────────
@router.get("/identity/check", response_model=IdentityStatus)
def check_identity(db: Session = Depends(get_session)):
    identity = db.exec(select(LuminaIdentity).where(LuminaIdentity.is_active == True)).first()
    hwid = get_hwid()
    if identity:
        return {
            "is_registered": True,
            "user_name": identity.user_name,
            "hwid": hwid
        }
    return {"is_registered": False, "hwid": hwid}

@router.post("/identity/register")
def register_identity(reg: IdentityRegister, db: Session = Depends(get_session)):
    # Check if already registered
    existing = db.exec(select(LuminaIdentity)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Identidade já registrada.")
    
    hwid = get_hwid()
    hwid_hash = generate_master_key(reg.user_name, hwid)
    
    new_id = LuminaIdentity(
        user_name=reg.user_name,
        hwid_hash=hwid_hash,
        is_active=True
    )
    db.add(new_id)
    db.commit()
    db.refresh(new_id)
    
    # Unlock Brain and Protect secrets immediately after registration
    if brain.verify_identity(new_id.user_name, new_id.hwid_hash):
        protect_project_secrets("c:/pulsyce/backend", new_id.user_name)
    
    return {"success": True, "user_name": reg.user_name}

# ─── Configuration ───────────────────────────────────────────────
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


# ─── Proactive Predictive Cache (Module C) ──────────────────────────
@router.post("/predict/next-steps", response_model=Dict[str, Any])
async def predict_next_steps(req: predictor.PredictionRequest):
    """(v4.0) Speculative execution buffer based on hardware load."""
    try:
        prediction = await predictor.generate_prediction(req)
        return {"status": "success", "prediction": prediction}
    except Exception as e:
        log.error(f"Predictor error: {e}")
        return {"status": "error", "message": str(e)}

# ─── Lumina Mesh (Module A v5.0) ────────────────────────────────────
@router.get("/mesh/status", response_model=Dict[str, Any])
async def get_mesh_status():
    """Returns local hardware status for swarm peering."""
    import psutil
    try:
        mem = psutil.virtual_memory()
        free_ram_gb = mem.available / (1024**3)
        # We assume for this MVP that > 4GB free RAM qualifies as a Cortex
        is_cortex = free_ram_gb >= 4.0
        return {
            "vram_free_gb": round(free_ram_gb, 2),
            "is_cortex": is_cortex
        }
    except Exception as e:
        log.error(f"Mesh status error: {e}")
        return {"vram_free_gb": 0.0, "is_cortex": False}

@router.get("/mesh/nodes", response_model=Dict[str, Any])
async def get_mesh_nodes():
    """Returns list of discovered swarm nodes."""
    try:
        import mesh
        nodes = []
        for nid, node in mesh.discovered_nodes.items():
            nodes.append({
                "id": nid,
                "ip": node.ip,
                "port": node.port,
                "hostname": node.hostname,
                "vram_free_gb": node.vram_free_gb,
                "is_cortex": node.is_cortex,
                "last_seen": node.last_seen
            })
        return {"nodes": nodes, "count": len(nodes)}
    except Exception as e:
        log.error(f"Mesh nodes error: {e}")
        return {"nodes": [], "count": 0}

# ─── Lumina Edge (Module B v5.5) ────────────────────────────────────
from edge_runtime import edge_manager
from fastapi.responses import FileResponse

@router.post("/edge/start", response_model=Dict[str, Any])
async def start_edge_sandbox():
    """Starts the WASM/Sandbox execution for the current workspace."""
    from workspace import _workspace_path
    if not _workspace_path:
        return {"status": "error", "message": "Nenhum workspace ativo para rodar no Edge."}
    return await edge_manager.start_sandbox(_workspace_path)

@router.delete("/edge/stop/{sandbox_id}")
async def stop_edge_sandbox(sandbox_id: str):
    edge_manager.stop_sandbox(sandbox_id)
    return {"status": "success"}

@router.get("/edge/preview/{sandbox_id}/{file_path:path}")
async def edge_preview(sandbox_id: str, file_path: str):
    """Serves the sandbox files as if it were a Wasm Edge runtime."""
    sandbox = edge_manager.get_sandbox(sandbox_id)
    if not sandbox:
        raise HTTPException(status_code=404, detail="Sandbox inativo ou inexistente")
    
    import os
    # Default to index.html if pointing to root/empty file_path
    if not file_path or file_path == "":
        file_path = "index.html"
        
    full_path = os.path.join(sandbox["workspace"], file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no sandbox")
        
    return FileResponse(full_path)

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
    
    # Trigger Lumina Brain Indexing (v6.0)
    from brain import brain
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        asyncio.create_task(brain.index_code(file_path, content))
    except Exception as e:
        log.error(f"Brain indexing failed: {e}")
    
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

@router.get("/api/sentinel/status")
async def get_sentinel_status():
    """Reports the current status of the active defense sentinel."""
    return {
        "is_active": sentinel._sentinel_running,
        "panic_triggered": sentinel.PANIC_TRIGGERED,
        "reason": sentinel.LAST_REASON
    }
@router.get("/api/brain/status")
async def get_brain_status():
    """Reports the status of the Lumina Brain engine and Pulse metrics."""
    from watcher import get_watcher
    watcher = get_watcher()
    latency = watcher.observer.dispatchers[0].event_handler.last_latency if watcher and watcher.observer else 0
    
    status = brain.get_status()
    status["analysis_latency_ms"] = latency
    return status

```

### `backend/security_vault.py`

```python
import os
import base64
import hashlib
from cryptography.fernet import Fernet
from identity import get_reconstructed_key

def _get_fernet_instance() -> Fernet:
    """Derives a Fernet-compatible key from the reconstructed master key fragments."""
    # Reconstruct from fragments (v2.1 Sharding)
    master_key_bytes = get_reconstructed_key()
    
    # Derivar a chave de 32 bytes para Fernet
    key_32bytes = hashlib.sha256(master_key_bytes).digest()
    fernet_key = base64.urlsafe_b64encode(key_32bytes)
    
    instance = Fernet(fernet_key)
    
    # Zero-Trace: Sobrescrever a chave temporária na RAM
    # (Python strings/bytes são imutáveis, mas tentamos isolar o uso)
    del master_key_bytes
    del key_32bytes
    
    return instance

def encrypt_file(file_path: str) -> bool:
    """Encrypts a file in place using the sharded identity key."""
    if not os.path.exists(file_path):
        return False
    
    try:
        fernet = _get_fernet_instance()
        with open(file_path, "rb") as f:
            data = f.read()
            
        if data.startswith(b"LUMINA_ENC:"):
            return True
            
        encrypted_data = b"LUMINA_ENC:" + fernet.encrypt(data)
        
        with open(file_path, "wb") as f:
            f.write(encrypted_data)
            
        # Zero-Trace
        del data
        del encrypted_data
        return True
    except Exception as e:
        print(f"Encryption error for {file_path}: {e}")
        return False

def decrypt_data(data: bytes) -> bytes:
    """Decrypts literal data if it starts with the Lumina prefix."""
    if not data.startswith(b"LUMINA_ENC:"):
        return data
    
    try:
        fernet = _get_fernet_instance()
        decrypted = fernet.decrypt(data[len(b"LUMINA_ENC:"):])
        return decrypted
    except Exception as e:
        print(f"Decryption error: {e}")
        return data

def protect_project_secrets(project_path: str):
    """Finds .env files and encrypts them."""
    for root, dirs, files in os.walk(project_path):
        for f in files:
            if f == ".env" or f.endswith(".vault"):
                encrypt_file(os.path.join(root, f))

```

### `backend/sentinel.py`

```python
import os
import sys
import time
import ctypes
import logging
import psutil
import threading
from typing import List

log = logging.getLogger("lumina.sentinel")

# Ferramentas Proibidas (Blacklist)
SUSPICIOUS_PROCESSES = [
    "x64dbg.exe", "ida64.exe", "idat64.exe", "wireshark.exe", 
    "http-toolkit.exe", "fiddler.exe", "processhacker.exe", 
    "ghidra.exe", "ollydbg.exe", "cheatengine.exe"
]

_sentinel_running = False
PANIC_TRIGGERED = False
LAST_REASON = ""

def is_debugger_present() -> bool:
    """Verifica se um debugger está anexado usando a API do Windows."""
    if sys.platform == 'win32':
        return ctypes.windll.kernel32.IsDebuggerPresent() != 0
    return False

def check_suspicious_processes() -> List[str]:
    """Procura por processos de análise na lista negra."""
    detected = []
    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name'].lower()
            if any(s.lower() in name for s in SUSPICIOUS_PROCESSES):
                detected.append(name)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return detected

def panic_mode(reason: str):
    """Encerrar a aplicação imediatamente e limpar a memória."""
    global PANIC_TRIGGERED, LAST_REASON
    if PANIC_TRIGGERED: return
    
    PANIC_TRIGGERED = True
    LAST_REASON = reason
    log.critical(f"🚨 PANIC MODE TRIGGERED: {reason}")
    
    # 1. Limpeza de variáveis sensíveis
    from identity import clear_key_fragments
    clear_key_fragments()
    
    log.info("🧹 Memory wiped. UI Alert issued. Waiting 5s before termination...")
    
    # Damos 5 segundos para o Frontend exibir o alerta antes de matar o processo
    def delayed_exit():
        time.sleep(5)
        log.info("🔴 Terminating processes...")
        os._exit(1)
        
    threading.Thread(target=delayed_exit, daemon=True).start()

def sentinel_loop():
    """Loop de monitoramento ativo."""
    global _sentinel_running
    while _sentinel_running:
        # 1. Check Debugger
        if is_debugger_present():
            panic_mode("Debugger attached detected via WinAPI")
        
        # 2. Check Blacklisted Tools
        detected_tools = check_suspicious_processes()
        if detected_tools:
            panic_mode(f"Prohibited analysis tools detected: {', '.join(detected_tools)}")
        
        time.sleep(2)

def start_sentinel():
    """Inicia o cão de guarda em uma thread separada."""
    global _sentinel_running
    if not _sentinel_running:
        _sentinel_running = True
        
        # Set High Priority for the defensive process (Windows specific)
        if sys.platform == 'win32':
            try:
                p = psutil.Process(os.getpid())
                p.nice(psutil.HIGH_PRIORITY_CLASS)
                log.info("🚀 Sentinel priority elevated to HIGH_PRIORITY_CLASS")
            except Exception as e:
                log.warning(f"Failed to elevate sentinel priority: {e}")

        thread = threading.Thread(target=sentinel_loop, daemon=True, name="LuminaSentinel")
        thread.start()
        log.info("🛡️ Lumina Sentinel Active Defense—STARTED")

def stop_sentinel():
    """Para o monitoramento."""
    global _sentinel_running
    _sentinel_running = False
    log.info("🛡️ Lumina Sentinel—STOPPED")

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

class MotorResponse(BaseModel):
    status: str # offline, starting, ready

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

# ─── Orchestrator Endpoints (v2.3) ──────────────────────────────────
@router.get("/motor/status", response_model=MotorResponse)
def get_motor_status():
    from ollama_orchestrator import get_orchestrator
    return MotorResponse(status=get_orchestrator().get_status_label())

@router.post("/motor/toggle")
def toggle_motor():
    from ollama_orchestrator import get_orchestrator
    orchestrator = get_orchestrator()
    if orchestrator.is_running():
        orchestrator.stop_motor()
        return {"status": "stopped"}
    else:
        orchestrator.start_motor()
        return {"status": "started"}

@router.get("/models/list")
async def list_all_models():
    """Lists installed models and available catalog models."""
    try:
        from ollama_orchestrator import get_orchestrator
        orchestrator = get_orchestrator()
        
        # 1. Fetch installed models from Ollama API
        installed = []
        if orchestrator.is_running():
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{orchestrator.base_url}/api/tags")
                if resp.status_code == 200:
                    installed = [m["name"] for m in resp.json().get("models", [])]
        
        # 2. Hardcoded recommendation catalog (simplified)
        catalog = [
            {"name": "mistral", "size": "4.1GB", "description": "High performance 7B model."},
            {"name": "llama3:8b", "size": "4.7GB", "description": "Meta's latest open powerhouse."},
            {"name": "codellama", "size": "3.8GB", "description": "Optimized for programming."},
            {"name": "phi3", "size": "2.3GB", "description": "Ultra-lightweight but capable."},
            {"name": "gemma:7b", "size": "5.0GB", "description": "Google's open model series."}
        ]
        
        return {
            "installed": installed,
            "catalog": catalog
        }
    except Exception as e:
        log.error(f"Error listing models: {e}")
        return {"installed": [], "catalog": []}

@router.delete("/models/{name}")
async def delete_model(name: str):
    """Removes an installed model."""
    from ollama_orchestrator import get_orchestrator
    orchestrator = get_orchestrator()
    if not orchestrator.is_running():
        raise HTTPException(status_code=503, detail="Ollama motor is offline")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                "DELETE", 
                f"{orchestrator.base_url}/api/delete",
                json={"name": name}
            )
            if resp.status_code == 200:
                return {"status": "success"}
            else:
                return {"status": "error", "message": resp.text}
    except Exception as e:
        log.error(f"Error deleting model: {e}")
        return {"status": "error", "message": str(e)}

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
import time
import threading
from typing import Set, Optional, Dict
from concurrent.futures import ThreadPoolExecutor
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger("lumina.watcher")

class FileWatcherHandler(FileSystemEventHandler):
    def __init__(self, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop, callback):
        super().__init__()
        self.skip_dirs = skip_dirs
        self.loop = loop
        self.callback = callback
        self._debounce_timers: Dict[str, threading.Timer] = {}
        self._executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="LuminaPulse")
        self._last_pulse = 0
        self.last_latency = 0
        self.pulse_batch = set()
        self.pulse_lock = threading.Lock()
        self._shutdown_event = threading.Event()

    def shutdown(self):
        """Cleanly shuts down the thread pool and timers."""
        self._shutdown_event.set()
        for timer in self._debounce_timers.values():
            timer.cancel()
        
        # cancel_futures=True ensures pending tasks are dropped immediately (Python 3.9+)
        try:
            self._executor.shutdown(wait=False, cancel_futures=True)
        except TypeError:
            # Fallback for older Python versions
            self._executor.shutdown(wait=False)
            
        logger.info("Watcher Handler executor shutdown completed (forced).")

    def _should_ignore(self, path: str) -> bool:
        # Ignore system folders and hidden files
        if any(part.startswith('.') for part in os.path.normpath(path).split(os.sep)):
            return True
        parts = os.path.normpath(path).split(os.sep)
        for part in parts:
            if part in self.skip_dirs:
                return True
        return False

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
            
        with self.pulse_lock:
            self.pulse_batch.add(event.src_path)
            
            # Cancel existing timer
            if "pulse_timer" in self._debounce_timers:
                self._debounce_timers["pulse_timer"].cancel()
            
            # Schedule the "Pulse" (Batch of 1.5s)
            timer = threading.Timer(1.5, self._trigger_pulse)
            self._debounce_timers["pulse_timer"] = timer
            timer.start()

    def _trigger_pulse(self):
        """Processes the batch of modified files in the thread pool."""
        with self.pulse_lock:
            batch = list(self.pulse_batch)
            self.pulse_batch.clear()
            
        if not batch:
            return

        start_time = time.time()
        logger.info(f"⚡ Pulse Triggered: Processing {len(batch)} file(s)...")
        
        # Offload brain and healer processing to the executor
        for file_path in batch:
            self._executor.submit(self._process_file, file_path)
            
        self.last_latency = (time.time() - start_time) * 1000
        logger.info(f"✅ Pulse Completed in {self.last_latency:.2f}ms")

    def _process_file(self, file_path: str):
        """Individual file processing in a separate thread."""
        try:
            # We run the original callback (which usually updates Brain/Healer)
            # using run_coroutine_threadsafe to jump back to the main loop if needed
            asyncio.run_coroutine_threadsafe(self.callback(file_path), self.loop)
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")


class LuminaWatcher:
    def __init__(self, callback):
        self.observer = None
        self.handler = None
        self.callback = callback
        self.current_path = None

    def start(self, path: str, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop):
        if self.observer:
            self.stop()
            
        if not path or not os.path.isdir(path):
            return

        self.current_path = path
        self.handler = FileWatcherHandler(skip_dirs, loop, self.callback)
        self.observer = Observer()
        self.observer.schedule(self.handler, path, recursive=True)
        self.observer.start()
        logger.info(f"O Nervo Óptico foi ativado no diretório: {path}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join(timeout=2)
            self.observer = None
            
        if self.handler:
            self.handler.shutdown()
            self.handler = None
            
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

