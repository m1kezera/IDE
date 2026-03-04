/**
 * Lumina IDE Frontend — API Service Layer
 */

const BASE = '/api';

// ─── Diagnostic Logger ──────────────────────────────────────────────
const _log = (label, ...args) => console.log(`%c[Lumina API] ${label}`, 'color: #7c3aed; font-weight: bold;', ...args);

// ─── Health Check (for diagnostics) ─────────────────────────────────
export const checkHealth = () =>
    fetch(`${BASE}/health`)
        .then(r => r.json())
        .then(data => { _log('✅ Health', data); return data; })
        .catch(err => { _log('❌ Health FAILED', err.message); throw err; });

// ─── Dashboard ──────────────────────────────────────────────────────
export const fetchDashboard = () =>
    fetch(`${BASE}/dashboard`).then((r) => r.json());

// ─── Terminal ───────────────────────────────────────────────────────
export const fetchTerminalLogs = (port) =>
    fetch(`${BASE}/terminal/logs/${port}`).then((r) => r.json());

// ─── Config ─────────────────────────────────────────────────────────
export const fetchConfig = () =>
    fetch(`${BASE}/config`).then((r) => r.json());

export const updateConfig = (config) =>
    fetch(`${BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    }).then((r) => r.json());

// ─── Extensions ─────────────────────────────────────────────────────
export const fetchExtensions = () =>
    fetch(`${BASE}/extensions/`).then((r) => r.json());

export const toggleExtension = (id) =>
    fetch(`${BASE}/extensions/${id}/toggle`, { method: 'POST' }).then((r) => r.json());

// ─── Ollama Models ──────────────────────────────────────────────────
export const fetchModels = () =>
    fetch(`${BASE}/models`).then((r) => r.json());


// ─── Chats ──────────────────────────────────────────────────────────
export const fetchChats = () =>
    fetch(`${BASE}/chats`).then((r) => r.json());

export const createChat = (uid, title = 'Novo Chat') =>
    fetch(`${BASE}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, title }),
    }).then((r) => r.json());

export const updateChat = (uid, data) =>
    fetch(`${BASE}/chats/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((r) => r.json());

export const deleteChat = (uid) =>
    fetch(`${BASE}/chats/${uid}`, { method: 'DELETE' }).then((r) => r.json());

export const fetchMessages = (uid) =>
    fetch(`${BASE}/chats/${uid}/messages`).then((r) => r.json());

export const addMessage = (uid, role, content, tokens = 0) =>
    fetch(`${BASE}/chats/${uid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, tokens }),
    }).then((r) => r.json());

// ─── Workspace / File System ────────────────────────────────────────
const WS = '/api/workspace';

export const getWorkspace = () =>
    fetch(`${WS}/current`).then((r) => r.json());

export const openFolder = (path) =>
    fetch(`${WS}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    }).then((r) => r.json());

export const browseFolder = () =>
    fetch(`${WS}/browse`).then((r) => r.json());

export const getFileTree = () =>
    fetch(`${WS}/tree`).then((r) => r.json());

export const readFile = (path) =>
    fetch(`${WS}/file?path=${encodeURIComponent(path)}`).then((r) => r.json());

export const writeFile = (path, content) =>
    fetch(`${WS}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
    }).then((r) => r.json());

// ─── Autocomplete ───────────────────────────────────────────────────
export const fetchAutocomplete = ({ code, cursorLine, cursorCol, filename, mode }) =>
    fetch(`${BASE}/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            cursor_line: cursorLine,
            cursor_col: cursorCol,
            filename,
            mode,
        }),
    }).then((r) => r.json())
        .then((data) => data.suggestion || '')
        .catch(() => '');

// ─── SSE Streaming ──────────────────────────────────────────────────
export function streamGenerate({ prompt, mode, model, format }, { onToken, onDone, onError, onFiles }) {
    const controller = new AbortController();

    fetch(`${BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, model, format, stream: true }),
        signal: controller.signal,
    })
        .then(async (res) => {
            if (!res.ok) {
                try {
                    const errBody = await res.json();
                    onError?.(new Error(errBody.detail || `HTTP ${res.status}`));
                } catch {
                    onError?.(new Error(`Erro HTTP ${res.status}: ${res.statusText}`));
                }
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let gotDone = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.error) {
                            onError?.(new Error(data.error));
                            gotDone = true;
                            return;
                        }
                        if (data.files) {
                            onFiles?.(data.files);
                            continue;
                        }
                        if (data.metrics) {
                            onDone?.(data.metrics);
                            gotDone = true;
                            continue;
                        }
                        if (data.token !== undefined) {
                            onToken?.(data.token);
                        }
                    } catch { /* skip malformed SSE */ }
                }
            }

            if (!gotDone) onDone?.({});
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                onError?.(new Error(
                    err.message === 'Failed to fetch'
                        ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8000.'
                        : err.message
                ));
            }
        });

    return () => controller.abort();
}
