# Lumina IDE

**Intelligent Development Environment** — An AI-powered desktop code editor built with Electron, TypeScript, and Python.

Lumina IDE integrates a local/cloud AI agent, a visual Design Studio, a document library with semantic search, and a full terminal — all inside a single frameless desktop application.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Agent** | Chat assistant with chain-of-thought thinking, multi-model support (Ollama local + OpenAI/Anthropic/Groq cloud) |
| **Code Editor** | Monaco-class editor with syntax highlighting, multi-tab, and workspace file tree |
| **Design Studio** | Visual drag-and-drop UI builder that exports clean HTML/CSS |
| **Web Studio** | Full WYSIWYG page builder with templates, tokens, and snap grid |
| **Terminal** | Integrated xterm.js terminal with PTY support |
| **Brain** | Vector-indexed code search using TF-IDF for codebase context injection |
| **Library** | Document manager (PDF, DOCX, MD) with personality prompts and semantic memory |
| **Swarm Mesh** | Multi-model orchestration for complex tasks using tiered model routing |
| **Git Panel** | Built-in Git interface for staging, committing, and branch management |
| **Music Panel** | Ambient music player for focus sessions |
| **Telemetry** | Live usage stats, token tracking, and cost ROI dashboard |
| **Themes** | Dynamic theme engine with Catppuccin-based palette and glassmorphism |
| **Extensions** | Plugin system for custom tools and integrations |
| **i18n** | Multi-language support (PT-BR, EN, ES) |

---

## 🏗️ Architecture

```
lumina-ide/
├── electron/          # Electron shell (main process)
│   ├── main.js        # App lifecycle, backend spawn, IPC handlers
│   └── preload.js     # Context bridge for renderer ↔ main
├── frontend-ts/       # TypeScript frontend (Vite)
│   └── src/
│       ├── main.ts         # App bootstrap, panel orchestration
│       ├── style.css       # Full design system (~5200 lines)
│       ├── api/client.ts   # Backend API client
│       ├── core/           # EditorManager, TerminalManager, PubSub, i18n
│       └── ui/             # All UI panels (Agent, Library, Git, etc.)
├── backend/           # Python FastAPI backend
│   ├── main.py        # FastAPI app, CORS, startup hooks
│   ├── router.py      # All API endpoints (~3100 lines)
│   ├── agent.py       # Agentic coding engine (file ops, diffs)
│   ├── brain.py       # TF-IDF vector search engine
│   ├── library.py     # Document processing & personality prompts
│   ├── memory.py      # Persistent agent memory (SQLite-backed)
│   ├── models.py      # SQLModel database schemas
│   ├── database.py    # SQLite engine, migrations, session management
│   ├── config.py      # Settings from .env with cloud config persistence
│   ├── terminal.py    # PTY subprocess for integrated terminal
│   ├── swarm_mesh.py  # Multi-model orchestration & LLM cache
│   └── ...            # sentinel, healer, watcher, skills, etc.
├── docs/              # Documentation
├── package.json       # Root Electron package
└── electron-builder.yml  # Packaging config (NSIS installer)
```

> See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture diagram.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **Ollama** (for local AI) — [ollama.com](https://ollama.com)

### Development Setup

```bash
# 1. Clone
git clone https://github.com/m1kezera/IDE.git lumina-ide
cd lumina-ide

# 2. Backend
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt

# 3. Frontend
cd ../frontend-ts
npm install
npm run build                 # Builds to frontend-ts/dist/

# 4. Electron (root)
cd ..
npm install
npm start                     # Launches desktop app
```

> See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

---

## 📦 Packaging

Lumina IDE is packaged as a Windows NSIS installer using `electron-builder`.

```bash
# Full release pipeline (backend → frontend → installer)
.\build_release.bat
```

> See [docs/PACKAGING.md](docs/PACKAGING.md) for the full packaging guide.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, and component diagram |
| [SETUP.md](docs/SETUP.md) | Development environment setup guide |
| [PACKAGING.md](docs/PACKAGING.md) | Build pipeline, PyInstaller, Electron Builder |
| [DEPENDENCIES.md](docs/DEPENDENCIES.md) | All dependencies with versions and purposes |
| [API.md](docs/API.md) | Backend REST API reference |
| [ROADMAP.md](docs/ROADMAP.md) | Feature roadmap and version history |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron 33 |
| Frontend | TypeScript, Vite 8, Vanilla CSS |
| UI Rendering | Pure DOM manipulation (no React for main UI) |
| Design Studio | React 19 + @xyflow/react (visual builder only) |
| Code Editor | Monaco-style custom editor |
| Terminal | xterm.js 5 + @xterm/addon-fit |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Database | SQLite via SQLModel |
| AI (Local) | Ollama (Mistral, Llama, Qwen, etc.) |
| AI (Cloud) | OpenAI, Anthropic, Groq, Google (configurable) |
| Vector Search | TF-IDF with tiktoken tokenization |
| Packaging | PyInstaller (backend) + electron-builder (NSIS) |

---

## 📄 License

ISC © [m1kezera](https://github.com/m1kezera)
