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
  cache_size: number;
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
  type: 'file' | 'dir';
  children?: FileTreeNode[];
  ext?: string;
  size?: number;
  is_text?: boolean;
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
  nickname?: string;
  vram_free_gb: number;
  is_cortex: boolean;
}

export interface MeshNodesResponse {
  nodes: MeshNode[];
  count: number;
}

export interface MeshStatus {
  gpu_name: string;
  vram_total_gb: number;
  vram_free_gb: number;
  is_cortex: boolean;
  is_running?: boolean;
  port?: number;
  resource_limits?: {
    connected_nodes: number;
    total_machines: number;
    max_vram_pct: number;
    max_ram_pct: number;
    max_cpu_pct: number;
    throttle_active: boolean;
  };
}

export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onDone?: (metrics: Record<string, unknown>) => void;
  onError?: (err: Error) => void;
  onFiles?: (files: Array<{ path: string; status: string; content?: string }>) => void;
  onPendingConfirmation?: (id: string, blocks: unknown[]) => void;
  // ── Tool Calling (Ollama 0.19+) ──
  onToolCall?: (call: { name: string; arguments: Record<string, unknown> }) => void;
  onToolResult?: (result: { name: string; result: Record<string, unknown> }) => void;
  onPendingTool?: (tool: { name: string; arguments: Record<string, unknown> }) => void;
  // ── Bash output capture ──
  onBashOutput?: (output: { command: string; stdout: string; stderr: string; exit_code: number; status: string }) => void;
  // ── Agent Loop cycles ──
  onAgentCycle?: (cycle: { round: number; max_rounds: number; tool_count: number }) => void;
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
  if (!res.ok) {
    const method = init?.method || 'GET';
    console.warn(`[API] ${method} ${url} → HTTP ${res.status}`);
  }
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
    is_ready: false, last_pulse: 0, analysis_latency_ms: 0, cache_size: 0,
  }));

export const fetchSentinelStatus = (): Promise<SentinelStatus> =>
  fetchJSON<SentinelStatus>(`${BASE}/sentinel/status`).catch(() => ({
    is_active: false, panic_triggered: false,
  }));

export const fetchMotorStatus = (): Promise<MotorStatusResponse> =>
  fetchJSON<MotorStatusResponse>(`${BASE}/setup/motor/status`).catch(() => ({ status: 'offline' }));

export const toggleMotor = (): Promise<unknown> =>
  fetchJSON(`${BASE}/setup/motor/toggle`, { method: 'POST' });

// ─── Agent Permissions ───────────────────────────────────────────────
export interface AgentPermissions {
  level: string;
  override_protection: boolean;
}

export const fetchPermissions = (): Promise<AgentPermissions> =>
  fetchJSON<AgentPermissions>(`${BASE}/permissions`);

export function updatePermissions(perms: AgentPermissions): Promise<{ status: string }> {
  return fetchJSON<{ status: string }>(`${BASE}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(perms),
  });
}

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

export const getFileTree = async (): Promise<{ root: string; path: string; tree: FileTreeNode[] }> => {
  const resp = await fetchJSON<{ root: string; path: string; tree: FileTreeNode[] }>(`${WS_BASE}/tree`);
  return resp;
};

export const readFile = (path: string): Promise<FileData> =>
  fetchJSON<FileData>(`${WS_BASE}/file?path=${encodeURIComponent(path)}`);

export function writeFile(path: string, content: string): Promise<{ status: string }> {
  return fetchJSON(`${WS_BASE}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  });
}

export function confirmChanges(changeId: string): Promise<{ files: Array<{ path: string; status: string; }> }> {
  return fetchJSON(`${BASE}/confirm_changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change_id: changeId }),
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

export function unloadModel(model: string): Promise<{ status: string; message?: string }> {
  return fetchJSON<{ status: string; message?: string }>(`${BASE}/ollama/unload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });
}

// ─── Chat CRUD ───────────────────────────────────────────────────
export interface ChatSession { uid: string; title: string; model: string; updated_at: string; }
export interface ChatMsg { role: string; content: string; tokens?: number; created_at?: string; }

export const listChats = (): Promise<{ chats: ChatSession[] }> =>
  fetchJSON<{ chats: ChatSession[] }>(`${BASE}/chats`).catch(() => ({ chats: [] }));

export function createChat(uid: string, title: string, model = ''): Promise<{ uid: string; title: string; model: string }> {
  return fetchJSON(`${BASE}/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, title, model }),
  });
}

export const getChatMessages = (uid: string): Promise<{ messages: ChatMsg[] }> =>
  fetchJSON<{ messages: ChatMsg[] }>(`${BASE}/chats/${uid}/messages`).catch(() => ({ messages: [] }));

export function addChatMessage(uid: string, role: string, content: string, tokens = 0): Promise<unknown> {
  return fetchJSON(`${BASE}/chats/${uid}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content, tokens }),
  });
}

export function deleteChat(uid: string): Promise<unknown> {
  return fetchJSON(`${BASE}/chats/${uid}`, { method: 'DELETE' });
}

export function renameChat(uid: string, title: string): Promise<unknown> {
  return fetchJSON(`${BASE}/chats/${uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

// ─── Mesh (Swarm) ────────────────────────────────────────────────
export const fetchMeshStatus = (): Promise<MeshStatus> =>
  fetchJSON<MeshStatus>(`${BASE}/mesh/status`).catch(() => ({ gpu_name: 'N/A', vram_total_gb: 0, vram_free_gb: 0, is_cortex: false }));

export const fetchMeshNodes = (): Promise<MeshNodesResponse> =>
  fetchJSON<MeshNodesResponse>(`${BASE}/mesh/nodes`).catch(() => ({ nodes: [], count: 0 }));

export function updateMeshConfig(enabled: boolean, port: number): Promise<{ status: string }> {
  return fetchJSON(`${BASE}/mesh/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled, port }),
  });
}

export function probeOllamaNode(host: string, port: number = 11434): Promise<{ reachable: boolean; host: string; port: number; models?: string[]; error?: string }> {
  return fetchJSON(`${BASE}/ollama/probe?host=${encodeURIComponent(host)}&port=${port}`);
}

export async function pingMeshNode(ip: string, port: number = 8000): Promise<boolean> {
  /** (Swarm v7.0) Ping via backend proxy — avoids CORS issues from Electron file:// */
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${BASE}/mesh/ping-node?ip=${encodeURIComponent(ip)}&port=${port}`, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      return data.reachable === true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function delegateMeshPrediction(targetIp: string, targetPort: number, taskId: string, context: string, prompt: string): Promise<any> {
  /** (Swarm v6.0) Assembles the stateless payload and offloads to a Cortex node. */
  return fetchJSON(`http://${targetIp}:${targetPort}/api/predict/next-steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      compiled_context: context,
      prompt: prompt,
      model_tier: 'high'
    }),
  });
}

// ─── Extensions ──────────────────────────────────────────────────
export const fetchExtensionsPath = (): Promise<{ path: string }> =>
  fetchJSON<{ path: string }>(`${BASE}/extensions/path`);

export const fetchExtensions = (): Promise<unknown[]> =>
  fetchJSON<{ extensions: unknown[] }>(`${BASE}/extensions/`).then(r => r.extensions ?? []);

export const toggleExtension = (id: string): Promise<unknown> =>
  fetchJSON(`${BASE}/extensions/${id}/toggle`, { method: 'POST' });

// ─── Library ─────────────────────────────────────────────────────
export const fetchLibraryList = (): Promise<{ documents: unknown[]; folders: unknown[] }> =>
  fetchJSON<{ documents: unknown[]; folders: unknown[] }>(`${BASE}/library/list`).catch(() => ({ documents: [], folders: [] }));

export function createLibraryFolder(name: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export function moveLibraryDoc(docName: string, folder: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/document/move`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_name: docName, folder }),
  });
}

export function deleteLibraryDoc(docName: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/document/${encodeURIComponent(docName)}`, {
    method: 'DELETE',
  });
}

export function deleteLibraryFolder(folderName: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/folder/${encodeURIComponent(folderName)}`, {
    method: 'DELETE',
  });
}

export function renameLibraryFolder(oldName: string, newName: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/folder/rename`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_name: oldName, new_name: newName }),
  });
}

export function searchLibrary(query: string): Promise<{ results: unknown[] }> {
  return fetchJSON<{ results: unknown[] }>(`${BASE}/library/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  }).catch(() => ({ results: [] }));
}

export function savePersonalityText(text: string, name?: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/library/personality/text`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, name: name || 'inline-personality' }),
  });
}

// ─── Memory CRUD ─────────────────────────────────────────────────
export interface MemoryItem {
  id: number;
  type: string;
  content: string;
  source: string;
  timestamp: string;
}

export const fetchMemories = (): Promise<{ memories: MemoryItem[] }> =>
  fetchJSON<{ memories: MemoryItem[] }>(`${BASE}/memories`).catch(() => ({ memories: [] }));

export function createMemory(type: string, content: string): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content }),
  });
}

export function deleteMemory(memoryId: number): Promise<{ success: boolean }> {
  return fetchJSON(`${BASE}/memories/${memoryId}`, { method: 'DELETE' });
}

// ─── Shield ──────────────────────────────────────────────────────
export interface ShieldReport {
  is_active: boolean;
  scans_performed: number;
  threats_blocked: number;
  uptime_seconds: number;
  last_scan_time: number;
  panic_triggered: boolean;
  last_reason: string;
  blacklist_size: number;
}

export const fetchShieldReport = (): Promise<ShieldReport> =>
  fetchJSON<ShieldReport>(`${BASE}/shield/report`).catch(() => ({
    is_active: false, scans_performed: 0, threats_blocked: 0,
    uptime_seconds: 0, last_scan_time: 0, panic_triggered: false,
    last_reason: '', blacklist_size: 0
  }));

// ─── SSE Streaming (Agent Generate) ─────────────────────────────
export function streamGenerate(
  params: { prompt: string; mode: string; model?: string; format?: string; history?: { role: string; content: string }[]; strict_library_mode?: boolean; thinking_mode?: boolean },
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

      const processSSEBuffer = (text: string) => {
        const lines = text.split('\n\n');
        const remaining = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
            if (data.error) { console.error('[SSE] Error event:', data.error); callbacks.onError?.(new Error(data.error as string)); gotDone = true; return remaining; }
            if (data.files) { console.log('[SSE] 📂 Files event:', JSON.stringify(data.files)); callbacks.onFiles?.(data.files as Array<{ path: string; status: string }>); continue; }
            if (data.pending_confirmation) { console.log('[SSE] ⚠️ PendingConfirmation event:', data.pending_confirmation); callbacks.onPendingConfirmation?.(data.pending_confirmation as string, data.blocks as unknown[]); continue; }
            // ── Tool Calling Events (Ollama 0.19+) ──
            if (data.tool_call) { console.log('[SSE] 🔧 ToolCall event:', JSON.stringify(data.tool_call)); callbacks.onToolCall?.(data.tool_call as { name: string; arguments: Record<string, unknown> }); continue; }
            if (data.tool_result) { console.log('[SSE] ✅ ToolResult event:', JSON.stringify(data.tool_result)); callbacks.onToolResult?.(data.tool_result as { name: string; result: Record<string, unknown> }); continue; }
            if (data.pending_tool) { console.log('[SSE] ⚠️ PendingTool event:', JSON.stringify(data.pending_tool)); callbacks.onPendingTool?.(data.pending_tool as { name: string; arguments: Record<string, unknown> }); continue; }
            if (data.bash_output) { console.log('[SSE] 💻 BashOutput event:', JSON.stringify(data.bash_output)); callbacks.onBashOutput?.(data.bash_output as { command: string; stdout: string; stderr: string; exit_code: number; status: string }); continue; }
            if (data.agent_cycle) { console.log(`[SSE] 🔄 AgentCycle: round ${(data.agent_cycle as {round: number}).round}`); callbacks.onAgentCycle?.(data.agent_cycle as { round: number; max_rounds: number; tool_count: number }); continue; }
            if (data.metrics) { console.log('[SSE] 📊 Metrics/Done event'); callbacks.onDone?.(data.metrics as Record<string, unknown>); gotDone = true; continue; }
            if (data.token !== undefined) { callbacks.onToken?.(data.token as string); }
          } catch { /* skip malformed SSE */ }
        }
        return remaining;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = processSSEBuffer(buffer);
      }

      // CRITICAL: Flush remaining buffer after stream closes
      // The last SSE event (files/pending_confirmation) may still be in the buffer
      if (buffer.trim()) {
        console.log('[SSE] 🔄 Flushing remaining buffer, length:', buffer.length);
        processSSEBuffer(buffer + '\n\n');
      }

      if (!gotDone) callbacks.onDone?.({});
    })
    .catch((err: Error) => {
      // AbortError = user cancelled, TypeError = SSE stream naturally closed — both are normal
      if (err.name === 'AbortError') return;
      if (err.name === 'TypeError' && (err.message.includes('body') || err.message.includes('network') || err.message.includes('blocked'))) {
        // SSE stream termination is normal — don't show error
        return;
      }
      callbacks.onError?.(new Error(
        err.message === 'Failed to fetch'
          ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8001.'
          : err.message
      ));
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
