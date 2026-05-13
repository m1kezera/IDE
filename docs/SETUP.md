# Development Setup

> Step-by-step guide to set up Lumina IDE for development

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| Python | ≥ 3.10 | [python.org](https://python.org) |
| Git | ≥ 2.30 | [git-scm.com](https://git-scm.com) |
| Ollama | Latest | [ollama.com](https://ollama.com) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/m1kezera/IDE.git lumina-ide
cd lumina-ide
```

---

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Optional: install enhanced features
pip install PyMuPDF python-docx watchdog psutil
```

### Configure Environment

Create `backend/.env`:

```env
OLLAMA_HOST=127.0.0.1
OLLAMA_PORT=11434
LOCAL_MODEL=mistral

# Optional: Cloud AI (leave empty if not using)
CLOUD_API_KEY=
CLOUD_PROVIDER=
CLOUD_MODEL=gpt-4o
```

### Start Backend (standalone)

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --port 8001 --reload
```

Verify: `http://127.0.0.1:8001/api/health`

---

## 3. Frontend Setup

```bash
cd frontend-ts

# Install dependencies
npm install

# Build (required for Electron to load)
npm run build

# Or use dev server (for hot reload during UI development)
npm run dev
```

> **Note**: Electron loads from `frontend-ts/dist/index.html`, so you need to build at least once. For live development, you can modify `electron/main.js` to load `http://localhost:5173` instead.

---

## 4. Electron Setup

```bash
# From project root
npm install

# Start the desktop app (builds frontend if not already built)
npm start
```

---

## 5. Install Ollama Models

```bash
# Install the default model
ollama pull mistral

# Other recommended models
ollama pull llama3.2
ollama pull qwen2.5-coder
ollama pull deepseek-coder-v2
```

---

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend with hot reload
cd backend && .venv\Scripts\activate
uvicorn main:app --port 8001 --reload

# Terminal 2: Frontend dev server
cd frontend-ts && npm run dev

# Terminal 3: Electron (loads built frontend)
npm start
```

### File Structure Quick Reference

| You want to change... | Edit this file |
|----------------------|----------------|
| AI agent behavior | `backend/agent.py` |
| API endpoints | `backend/router.py` |
| Chat UI | `frontend-ts/src/ui/AgentPanel.ts` |
| File tree / sidebar | `frontend-ts/src/ui/Sidebar.ts` |
| Code editor | `frontend-ts/src/core/EditorManager.ts` |
| Styling / themes | `frontend-ts/src/style.css` |
| Terminal | `frontend-ts/src/core/TerminalManager.ts` |
| Design Studio | `frontend-ts/src/ui/ds-*.ts` |
| Electron window | `electron/main.js` |

### Testing the Backend

```bash
cd backend
python -m pytest test_*.py
```

### Building for Release

```bash
# Full pipeline
.\build_release.bat

# Or step by step:
cd frontend-ts && npm run build && cd ..
cd backend && pyinstaller LuminaEngine.spec && cd ..
npx electron-builder
```

---

## Port Reference

| Service | Port | Protocol |
|---------|------|----------|
| Backend API | 8001 | HTTP |
| Terminal PTY | 8001 | WebSocket `/ws/terminal` |
| File Watcher | 8001 | WebSocket `/ws/watcher` |
| Ollama | 11434 | HTTP |
| Vite Dev Server | 5173 | HTTP (dev only) |

---

## Common Issues

| Problem | Solution |
|---------|----------|
| Backend won't start | Check Python version (`python --version` ≥ 3.10) |
| "Ollama not found" | Install Ollama and run `ollama serve` |
| Frontend blank page | Run `npm run build` in `frontend-ts/` |
| DevTools blocked in Electron | Press F5 to reload, DevTools are disabled in packaged builds |
| Permission errors on Windows | Run terminal as Administrator |
| Port 8001 already in use | Kill existing process: `netstat -ano | findstr :8001` |
