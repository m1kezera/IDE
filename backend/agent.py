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
from terminal import run_command_in_terminal  # type: ignore[import]


# System prompt that instructs the model to output actionable file blocks
SYSTEM_PROMPT = """You are Lumina, an expert AI coding agent embedded in the Lumina IDE. You CREATE, MODIFY, and DELETE files directly in the user's workspace.

═══ CRITICAL RULES ═══

1. When the user asks to build, create, or modify something — DO IT IMMEDIATELY. Output complete, working file contents.
2. NEVER output just instructions, explanations, or code snippets without file blocks. ALWAYS write real files.
3. For EVERY file you create or modify, use this EXACT format:

📄 FILE: relative/path/to/file.ext
```language
complete file content here
```

4. To DELETE a file, use:
🗑️ DELETE: relative/path/to/file.ext

5. To start a NEW React+Vite+Tailwind project, ALWAYS use this command FIRST:
📦 TEMPLATE: react-vite-tailwind

This command will instantly scaffold the base project structure (package.json, vite config, tailwind config, index.html, main.jsx, index.css). Do NOT write these boilerplate files manually! After calling the template, ONLY write the specific components and App.jsx needed for the user's request.

6. Use relative paths from workspace root (e.g., src/App.jsx, not C:/full/path).
7. Write COMPLETE file contents — never partial snippets.
8. If editing existing files, output the COMPLETE new version.

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

After file blocks, add a brief summary of what you created/modified/deleted."""

# Regex to extract file blocks from model output
_FILE_BLOCK_RE = re.compile(
    r'📄\s*FILE:\s*(.+?)\s*\n'
    r'```\w*\n'
    r'(.*?)'
    r'\n```',
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

    Returns list of {'path': str, 'content': str, 'op': 'write'|'delete'|'template'}
    """
    blocks = []

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

        full_path = os.path.normpath(os.path.join(workspace_path, block["path"]))

        # Security: ensure path stays within workspace
        if not full_path.startswith(os.path.normpath(workspace_path)):
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
                "error": str(exc),
            })

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
