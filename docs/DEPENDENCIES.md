# Dependencies

> Complete dependency reference for Lumina IDE v10

---

## Root (Electron Shell)

| Package | Version | Purpose |
|---------|---------|---------|
| `electron` | ^33.0.0 | Desktop application framework |
| `electron-builder` | ^25.1.8 | Packaging into NSIS installer |

**File**: `package.json`

---

## Frontend (`frontend-ts/`)

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `marked` | ^17.0.4 | Markdown → HTML rendering (agent chat, preview) |
| `@types/marked` | ^5.0.2 | TypeScript types for marked |
| `xterm` | ^5.3.0 | Terminal emulator in the browser |
| `@xterm/addon-fit` | ^0.11.0 | Auto-resize terminal to container |
| `@xterm/addon-web-links` | ^0.12.0 | Clickable URLs in terminal output |
| `@xyflow/react` | ^12.10.2 | React Flow for Design Studio node graph |
| `@panzoom/panzoom` | ^4.6.2 | Pan/zoom for canvas views |
| `html-to-image` | ^1.11.13 | Screenshot export for Design Studio |
| `react` | ^19.2.5 | Used only in Design Studio visual builder |
| `react-dom` | ^19.2.5 | React DOM renderer |
| `tldraw` | ^4.5.8 | Infinite canvas for whiteboard/brainstorm |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.3 | TypeScript compiler |
| `vite` | ^8.0.0 | Build tool and dev server |
| `@vitejs/plugin-react` | ^6.0.1 | React support in Vite (for Design Studio) |
| `tailwindcss` | ^3.4.19 | Utility CSS (used minimally, mostly custom CSS) |
| `autoprefixer` | ^10.4.27 | CSS vendor prefixing |
| `postcss` | ^8.5.8 | CSS processing pipeline |
| `@types/react` | ^19.2.14 | TypeScript types for React |
| `@types/react-dom` | ^19.2.3 | TypeScript types for React DOM |

**File**: `frontend-ts/package.json`

---

## Backend (`backend/`)

### Core Dependencies (`requirements.txt`)

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework for REST API |
| `uvicorn` | ASGI server (production + dev) |
| `sqlmodel` | SQLite ORM (SQLAlchemy + Pydantic) |
| `requests` | HTTP client for Ollama and cloud API calls |
| `tiktoken` | OpenAI tokenizer for accurate token counting |
| `python-dotenv` | Load `.env` file for configuration |
| `pydantic-settings` | Typed settings management from env vars |
| `websockets` | WebSocket support for terminal PTY and file watcher |
| `cryptography` | Security vault encryption (HWID, API key storage) |

### Optional Dependencies (Enhanced Features)

| Package | Purpose | Required? |
|---------|---------|-----------|
| `PyMuPDF` (fitz) | PDF text extraction for Library | Optional |
| `python-docx` | DOCX parsing for Library | Optional |
| `watchdog` | File system watcher for live reload | Optional |
| `psutil` | System metrics for telemetry | Optional |

### PyInstaller (Build Only)

| Package | Purpose |
|---------|---------|
| `pyinstaller` | Bundle backend into standalone `.exe` |

---

## System Requirements

### Development

| Tool | Minimum Version |
|------|----------------|
| Node.js | 18+ |
| Python | 3.10+ |
| npm | 9+ |
| Git | 2.30+ |

### Runtime (End User)

| Requirement | Details |
|-------------|---------|
| OS | Windows 10/11 (x64) |
| RAM | 4 GB minimum, 8 GB recommended |
| Disk | ~500 MB for Lumina IDE + models |
| Ollama | Required for local AI (auto-detected on port 11434) |
| GPU | Optional, improves local LLM inference speed |

### AI Models (Ollama)

| Model | Size | Best For |
|-------|------|----------|
| `mistral` | 4.1 GB | Default, good balance of speed and quality |
| `llama3.2` | 2 GB | Lightweight, fast responses |
| `qwen2.5-coder` | 4.7 GB | Code-focused, best for programming tasks |
| `deepseek-coder-v2` | 8.9 GB | Advanced code generation |
| `codellama` | 3.8 GB | Meta's code-specialized model |

### Cloud Providers (Optional)

| Provider | Models | API Key Required |
|----------|--------|-----------------|
| OpenAI | gpt-4o, gpt-4o-mini, o1 | Yes |
| Anthropic | claude-sonnet-4, claude-3.5-haiku | Yes |
| Groq | llama-3.3-70b, mixtral-8x7b | Yes |
| Google | gemini-2.0-flash, gemini-pro | Yes |
