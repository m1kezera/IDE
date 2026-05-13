# API Reference

> Lumina IDE Backend REST API — `http://127.0.0.1:8001/api/`

All endpoints are prefixed with `/api` by the FastAPI router.

---

## Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Backend health check |
| `GET` | `/models` | List available Ollama models |
| `GET` | `/dashboard` | Main dashboard stats |

---

## AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate` | Main AI generation (SSE streaming) |
| `POST` | `/confirm_changes` | Confirm agent file operations |
| `POST` | `/autocomplete` | Code completion predictions |

**Request Body** (`GenerateRequest`):
```json
{
  "prompt": "string",
  "mode": "local | cloud",
  "model": "string (optional)",
  "stream": true,
  "history": [{"role": "user|assistant", "content": "..."}],
  "strict_library_mode": false,
  "thinking_mode": false
}
```

**SSE Response** (streaming):
```
data: {"token": "Hello", "done": false}
data: {"token": " world", "done": false}
data: {"token": "", "done": true}
```

---

## Workspace & Files

**From `router.py`** (main router):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/workspace/check` | Get workspace status and file tree |
| `POST` | `/workspace/create-file` | Create a new file |
| `POST` | `/workspace/create-folder` | Create a new folder |
| `POST` | `/workspace/rename` | Rename a file or folder |
| `POST` | `/workspace/move` | Move a file or folder |
| `DELETE` | `/workspace/file` | Delete a file |

**From `workspace.py`** (workspace router):

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workspace/current` | Get current workspace path |
| `POST` | `/workspace/open` | Open/set workspace directory |
| `GET` | `/workspace/browse` | Native folder browser dialog |
| `GET` | `/workspace/tree` | Get full file tree structure |
| `GET` | `/workspace/file?path=...` | Read file content |
| `PUT` | `/workspace/file` | Write/update file content |

---

## Chat Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats` | List all chat sessions |
| `POST` | `/chats` | Create new chat session |
| `GET` | `/chats/{uid}/messages` | Get chat messages by session |
| `DELETE` | `/chats/{uid}` | Delete a chat session |
| `PUT` | `/chats/{uid}` | Update chat session (title, model) |

---

## Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/library/upload` | Upload a document (PDF/DOCX/MD/TXT) |
| `GET` | `/library/list` | List all documents and folders |
| `POST` | `/library/search` | Vector search within library docs |
| `POST` | `/library/folder` | Create a new folder |
| `DELETE` | `/library/folder/{folder_name}` | Delete a folder |
| `PUT` | `/library/folder/rename` | Rename a folder |
| `PUT` | `/library/document/move` | Move doc to a folder |
| `DELETE` | `/library/document/{doc_name}` | Delete a document |

### Personality Prompt

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/library/personality` | Get current personality prompt |
| `POST` | `/library/personality` | Upload personality from .txt file |
| `PUT` | `/library/personality/text` | Set personality from inline text |
| `DELETE` | `/library/personality` | Clear personality prompt |

---

## Memory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/memories` | List all agent memories |
| `POST` | `/memories` | Create a memory manually |
| `DELETE` | `/memories/{memory_id}` | Delete a specific memory |

**Create Memory Body**:
```json
{
  "type": "user | feedback | project | reference",
  "content": "string"
}
```

---

## Git

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/git/status` | Git status for workspace |
| `GET` | `/git/log` | Git log (recent commits) |
| `GET` | `/git/diff` | Diff of staged/unstaged changes |
| `POST` | `/git/commit` | Commit staged changes |
| `POST` | `/git/branch` | Create or switch branch |
| `POST` | `/git/checkout` | Checkout branch |
| `POST` | `/git/push` | Push to remote |
| `POST` | `/git/pull` | Pull from remote |
| `POST` | `/git/init` | Initialize git repo in workspace |

---

## Ollama Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/ollama/models` | List installed Ollama models |
| `GET` | `/ollama/available` | List available models to download |
| `POST` | `/ollama/pull` | Pull/download a model |
| `POST` | `/ollama/delete` | Delete a model |
| `GET` | `/ollama/ps` | List running models |
| `POST` | `/ollama/unload` | Unload a model from memory |
| `GET` | `/ollama/sysinfo` | System info (GPU, RAM) |
| `GET` | `/ollama/probe` | Probe Ollama connectivity |

---

## Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/config` | Get current configuration |
| `POST` | `/config` | Save configuration changes |

---

## Identity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/identity/check` | Check HWID identity registration |
| `POST` | `/identity/register` | Register new identity |

---

## Preview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/preview/{file_path}` | Serve file for live preview |
| `GET` | `/preview/folders` | List previewable folders |
| `POST` | `/preview/dev-server` | Start dev server for preview |
| `GET` | `/preview/qr` | Generate QR code for mobile preview |

---

## Brain (Vector Search)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/brain/status` | Index stats (files, chunks) |

> Brain indexing is triggered automatically on workspace change. Search is internal — used by the AI generation pipeline to inject relevant context.

---

## Swarm Mesh

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mesh/status` | Mesh cluster status |
| `GET` | `/mesh/nodes` | List mesh nodes |
| `GET` | `/mesh/config` | Get mesh configuration |
| `POST` | `/mesh/ping` | Ping all mesh nodes |
| `POST` | `/mesh/ping-node` | Ping specific node |

---

## Shield & Security

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sentinel/status` | Security sentinel status |
| `GET` | `/shield/report` | Security scan report |
| `GET` | `/shield/blacklist` | List blacklisted items |
| `POST` | `/shield/blacklist` | Add to blacklist |
| `DELETE` | `/shield/blacklist/{name}` | Remove from blacklist |

---

## Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/skills` | List agent skills |
| `GET` | `/permissions` | Get user permissions |
| `POST` | `/frontend-log` | Forward frontend logs to backend |
| `GET` | `/system/logs` | Get system logs |
| `POST` | `/predict/next-steps` | Get AI-predicted next steps |

---

## WebSocket Endpoints

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WebSocket` | `/ws/watcher` | File system change notifications |
| `WebSocket` | `/ws/terminal/{port}` | Interactive PTY terminal I/O |

> Terminal logs can also be fetched via `GET /terminal/logs/{port}`.

---

## Canvas (Design Studio)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/canvas/upload-image` | Upload image to canvas |
| `GET` | `/canvas/images/{filename}` | Serve canvas image |

---

## Edge Runtime

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/edge/start` | Start edge function sandbox |
| `DELETE` | `/edge/stop/{sandbox_id}` | Stop edge function sandbox |
| `GET` | `/edge/preview/{sandbox_id}/{file_path}` | Preview edge function output |

---

## Extensions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/extensions/` | List all extensions |
| `GET` | `/extensions/path` | Get extensions directory path |
| `POST` | `/extensions/{extension_id}/toggle` | Enable/disable an extension |

---

## Setup Manager

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/setup/status` | Setup wizard status |
| `POST` | `/setup/install` | Run setup installation |
| `GET` | `/setup/motor/status` | Ollama motor status |
| `POST` | `/setup/motor/toggle` | Start/stop Ollama motor |
| `GET` | `/setup/models/list` | List available models for setup |
| `DELETE` | `/setup/models/{name}` | Remove a model |
| `POST` | `/setup/pull` | Pull a model during setup |
