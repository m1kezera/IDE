# Roadmap & Version History

> Lumina IDE — Feature evolution from v1 to v10

---

## Current Version: v10.0.1

---

## Version History

### v10.0 — Brain Intelligence Upgrade (May 2026)
- **Thinking Mode**: Toggleable chain-of-thought reasoning with `<thinking>` tag injection
  - Collapsible thinking blocks in chat UI
  - Cloud token warning badge
  - Persistent state via localStorage
- **SQLite Migration**: All state consolidated into `pulsyce.db`
  - `library_documents` — document metadata
  - `library_folders` — folder organization
  - `personality_config` — system prompt persistence
  - `agent_memories` — persistent memory with dedup and auto-pruning
  - Auto-migration from legacy JSON files (`.migrated.bak`)
- **Inline Personality Editor**: Edit system prompts directly in Library Panel
- **Memory CRUD**: Full UI for viewing, adding, and deleting agent memories
- **API Expansion**: `PUT /library/personality/text`, `GET/POST/DELETE /memories`

### v9.0 — Web Studio & Design Studio (Apr 2026)
- **Web Studio**: Full WYSIWYG page builder (114KB module)
  - Drag-and-drop components
  - Properties panel with live editing
  - Snap grid and rulers
  - Template gallery
  - Export to clean HTML/CSS
- **Design Studio**: Visual component builder
  - Node-based UI with React Flow
  - Component palette and token system
  - Inline text editing
  - Asset management
  - History (undo/redo)

### v8.0 — Swarm Mesh & Multi-Model (Mar 2026)
- **Swarm Mesh**: Multi-model orchestration engine
  - Tiered routing: small → medium → large models
  - LLM response cache
  - Parallel model execution
- **Model Tiers**: Automatic classification of Ollama models by capability
- **Mesh Panel**: UI for monitoring multi-model operations

### v7.0 — Library & Documents (Feb 2026)
- **Document Library**: Upload and index PDF, DOCX, MD, TXT files
  - Folder organization with drag-and-drop
  - Vector search (Brain-powered) restricted to library
  - Personality prompt system (custom agent behavior)
- **Telemetry Panel**: Usage stats, token costs, GPU monitoring
- **Settings Panel**: Cloud API key management, model selection

### v6.0 — Agent Coding Engine (Jan 2026)
- **Agentic Mode**: AI can create, edit, and delete files
  - Diff generation and preview
  - Multi-step planning with user confirmation
  - File operation chips in chat
- **Strict Library Mode**: Force agent to only use uploaded documents
- **Git Panel**: Built-in staging, commit, branch management

### v5.0 — TypeScript Rewrite (Dec 2025)
- **Full rewrite** from React (JSX) to TypeScript + Vanilla DOM
- **Performance**: 60% faster panel rendering, no framework overhead
- **EditorManager**: Multi-tab editor with syntax highlighting
- **PubSub**: Event bus for cross-panel communication
- **i18n**: Multi-language support (PT-BR, EN, ES)

### v4.0 — Brain & Vector Search (Nov 2025)
- **Brain Engine**: TF-IDF vector index for codebase context
  - Automatic workspace indexing
  - Semantic search for prompt injection
  - Chunked indexing with tiktoken
- **Context Injection**: Relevant code automatically added to prompts

### v3.0 — Electron Desktop (Oct 2025)
- **Electron Shell**: Frameless window with custom titlebar
  - Backend lifecycle management (spawn/kill)
  - Handshake stabilization (health check polling)
  - Native file/folder dialogs
  - IPC keyboard shortcut forwarding
- **PyInstaller**: Backend bundled as standalone `.exe`
- **NSIS Installer**: One-click Windows installer

### v2.0 — Cloud AI & Streaming (Sep 2025)
- **Cloud Provider Support**: OpenAI, Anthropic, Groq, Google
- **SSE Streaming**: Token-by-token response display
- **Chat History**: SQLite-backed conversation persistence
- **Theme Engine**: Dynamic Catppuccin-based theming

### v1.0 — Initial Release (Aug 2025)
- Basic code editor with file tree
- Ollama integration for local AI chat
- Terminal emulator (xterm.js)
- Single-panel layout

---

## Planned Features

### Short Term
- [ ] Semantic memory recall via Brain vectors (replace keyword matching)
- [ ] Extension marketplace with community plugins
- [ ] Code completion (autocomplete) via Ollama
- [ ] Multi-file diff viewer for agent operations

### Medium Term
- [ ] Collaborative editing (WebSocket-based)
- [ ] Mobile companion app for viewing projects
- [ ] Plugin API for third-party integrations
- [ ] Integrated debugger (DAP protocol)

### Long Term
- [ ] macOS and Linux builds
- [ ] Self-hosted cloud deployment option
- [ ] Model fine-tuning on user codebase
- [ ] Voice commands via Whisper
