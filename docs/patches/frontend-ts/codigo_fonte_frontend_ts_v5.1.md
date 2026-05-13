# 📄 Lumina IDE v5.1 — Project Y (Frontend-TS)

Este documento contém o código-fonte integral da refatoração Vanilla TypeScript (v5.1).

## 📂 Estrutura de Arquivos

- [index.html](#indexhtml)
- [package.json](#packagejson)
- [postcss.config.js](#postcssconfigjs)
- [src\api\client.ts](#srcapiclientts)
- [src\core\EditorManager.ts](#srccoreEditorManagerts)
- [src\core\PubSub.ts](#srccorePubSubts)
- [src\core\TerminalManager.ts](#srccoreTerminalManagerts)
- [src\main.ts](#srcmaints)
- [src\style.css](#srcstylecss)
- [src\ui\AgentPanel.ts](#srcuiAgentPanelts)
- [src\ui\Modals.ts](#srcuiModalsts)
- [src\ui\SettingsPanel.ts](#srcuiSettingsPanelts)
- [src\ui\Sidebar.ts](#srcuiSidebarts)
- [src\ui\Telemetry.ts](#srcuiTelemetryts)
- [tailwind.config.js](#tailwindconfigjs)
- [tsconfig.json](#tsconfigjson)
- [vite.config.ts](#viteconfigts)

---

## index.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lumina IDE v5.0</title>
  <meta name="description" content="Lumina IDE — Cockpit Intelligence & Future Processing" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- BOOT SCREEN (Handshake seguro com o backend)                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div id="projecty-boot-screen" style="display:flex; flex-direction:column; height:100vh; width:100vw; background:var(--bg-base,#0d0f18); align-items:center; justify-content:center; color:var(--text,#e0e0e0); font-family:'Inter',sans-serif;">
  <div class="loading-spinner" style="width:40px;height:40px;margin-bottom:20px;"></div>
  <h2 style="font-weight:600;letter-spacing:2px;color:var(--text,#e0e0e0);">AQUECENDO MOTORES DA IA</h2>
  <p style="color:var(--text-muted,#888);font-size:12px;margin-top:8px;">Estabelecendo handshake seguro com a API local...</p>
</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- IDE LAYOUT (CSS Grid — hidden until boot completes)            -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<div id="projecty-ide" class="ide-layout" style="display:none;">

  <!-- ─── Telemetry Bar (top) ──────────────────────────── -->
  <header id="projecty-telemetry-bar" class="telemetry-bar">
    <div class="telemetry-left">
      <span class="telemetry-brand">✦ LUMINA IDE</span>
      <span class="telemetry-separator">|</span>
      <span id="projecty-mode-indicator" class="telemetry-value">LOCAL</span>
    </div>
    <div class="telemetry-right">
      <span class="telemetry-label">Motor:</span>
      <span id="projecty-motor-status" class="telemetry-value">🔴 Offline</span>
      <span class="telemetry-separator">|</span>
      <span class="telemetry-label">Brain:</span>
      <span id="projecty-brain-status" class="telemetry-value">🔴 Offline</span>
      <span class="telemetry-separator">|</span>
      <span class="telemetry-label">Sentinel:</span>
      <span id="projecty-sentinel-indicator" class="telemetry-value">🟢 Seguro</span>
    </div>
  </header>

  <!-- ─── Activity Bar (far left icons) ────────────────── -->
  <nav id="projecty-activity-bar" class="activity-bar">
    <button class="activity-btn active" data-panel="explorer" title="Explorer (Ctrl+Shift+E)">📁</button>
    <button class="activity-btn" data-panel="ai" title="Agent Context">🤖</button>
    <button class="activity-btn" data-panel="telemetry" title="Telemetria">📊</button>
    <button class="activity-btn" data-panel="swarm" title="Swarm Mesh">🕸️</button>
    <button class="activity-btn" data-panel="extensions" title="Extensões">🧩</button>
    <button class="activity-btn" data-panel="library" title="Biblioteca">📚</button>
    <div style="flex:1;"></div>
    <button class="activity-btn" data-panel="settings" title="Configurações (Ctrl+,)">⚙️</button>
  </nav>

  <!-- ─── Sidebar ──────────────────────────────────────── -->
  <aside id="projecty-sidebar" class="side-panel glass-panel">
    <!-- Explorer Panel -->
    <div id="projecty-panel-explorer" class="sidebar-panel-content">
      <div class="panel-header">
        EXPLORER
        <button id="projecty-browse-btn" class="panel-action-btn" title="Abrir Pasta">📂</button>
      </div>
      <div id="projecty-explorer-tree" class="explorer-tree"></div>
    </div>
    <!-- AI Context Panel -->
    <div id="projecty-panel-ai" class="sidebar-panel-content hidden">
      <div class="panel-header">AGENT — CONTEXTO & PROMPTS</div>
      <div style="padding:8px 12px;">
        <p class="panel-hint" style="font-size:11px;">Painel de contexto do Agent (em construção).</p>
      </div>
    </div>
    <!-- Telemetry Panel -->
    <div id="projecty-panel-telemetry" class="sidebar-panel-content hidden">
      <div class="panel-header">TELEMETRIA</div>
      <div style="padding:8px 12px; display:flex; flex-direction:column; gap:8px;">
        <div class="telemetry-card">
          <div class="telemetry-row"><span class="telemetry-label">Tokens Processados</span><span id="projecty-total-tokens" class="telemetry-value" style="color:var(--accent);">0</span></div>
          <div class="telemetry-row"><span class="telemetry-label">Custo Nuvem Estimado</span><span id="projecty-cloud-cost" class="telemetry-value" style="color:var(--accent-red);">$0.0000</span></div>
          <div class="telemetry-row"><span class="telemetry-label">Custo Local (Lumina)</span><span id="projecty-local-cost" class="telemetry-value" style="color:var(--accent-green);">$0.0000</span></div>
          <div class="telemetry-row" style="border-top:1px dashed var(--border);padding-top:6px;"><span class="telemetry-label">Economia Total</span><span id="projecty-savings" class="telemetry-value" style="color:var(--accent-green);font-weight:700;">$0.0000</span></div>
          <div class="telemetry-row"><span class="telemetry-label">Latência Nervo Óptico</span><span id="projecty-brain-latency" class="telemetry-value" style="color:var(--projecty-blue);">0ms</span></div>
        </div>
      </div>
    </div>
    <!-- Swarm Panel -->
    <div id="projecty-panel-swarm" class="sidebar-panel-content hidden">
      <div class="panel-header">SWARM MESH</div>
      <div style="padding:8px 12px;"><p class="panel-hint" style="font-size:11px;">Rede Mesh (em construção).</p></div>
    </div>
    <!-- Extensions Panel -->
    <div id="projecty-panel-extensions" class="sidebar-panel-content hidden">
      <div class="panel-header">EXTENSÕES</div>
      <div style="padding:8px 12px;"><p class="panel-hint" style="font-size:11px;">Extensões (em construção).</p></div>
    </div>
    <!-- Library Panel -->
    <div id="projecty-panel-library" class="sidebar-panel-content hidden">
      <div class="panel-header">BIBLIOTECA</div>
      <div style="padding:8px 12px;"><p class="panel-hint" style="font-size:11px;">Biblioteca (em construção).</p></div>
    </div>
    <!-- Settings Panel -->
    <div id="projecty-panel-settings" class="sidebar-panel-content hidden">
      <div class="panel-header">CONFIGURAÇÕES</div>
      <div style="padding:8px 12px;"><p class="panel-hint" style="font-size:11px;">Carregando...</p></div>
    </div>
  </aside>

  <!-- ─── Main Editor + Terminal Area ──────────────────── -->
  <div id="projecty-main-area" class="main-area">

    <!-- Editor Zone -->
    <div id="projecty-editor-zone" class="editor-zone">
      <div id="projecty-tab-bar" class="tab-bar">
        <!-- Tabs injected dynamically -->
      </div>
      <div id="projecty-editor-content" class="editor-content">
        <!-- Welcome Screen -->
        <div id="projecty-welcome" class="welcome-screen">
          <div class="welcome-aura"></div>
          <h1 class="welcome-title neon-blue">Lumina IDE</h1>
          <p class="welcome-sub">Cockpit Intelligence • Future Processing</p>
          <div class="welcome-actions">
            <div class="welcome-shortcut"><kbd>Ctrl+Shift+E</kbd><span>Abrir Explorer</span></div>
            <div class="welcome-shortcut"><kbd>Ctrl+`</kbd><span>Painel do Agent</span></div>
            <div class="welcome-shortcut"><kbd>Ctrl+B</kbd><span>Toggle Sidebar</span></div>
            <div class="welcome-shortcut"><kbd>Ctrl+,</kbd><span>Configurações</span></div>
            <div class="welcome-shortcut"><kbd>Ctrl+W</kbd><span>Fechar aba</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resize Handle -->
    <div id="projecty-resize-h" class="resizer-v" style="height:4px;cursor:row-resize;background:var(--border);"></div>

    <!-- Terminal Zone (IMMORTAL — never destroyed) -->
    <div id="projecty-terminal-zone" class="terminal-zone">
      <div class="terminal-tabs">
        <span class="terminal-tab active">Terminal</span>
      </div>
      <div id="projecty-terminal-container" class="terminal-container"></div>
    </div>

  </div>

  <!-- ─── Status Bar (bottom) ──────────────────────────── -->
  <footer id="projecty-statusbar" class="status-bar">
    <div class="status-left">
      <span id="projecty-workspace-name" class="status-item">Sem Projeto</span>
    </div>
    <div class="status-right">
      <span id="projecty-user-name" class="status-item">▸ Anônimo</span>
      <span class="status-separator">|</span>
      <span id="projecty-token-count" class="status-item">0 tokens</span>
    </div>
  </footer>

</div>

<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- MODAL LAYER (Identity Lock + Sentinel Panic)                   -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<!-- Identity Modal -->
<div id="projecty-identity-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center; font-family:'Inter',sans-serif;">
  <div style="background:var(--bg-surface,#1a1c2e); border:1px solid var(--border,#2a2d42); border-radius:12px; padding:32px; max-width:400px; width:90%; text-align:center;">
    <h2 style="color:var(--text,#e0e0e0); font-size:18px; margin-bottom:8px;">🔐 Lumina Identity Lock</h2>
    <p style="color:var(--text-muted,#888); font-size:12px; margin-bottom:20px;">Registre seu nome para blindar esta instância ao seu hardware.</p>
    <form id="projecty-identity-form" style="display:flex; gap:8px;">
      <input id="projecty-identity-input" type="text" placeholder="Seu nome de usuário" required
        style="flex:1; background:var(--bg-overlay,#12141f); border:1px solid var(--border,#2a2d42); border-radius:6px; padding:8px 12px; color:var(--text,#e0e0e0); font-size:13px; outline:none;" />
      <button type="submit" style="background:var(--accent,#7c3aed); color:white; border:none; border-radius:6px; padding:8px 16px; font-weight:600; cursor:pointer;">Registrar</button>
    </form>
  </div>
</div>

<!-- Sentinel Panic Overlay -->
<div id="projecty-panic-overlay" style="display:none; position:fixed; inset:0; background:rgba(255,0,0,0.15); backdrop-filter:blur(4px); z-index:9998; align-items:center; justify-content:center; font-family:'Inter',sans-serif;">
  <div style="background:#1a0000; border:2px solid #ff3333; border-radius:12px; padding:32px; max-width:500px; text-align:center;">
    <h2 style="color:#ff3333; font-size:20px; margin-bottom:8px;">🛡️ ALERTA DE SEGURANÇA</h2>
    <p id="projecty-panic-reason" style="color:#ffaaaa; font-size:13px; margin-bottom:20px;">Intrusão detectada</p>
    <button id="projecty-panic-dismiss" style="background:#ff3333; color:white; border:none; border-radius:6px; padding:8px 20px; font-weight:600; cursor:pointer;">Entendido</button>
  </div>
</div>

<!-- Entry Point -->
<script type="module" src="/src/main.ts"></script>
</body>
</html>

```

## package.json
```json
{
  "name": "frontend-ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.27",
    "postcss": "^8.5.8",
    "tailwindcss": "^3.4.19",
    "typescript": "~5.9.3",
    "vite": "^8.0.0"
  },
  "dependencies": {
    "@xterm/addon-fit": "^0.11.0",
    "@xterm/addon-web-links": "^0.12.0",
    "xterm": "^5.3.0"
  }
}

```

## postcss.config.js
```text
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```

## src\api\client.ts
```typescript
/**
 * Project Y — Typed API Client (v5.0)
 * All backend communication goes through this module.
 * No React. No frameworks. Pure fetch + TypeScript interfaces.
 */

// ─── Host Detection ──────────────────────────────────────────────
const isElectron = window.location.protocol === 'file:';
const BASE_HOST = isElectron ? 'http://127.0.0.1:8001' : '';
const BASE = `${BASE_HOST}/api`;
const WS_BASE = `${BASE_HOST}/api/workspace`;

// ─── Interfaces ──────────────────────────────────────────────────
export interface HealthResponse {
  status: string;
  service: string;
}

export interface IdentityStatus {
  is_registered: boolean;
  user_name: string;
  hwid?: string;
}

export interface BrainStatus {
  is_ready: boolean;
  last_pulse: number;
  analysis_latency_ms: number;
  status?: string;
}

export interface SentinelStatus {
  is_active: boolean;
  panic_triggered: boolean;
  reason?: string;
}

export interface MotorStatusResponse {
  status: string; // 'offline' | 'starting' | 'ready'
}

export interface DashboardData {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  recent_calls: Array<{ model: string; tokens: number }>;
}

export interface ConfigData {
  selected_model?: string;
  ollama_host?: string;
  ollama_port?: number;
  [key: string]: unknown;
}

export interface FileTreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileTreeNode[];
}

export interface WorkspaceInfo {
  path: string;
  name: string;
}

export interface FileData {
  path: string;
  content: string;
  name: string;
  ext: string;
}

export interface MeshNode {
  ip: string;
  port: number;
  hostname: string;
  vram_free_gb: number;
  is_cortex: boolean;
}

export interface MeshNodesResponse {
  nodes: MeshNode[];
  count: number;
}

export interface MeshStatus {
  vram_free_gb: number;
  is_cortex: boolean;
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onDone?: (metrics: Record<string, unknown>) => void;
  onError?: (err: Error) => void;
  onFiles?: (files: Array<{ path: string; status: string; content?: string }>) => void;
  onPendingConfirmation?: (id: string, blocks: unknown[]) => void;
}

export interface PullCallbacks {
  onToken?: (status: string) => void;
  onDone?: (data: Record<string, unknown>) => void;
  onError?: (err: Error) => void;
}

// ─── Logger ──────────────────────────────────────────────────────
const _log = (label: string, ...args: unknown[]): void =>
  console.log(`%c[Project Y API] ${label}`, 'color: #7c3aed; font-weight: bold;', ...args);

// ─── Helper ──────────────────────────────────────────────────────
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  return res.json() as Promise<T>;
}

// ─── Health ──────────────────────────────────────────────────────
export async function checkHealth(retries = 5, delay = 1000): Promise<HealthResponse> {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await fetchJSON<HealthResponse>(`${BASE}/health`);
      _log('✅ Health', data);
      return data;
    } catch (err) {
      _log(`⚠️ Health Attempt ${i + 1} failed`);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Health check failed after all retries');
}

// ─── Identity ────────────────────────────────────────────────────
export async function checkIdentityStatus(): Promise<IdentityStatus> {
  const res = await fetch(`${BASE}/identity/check`);
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  return res.json();
}

export function registerIdentity(userName: string): Promise<IdentityStatus> {
  return fetchJSON<IdentityStatus>(`${BASE}/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName }),
  });
}

// ─── Dashboard & Telemetry ───────────────────────────────────────
export const fetchDashboard = (): Promise<DashboardData> =>
  fetchJSON<DashboardData>(`${BASE}/dashboard`);

export const fetchBrainStatus = (): Promise<BrainStatus> =>
  fetchJSON<BrainStatus>(`${BASE}/brain/status`).catch(() => ({
    is_ready: false, last_pulse: 0, analysis_latency_ms: 0,
  }));

export const fetchSentinelStatus = (): Promise<SentinelStatus> =>
  fetchJSON<SentinelStatus>(`${BASE}/sentinel/status`).catch(() => ({
    is_active: false, panic_triggered: false,
  }));

export const fetchMotorStatus = (): Promise<MotorStatusResponse> =>
  fetchJSON<MotorStatusResponse>(`${BASE}/setup/motor/status`).catch(() => ({ status: 'offline' }));

export const toggleMotor = (): Promise<unknown> =>
  fetchJSON(`${BASE}/setup/motor/toggle`, { method: 'POST' });

// ─── Config ──────────────────────────────────────────────────────
export const fetchConfig = (): Promise<ConfigData> =>
  fetchJSON<ConfigData>(`${BASE}/config`);

export function updateConfig(config: Partial<ConfigData>): Promise<ConfigData> {
  return fetchJSON<ConfigData>(`${BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

// ─── Workspace / File System ─────────────────────────────────────
export const getWorkspace = (): Promise<WorkspaceInfo> =>
  fetchJSON<WorkspaceInfo>(`${WS_BASE}/current`);

export const browseFolder = (): Promise<{ path: string }> =>
  fetchJSON<{ path: string }>(`${WS_BASE}/browse`);

export function openFolder(path: string): Promise<{ status: string }> {
  return fetchJSON(`${WS_BASE}/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  });
}

export const getFileTree = (): Promise<FileTreeNode[]> =>
  fetchJSON<FileTreeNode[]>(`${WS_BASE}/tree`);

export const readFile = (path: string): Promise<FileData> =>
  fetchJSON<FileData>(`${WS_BASE}/file?path=${encodeURIComponent(path)}`);

export function writeFile(path: string, content: string): Promise<{ status: string }> {
  return fetchJSON(`${WS_BASE}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
}

// ─── Autocomplete ────────────────────────────────────────────────
export interface AutocompleteParams {
  code: string;
  cursorLine: number;
  cursorCol: number;
  filename: string;
  mode: string;
}

export function fetchAutocomplete(params: AutocompleteParams): Promise<{ suggestion: string; used_brain: boolean }> {
  return fetchJSON<{ suggestion: string; used_brain: boolean }>(`${BASE}/autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: params.code,
      cursor_line: params.cursorLine,
      cursor_col: params.cursorCol,
      filename: params.filename,
      mode: params.mode,
    }),
  }).catch(() => ({ suggestion: '', used_brain: false }));
}

// ─── Models ──────────────────────────────────────────────────────
export const fetchModels = (): Promise<{ models: Array<{ name: string; size: number }> }> =>
  fetchJSON(`${BASE}/models`);

export const fetchModelCatalog = (): Promise<{ installed: unknown[]; catalog: unknown[] }> =>
  fetchJSON<{ installed: unknown[]; catalog: unknown[] }>(`${BASE}/setup/models/list`).catch(() => ({ installed: [], catalog: [] }));

export const deleteModel = (name: string): Promise<unknown> =>
  fetchJSON(`${BASE}/setup/models/${encodeURIComponent(name)}`, { method: 'DELETE' });

// ─── Mesh (Swarm) ────────────────────────────────────────────────
export const fetchMeshStatus = (): Promise<MeshStatus> =>
  fetchJSON<MeshStatus>(`${BASE}/mesh/status`).catch(() => ({ vram_free_gb: 0, is_cortex: false }));

export const fetchMeshNodes = (): Promise<MeshNodesResponse> =>
  fetchJSON<MeshNodesResponse>(`${BASE}/mesh/nodes`).catch(() => ({ nodes: [], count: 0 }));

// ─── Extensions ──────────────────────────────────────────────────
export const fetchExtensions = (): Promise<unknown[]> =>
  fetchJSON(`${BASE}/extensions/`);

export const toggleExtension = (id: string): Promise<unknown> =>
  fetchJSON(`${BASE}/extensions/${id}/toggle`, { method: 'POST' });

// ─── Library ─────────────────────────────────────────────────────
export const fetchLibraryList = (): Promise<{ documents: unknown[] }> =>
  fetchJSON<{ documents: unknown[] }>(`${BASE}/library/list`).catch(() => ({ documents: [] }));

// ─── Chats ───────────────────────────────────────────────────────
export const fetchChats = (): Promise<unknown[]> =>
  fetchJSON(`${BASE}/chats`);

export function createChat(uid: string, title = 'Novo Chat'): Promise<unknown> {
  return fetchJSON(`${BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, title }),
  });
}

export const fetchMessages = (uid: string): Promise<unknown[]> =>
  fetchJSON(`${BASE}/chats/${uid}/messages`);

// ─── SSE Streaming (Agent Generate) ─────────────────────────────
export function streamGenerate(
  params: { prompt: string; mode: string; model?: string; format?: string },
  callbacks: StreamCallbacks
): () => void {
  const controller = new AbortController();

  fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, stream: true }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        try {
          const errBody = await res.json();
          callbacks.onError?.(new Error((errBody as Record<string, string>).detail || `HTTP ${res.status}`));
        } catch {
          callbacks.onError?.(new Error(`HTTP Error ${res.status}`));
        }
        return;
      }

      const reader = res.body!.getReader();
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
            const data = JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
            if (data.error) { callbacks.onError?.(new Error(data.error as string)); gotDone = true; return; }
            if (data.files) { callbacks.onFiles?.(data.files as Array<{ path: string; status: string }>); continue; }
            if (data.pending_confirmation) { callbacks.onPendingConfirmation?.(data.pending_confirmation as string, data.blocks as unknown[]); continue; }
            if (data.metrics) { callbacks.onDone?.(data.metrics as Record<string, unknown>); gotDone = true; continue; }
            if (data.token !== undefined) { callbacks.onToken?.(data.token as string); }
          } catch { /* skip malformed SSE */ }
        }
      }
      if (!gotDone) callbacks.onDone?.({});
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') {
        callbacks.onError?.(new Error(
          err.message === 'Failed to fetch'
            ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8001.'
            : err.message
        ));
      }
    });

  return () => controller.abort();
}

// ─── SSE Streaming (Model Pull) ──────────────────────────────────
export function streamPullModel(
  params: { model: string },
  callbacks: PullCallbacks
): () => void {
  const controller = new AbortController();

  fetch(`${BASE}/setup/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
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
            const data = JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
            if (data.error) callbacks.onError?.(new Error(data.error as string));
            else if (data.done) callbacks.onDone?.(data as Record<string, unknown>);
            else if (data.status) callbacks.onToken?.(data.status as string);
          } catch { /* skip */ }
        }
      }
      callbacks.onDone?.({});
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') callbacks.onError?.(err);
    });

  return () => controller.abort();
}

```

## src\core\EditorManager.ts
```typescript
/**
 * Project Y — Editor Manager (v5.0)
 * Vanilla TS file editor with tab management, Ctrl+S save, and line numbers.
 * Listens to PubSub 'file:select' events from the Sidebar.
 */

import { readFile, writeFile } from '../api/client';
import { PubSub } from '../core/PubSub';

interface OpenTab {
  path: string;
  name: string;
  ext: string;
  content: string;
  modified: boolean;
}

let openTabs: OpenTab[] = [];
let activeTabPath: string | null = null;

let tabBarEl: HTMLElement;
let editorContentEl: HTMLElement;
let welcomeEl: HTMLElement;

export function initEditor(): void {
  tabBarEl = document.getElementById('projecty-tab-bar') as HTMLElement;
  editorContentEl = document.getElementById('projecty-editor-content') as HTMLElement;
  welcomeEl = document.getElementById('projecty-welcome') as HTMLElement;

  // Listen for file selections from Explorer
  PubSub.on('file:select', (data) => {
    const file = data as { path: string; name: string; ext: string };
    openFile(file.path, file.name, file.ext);
  });

  // Ctrl+S → Save active file
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveActiveFile();
    }
    // Ctrl+W → Close active tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (activeTabPath) closeTab(activeTabPath);
    }
  });
}

async function openFile(path: string, name: string, ext: string): Promise<void> {
  // Check if already open
  const existing = openTabs.find((t) => t.path === path);
  if (existing) {
    activateTab(path);
    return;
  }

  try {
    const fileData = await readFile(path);
    const tab: OpenTab = {
      path,
      name,
      ext,
      content: fileData.content || '',
      modified: false,
    };
    openTabs.push(tab);
    activateTab(path);
  } catch (err) {
    console.error('[EditorManager] Failed to read file:', err);
  }
}

function activateTab(path: string): void {
  activeTabPath = path;
  renderTabBar();
  renderEditor();
}

function closeTab(path: string): void {
  openTabs = openTabs.filter((t) => t.path !== path);
  if (activeTabPath === path) {
    activeTabPath = openTabs.length > 0 ? openTabs[openTabs.length - 1].path : null;
  }
  renderTabBar();
  renderEditor();
}

function renderTabBar(): void {
  tabBarEl.innerHTML = '';
  for (const tab of openTabs) {
    const tabEl = document.createElement('div');
    tabEl.className = `tab${tab.path === activeTabPath ? ' active' : ''}`;
    tabEl.innerHTML = `
      <span class="tab-icon">${getFileIcon(tab.ext)}</span>
      <span class="tab-label">${tab.name}</span>
      ${tab.modified ? '<span class="tab-dot">●</span>' : ''}
      <button class="tab-close-btn">✕</button>
    `;

    tabEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('tab-close-btn')) {
        closeTab(tab.path);
      } else {
        activateTab(tab.path);
      }
    });

    tabBarEl.appendChild(tabEl);
  }
}

function renderEditor(): void {
  // Remove any existing editor (but never the welcome screen node itself)
  const existingEditor = editorContentEl.querySelector('.file-editor');
  if (existingEditor) existingEditor.remove();

  if (!activeTabPath) {
    welcomeEl.style.display = 'flex';
    return;
  }

  welcomeEl.style.display = 'none';
  const tab = openTabs.find((t) => t.path === activeTabPath);
  if (!tab) return;

  const editorEl = document.createElement('div');
  editorEl.className = 'file-editor';

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  toolbar.innerHTML = `
    <div class="editor-toolbar-left">
      <span class="editor-filename">${tab.name}</span>
      <span class="editor-lang">${tab.ext.toUpperCase()}</span>
    </div>
    <div class="editor-toolbar-right">
      <span id="projecty-save-indicator" class="save-indicator"></span>
      <button class="editor-save-btn" title="Salvar (Ctrl+S)">💾</button>
    </div>
  `;

  // Code area with line numbers
  const codeArea = document.createElement('div');
  codeArea.className = 'code-area';

  const lineNumbers = document.createElement('div');
  lineNumbers.className = 'line-numbers';
  lineNumbers.id = 'projecty-line-numbers';

  const textarea = document.createElement('textarea');
  textarea.className = 'code-textarea';
  textarea.value = tab.content;
  textarea.spellcheck = false;
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');

  // Update line numbers
  const updateLineNumbers = (): void => {
    const lines = textarea.value.split('\n');
    lineNumbers.innerHTML = lines
      .map((_, i) => `<div class="line-num">${i + 1}</div>`)
      .join('');
  };

  textarea.addEventListener('input', () => {
    tab.content = textarea.value;
    tab.modified = true;
    updateLineNumbers();
    renderTabBar(); // refresh dot indicator
  });

  // Sync scroll
  textarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = textarea.scrollTop;
  });

  // Tab key support
  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 4;
      tab.content = textarea.value;
      tab.modified = true;
      updateLineNumbers();
    }
  });

  codeArea.appendChild(lineNumbers);
  codeArea.appendChild(textarea);
  editorEl.appendChild(toolbar);
  editorEl.appendChild(codeArea);
  editorContentEl.appendChild(editorEl);

  // Save button
  const saveBtn = toolbar.querySelector('.editor-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveActiveFile);
  }

  updateLineNumbers();
  textarea.focus();
}

async function saveActiveFile(): Promise<void> {
  if (!activeTabPath) return;
  const tab = openTabs.find((t) => t.path === activeTabPath);
  if (!tab) return;

  const indicator = document.getElementById('projecty-save-indicator');
  if (indicator) { indicator.textContent = 'Salvando...'; indicator.className = 'save-indicator saving'; }

  try {
    await writeFile(tab.path, tab.content);
    tab.modified = false;
    renderTabBar();
    if (indicator) { indicator.textContent = '✓ Salvo'; indicator.className = 'save-indicator saved'; }
    setTimeout(() => { if (indicator) indicator.textContent = ''; }, 2000);
  } catch (err) {
    console.error('[EditorManager] Save failed:', err);
    if (indicator) { indicator.textContent = '✗ Erro'; indicator.className = 'save-indicator error'; }
  }
}

function getFileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️', py: '🐍',
    css: '🎨', html: '🌐', json: '📋', md: '📝', txt: '📄',
  };
  return icons[ext] || '📄';
}

```

## src\core\PubSub.ts
```typescript
/**
 * Project Y — Global Event Bus (PubSub)
 * Isolates UI modules from each other via a publish/subscribe pattern.
 */

type Handler = (data?: unknown) => void;

class PubSubBus {
  private listeners: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (e) {
        console.error(`[PubSub] Error in handler for "${event}":`, e);
      }
    });
  }
}

export const PubSub = new PubSubBus();

```

## src\core\TerminalManager.ts
```typescript
/**
 * Project Y — Terminal Manager (v5.0 — PTY Real)
 * Bidirectional xterm.js ↔ WebSocket ↔ pywinpty tunnel.
 * Sends resize payload on connect to wake the PowerShell prompt.
 * The terminal DOM node is NEVER destroyed.
 */

import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const WS_HOST = window.location.hostname || '127.0.0.1';
const WS_PORT = '8001';

export class TerminalManager {
  private term: Terminal;
  private fitAddon: FitAddon;
  private ws: WebSocket | null = null;
  private container: HTMLDivElement;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 16000;
  private mounted = false;

  constructor(containerId: string) {
    const el = document.getElementById(containerId) as HTMLDivElement | null;
    if (!el) throw new Error(`[TerminalManager] Container #${containerId} not found in DOM`);
    this.container = el;

    this.term = new Terminal({
      theme: {
        background: 'transparent',
        foreground: '#d4d4d4',
        cursor: '#00f2fe',
        selectionBackground: '#264f7844',
        black: '#1e1e2e',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#cdd6f4',
      },
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
  }

  mount(): void {
    if (this.mounted) return;
    this.term.open(this.container);
    this.mounted = true;

    requestAnimationFrame(() => this.fitAddon.fit());

    // ResizeObserver: fit terminal AND send new dimensions to backend
    const ro = new ResizeObserver(() => {
      try {
        this.fitAddon.fit();
        this.sendResize();
      } catch { /* ignore */ }
    });
    ro.observe(this.container);

    // Bidirectional: user keystrokes → WebSocket → PTY
    this.term.onData((data: string) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      }
    });

    this.connect();
  }

  /** Send current terminal dimensions to the backend PTY */
  private sendResize(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const dims = this.fitAddon.proposeDimensions();
      if (dims) {
        this.ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        }));
      }
    }
  }

  private connect(): void {
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
    }

    const wsUrl = `ws://${WS_HOST}:${WS_PORT}/api/ws/terminal/default`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      // Send initial resize to wake the PowerShell prompt
      requestAnimationFrame(() => {
        this.fitAddon.fit();
        this.sendResize();
      });
    };

    // Bidirectional: PTY output → xterm display
    this.ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        this.term.write(event.data);
      } else if (event.data instanceof Blob) {
        // Handle binary data from PTY
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            this.term.write(reader.result);
          }
        };
        reader.readAsText(event.data);
      }
    };

    this.ws.onclose = () => {
      this.term.writeln('\x1B[1;3;31m Terminal Disconnected — reconnecting...\x1B[0m');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose fires after onerror
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  dispose(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) { try { this.ws.close(); } catch { /* ignore */ } }
    this.term.dispose();
  }
}

```

## src\main.ts
```typescript
/**
 * Project Y — Main Entry Point (v5.0)
 * Vanilla TypeScript. No React. No Virtual DOM.
 * Bootstraps the IDE: handshake → identity → modules → reveal.
 */

import './style.css';
import { checkHealth, checkIdentityStatus, fetchConfig, getWorkspace } from './api/client';
import { TerminalManager } from './core/TerminalManager';
import { PubSub } from './core/PubSub';
import { initSidebar, handleBrowseFolder } from './ui/Sidebar';
import { initTelemetry } from './ui/Telemetry';
import { initModals, showIdentityModal, hideBootScreen } from './ui/Modals';
import { initEditor } from './core/EditorManager';
import { initAgentPanel } from './ui/AgentPanel';
import { initSettingsPanel } from './ui/SettingsPanel';

// ─── Boot Sequence ───────────────────────────────────────────────
async function boot(): Promise<void> {
  console.log('%c[Lumina IDE] Booting v5.0...', 'color: #7c3aed; font-weight: bold;');

  // Phase 1: Wait for backend
  while (true) {
    try {
      const health = await checkHealth(1, 500);
      if (health && health.status === 'ok') break;
    } catch {
      // Backend not ready — keep waiting
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Phase 2: Identity verification
  try {
    const identity = await checkIdentityStatus();
    if (!identity.is_registered) {
      showIdentityModal();
    } else {
      const userEl = document.getElementById('projecty-user-name');
      if (userEl) userEl.textContent = `▸ ${identity.user_name}`;
    }

    PubSub.on('identity:registered', (name) => {
      const userEl = document.getElementById('projecty-user-name');
      if (userEl) userEl.textContent = `▸ ${name as string}`;
    });
  } catch {
    showIdentityModal();
  }

  // Phase 3: Load config
  try {
    const config = await fetchConfig();
    if (config.selected_model) {
      const modeEl = document.getElementById('projecty-mode-indicator');
      if (modeEl) modeEl.textContent = `LOCAL — ${config.selected_model}`;
    }
  } catch { /* use defaults */ }

  // Phase 4: Load workspace
  try {
    const ws = await getWorkspace();
    if (ws && ws.path) {
      const wsEl = document.getElementById('projecty-workspace-name');
      if (wsEl) wsEl.textContent = ws.name || ws.path;
      PubSub.emit('workspace:set', ws.path);
    }
  } catch { /* no workspace */ }

  // Phase 5: Initialize ALL modules
  initModals();
  initSidebar();
  initTelemetry();
  initEditor();
  initAgentPanel();
  initSettingsPanel();

  // Phase 6: Terminal (immortal mount)
  const terminal = new TerminalManager('projecty-terminal-container');
  terminal.mount();

  // Phase 7: Wire Activity Bar buttons
  const PANEL_IDS = ['explorer', 'ai', 'telemetry', 'swarm', 'extensions', 'library', 'settings'] as const;
  const activityBtns = document.querySelectorAll<HTMLButtonElement>('#projecty-activity-bar .activity-btn');
  activityBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if (!panel) return;

      // Update active state
      activityBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide sidebar panels
      PANEL_IDS.forEach((pid) => {
        const el = document.getElementById(`projecty-panel-${pid}`);
        if (el) el.classList.toggle('hidden', pid !== panel);
      });

      PubSub.emit('panel:toggle', panel);
    });
  });

  // Phase 8: Wire Browse button
  const browseBtn = document.getElementById('projecty-browse-btn');
  if (browseBtn) {
    browseBtn.addEventListener('click', handleBrowseFolder);
  }

  // Phase 9: Keyboard shortcuts
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl+` → Toggle terminal
    if (e.ctrlKey && e.key === '`') {
      e.preventDefault();
      const termZone = document.getElementById('projecty-terminal-zone');
      const resizer = document.getElementById('projecty-resize-h');
      if (termZone && resizer) {
        const isHidden = termZone.classList.toggle('hidden');
        resizer.classList.toggle('hidden', isHidden);
      }
    }
    // Ctrl+Shift+E → Explorer
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      PubSub.emit('panel:toggle', 'explorer');
    }
    // Ctrl+Shift+X → Extensions
    if (e.ctrlKey && e.shiftKey && e.key === 'X') {
      e.preventDefault();
      PubSub.emit('panel:toggle', 'extensions');
    }
    // Ctrl+B → Toggle sidebar
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const sidebar = document.getElementById('projecty-sidebar');
      if (sidebar) sidebar.classList.toggle('hidden');
    }
    // Ctrl+, → Settings
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      PubSub.emit('panel:toggle', 'settings');
    }
  });

  // Phase 10: Reveal IDE
  hideBootScreen();
  console.log('%c[Lumina IDE] ✅ Boot complete!', 'color: #a6e3a1; font-weight: bold;');
}

// ─── Start ───────────────────────────────────────────────────────
boot().catch((err) => {
  console.error('[Lumina IDE] Fatal boot error:', err);
});

```

## src\style.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ═══════════════════════════════════════════════════════════════════
   Project Y — Design System
   Catppuccin-inspired dark theme with neural neon accents
   ═══════════════════════════════════════════════════════════════════ */
:root {
  --projecty-blue: #00A3FF;
  --bg-dark: #0B0E14;

  --bg-base: var(--bg-dark);
  --bg-surface: #10141d;
  --bg-overlay: #151b26;
  --bg-mantle: #080a0f;
  --bg-crust: #05070a;
  --bg-hover: rgba(0, 163, 255, 0.06);
  --bg-active: rgba(0, 163, 255, 0.12);

  --border: rgba(255, 255, 255, 0.08);
  --border-active: var(--projecty-blue);

  --text: #e0e6f0;
  --text-secondary: #a0acba;
  --text-muted: #5b657a;
  --text-accent: var(--projecty-blue);

  --accent: var(--projecty-blue);
  --accent-secondary: #70c4ff;
  --accent-green: #33ffaa;
  --accent-red: #ff4d6d;
  --accent-yellow: #ffcc66;
  --accent-peach: #ffb088;
  --accent-mauve: #b088ff;

  --lumen-glow: 0 0 15px rgba(0, 163, 255, 0.4);
  --lumen-bg: rgba(0, 163, 255, 0.05);

  --radius: 8px;
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  /* v2.3.1 Glow & Motion Tokens */
  --neon-glow: 0 0 15px rgba(0, 163, 255, 0.6);
  --border-breath: 0 0 10px rgba(0, 163, 255, 0.2);
  --glass-bg: rgba(16, 20, 29, 0.7);
  --glass-blur: blur(12px);
}

/* ─── Project Y Edge (v5.5) ─── */
.live-preview-container {
  animation: fadeIn 0.3s ease-out;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-green);
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(166, 227, 161, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(166, 227, 161, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(166, 227, 161, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(166, 227, 161, 0);
  }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--bg-overlay);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-frame-wrapper iframe {
  background: #fff;
  cursor: default;
}

/* ═══════════════════════════════════════════════════════════════════
   Light Theme
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] {
  --bg-base: #eff1f5;
  --bg-surface: #e6e9ef;
  --bg-overlay: #dce0e8;
  --bg-mantle: #ccd0da;
  --bg-crust: #bcc0cc;
  --bg-hover: rgba(0, 0, 0, 0.04);
  --bg-active: rgba(30, 102, 245, 0.08);

  --border: rgba(0, 0, 0, 0.08);
  --border-active: rgba(30, 102, 245, 0.35);

  --text: #4c4f69;
  --text-secondary: #5c5f77;
  --text-muted: #9ca0b0;
  --text-accent: #1e66f5;

  --accent: #1e66f5;
  --accent-secondary: #7287fd;
  --accent-green: #40a02b;
  --accent-red: #d20f39;
  --accent-yellow: #df8e1d;
  --accent-peach: #fe640b;
  --accent-mauve: #8839ef;

  --lumen-glow: 0 0 12px rgba(30, 102, 245, 0.2);
  --lumen-bg: rgba(30, 102, 245, 0.04);
}

/* ═══════════════════════════════════════════════════════════════════
   Project Y Icon (Rounded Logo Cut)
   ═══════════════════════════════════════════════════════════════════ */
.projecty-icon {
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
}

.projecty-icon.sm {
  width: 20px;
  height: 20px;
}

.projecty-icon.md {
  width: 48px;
  height: 48px;
}

.projecty-icon.lg {
  width: 80px;
  height: 80px;
}

.projecty-icon.xl {
  width: 120px;
  height: 120px;
}

[data-theme='light'] .projecty-icon {
  border-color: rgba(30, 102, 245, 0.2);
  box-shadow: 0 0 20px rgba(30, 102, 245, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  background: var(--bg-base);
  color: var(--text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar v2.3.1 UX Refinement */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 163, 255, 0.1);
  border-radius: 10px;
  transition: background var(--transition);
}

*:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 163, 255, 0.4);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--projecty-blue) !important;
  box-shadow: var(--neon-glow);
}

/* ═══════════════════════════════════════════════════════════════════
   IDE Layout Grid (A CORREÇÃO SUPREMA - 3 COLUNAS)
   ═══════════════════════════════════════════════════════════════════ */
.ide-layout {
  display: grid;
  grid-template-columns: 48px 260px 1fr;
  /* 3 Colunas: Ícones, Sidebar, Código */
  grid-template-rows: 36px 1fr 22px;
  grid-template-areas:
    "telemetry telemetry telemetry"
    "activity  sidebar   workspace"
    "status    status    status";
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════════════
   Telemetry Bar (top)
   ═══════════════════════════════════════════════════════════════════ */
.telemetry-bar {
  grid-area: telemetry;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
}

.telemetry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.telemetry-logo {
  width: 20px;
  height: 20px;
  border-radius: 20%;
  object-fit: cover;
}

.telemetry-brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--accent);
}

.telemetry-center {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.telemetry-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.telemetry-chip .chip-icon {
  font-size: 12px;
}

.telemetry-chip .chip-label {
  font-weight: 500;
}

.telemetry-chip .chip-unit {
  color: var(--text-muted);
  font-size: 10px;
}

.telemetry-chip .chip-model {
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.connected {
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.status-dot.checking {
  background: var(--accent-yellow);
  animation: pulse 1s infinite;
}

.status-dot.disconnected {
  background: var(--accent-red);
}

.telemetry-chip.savings .chip-label {
  color: var(--accent-green);
}

.telemetry-chip.tokens .chip-label {
  color: var(--accent);
}

.telemetry-right {
  color: var(--text-muted);
  font-size: 11px;
}

/* ═══════════════════════════════════════════════════════════════════
   Activity Bar (far left)
   ═══════════════════════════════════════════════════════════════════ */
.activity-bar {
  grid-area: activity;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-overlay);
  border-right: 1px solid var(--border);
  padding: 4px 0;
}

.activity-bar-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.activity-bar-bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 4px;
}

.activity-btn {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  opacity: 0.6;
  transition: all var(--transition);
}

.activity-btn:hover {
  opacity: 1;
  background: var(--bg-hover);
  color: var(--text);
}

.activity-btn.active {
  opacity: 1;
  color: var(--projecty-blue);
  background: var(--bg-active);
}

.activity-icon-svg {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.activity-btn:active .activity-icon-svg {
  transform: scale(0.9);
}

.activity-btn.active .activity-icon-svg {
  filter: drop-shadow(0 0 5px rgba(0, 163, 255, 0.5));
}

.activity-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--projecty-blue);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(0, 163, 255, 0.6);
}

/* ═══════════════════════════════════════════════════════════════════
   Side Panel
   ═══════════════════════════════════════════════════════════════════ */
.side-panel {
  grid-area: sidebar;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  user-select: none;
  flex-shrink: 0;
}

.panel-hint {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════════════
   File Explorer
   ═══════════════════════════════════════════════════════════════════ */
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  user-select: none;
}

.explorer-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.explorer-actions {
  display: flex;
  gap: 2px;
}

.explorer-action {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0.5;
  transition: all var(--transition);
}

.explorer-action:hover {
  opacity: 1;
  background: var(--bg-hover);
}

.explorer-input-row {
  display: flex;
  gap: 4px;
  padding: 4px 8px 8px;
}

.explorer-input-row input {
  flex: 1;
  background: var(--bg-overlay);
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  padding: 4px 8px;
  color: var(--text);
  font-size: 11px;
  outline: none;
}

.explorer-input-row button {
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.explorer-workspace {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.explorer-tree {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.explorer-loading,
.explorer-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.explorer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-icon {
  font-size: 28px;
  opacity: 0.3;
}

.btn-primary {
  padding: 6px 16px;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-ghost {
  padding: 5px 14px;
  background: none;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 11px;
  cursor: pointer;
}

.btn-ghost:hover {
  background: var(--bg-hover);
}

/* Tree */
.tree-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  transition: background var(--transition);
}

.tree-label:hover {
  background: var(--bg-hover);
}

.tree-label.active {
  background: var(--bg-active);
  color: var(--text-accent);
}

.tree-arrow {
  font-size: 9px;
  width: 12px;
  text-align: center;
  color: var(--text-muted);
}

.tree-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════
   Main Area (Editor + Terminal Container)
   ═══════════════════════════════════════════════════════════════════ */
.main-area {
  grid-area: workspace;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-base);
}

.editor-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.terminal-zone {
  height: 250px;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: #0d0d15;
}

.terminal-tabs {
  padding: 4px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.terminal-container {
  flex: 1;
  overflow: hidden;
  padding: 8px;
}

/* ═══════════════════════════════════════════════════════════════════
   Editor Area
   ═══════════════════════════════════════════════════════════════════ */
.editor-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-base);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  min-height: 35px;
}

.tab-list {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 35px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-muted);
  white-space: nowrap;
  transition: all var(--transition);
  position: relative;
}

.tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.tab.active {
  background: var(--bg-base);
  color: var(--text);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
}

.tab-icon {
  font-size: 13px;
}

.tab-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-dot {
  color: var(--accent-yellow);
  font-size: 9px;
}

.tab-close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: all var(--transition);
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

/* Editor content */
.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════════════════════════════
   File Editor
   ═══════════════════════════════════════════════════════════════════ */
.file-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-base);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  min-height: 30px;
}

.editor-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-filename {
  font-weight: 500;
  color: var(--text);
}

.editor-modified-dot {
  color: var(--accent-yellow);
  font-size: 10px;
}

.editor-lang {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.editor-info {
  font-size: 11px;
  color: var(--text-muted);
}

.editor-save-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.5;
  padding: 2px;
}

.editor-save-btn:hover:not(:disabled) {
  opacity: 1;
}

.editor-save-btn:disabled {
  opacity: 0.2;
  cursor: default;
}

/* Autocomplete Toggle */
.autocomplete-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-muted);
  transition: all var(--transition);
}

.autocomplete-toggle.on {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.autocomplete-toggle .toggle-icon {
  font-size: 12px;
}

.autocomplete-toggle .toggle-label {
  font-weight: 500;
}

.toggle-switch {
  width: 20px;
  height: 10px;
  border-radius: 5px;
  background: var(--text-muted);
  position: relative;
  transition: background var(--transition);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transition: transform var(--transition);
}

.toggle-switch.on {
  background: var(--accent-green);
}

.toggle-switch.on::after {
  transform: translateX(10px);
}

.save-indicator {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
}

.save-indicator.saved {
  color: var(--accent-green);
}

.save-indicator.saving {
  color: var(--accent-yellow);
}

.save-indicator.error {
  color: var(--accent-red);
}

/* Code Area */
.code-area {
  flex: 1;
  display: flex;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 20px;
}

.line-numbers {
  padding: 8px 12px 8px 16px;
  text-align: right;
  color: var(--text-muted);
  user-select: none;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  min-width: 48px;
}

.line-num {
  height: 20px;
  line-height: 20px;
  transition: all var(--transition);
}

/* Lúmen Glow — AI-generated lines */
.line-num.lumen-glow {
  color: var(--accent);
  text-shadow: var(--lumen-glow);
  background: var(--lumen-bg);
}

.code-textarea {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
  tab-size: 4;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

/* Code Editor Wrapper (for ghost text positioning) */
.code-editor-wrapper {
  flex: 1;
  position: relative;
  overflow: auto;
}

.code-editor-wrapper .code-textarea {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* ═══════════════════════════════════════════════════════════════════
   Find-in-File Bar
   ═══════════════════════════════════════════════════════════════════ */
.find-bar {
  padding: 6px 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.find-bar-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-active);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 100%;
}

.find-icon {
  font-size: 13px;
  opacity: 0.6;
}

.find-input {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  min-width: 120px;
}

.find-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.find-count {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.find-nav-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
  font-size: 10px;
  transition: all var(--transition);
}

.find-nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.find-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.find-close-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  transition: all var(--transition);
}

.find-close-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: var(--accent-red);
}

/* Find match highlight on line numbers */
.line-num.find-highlight-line {
  background: rgba(249, 226, 175, 0.08);
  color: var(--accent-yellow);
}

/* ═══════════════════════════════════════════════════════════════════
   Ghost Text (Autocomplete)
   ═══════════════════════════════════════════════════════════════════ */
.ghost-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-text {
  color: rgba(0, 163, 255, 0.3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 20px;
  white-space: pre;
}

.ghost-hint {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 163, 255, 0.1);
  color: rgba(0, 163, 255, 0.7);
  font-family: 'Inter', sans-serif;
  border: 1px solid rgba(0, 163, 255, 0.2);
}

.ghost-loading {
  font-size: 11px;
  animation: pulse 1s infinite;
}

/* ═══════════════════════════════════════════════════════════════════
   Welcome Screen
   ═══════════════════════════════════════════════════════════════════ */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, rgba(0, 163, 255, 0.03) 0%, transparent 70%);
}

.welcome-aura {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 163, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  animation: aura-pulse 8s ease-in-out infinite;
}

@keyframes aura-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.neon-blue {
  color: var(--projecty-blue);
  text-shadow: 0 0 10px rgba(0, 163, 255, 0.5), 0 0 20px rgba(0, 163, 255, 0.3);
  font-weight: 700;
  letter-spacing: 2px;
  z-index: 1;
}

.welcome-title {
  font-size: 48px;
  margin: 0;
  text-transform: uppercase;
}

.welcome-sub {
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: -10px;
  z-index: 1;
  opacity: 0.6;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1;
  margin-top: 40px;
}

.welcome-shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.welcome-shortcut kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  min-width: 100px;
  text-align: center;
}

/* Terminal Tabs */
.tab-close-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0.5;
  transition: all var(--transition);
}

.tab-close-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.tab-add-btn {
  font-size: 16px;
  padding: 0 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.tab-add-btn:hover {
  color: var(--text);
  background: var(--bg-hover);
}

/* ═══════════════════════════════════════════════════════════════════
   Bottom Panel (Agent + Terminal + Output)
   ═══════════════════════════════════════════════════════════════════ */
.bottom-panel {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
  min-height: 180px;
  max-height: 50vh;
  height: 260px;
}

.bottom-tabs {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
  min-height: 35px;
  overflow-x: auto;
  scrollbar-width: none;
}

.bottom-tabs::-webkit-scrollbar {
  display: none;
}

.bottom-tab {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: background var(--transition), color var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.bottom-tab:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.bottom-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
  background: var(--bg-active);
}

.streaming-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-green);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Sentinel Active Defense (v2.1)
   ═══════════════════════════════════════════════════════════════════ */
.security-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: rgba(15, 5, 5, 0.9);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
}

.security-alert-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

.security-alert-modal {
  width: 500px;
  background: #0f0505;
  border: 1px solid #ff3e3e;
  border-radius: var(--radius);
  padding: 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(255, 62, 62, 0.3);
  perspective: 1000px;
}

.alert-header {
  text-align: center;
  margin-bottom: 30px;
}

.alert-header h2 {
  color: #ff3e3e;
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  letter-spacing: 4px;
  margin: 10px 0;
  text-shadow: 0 0 10px rgba(255, 62, 62, 0.5);
}

.alert-badge {
  display: inline-block;
  background: #ff3e3e;
  color: #000;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 2px;
  letter-spacing: 1px;
}

.alert-terminal {
  background: #000;
  border: 1px solid #331111;
  border-radius: 4px;
  margin-bottom: 20px;
}

.terminal-header {
  background: #1a0a0a;
  padding: 6px 12px;
  font-size: 10px;
  color: #884444;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #331111;
}

.terminal-body {
  padding: 15px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #ff3e3e;
  line-height: 1.6;
}

.reason-text {
  color: #fff;
  background: rgba(255, 62, 62, 0.2);
  padding: 2px 4px;
}

.alert-notice {
  text-align: center;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  margin-bottom: 30px;
}

.alert-footer {
  display: flex;
  gap: 15px;
}

.panic-btn {
  flex: 1;
  background: #ff3e3e;
  color: #fff;
  border: none;
  padding: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.dismiss-btn {
  flex: 1;
  background: transparent;
  border: 1px solid #331111;
  color: #555;
  padding: 12px;
  font-family: inherit;
  cursor: pointer;
}

.glitch-line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 62, 62, 0.5);
  animation: glitch-scan 4s infinite;
}

@keyframes glitch-scan {
  0% {
    transform: translateY(-200px);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: translateY(200px);
    opacity: 0;
  }
}

.pulse-alert {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {

  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 5px #ff3e3e);
  }

  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 20px #ff3e3e);
  }
}

.shield-indicator {
  transition: color 0.3s, filter 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shield-active {
  color: var(--projecty-blue) !important;
  filter: drop-shadow(0 0 5px rgba(0, 163, 255, 0.5));
}

.shield-panic {
  color: #ff3e3e !important;
  filter: drop-shadow(0 0 8px #ff3e3e);
  animation: blink-red 0.5s infinite;
}

@keyframes blink-red {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.bottom-tabs-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.bottom-action {
  padding: 2px 8px;
  font-size: 11px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
}

.bottom-action:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.bottom-action.stop {
  color: var(--accent-red);
}

.bottom-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  background: var(--bg-overlay);
}

.bottom-output.terminal {
  background: #0d0d15;
  color: #a6e3a1;
  font-family: 'JetBrains Mono', monospace;
}

.bottom-output.terminal pre {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
}

.bottom-output.streaming {
  border-left: 2px solid var(--accent);
}

.bottom-welcome {
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--accent);
  margin-left: 1px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* File ops */
.file-ops-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px 10px;
  border-top: 1px solid var(--border);
}

.file-op-chip {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}

.file-op-chip.created {
  background: rgba(166, 227, 161, 0.08);
  color: var(--accent-green);
}

.file-op-chip.modified {
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
}

.file-op-chip.error {
  background: rgba(243, 139, 168, 0.08);
  color: var(--accent-red);
}

.bottom-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--accent-red);
  border-top: 1px solid rgba(243, 139, 168, 0.15);
  background: rgba(243, 139, 168, 0.03);
}

.bottom-error button {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 14px;
}

/* Prompt */
.bottom-prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-overlay) 0%, rgba(17, 17, 27, 0.95) 100%);
}

.bottom-prompt-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
}

.prompt-mode {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  padding-bottom: 4px;
  white-space: nowrap;
}

.prompt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

.prompt-textarea {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 7px 12px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  outline: none;
  max-height: 100px;
  transition: border-color var(--transition);
}

.prompt-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.prompt-textarea::placeholder {
  color: var(--text-muted);
}

.prompt-send {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.prompt-send:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.3);
}

.prompt-send:disabled {
  opacity: 0.25;
  cursor: default;
}

.prompt-send.stop {
  background: var(--accent-red);
}

/* ═══════════════════════════════════════════════════════════════════
   Status Bar
   ═══════════════════════════════════════════════════════════════════ */
.status-bar {
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: linear-gradient(90deg, #1a1a2e 0%, #313244 50%, #1a1a2e 100%);
  color: var(--text-secondary);
  font-size: 11px;
  border-top: 1px solid rgba(137, 180, 250, 0.08);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item.brand {
  opacity: 0.5;
}

/* ═══════════════════════════════════════════════════════════════════
   Settings Panel
   ═══════════════════════════════════════════════════════════════════ */
.settings-view {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.settings-logo {
  width: 64px;
  height: 64px;
  border-radius: 20%;
  overflow: hidden;
  object-fit: cover;
  border: 1px solid rgba(137, 180, 250, 0.2);
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
  filter: drop-shadow(0 0 16px rgba(137, 180, 250, 0.4));
}

.settings-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px 0;
  letter-spacing: 0.5px;
}

.settings-header p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.settings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(137, 180, 250, 0.03);
  flex-shrink: 0;
  transition: box-shadow var(--transition), border-color var(--transition);
}

.settings-card:hover {
  border-color: rgba(137, 180, 250, 0.12);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(137, 180, 250, 0.06);
}

.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
}

.settings-card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-card-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row-flex {
  display: flex;
  gap: 24px;
}

.setting-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-field label {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-input {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 16px;
  outline: none;
  font-family: 'JetBrains Mono', monospace;
  transition: all var(--transition);
}

.settings-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.15);
  background: var(--bg-hover);
}

.settings-refresh-btn {
  background: var(--bg-base);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.settings-refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.settings-alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 8px;
}

.settings-alert.error {
  background: rgba(243, 139, 168, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(243, 139, 168, 0.2);
}

.settings-alert.info {
  background: rgba(137, 180, 250, 0.1);
  color: var(--accent);
  border: 1px solid rgba(137, 180, 250, 0.2);
}

.settings-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-badge.success {
  background: rgba(166, 227, 161, 0.15);
  color: var(--accent-green);
}

.settings-badge.neon {
  background: rgba(137, 180, 250, 0.15);
  color: var(--accent);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.2);
}

.provider-detected {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.settings-save-btn {
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-save-btn:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 16px rgba(137, 180, 250, 0.3);
}

.settings-save-btn.saved {
  background: var(--accent-green);
  box-shadow: 0 0 16px rgba(166, 227, 161, 0.3);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.model-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.model-card:hover {
  border-color: var(--border-active);
  background: var(--bg-hover);
}

.model-card.selected {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.05);
  box-shadow: 0 0 0 1px var(--accent);
}

.model-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.model-active-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--bg-base);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.model-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-tag {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
}

.model-tag.size {
  margin-left: auto;
  color: var(--accent-yellow);
  border-color: rgba(249, 226, 175, 0.2);
}

.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
  gap: 8px;
  padding: 16px;
}

.panel-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
  outline: none;
  margin: 0 12px;
  width: calc(100% - 24px);
}

.search-input:focus {
  border-color: var(--accent);
}

.dashboard-bar {
  display: none;
}

/* ═══════════════════════════════════════════════════════════════════
   Theme Toggle Buttons
   ═══════════════════════════════════════════════════════════════════ */
.settings-theme-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.settings-theme-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-active);
}

.settings-theme-btn.active {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(137, 180, 250, 0.1);
}

/* ═══════════════════════════════════════════════════════════════════
   Predictive Cache Ghost Blocks (Module C)
   ═══════════════════════════════════════════════════════════════════ */
.ghost-block-overlay {
  position: absolute;
  top: 8px;
  left: 60px;
  right: 20px;
  opacity: 0.25;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.3s ease;
}

.ghost-block-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
  background: transparent;
  margin: 0;
  padding: 0;
  white-space: pre;
}

.ghost-block-hint {
  margin-top: 12px;
  padding: 6px 12px;
  background: var(--bg-hover);
  border: 1px dashed var(--accent);
  color: var(--accent);
  font-size: 11px;
  border-radius: 4px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

/* ═══════════════════════════════════════════════════════════════════
   Light Theme — Component Overrides
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] .status-bar {
  background: linear-gradient(90deg, #ccd0da 0%, #bcc0cc 50%, #ccd0da 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-output.terminal {
  background: #e6e9ef;
  color: #40a02b;
}

[data-theme='light'] .telemetry-bar {
  background: linear-gradient(135deg, #dce0e8 0%, #ccd0da 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .activity-bar {
  background: #dce0e8;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-prompt {
  background: linear-gradient(180deg, #e6e9ef 0%, #dce0e8 100%);
}

[data-theme='light'] .settings-theme-btn.active {
  background: rgba(30, 102, 245, 0.08);
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(30, 102, 245, 0.1);
}

[data-theme='light'] .ghost-text {
  color: rgba(30, 102, 245, 0.3);
}

[data-theme='light'] .ghost-hint {
  background: rgba(30, 102, 245, 0.08);
  color: rgba(30, 102, 245, 0.5);
  border-color: rgba(30, 102, 245, 0.12);
}

/* ─── Project Y Library (v6.5) ───────────────────────────────────────── */
.library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: var(--bg-primary);
  color: var(--text);
}

.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-zone.active {
  border-color: var(--accent);
  background: var(--bg-overlay);
}

.upload-zone.uploading {
  opacity: 0.7;
  pointer-events: none;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.upload-btn {
  background: var(--accent);
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.library-list h3 {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: var(--bg-overlay);
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition: border 0.2s;
}

.doc-item:hover {
  border-color: var(--border);
}

.doc-icon {
  font-size: 18px;
}

.doc-info {
  flex: 1;
  overflow: hidden;
}

.doc-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  font-size: 10px;
  color: var(--text-muted);
}

/* ═══════════════════════════════════════════════════════════════════
   Identity & Security (v1.16)
   ═══════════════════════════════════════════════════════════════════ */
.identity-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(8, 10, 15, 0.95);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-modal {
  width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--projecty-blue);
  border-radius: var(--radius);
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modal-slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.identity-header {
  text-align: center;
  margin-bottom: 30px;
}

.shield-icon {
  font-size: 48px;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(0, 163, 255, 0.4));
}

.identity-header h2 {
  color: var(--projecty-blue);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

.identity-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 5px;
}

.identity-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.identity-body p {
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.identity-input {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  text-align: center;
}

.identity-input:focus {
  border-color: var(--projecty-blue);
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.1);
}

.identity-btn {
  background: var(--projecty-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.identity-btn:hover:not(:disabled) {
  background: #008fdf;
  transform: translateY(-2px);
}

.identity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.identity-notice {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
  opacity: 0.6;
}

/* Scanning Animation */
.identity-body.scan {
  height: 150px;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--projecty-blue);
  box-shadow: 0 0 15px var(--projecty-blue);
  animation: scanner-move 2s linear infinite;
  z-index: 2;
}

@keyframes scanner-move {
  0% {
    top: 0;
  }

  100% {
    top: 100%;
  }
}

.scan-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 2;
  z-index: 1;
}

.glow-text {
  color: var(--projecty-blue);
  animation: text-pulse 1.5s infinite;
}

@keyframes text-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   UX v2.3.1 Masterclass Animations
   ═══════════════════════════════════════════════════════════════════ */

/* Motor Pulse (Starting State) */
.pulse-starting {
  animation: motorPulse 0.8s ease-in-out infinite alternate !important;
}

@keyframes motorPulse {
  from {
    opacity: 0.5;
    filter: drop-shadow(0 0 2px #ffb088);
  }

  to {
    opacity: 1;
    filter: drop-shadow(0 0 10px #ffb088);
  }
}

/* Motor Ready (Transition Signal) */
.pulse-ready-trigger {
  animation: motorReadyFlash 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes motorReadyFlash {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }

  30% {
    transform: scale(1.3);
    filter: brightness(2) drop-shadow(0 0 20px var(--projecty-blue));
  }

  100% {
    transform: scale(1);
    filter: brightness(1) drop-shadow(0 0 5px var(--projecty-blue));
  }
}

/* Border Breathing (Brain Indexing) */
.border-breathe {
  position: relative;
}

.border-breathe::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: 1px solid var(--projecty-blue);
  border-radius: inherit;
  animation: borderBreatheAnim 2s ease-in-out infinite;
  z-index: 100;
}

@keyframes borderBreatheAnim {
  0% {
    opacity: 0.1;
    box-shadow: inset 0 0 5px rgba(0, 163, 255, 0.1);
  }

  50% {
    opacity: 0.4;
    box-shadow: inset 0 0 15px rgba(0, 163, 255, 0.3);
  }

  100% {
    opacity: 0.1;
    box-shadow: inset 0 0 5px rgba(0, 163, 255, 0.1);
  }
}

/* Glassmorphism Refinement */
.glass-panel {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur) !important;
  border: 1px solid var(--border);
}

.activity-btn:active {
  transform: scale(0.95);
}
```

## src\ui\AgentPanel.ts
```typescript
/**
 * Project Y — Agent Panel (v5.0)
 * SSE streaming chat with the AI backend. Pure DOM manipulation.
 * Replaces the sidebar AI placeholder with a full chat interface.
 */

import { fetchModels, streamGenerate } from '../api/client';
import type { StreamCallbacks } from '../api/client';

let chatOutput: HTMLElement;
let promptInput: HTMLTextAreaElement;
let sendBtn: HTMLButtonElement;
let modelSelect: HTMLSelectElement;
let currentAbort: (() => void) | null = null;
let isStreaming = false;

export function initAgentPanel(): void {
  const panel = document.getElementById('projecty-panel-ai') as HTMLElement;
  if (!panel) return;

  // Replace placeholder content with real chat UI
  panel.innerHTML = `
    <div class="panel-header">AGENT — LUMINA AI</div>
    <div style="padding:6px 12px; border-bottom:1px solid var(--border);">
      <select id="projecty-model-select" style="width:100%; background:var(--bg-overlay); border:1px solid var(--border); border-radius:4px; padding:4px 8px; color:var(--text); font-size:11px; outline:none;">
        <option value="mistral">mistral</option>
      </select>
    </div>
    <div id="projecty-chat-output" class="bottom-output" style="flex:1; overflow-y:auto; padding:12px; font-size:12px; line-height:1.7;"></div>
    <div style="padding:8px 12px; border-top:1px solid var(--border); display:flex; gap:6px; align-items:flex-end;">
      <textarea id="projecty-prompt-input" class="prompt-textarea" placeholder="Pergunte algo ao Agent..." rows="2" style="flex:1; resize:none; min-height:32px; max-height:80px;"></textarea>
      <button id="projecty-send-btn" class="prompt-send" title="Enviar">▶</button>
    </div>
  `;

  chatOutput = document.getElementById('projecty-chat-output') as HTMLElement;
  promptInput = document.getElementById('projecty-prompt-input') as HTMLTextAreaElement;
  sendBtn = document.getElementById('projecty-send-btn') as HTMLButtonElement;
  modelSelect = document.getElementById('projecty-model-select') as HTMLSelectElement;

  // Load available models
  loadModels();

  // Send on click
  sendBtn.addEventListener('click', handleSend);

  // Send on Enter (Shift+Enter for newline)
  promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-expand textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 80) + 'px';
  });
}

async function loadModels(): Promise<void> {
  try {
    const data = await fetchModels();
    const models = (data as { models: Array<{ name: string }> }).models || [];
    modelSelect.innerHTML = models
      .map((m) => `<option value="${m.name}">${m.name}</option>`)
      .join('');
  } catch {
    // Keep default option
  }
}

function handleSend(): void {
  if (isStreaming) {
    // Stop streaming
    if (currentAbort) currentAbort();
    isStreaming = false;
    sendBtn.textContent = '▶';
    sendBtn.classList.remove('stop');
    return;
  }

  const prompt = promptInput.value.trim();
  if (!prompt) return;

  // Render user message
  appendMessage('user', prompt);
  promptInput.value = '';
  promptInput.style.height = 'auto';

  // Start streaming
  isStreaming = true;
  sendBtn.textContent = '■';
  sendBtn.classList.add('stop');

  const responseEl = appendMessage('assistant', '');
  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  responseEl.appendChild(cursor);

  let fullText = '';

  const callbacks: StreamCallbacks = {
    onToken: (token: string) => {
      fullText += token;
      responseEl.textContent = fullText;
      responseEl.appendChild(cursor);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    },
    onDone: () => {
      cursor.remove();
      isStreaming = false;
      sendBtn.textContent = '▶';
      sendBtn.classList.remove('stop');
      currentAbort = null;
    },
    onError: (err: Error) => {
      cursor.remove();
      responseEl.innerHTML += `<span style="color:var(--accent-red);">\n[Erro: ${err.message}]</span>`;
      isStreaming = false;
      sendBtn.textContent = '▶';
      sendBtn.classList.remove('stop');
      currentAbort = null;
    },
    onFiles: (files) => {
      const filesEl = document.createElement('div');
      filesEl.className = 'file-ops-inline';
      for (const f of files) {
        const chip = document.createElement('span');
        chip.className = `file-op-chip ${f.status}`;
        chip.textContent = `${f.status === 'created' ? '✚' : '✎'} ${f.path.split('/').pop() || f.path}`;
        filesEl.appendChild(chip);
      }
      chatOutput.appendChild(filesEl);
    },
  };

  currentAbort = streamGenerate(
    { prompt, mode: 'agent', model: modelSelect.value },
    callbacks
  );
}

function appendMessage(role: 'user' | 'assistant', text: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.marginBottom = '12px';

  const label = document.createElement('div');
  label.style.fontSize = '10px';
  label.style.fontWeight = '600';
  label.style.letterSpacing = '0.5px';
  label.style.marginBottom = '4px';
  label.style.color = role === 'user' ? 'var(--accent)' : 'var(--accent-green)';
  label.textContent = role === 'user' ? '▸ VOCÊ' : '▸ LUMINA';

  const content = document.createElement('div');
  content.style.whiteSpace = 'pre-wrap';
  content.style.wordBreak = 'break-word';
  content.style.fontFamily = "'JetBrains Mono', monospace";
  content.style.fontSize = '12px';
  content.style.lineHeight = '1.7';
  content.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(content);
  chatOutput.appendChild(wrapper);
  chatOutput.scrollTop = chatOutput.scrollHeight;

  return content;
}

```

## src\ui\Modals.ts
```typescript
/**
 * Project Y — Modal Controller (v5.0)
 * Controls Identity Lock, Sentinel Panic, and Boot Screen via style.display toggling.
 * Zero DOM creation/destruction — all modals are pre-baked in the HTML.
 */

import { registerIdentity } from '../api/client';
import { PubSub } from '../core/PubSub';

export function initModals(): void {
  // ─── Identity Modal ────────────────────────────────────────────
  const identityModal = document.getElementById('projecty-identity-modal') as HTMLElement;
  const identityForm = document.getElementById('projecty-identity-form') as HTMLFormElement;
  const identityInput = document.getElementById('projecty-identity-input') as HTMLInputElement;

  if (identityForm) {
    identityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = identityInput.value.trim();
      if (!name) return;

      try {
        await registerIdentity(name);
        identityModal.style.display = 'none';
        PubSub.emit('identity:registered', name);
      } catch (err) {
        console.error('[Modals] Identity registration failed:', err);
      }
    });
  }

  // ─── Sentinel Panic Overlay ─────────────────────────────────────
  const panicOverlay = document.getElementById('projecty-panic-overlay') as HTMLElement;
  const panicReason = document.getElementById('projecty-panic-reason') as HTMLElement;
  const panicDismiss = document.getElementById('projecty-panic-dismiss') as HTMLElement;

  PubSub.on('sentinel:panic', (reason) => {
    if (panicOverlay && panicReason) {
      panicReason.textContent = reason as string;
      panicOverlay.style.display = 'flex';
    }
  });

  if (panicDismiss) {
    panicDismiss.addEventListener('click', () => {
      panicOverlay.style.display = 'none';
    });
  }
}

export function showIdentityModal(): void {
  const el = document.getElementById('projecty-identity-modal');
  if (el) el.style.display = 'flex';
}

export function hideBootScreen(): void {
  const boot = document.getElementById('projecty-boot-screen');
  const ide = document.getElementById('projecty-ide');
  if (boot) boot.style.display = 'none';
  if (ide) ide.style.display = 'grid';
}

```

## src\ui\SettingsPanel.ts
```typescript
/**
 * Project Y — Settings Panel (v5.0)
 * Connects the settings sidebar to real backend endpoints.
 * Pure DOM manipulation — no frameworks.
 */

import { fetchConfig, updateConfig, fetchMotorStatus, toggleMotor, fetchModelCatalog } from '../api/client';
import { PubSub } from '../core/PubSub';

export function initSettingsPanel(): void {
  const panel = document.getElementById('projecty-panel-settings') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header">CONFIGURAÇÕES</div>
    <div style="padding:12px; display:flex; flex-direction:column; gap:16px; overflow-y:auto; flex:1;">

      <!-- Ollama Config -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>⚙️ Motor Ollama</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>Host</label>
            <input id="projecty-settings-host" class="settings-input" type="text" value="127.0.0.1" style="font-size:12px; padding:8px 12px;" />
          </div>
          <div class="setting-field">
            <label>Porta</label>
            <input id="projecty-settings-port" class="settings-input" type="number" value="11434" style="font-size:12px; padding:8px 12px;" />
          </div>
          <div class="setting-field">
            <label>
              Motor Status
              <span id="projecty-settings-motor-badge" class="settings-badge success">offline</span>
            </label>
            <button id="projecty-settings-motor-toggle" style="background:var(--accent); color:white; border:none; border-radius:6px; padding:8px 12px; font-size:12px; font-weight:600; cursor:pointer;">
              Toggle Motor
            </button>
          </div>
        </div>
      </div>

      <!-- Model Selection -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>🧠 Modelo Ativo</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>Modelo Selecionado</label>
            <select id="projecty-settings-model" class="settings-input" style="font-size:12px; padding:8px 12px;">
              <option value="mistral">mistral</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sentinel -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>🛡️ Sentinel Active Defense</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>
              Proteção Ativa
              <span id="projecty-settings-sentinel-status" style="color:var(--accent-green);">🟢 Ativo</span>
            </label>
            <p class="panel-hint" style="font-size:11px;">O Sentinel monitora tentativas de intrusão e protege o workspace.</p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button id="projecty-settings-save" class="settings-save-btn" style="align-self:flex-end; padding:8px 20px; font-size:12px;">
        Salvar Configurações
      </button>
    </div>
  `;

  // Load current config
  loadConfig();

  // Wire motor toggle
  const motorToggle = document.getElementById('projecty-settings-motor-toggle');
  if (motorToggle) {
    motorToggle.addEventListener('click', async () => {
      await toggleMotor();
      const status = await fetchMotorStatus();
      updateMotorBadge(status.status);
    });
  }

  // Wire save button
  const saveBtn = document.getElementById('projecty-settings-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveConfig);
  }

  // Periodic motor status
  setInterval(async () => {
    try {
      const status = await fetchMotorStatus();
      updateMotorBadge(status.status);
    } catch { /* ignore */ }
  }, 5000);
}

async function loadConfig(): Promise<void> {
  try {
    const config = await fetchConfig();
    const hostInput = document.getElementById('projecty-settings-host') as HTMLInputElement;
    const portInput = document.getElementById('projecty-settings-port') as HTMLInputElement;
    const modelSelect = document.getElementById('projecty-settings-model') as HTMLSelectElement;

    if (hostInput && config.ollama_host) hostInput.value = config.ollama_host;
    if (portInput && config.ollama_port) portInput.value = String(config.ollama_port);

    // Load model catalog
    try {
      const catalog = await fetchModelCatalog();
      const installed = (catalog.installed || []) as Array<{ name: string }>;
      if (installed.length > 0 && modelSelect) {
        modelSelect.innerHTML = installed
          .map((m) => `<option value="${m.name}" ${m.name === config.selected_model ? 'selected' : ''}>${m.name}</option>`)
          .join('');
      }
    } catch { /* keep defaults */ }

    // Motor status
    const motorStatus = await fetchMotorStatus();
    updateMotorBadge(motorStatus.status);
  } catch {
    console.warn('[Settings] Could not load config');
  }
}

async function saveConfig(): Promise<void> {
  const hostInput = document.getElementById('projecty-settings-host') as HTMLInputElement;
  const portInput = document.getElementById('projecty-settings-port') as HTMLInputElement;
  const modelSelect = document.getElementById('projecty-settings-model') as HTMLSelectElement;
  const saveBtn = document.getElementById('projecty-settings-save') as HTMLButtonElement;

  try {
    await updateConfig({
      ollama_host: hostInput.value,
      ollama_port: parseInt(portInput.value, 10),
      selected_model: modelSelect.value,
    });
    saveBtn.textContent = '✓ Salvo!';
    saveBtn.classList.add('saved');
    PubSub.emit('config:updated');
    setTimeout(() => {
      saveBtn.textContent = 'Salvar Configurações';
      saveBtn.classList.remove('saved');
    }, 2000);
  } catch (err) {
    saveBtn.textContent = '✗ Erro';
    console.error('[Settings] Save failed:', err);
  }
}

function updateMotorBadge(status: string): void {
  const badge = document.getElementById('projecty-settings-motor-badge');
  if (!badge) return;
  badge.textContent = status;
  if (status === 'ready') {
    badge.className = 'settings-badge success';
  } else if (status === 'starting') {
    badge.className = 'settings-badge neon';
  } else {
    badge.className = 'settings-badge';
    badge.style.background = 'rgba(243,139,168,0.15)';
    badge.style.color = 'var(--accent-red)';
  }
}

```

## src\ui\Sidebar.ts
```typescript
/**
 * Project Y — Sidebar Controller (v5.0)
 * DOM-imperative sidebar panel management.
 * Renders File Explorer tree and handles panel switching.
 */

import { getFileTree, browseFolder, openFolder } from '../api/client';
import type { FileTreeNode } from '../api/client';
import { PubSub } from '../core/PubSub';

let currentPanel: string | null = 'explorer';
let fileTree: FileTreeNode[] = [];

// DOM refs (cached once at init)
let sidebarEl: HTMLElement;
let explorerContent: HTMLElement;

const PANEL_IDS = ['explorer', 'ai', 'telemetry', 'swarm', 'extensions', 'library'] as const;

export function initSidebar(): void {
  sidebarEl = document.getElementById('projecty-sidebar') as HTMLElement;
  explorerContent = document.getElementById('projecty-explorer-tree') as HTMLElement;

  // Listen for panel toggle events from ActivityBar
  PubSub.on('panel:toggle', (panelId) => {
    const id = panelId as string;
    if (currentPanel === id) {
      currentPanel = null;
      sidebarEl.classList.add('hidden');
    } else {
      currentPanel = id;
      sidebarEl.classList.remove('hidden');
      showPanel(id);
    }
  });

  PubSub.on('workspace:set', () => {
    refreshTree();
  });

  // Initial tree load
  refreshTree();
}

function showPanel(id: string): void {
  PANEL_IDS.forEach((pid) => {
    const el = document.getElementById(`projecty-panel-${pid}`);
    if (el) el.classList.toggle('hidden', pid !== id);
  });
}

async function refreshTree(): Promise<void> {
  try {
    const tree = await getFileTree();
    fileTree = Array.isArray(tree) ? tree : [];
    renderTree(fileTree, explorerContent, 0);
  } catch {
    explorerContent.innerHTML = '<p class="panel-hint" style="font-size:11px;padding:8px;">Nenhum workspace aberto.</p>';
  }
}

function renderTree(nodes: FileTreeNode[], parent: HTMLElement, depth: number): void {
  parent.innerHTML = '';
  for (const node of nodes) {
    const row = document.createElement('div');
    row.className = 'projecty-tree-item';
    row.style.paddingLeft = `${12 + depth * 14}px`;
    row.dataset.path = node.path;

    const icon = document.createElement('span');
    icon.className = 'projecty-tree-icon';
    icon.textContent = node.is_dir ? '📂' : getFileIcon(node.name);

    const label = document.createElement('span');
    label.className = 'projecty-tree-label';
    label.textContent = node.name;

    row.appendChild(icon);
    row.appendChild(label);

    if (!node.is_dir) {
      row.addEventListener('click', () => {
        PubSub.emit('file:select', { path: node.path, name: node.name, ext: getExt(node.name) });
      });
      row.addEventListener('mouseenter', () => {
        PubSub.emit('file:hover', node.path);
      });
    }

    parent.appendChild(row);

    if (node.is_dir && node.children) {
      const childContainer = document.createElement('div');
      childContainer.className = 'projecty-tree-children';
      let expanded = false;

      row.addEventListener('click', () => {
        expanded = !expanded;
        childContainer.classList.toggle('hidden', !expanded);
        icon.textContent = expanded ? '📂' : '📁';
      });

      parent.appendChild(childContainer);
      renderTree(node.children, childContainer, depth + 1);
      childContainer.classList.add('hidden');
    }
  }
}

function getFileIcon(name: string): string {
  const ext = getExt(name);
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️', py: '🐍',
    css: '🎨', html: '🌐', json: '📋', md: '📝', txt: '📄',
    yaml: '⚙️', yml: '⚙️', toml: '⚙️', sh: '🐚', bat: '🪟',
  };
  return icons[ext] || '📄';
}

function getExt(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export async function handleBrowseFolder(): Promise<void> {
  try {
    const result = await browseFolder();
    if (result.path) {
      await openFolder(result.path);
      PubSub.emit('workspace:set', result.path);
      refreshTree();
    }
  } catch { /* ignore */ }
}

```

## src\ui\Telemetry.ts
```typescript
/**
 * Project Y — Telemetry UI (v5.0)
 * Surgical DOM updates via element IDs. No Virtual DOM. No re-renders.
 */

import { fetchBrainStatus, fetchSentinelStatus, fetchMotorStatus, fetchDashboard } from '../api/client';
import type { SentinelStatus, DashboardData } from '../api/client';
import { PubSub } from '../core/PubSub';


let pollInterval: ReturnType<typeof setInterval> | null = null;

export function initTelemetry(): void {
  // Initial fetch
  poll();

  // Poll every 5 seconds
  pollInterval = setInterval(poll, 5000);
}

async function poll(): Promise<void> {
  try {
    const [brain, sentinel, motor, dashboard] = await Promise.allSettled([
      fetchBrainStatus(),
      fetchSentinelStatus(),
      fetchMotorStatus(),
      fetchDashboard(),
    ]);

    // Brain
    if (brain.status === 'fulfilled') {
      updateElement('projecty-brain-status', brain.value.is_ready ? '🟢 Online' : '🔴 Offline');
      updateElement('projecty-brain-latency', `${(brain.value.analysis_latency_ms || 0).toFixed(1)}ms`);
      PubSub.emit('brain:updated', brain.value);
    }

    // Sentinel
    if (sentinel.status === 'fulfilled') {
      const s = sentinel.value as SentinelStatus;
      updateElement('projecty-sentinel-indicator', s.panic_triggered ? '🔴 ALERTA' : '🟢 Seguro');
      if (s.panic_triggered) {
        PubSub.emit('sentinel:panic', s.reason || 'Intrusão detectada');
      }
    }

    // Motor
    if (motor.status === 'fulfilled') {
      const m = motor.value;
      updateElement('projecty-motor-status', m.status === 'ready' ? '🟢 Pronto' : m.status === 'starting' ? '🟡 Iniciando' : '🔴 Offline');
      PubSub.emit('motor:updated', m.status);
    }

    // Dashboard
    if (dashboard.status === 'fulfilled') {
      const d = dashboard.value as DashboardData;
      updateElement('projecty-total-tokens', (d.total_tokens || 0).toLocaleString());
      const cloudCost = ((d.total_tokens || 0) / 1000 * 0.015).toFixed(4);
      updateElement('projecty-cloud-cost', `$${cloudCost}`);
      updateElement('projecty-local-cost', '$0.0000');
      updateElement('projecty-savings', `$${cloudCost}`);
    }
  } catch {
    // Silently handle polling failures
  }
}

function updateElement(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function disposeTelemetry(): void {
  if (pollInterval) clearInterval(pollInterval);
}

```

## tailwind.config.js
```text
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

```

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}

```

## vite.config.ts
```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

```

