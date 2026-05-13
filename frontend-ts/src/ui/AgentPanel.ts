/**
 * Lumina IDE — Agent Panel (v8.0)
 * Premium AI Chat with hidden thinking, animated processing indicator,
 * file attachments, @mentions, and professional UI.
 * SSE streaming. Pure DOM manipulation — no frameworks.
 */

import { fetchModels, streamGenerate, confirmChanges, unloadModel, fetchConfig, updateConfig, listChats, createChat, getChatMessages, addChatMessage, deleteChat, renameChat, getFileTree } from '../api/client';
import type { StreamCallbacks, ChatSession } from '../api/client';
import { PubSub } from '../core/PubSub';
import { marked } from 'marked';
import { getWebStudioHTML } from './WebStudioPanel';

let chatOutput: HTMLElement;
let promptInput: HTMLTextAreaElement;
let sendBtn: HTMLButtonElement;
let modelSelect: HTMLSelectElement;
let strictLibraryCheck: HTMLInputElement;
let thinkingModeCheck: HTMLInputElement;
let attachInput: HTMLInputElement;
let attachPreview: HTMLElement;
let currentAbort: (() => void) | null = null;
let isStreaming = false;
let chatHistory: { role: string; content: string }[] = [];
let attachedFiles: { name: string; content: string }[] = [];

// ─── Chat History Management (Antigravity-style) ─────────────────
let activeChatUid: string = '';
let allChats: ChatSession[] = [];

function generateUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function loadChatList(): Promise<void> {
  try {
    const resp = await listChats();
    allChats = resp.chats || [];
    renderChatList();
  } catch (err) { console.warn('[Agent] Failed to load chat list:', err); }
}

function renderChatList(): void {
  const containers = [
    document.getElementById('projecty-chat-list'),
    document.getElementById('projecty-chat-list-sidebar'),
  ].filter(Boolean) as HTMLElement[];

  // If no containers found (e.g., panel detached to popup), try popup's document
  if (containers.length === 0 && chatOutput?.ownerDocument) {
    const popupDoc = chatOutput.ownerDocument;
    const popupContainers = [
      popupDoc.getElementById('projecty-chat-list'),
      popupDoc.getElementById('projecty-chat-list-sidebar'),
    ].filter(Boolean) as HTMLElement[];
    containers.push(...popupContainers);
  }

  if (containers.length === 0) return;
  
  for (const listEl of containers) {
    if (allChats.length === 0) {
      listEl.innerHTML = '<div style="padding:8px 12px; color:var(--text-muted); font-size:10px;">Nenhum chat salvo</div>';
      continue;
    }
    listEl.innerHTML = allChats.map(c => {
      const isActive = c.uid === activeChatUid;
      return `<div class="chat-history-item ${isActive ? 'active' : ''}" data-uid="${c.uid}" style="
        padding:6px 10px; cursor:pointer; font-size:11px; display:flex; justify-content:space-between; align-items:center;
        border-radius:4px; margin:2px 4px;
        background:${isActive ? 'rgba(0,163,255,0.1)' : 'transparent'};
        color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'};
        transition: background 0.15s;
      ">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${c.title || 'Chat sem título'}</span>
        <span style="display:flex; align-items:center; gap:4px; flex-shrink:0; margin-left:4px;">
          ${c.model ? `<span style="font-size:8px; padding:1px 5px; border-radius:3px; background:rgba(0,163,255,0.12); color:var(--accent,#00a3ff); white-space:nowrap;">${c.model.split(':')[0]}</span>` : ''}
          <span style="font-size:9px; color:var(--text-muted);">${formatRelativeTime(c.updated_at)}</span>
        </span>
      </div>`;
    }).join('');
    // Wire clicks + right-click context menu
    listEl.querySelectorAll('.chat-history-item').forEach(el => {
      el.addEventListener('click', () => {
        const uid = (el as HTMLElement).dataset.uid;
        if (uid && uid !== activeChatUid) switchToChat(uid);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const uid = (el as HTMLElement).dataset.uid;
        if (!uid) return;
        const chat = allChats.find(c => c.uid === uid);
        showChatContextMenu(e as MouseEvent, uid, chat?.title || '');
      });
    });
  }
}

function showChatContextMenu(e: MouseEvent, uid: string, currentTitle: string): void {
  // Use ownerDocument for popup support
  const doc = chatOutput?.ownerDocument ?? document;
  // Remove any existing context menu
  doc.getElementById('chat-ctx-menu')?.remove();

  const menu = doc.createElement('div');
  menu.id = 'chat-ctx-menu';
  menu.style.cssText = `
    position:fixed; z-index:9999;
    left:${e.clientX}px; top:${e.clientY}px;
    background:var(--bg-panel, #1e1e2e); border:1px solid var(--border, #333);
    border-radius:6px; padding:4px 0; min-width:140px;
    box-shadow:0 4px 16px rgba(0,0,0,0.4);
    font-size:11px; color:var(--text, #cdd6f4);
  `;
  menu.innerHTML = `
    <div class="ctx-item" data-action="rename" style="padding:6px 14px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:background 0.1s;">
      <span>✏️</span><span>Renomear</span>
    </div>
    <div style="height:1px; background:var(--border,#333); margin:2px 8px;"></div>
    <div class="ctx-item" data-action="delete" style="padding:6px 14px; cursor:pointer; display:flex; align-items:center; gap:6px; color:var(--accent-red, #f38ba8); transition:background 0.1s;">
      <span>🗑️</span><span>Deletar</span>
    </div>
  `;
  doc.body.appendChild(menu);

  // Hover effects
  menu.querySelectorAll('.ctx-item').forEach(item => {
    (item as HTMLElement).addEventListener('mouseenter', () => {
      (item as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
    });
    (item as HTMLElement).addEventListener('mouseleave', () => {
      (item as HTMLElement).style.background = 'transparent';
    });
  });

  // Handle actions
  menu.querySelector('[data-action="rename"]')?.addEventListener('click', async () => {
    menu.remove();
    const newTitle = prompt('Novo nome do chat:', currentTitle);
    if (newTitle !== null && newTitle.trim()) {
      try {
        await renameChat(uid, newTitle.trim());
        await loadChatList();
      } catch (err) { console.warn('[Agent] Failed to rename chat:', err); }
    }
  });

  menu.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
    menu.remove();
    if (!confirm('Deletar este chat permanentemente?')) return;
    try {
      // Remove locally for instant visual feedback
      allChats = allChats.filter(c => c.uid !== uid);
      renderChatList();
      
      // Delete on server
      await deleteChat(uid);
      
      if (uid === activeChatUid) {
        // Switch to newest remaining chat or create new
        if (allChats.length > 0) {
          await switchToChat(allChats[0].uid);
        } else {
          await startNewChat();
        }
      }
      // Re-sync from server to be safe
      await loadChatList();
    } catch (err) { console.warn('[Agent] Failed to delete chat:', err); }
  });

  // Close on click outside
  const closeMenu = (ev: MouseEvent) => {
    if (!menu.contains(ev.target as Node)) {
      menu.remove();
      doc.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => doc.addEventListener('click', closeMenu), 0);
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  } catch { return ''; }
}

async function switchToChat(uid: string): Promise<void> {
  activeChatUid = uid;
  chatHistory = [];
  chatOutput.innerHTML = '';
  try {
    const resp = await getChatMessages(uid);
    const msgs = resp.messages || [];
    for (const m of msgs) {
      chatHistory.push({ role: m.role, content: m.content });
      if (m.role === 'user') {
        appendMessage('user', m.content);
      } else {
        const el = appendMessage('assistant', '');
        el.innerHTML = processThinking(m.content);
      }
    }
  } catch (err) { console.warn('[Agent] Failed to load chat messages:', err); }
  renderChatList();
  // Restore model from chat session
  const chatData = allChats.find(c => c.uid === uid);
  if (chatData?.model && modelSelect) {
    // Check if model exists in dropdown
    const opts = Array.from(modelSelect.options).map(o => o.value);
    if (opts.includes(chatData.model)) {
      modelSelect.value = chatData.model;
    }
  }
  // Close history panel after switching
  const hp = document.getElementById('projecty-chat-history-panel');
  if (hp) hp.style.display = 'none';
}

async function startNewChat(): Promise<void> {
  const uid = generateUid();
  const title = 'Novo Chat';
  const currentModel = modelSelect?.value || '';
  try {
    await createChat(uid, title, currentModel);
    activeChatUid = uid;
    chatHistory = [];
    chatOutput.innerHTML = '';
    await loadChatList();
  } catch (err) { console.warn('[Agent] Failed to create new chat:', err); }
}

/** Detect model tier from model name → adaptive context limits */
function getModelTier(): { maxMessages: number; summaryDepth: number; tier: string } {
  const model = (modelSelect?.value || '').toLowerCase();
  const isCloud = document.getElementById('projecty-mode-cloud')?.classList.contains('active');

  // Cloud models → full context
  if (isCloud) return { maxMessages: 30, summaryDepth: 8, tier: 'cloud' };

  // Parse param count from model name patterns like "llama3.2:1b", "mistral:7b", "qwen2.5:72b"
  const paramMatch = model.match(/:(\d+\.?\d*)b/i);
  const params = paramMatch ? parseFloat(paramMatch[1]) : 7; // default 7B if unknown

  if (params <= 3) {
    // Small models (1-3B): tight context, aggressive compression
    return { maxMessages: 4, summaryDepth: 3, tier: 'small' };
  } else if (params <= 14) {
    // Medium models (7-13B): balanced context
    return { maxMessages: 12, summaryDepth: 5, tier: 'medium' };
  } else {
    // Large models (30B+): generous context
    return { maxMessages: 20, summaryDepth: 8, tier: 'large' };
  }
}

/** Build a compressed summary digest of messages — includes BOTH user topics and Lumina's key responses */
function buildChatDigest(messages: { role: string; content: string }[], maxEntries: number): string {
  const entries: string[] = [];
  for (const m of messages) {
    if (entries.length >= maxEntries) break;
    if (m.role === 'user') {
      entries.push(`👤 User: ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`);
    } else if (m.role === 'assistant') {
      // Extract the first meaningful line of Lumina's response (skip empty/code blocks)
      const firstLine = m.content.split('\n').find(l => l.trim().length > 10 && !l.startsWith('```'));
      if (firstLine) {
        entries.push(`✦ Lumina: ${firstLine.slice(0, 100)}${firstLine.length > 100 ? '...' : ''}`);
      }
    }
  }
  return entries.join('\n');
}

/** Antigravity-style: adaptive context window scaled by model size + IDE context */
function buildContextWindow(): { role: string; content: string }[] {
  const result: { role: string; content: string }[] = [];
  const { maxMessages, summaryDepth, tier } = getModelTier();

  // Smart Context Injection: active file + workspace
  const contextParts: string[] = [];
  try {
    const activeTab = document.querySelector('.tab-bar .tab.active .tab-name');
    if (activeTab?.textContent) contextParts.push(`Arquivo ativo: ${activeTab.textContent}`);
    const workspaceEl = document.querySelector('.sidebar-header .workspace-name, .file-tree-header');
    if (workspaceEl?.textContent) contextParts.push(`Workspace: ${workspaceEl.textContent.trim()}`);
  } catch (err) { console.warn('[Agent] Failed to gather IDE context:', err); }
  if (contextParts.length > 0) {
    result.push({ role: 'system', content: `[IDE Context] ${contextParts.join(' | ')}` });
  }

  // If chat fits in the window for this model tier → send everything
  if (chatHistory.length <= maxMessages) {
    return [...result, ...chatHistory];
  }

  // Split: recent messages (full) + older messages (compressed digest)
  const recent = chatHistory.slice(-maxMessages);
  const older = chatHistory.slice(0, -maxMessages);

  // Build a rich digest — user topics + Lumina's key responses
  const digest = buildChatDigest(older, summaryDepth * 2);
  const digestMsg: { role: string; content: string } = {
    role: 'system',
    content: `[Resumo da conversa anterior — ${older.length} mensagens, modelo tier: ${tier}]\n${digest}\n[Fim do resumo — as ${recent.length} mensagens mais recentes seguem abaixo]`
  };

  return [...result, digestMsg, ...recent];
}

async function persistMessage(role: string, content: string): Promise<void> {
  if (!activeChatUid) return;
  try {
    await addChatMessage(activeChatUid, role, content);
    const currentModel = modelSelect?.value || '';
    // Auto-title + model: use first user message as chat title, always persist model
    if (role === 'user' && chatHistory.filter(m => m.role === 'user').length <= 1) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await fetch(`/api/chats/${activeChatUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model: currentModel }),
      }).catch(() => {});
      loadChatList();
    } else if (currentModel) {
      // Always keep model up to date
      await fetch(`/api/chats/${activeChatUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: currentModel }),
      }).catch(() => {});
    }
  } catch { /* ignore — don't break the flow */ }
}

/** Export current chat as a .md file for sharing */
function exportChatAsMarkdown(): void {
  if (chatHistory.length === 0) return;
  const chatTitle = allChats.find(c => c.uid === activeChatUid)?.title || 'Chat Lumina';
  const now = new Date().toISOString().slice(0, 10);
  let md = `# ${chatTitle}\n\n> Exportado da Lumina IDE em ${now}\n\n---\n\n`;
  for (const msg of chatHistory) {
    if (msg.role === 'user') {
      md += `## 🧑 Você\n\n${msg.content}\n\n---\n\n`;
    } else {
      md += `## ✦ Lumina\n\n${msg.content}\n\n---\n\n`;
    }
  }
  // Trigger download
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const doc = chatOutput?.ownerDocument ?? document;
  const a = doc.createElement('a');
  a.href = url;
  a.download = `${chatTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}_${now}.md`;
  doc.body.appendChild(a);
  a.click();
  doc.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function restoreOrCreateChat(): Promise<void> {
  try {
    const resp = await listChats();
    allChats = resp.chats || [];
    if (allChats.length > 0) {
      // Restore most recent chat
      await switchToChat(allChats[0].uid);
    } else {
      // First use — create a chat
      await startNewChat();
    }
  } catch {
    // Offline fallback — generate a local uid
    activeChatUid = generateUid();
  }
}

export function initAgentPanel(): void {
  const panel = document.getElementById('projecty-agent-container') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <!-- Agent Header Bar -->
    <div class="agent-header">
      <div class="agent-header-left">
        <span class="agent-logo">✦</span>
        <span class="agent-badge">AGENT</span>
      </div>
      <div class="agent-header-right">
        <button id="agent-settings-btn" title="Configurações do painel" style="background:none;border:1px solid var(--border,#333);color:var(--text-muted,#888);cursor:pointer;padding:3px 8px;border-radius:4px;font-size:11px;transition:all 0.2s;">⚙</button>
        <button id="agent-history-btn" title="Histórico de Chats" style="background:none;border:1px solid var(--border,#333);color:var(--text-muted,#888);cursor:pointer;padding:3px 8px;border-radius:4px;font-size:11px;transition:all 0.2s;">📋</button>
        <button id="agent-export-btn" title="Exportar Chat (.md)" style="background:none;border:1px solid var(--border,#333);color:var(--text-muted,#888);cursor:pointer;padding:3px 8px;border-radius:4px;font-size:11px;transition:all 0.2s;">📥</button>
        <button id="agent-new-chat-btn" title="Novo Chat" style="background:none;border:1px solid var(--border,#333);color:var(--text-muted,#888);cursor:pointer;padding:3px 8px;border-radius:4px;font-size:11px;transition:all 0.2s;">＋</button>
        <button id="agent-unload-btn" class="agent-unload-btn" title="Pausar modelo (liberar VRAM)" style="background:none;border:1px solid var(--border,#333);color:var(--text-muted,#888);cursor:pointer;padding:3px 8px;border-radius:4px;font-size:12px;transition:all 0.2s;">⏹</button>
      </div>
    </div>

    <!-- Settings Popover -->
    <div id="projecty-agent-settings" style="display:none; background:var(--bg-panel,#1e1e2e); border-bottom:1px solid var(--border); padding:8px 12px;">
      <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); margin-bottom:6px; letter-spacing:0.5px;">Layout do Histórico</div>
      <div style="display:flex; gap:6px;">
        <button id="agent-layout-sidebar" class="agent-layout-btn" style="flex:1;padding:5px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:10px;transition:all 0.2s;">◧ Lateral</button>
        <button id="agent-layout-top" class="agent-layout-btn" style="flex:1;padding:5px 8px;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--text-secondary);cursor:pointer;font-size:10px;transition:all 0.2s;">▤ Topo</button>
      </div>
    </div>

    <!-- Agent Content Wrapper (sidebar layout support) -->
    <div id="projecty-agent-body" style="display:flex; flex:1; overflow:hidden; min-height:0;">
      <!-- Chat History Sidebar (hidden by default, shown when layout=sidebar) -->
      <div id="projecty-chat-history-sidebar" style="display:none; width:180px; border-right:1px solid var(--border); overflow-y:auto; background:var(--bg-surface,#141420); flex-shrink:0;">
        <div style="padding:6px 8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border);">
          <span style="font-size:9px; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px;">Chats</span>
          <button id="agent-sidebar-new-chat" style="background:none;border:none;color:var(--accent,#00a3ff);cursor:pointer;font-size:14px;padding:0 2px;" title="Novo Chat">＋</button>
        </div>
        <div id="projecty-chat-list-sidebar"></div>
      </div>

      <!-- Main chat area -->
      <div style="display:flex; flex-direction:column; flex:1; overflow:hidden; min-height:0;">
        <!-- Chat History Dropdown (shown when layout=top) -->
        <div id="projecty-chat-history-panel" style="display:none; background:var(--bg-overlay); border-bottom:1px solid var(--border); max-height:120px; overflow-y:auto;">
          <div id="projecty-chat-list"></div>
        </div>

        <!-- Chat Messages -->
        <div id="projecty-chat-output" class="agent-chat-output"></div>

        <!-- Attached Files Preview -->
        <div id="projecty-attach-preview" class="agent-attach-preview" style="display:none;"></div>

        <!-- Controls Bar (model select + strict) -->
        <div class="agent-controls-bar">
          <div class="agent-mode-toggle">
            <button id="projecty-mode-local" class="agent-mode-btn active" title="Modelo Local (Ollama)">Local</button>
            <button id="projecty-mode-cloud" class="agent-mode-btn" title="Modelo Cloud (API Key)">☁ Cloud</button>
          </div>
          <select id="projecty-model-select" class="agent-model-select">
            <option value="mistral">mistral</option>
          </select>
          <label class="agent-strict-label" title="Só usa conhecimento da Library e Workspace (Modo NotebookLM)">
            <input type="checkbox" id="projecty-strict-library" />
            <span class="agent-strict-text">Strict</span>
          </label>
          <label class="agent-thinking-label" title="Raciocínio passo-a-passo (recomendado para uso local)">
            <input type="checkbox" id="projecty-thinking-mode" />
            <span class="agent-thinking-text">🧠 Think</span>
          </label>
          <span id="projecty-thinking-warn" class="agent-thinking-warn" style="display:none;">⚠️ Tokens</span>
        </div>

        <!-- Input Bar -->
        <div class="agent-input-bar" style="position:relative;">
          <div id="projecty-mention-dropdown" class="agent-mention-dropdown" style="display:none;"></div>
          <div class="agent-input-actions">
            <button id="projecty-attach-btn" class="agent-action-btn" title="Anexar arquivo de texto para contexto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <button id="projecty-mention-btn" class="agent-action-btn" title="Mencionar contexto (@)" style="font-size:14px;font-weight:700;color:var(--accent,#7c3aed);">@</button>
            <input id="projecty-attach-input" type="file" accept=".txt,.md,.py,.js,.ts,.json,.html,.css,.yaml,.yml,.toml,.xml,.csv,.log" multiple style="display:none;" />
          </div>
          <textarea id="projecty-prompt-input" class="agent-prompt-input" placeholder="Ask Lumina anything... (type @ to mention)" rows="1"></textarea>
          <button id="projecty-send-btn" class="agent-send-btn" title="Send (Enter)">✦</button>
        </div>
      </div>
    </div>
  `;

  chatOutput = document.getElementById('projecty-chat-output') as HTMLElement;
  promptInput = document.getElementById('projecty-prompt-input') as HTMLTextAreaElement;
  sendBtn = document.getElementById('projecty-send-btn') as HTMLButtonElement;
  modelSelect = document.getElementById('projecty-model-select') as HTMLSelectElement;
  strictLibraryCheck = document.getElementById('projecty-strict-library') as HTMLInputElement;
  thinkingModeCheck = document.getElementById('projecty-thinking-mode') as HTMLInputElement;

  // Restore thinking mode from localStorage
  const savedThinking = localStorage.getItem('lumina-thinking-mode');
  if (savedThinking === 'true') thinkingModeCheck.checked = true;
  thinkingModeCheck.addEventListener('change', () => {
    localStorage.setItem('lumina-thinking-mode', String(thinkingModeCheck.checked));
    updateThinkingWarn();
  });

  // Wire mode toggle
  const modeLocalBtn = document.getElementById('projecty-mode-local');
  const modeCloudBtn = document.getElementById('projecty-mode-cloud');
  if (modeLocalBtn && modeCloudBtn) {
    modeLocalBtn.addEventListener('click', () => {
      modeLocalBtn.classList.add('active');
      modeCloudBtn.classList.remove('active');
      // Remove cloud badge if present
      const badge = document.getElementById('projecty-cloud-provider-badge');
      if (badge) badge.remove();
      loadModels(); // reload local models
      updateThinkingWarn();
    });
    modeCloudBtn.addEventListener('click', async () => {
      modeCloudBtn.classList.add('active');
      modeLocalBtn.classList.remove('active');
      updateThinkingWarn();
      // Load cloud model from config + populate provider-specific models
      try {
        const config = await fetchConfig();
        const provider = (config as Record<string, unknown>).cloud_provider as string || '';
        const cloudModel = (config as Record<string, unknown>).cloud_model as string || 'gpt-4o';
        const hasKey = !!(config as Record<string, unknown>).has_cloud_key;

        // Provider-specific model catalogs (updated 2026)
        const CLOUD_MODELS: Record<string, string[]> = {
          openai:     ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o4-mini', 'o3-mini', 'o1-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'],
          anthropic:  ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
          groq:       ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
          xai:        ['grok-3', 'grok-3-mini', 'grok-2', 'grok-beta'],
          deepseek:   ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
          google:     ['gemini-2.5-pro-preview-05-06', 'gemini-2.5-flash-preview-04-17', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash'],
          nvidia:     ['meta/llama-3.1-405b-instruct', 'meta/llama-3.3-70b-instruct', 'mistralai/mixtral-8x22b-instruct-v0.1'],
          together:   ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
          mistralai:  ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mistral-7b', 'codestral-latest'],
          huggingface:['meta-llama/Meta-Llama-3-70B-Instruct', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
          replicate:  ['meta/llama-3-70b-instruct', 'mistralai/mixtral-8x7b-instruct-v0.1'],
          custom:     ['gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.0-flash', 'mistral-large-latest'],
        };

        const models = CLOUD_MODELS[provider] || CLOUD_MODELS['custom'];
        // Ensure the saved cloud model is always first
        const uniqueModels = [cloudModel, ...models.filter(m => m !== cloudModel)];

        modelSelect.innerHTML = uniqueModels
          .map(m => `<option value="${m}"${m === cloudModel ? ' selected' : ''}>${m}</option>`)
          .join('');

        // Show/remove provider badge
        let badge = document.getElementById('projecty-cloud-provider-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.id = 'projecty-cloud-provider-badge';
          badge.style.cssText = 'font-size:9px;padding:2px 6px;border-radius:3px;font-weight:600;letter-spacing:0.3px;margin-left:4px;';
          modeCloudBtn.parentElement?.appendChild(badge);
        }

        if (hasKey && provider) {
          badge.textContent = provider.toUpperCase();
          badge.style.background = 'rgba(0,163,255,0.15)';
          badge.style.color = '#00a3ff';
        } else {
          badge.textContent = '⚠ SEM KEY';
          badge.style.background = 'rgba(243,139,168,0.15)';
          badge.style.color = '#f38ba8';
        }
      } catch {
        modelSelect.innerHTML = '<option value="gpt-4o">gpt-4o</option>';
      }
    });
  }
  attachInput = document.getElementById('projecty-attach-input') as HTMLInputElement;
  attachPreview = document.getElementById('projecty-attach-preview') as HTMLElement;

  const attachBtn = document.getElementById('projecty-attach-btn') as HTMLButtonElement;

  loadModels(true); // first load — restore from config
  // Refresh model list periodically (every 15s) — skip when in cloud mode
  setInterval(() => {
    const isCloud = document.getElementById('projecty-mode-cloud')?.classList.contains('active');
    if (!isCloud) loadModels(false);
  }, 15000);

  // ─── Settings gear ──────────────────────────────────────────────
  const settingsBtn = document.getElementById('agent-settings-btn');
  const settingsPanel = document.getElementById('projecty-agent-settings');
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      const vis = settingsPanel.style.display !== 'none';
      settingsPanel.style.display = vis ? 'none' : 'block';
    });
  }

  // ─── Layout toggle (sidebar vs top) ────────────────────────────
  let chatLayout: 'sidebar' | 'top' = (localStorage.getItem('lumina-chat-layout') as 'sidebar' | 'top') || 'top';
  const sidebarEl = document.getElementById('projecty-chat-history-sidebar');
  const layoutSidebarBtn = document.getElementById('agent-layout-sidebar');
  const layoutTopBtn = document.getElementById('agent-layout-top');

  function applyLayout(): void {
    const histPanel = document.getElementById('projecty-chat-history-panel');
    if (chatLayout === 'sidebar') {
      if (sidebarEl) sidebarEl.style.display = '';
      if (histPanel) histPanel.style.display = 'none';
      if (layoutSidebarBtn) { layoutSidebarBtn.style.background = 'rgba(0,163,255,0.15)'; layoutSidebarBtn.style.color = 'var(--accent)'; layoutSidebarBtn.style.borderColor = 'var(--accent)'; }
      if (layoutTopBtn) { layoutTopBtn.style.background = 'transparent'; layoutTopBtn.style.color = 'var(--text-secondary)'; layoutTopBtn.style.borderColor = 'var(--border)'; }
      loadChatList();
    } else {
      if (sidebarEl) sidebarEl.style.display = 'none';
      if (layoutTopBtn) { layoutTopBtn.style.background = 'rgba(0,163,255,0.15)'; layoutTopBtn.style.color = 'var(--accent)'; layoutTopBtn.style.borderColor = 'var(--accent)'; }
      if (layoutSidebarBtn) { layoutSidebarBtn.style.background = 'transparent'; layoutSidebarBtn.style.color = 'var(--text-secondary)'; layoutSidebarBtn.style.borderColor = 'var(--border)'; }
    }
    localStorage.setItem('lumina-chat-layout', chatLayout);
  }

  layoutSidebarBtn?.addEventListener('click', () => { chatLayout = 'sidebar'; applyLayout(); });
  layoutTopBtn?.addEventListener('click', () => { chatLayout = 'top'; applyLayout(); });
  applyLayout();

  // ─── Chat History buttons ──────────────────────────────────────
  const historyBtn = document.getElementById('agent-history-btn');
  const historyPanel = document.getElementById('projecty-chat-history-panel');
  if (historyBtn && historyPanel) {
    historyBtn.addEventListener('click', () => {
      if (chatLayout === 'sidebar') {
        // In sidebar mode, toggle sidebar visibility
        if (sidebarEl) {
          const vis = sidebarEl.style.display !== 'none';
          sidebarEl.style.display = vis ? 'none' : '';
          if (!vis) loadChatList();
        }
      } else {
        // In top mode, toggle dropdown
        const isVisible = historyPanel.style.display !== 'none';
        historyPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) loadChatList();
      }
    });
  }
  const newChatBtn = document.getElementById('agent-new-chat-btn');
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      startNewChat();
      if (historyPanel) historyPanel.style.display = 'none';
    });
  }
  // Sidebar new chat button
  document.getElementById('agent-sidebar-new-chat')?.addEventListener('click', () => startNewChat());

  const exportBtn = document.getElementById('agent-export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportChatAsMarkdown());
  }

  // ─── Restore last chat or create new ───────────────────────────
  restoreOrCreateChat();
  PubSub.on('models:changed', () => loadModels(false));

  // Persist model selection to backend config on change
  modelSelect.addEventListener('change', () => {
    const selected = modelSelect.value;
    if (selected) {
      const isCloud = document.getElementById('projecty-mode-cloud')?.classList.contains('active');
      if (isCloud) {
        updateConfig({ cloud_model: selected }).catch(() => {});
      } else {
        updateConfig({ local_model: selected }).catch(() => {});
      }
      // Persist model to active chat session
      if (activeChatUid) {
        fetch(`/api/chats/${activeChatUid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: selected }),
        }).catch(() => {});
      }
    }
  });

  // Unload model button (free VRAM)
  const unloadBtn = document.getElementById('agent-unload-btn');
  if (unloadBtn) {
    unloadBtn.addEventListener('click', async () => {
      const model = modelSelect.value?.trim();
      if (!model) return;
      unloadBtn.textContent = '⏳';
      try {
        await unloadModel(model);
        unloadBtn.textContent = '✅';
        setTimeout(() => { unloadBtn.textContent = '⏹'; }, 2000);
      } catch {
        unloadBtn.textContent = '❌';
        setTimeout(() => { unloadBtn.textContent = '⏹'; }, 2000);
      }
    });
  }

  sendBtn.addEventListener('click', handleSend);

  promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
    // Don't send if mention dropdown is active — let mention handler consume Enter
    if (e.key === 'Enter' && !e.shiftKey && !mentionDropdownVisible) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-expand textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
  });

  // File attachment
  attachBtn.addEventListener('click', () => attachInput.click());
  attachInput.addEventListener('change', handleFileAttach);

  // ─── @ Mention System ──────────────────────────────────────────
  initMentionSystem();
}

// ─── @ Mention System ─────────────────────────────────────────────

interface MentionDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  getData: () => string;
}

let activeMentions: string[] = [];  // IDs of active mentions
let mentionDropdownVisible = false;
let mentionActiveIdx = 0;

const MENTION_DEFS: MentionDef[] = [
  {
    id: 'code', name: 'Código Ativo', icon: '📄', desc: 'Conteúdo do arquivo aberto no editor',
    getData: () => {
      // Use main window document for editor state (editor is never in popup)
      const textarea = window.document.querySelector('.code-textarea') as HTMLTextAreaElement;
      const tab = window.document.querySelector('.tab.active .tab-label');
      const name = tab?.textContent || 'arquivo';
      if (textarea && textarea.value.trim()) {
        return `\n\n═══ @CÓDIGO: ${name} ═══\n\`\`\`\n${textarea.value.slice(0, 8000)}\n\`\`\`\n`;
      }
      return '\n[Nenhum arquivo aberto no editor]\n';
    },
  },
  {
    id: 'problems', name: 'Problems', icon: '⚠️', desc: 'Erros e avisos detectados no workspace',
    getData: () => {
      const container = window.document.getElementById('projecty-problems-container');
      if (container) {
        const items = container.querySelectorAll('.problem-item, .problems-row');
        if (items.length > 0) {
          let text = '\n\n═══ @PROBLEMS ═══\n';
          items.forEach(item => { text += `- ${item.textContent?.trim()}\n`; });
          return text;
        }
      }
      return '\n[Nenhum problema detectado]\n';
    },
  },
  {
    id: 'canvas', name: 'Canvas', icon: '🌐', desc: 'Dados do Lumina Canvas (nodes/edges)',
    getData: () => {
      const textarea = window.document.querySelector('.code-textarea') as HTMLTextAreaElement;
      const activeTab = window.document.querySelector('.tab.active .tab-label');
      if (activeTab?.textContent?.endsWith('.canvas') && textarea) {
        try {
          const data = JSON.parse(textarea.value);
          const summary = `Nodes: ${data.nodes?.length || 0}, Edges: ${data.edges?.length || 0}`;
          const nodeList = (data.nodes || []).map((n: Record<string, unknown>) => `  - [${n.type}] ${(n as Record<string,Record<string,string>>).data?.text || (n as Record<string,Record<string,string>>).data?.label || n.id}`).join('\n');
          return `\n\n═══ @CANVAS (${summary}) ═══\nNodes:\n${nodeList}\n\nJSON completo:\n\`\`\`json\n${textarea.value.slice(0, 6000)}\n\`\`\`\n`;
        } catch { /* not valid json */ }
      }
      return '\n[Nenhum canvas ativo — abra um arquivo .canvas]\n';
    },
  },
  {
    id: 'design', name: 'Web Studio', icon: '🌐', desc: 'HTML gerado pelo Web Studio',
    getData: () => {
      const html = getWebStudioHTML();
      if (html) {
        return `\n\n═══ @WEB STUDIO ═══\n\`\`\`html\n${html.slice(0, 8000)}\n\`\`\`\n`;
      }
      return '\n[Web Studio vazio — adicione componentes primeiro]\n';
    },
  },
  {
    id: 'terminal', name: 'Terminal', icon: '💻', desc: 'Output recente do terminal ativo',
    getData: () => {
      const termContainer = window.document.getElementById('projecty-terminal-container');
      if (termContainer) {
        const termEl = termContainer.querySelector('.xterm-rows, .xterm-screen');
        if (termEl) {
          const text = termEl.textContent?.trim().slice(-3000) || '';
          if (text) return `\n\n═══ @TERMINAL ═══\n\`\`\`\n${text}\n\`\`\`\n`;
        }
      }
      return '\n[Terminal sem output recente]\n';
    },
  },
  {
    id: 'workspace', name: 'Workspace', icon: '📁', desc: 'Árvore de arquivos/pastas do workspace',
    getData: () => {
      const wsEl = window.document.getElementById('projecty-workspace-name');
      const branchEl = window.document.getElementById('projecty-git-branch');
      const ws = wsEl?.textContent?.trim() || 'N/A';
      const branch = branchEl?.textContent?.trim() || 'N/A';

      // Show cached file tree (populated async on mention select)
      if (_cachedFileTree) {
        return `\n\n═══ @WORKSPACE ═══\nWorkspace: ${ws}\nBranch: ${branch}\n\nArquivos e pastas:\n${_cachedFileTree}\n`;
      }
      return `\n\n═══ @WORKSPACE ═══\nWorkspace: ${ws}\nBranch: ${branch}\n`;
    },
  },
];

/** Cache for the workspace file tree (populated on @workspace selection) */
let _cachedFileTree: string | null = null;

/** Fetch and cache the workspace file tree */
async function fetchWorkspaceTree(): Promise<void> {
  try {
    const data = await getFileTree();
    if (data && data.tree) {
      const lines: string[] = [];
      const renderTree = (nodes: typeof data.tree, prefix: string, depth: number) => {
        if (depth > 3) return; // cap at 3 levels deep
        for (const node of nodes) {
          const icon = node.type === 'dir' ? '📁' : '📄';
          const sizeStr = node.type === 'file' && node.size ? ` (${(node.size / 1024).toFixed(1)}KB)` : '';
          lines.push(`${prefix}${icon} ${node.name}${sizeStr}`);
          if (node.children && node.children.length > 0) {
            renderTree(node.children, prefix + '  ', depth + 1);
          }
        }
      };
      renderTree(data.tree, '', 0);
      // Cap at 200 lines
      _cachedFileTree = lines.slice(0, 200).join('\n');
      if (lines.length > 200) {
        _cachedFileTree += `\n... (+${lines.length - 200} itens)`;
      }
    }
  } catch (err) {
    console.warn('[Mention] Failed to fetch workspace tree:', err);
    _cachedFileTree = '[Erro ao carregar árvore de arquivos]';
  }
}

function initMentionSystem(): void {
  // Use ownerDocument for popup-safe DOM access
  const doc = chatOutput.ownerDocument;
  const dropdown = doc.getElementById('projecty-mention-dropdown')!;
  const mentionBtn = doc.getElementById('projecty-mention-btn');

  // @ button click
  mentionBtn?.addEventListener('click', () => {
    toggleMentionDropdown();
  });

  // Detect @ in textarea
  promptInput.addEventListener('input', () => {
    const val = promptInput.value;
    const cursorPos = promptInput.selectionStart;
    const textBefore = val.substring(0, cursorPos);
    // Check if the last word starts with @
    const lastAtIdx = textBefore.lastIndexOf('@');
    if (lastAtIdx >= 0) {
      const textAfterAt = textBefore.substring(lastAtIdx + 1);
      // Only show if @ is at word boundary (start or after space/newline)
      const charBefore = lastAtIdx > 0 ? textBefore[lastAtIdx - 1] : ' ';
      if ((charBefore === ' ' || charBefore === '\n' || lastAtIdx === 0) && !/\s/.test(textAfterAt)) {
        showMentionDropdown(textAfterAt);
        return;
      }
    }
    hideMentionDropdown();
  });

  // Arrow keys + Enter in dropdown
  promptInput.addEventListener('keydown', (e) => {
    if (!mentionDropdownVisible) return;
    const dd = chatOutput.ownerDocument.getElementById('projecty-mention-dropdown');
    if (!dd) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      mentionActiveIdx = Math.min(mentionActiveIdx + 1, dd.children.length - 1);
      highlightMentionItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      mentionActiveIdx = Math.max(mentionActiveIdx - 1, 0);
      highlightMentionItem();
    } else if (e.key === 'Enter' && mentionDropdownVisible) {
      e.preventDefault();
      const activeItem = dd.children[mentionActiveIdx] as HTMLElement;
      if (activeItem) selectMention(activeItem.dataset.mentionId!);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hideMentionDropdown();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const activeItem = dd.children[mentionActiveIdx] as HTMLElement;
      if (activeItem) selectMention(activeItem.dataset.mentionId!);
    }
  });

  // Event delegation on dropdown — single listener, no leaks
  dropdown.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.agent-mention-item') as HTMLElement;
    if (item?.dataset.mentionId) {
      selectMention(item.dataset.mentionId);
    }
  });

  // Close dropdown when clicking outside (listen on ownerDocument)
  doc.addEventListener('mousedown', (e) => {
    if (!mentionDropdownVisible) return;
    const target = e.target as HTMLElement;
    if (!target.closest('.agent-mention-dropdown') && !target.closest('#projecty-mention-btn')) {
      hideMentionDropdown();
    }
  });
}

function showMentionDropdown(filter: string): void {
  const dropdown = chatOutput.ownerDocument.getElementById('projecty-mention-dropdown');
  if (!dropdown) return;
  const filtered = MENTION_DEFS.filter(m =>
    m.id.includes(filter.toLowerCase()) ||
    m.name.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) { hideMentionDropdown(); return; }

  dropdown.innerHTML = filtered.map((m, i) => `
    <div class="agent-mention-item ${i === 0 ? 'active' : ''}" data-mention-id="${m.id}">
      <span class="agent-mention-icon">${m.icon}</span>
      <div class="agent-mention-info">
        <span class="agent-mention-name">@${m.id}</span>
        <span class="agent-mention-desc">${m.desc}</span>
      </div>
      ${activeMentions.includes(m.id) ? '<span class="agent-mention-check">✓</span>' : ''}
    </div>
  `).join('');

  dropdown.style.display = 'block';
  mentionDropdownVisible = true;
  mentionActiveIdx = 0;
}

function hideMentionDropdown(): void {
  const dropdown = chatOutput.ownerDocument.getElementById('projecty-mention-dropdown');
  if (dropdown) dropdown.style.display = 'none';
  mentionDropdownVisible = false;
}

function toggleMentionDropdown(): void {
  if (mentionDropdownVisible) {
    hideMentionDropdown();
  } else {
    showMentionDropdown('');
    promptInput.focus();
  }
}

function highlightMentionItem(): void {
  const dropdown = chatOutput.ownerDocument.getElementById('projecty-mention-dropdown');
  if (!dropdown) return;
  Array.from(dropdown.children).forEach((child, i) => {
    child.classList.toggle('active', i === mentionActiveIdx);
  });
}

function selectMention(mentionId: string): void {
  // Remove the @xxx text from the input (if triggered by typing @)
  const val = promptInput.value;
  const cursorPos = promptInput.selectionStart;
  const textBefore = val.substring(0, cursorPos);
  const lastAtIdx = textBefore.lastIndexOf('@');

  if (lastAtIdx >= 0) {
    // Only remove if the @ is recent (within last 20 chars to avoid removing unrelated @)
    const textAfterAt = textBefore.substring(lastAtIdx + 1);
    if (textAfterAt.length <= 20 && !/\s/.test(textAfterAt)) {
      promptInput.value = val.substring(0, lastAtIdx) + val.substring(cursorPos);
      promptInput.selectionStart = promptInput.selectionEnd = lastAtIdx;
    }
  }

  // Toggle mention
  if (activeMentions.includes(mentionId)) {
    activeMentions = activeMentions.filter(m => m !== mentionId);
  } else {
    activeMentions.push(mentionId);
    // Pre-fetch workspace tree when @workspace is selected
    if (mentionId === 'workspace') {
      fetchWorkspaceTree();
    }
  }

  hideMentionDropdown();
  renderMentionChips();
  updateMentionButtonBadge();
  promptInput.focus();
}

function renderMentionChips(): void {
  // Find or create chips container
  const inputBar = promptInput.closest('.agent-input-bar');
  if (!inputBar) return;
  let chipsEl = inputBar.querySelector('.agent-mention-chips') as HTMLElement;
  if (!chipsEl) {
    chipsEl = chatOutput.ownerDocument.createElement('div');
    chipsEl.className = 'agent-mention-chips';
    // Insert before the input actions row
    const inputActions = inputBar.querySelector('.agent-input-actions');
    if (inputActions) {
      inputBar.insertBefore(chipsEl, inputActions);
    }
    // Event delegation for remove buttons — single listener
    chipsEl.addEventListener('click', (e) => {
      const removeBtn = (e.target as HTMLElement).closest('[data-remove]') as HTMLElement;
      if (removeBtn) {
        e.stopPropagation();
        const removeId = removeBtn.dataset.remove!;
        activeMentions = activeMentions.filter(m => m !== removeId);
        renderMentionChips();
        updateMentionButtonBadge();
      }
    });
  }

  if (activeMentions.length === 0) {
    chipsEl.style.display = 'none';
    return;
  }

  chipsEl.style.display = 'flex';
  chipsEl.innerHTML = activeMentions.map(id => {
    const def = MENTION_DEFS.find(m => m.id === id);
    if (!def) return '';
    return `<span class="agent-mention-chip" data-mention-id="${id}">${def.icon} @${def.id} <span class="agent-mention-chip-remove" data-remove="${id}">✕</span></span>`;
  }).join('');
}

/** Resolve all active mentions into context text */
function resolveMentions(): string {
  if (activeMentions.length === 0) return '';
  let ctx = '';
  for (const id of activeMentions) {
    const def = MENTION_DEFS.find(m => m.id === id);
    if (def) {
      try { ctx += def.getData(); } catch { ctx += `\n[@${id}: erro ao obter dados]\n`; }
    }
  }
  // Clear mentions after resolving
  activeMentions = [];
  renderMentionChips();
  updateMentionButtonBadge();
  return ctx;
}

/** Update the @ button to show active mention count */
function updateMentionButtonBadge(): void {
  const btn = chatOutput.ownerDocument.getElementById('projecty-mention-btn');
  if (!btn) return;
  if (activeMentions.length > 0) {
    btn.innerHTML = `@<span class="agent-mention-badge">${activeMentions.length}</span>`;
    btn.style.color = 'var(--accent-green, #a6e3a1)';
  } else {
    btn.innerHTML = '@';
    btn.style.color = 'var(--accent, #7c3aed)';
  }
}

async function loadModels(restoreFromConfig = false): Promise<void> {
  try {
    // Remember current selection before repopulating
    const prevSelected = modelSelect.value;

    const data = await fetchModels();
    const models = (data as { models: Array<{ name: string }> }).models || [];
    if (models.length === 0) return; // Don't wipe dropdown if Ollama is unreachable

    modelSelect.innerHTML = models
      .map((m) => `<option value="${m.name}">${m.name}</option>`)
      .join('');

    // Restore selection
    if (restoreFromConfig) {
      try {
        const config = await fetchConfig();
        const savedModel = (config as Record<string, unknown>).local_model as string;
        if (savedModel && models.some(m => m.name === savedModel)) {
          modelSelect.value = savedModel;
          return;
        }
      } catch { /* use first model */ }
    }

    // Preserve previous selection if still available
    if (prevSelected && models.some(m => m.name === prevSelected)) {
      modelSelect.value = prevSelected;
    }
  } catch {
    // Keep default option
  }
}

function handleFileAttach(): void {
  const files = attachInput.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      attachedFiles.push({ name: file.name, content });
      renderAttachPreview();
    };
    reader.readAsText(file);
  }
  attachInput.value = '';
}

function renderAttachPreview(): void {
  if (attachedFiles.length === 0) {
    attachPreview.style.display = 'none';
    return;
  }
  attachPreview.style.display = 'flex';
  attachPreview.innerHTML = attachedFiles.map((f, i) => `
    <div class="agent-attach-chip">
      <span class="agent-attach-icon">📎</span>
      <span class="agent-attach-name" title="${f.name}">${f.name}</span>
      <button class="agent-attach-remove" data-idx="${i}">×</button>
    </div>
  `).join('');

  // Remove buttons
  attachPreview.querySelectorAll('.agent-attach-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt((e.target as HTMLElement).dataset.idx || '0');
      attachedFiles.splice(idx, 1);
      renderAttachPreview();
    });
  });
}

function handleSend(): void {
  if (isStreaming) {
    if (currentAbort) currentAbort();
    isStreaming = false;
    sendBtn.innerHTML = '✦';
    sendBtn.classList.remove('stop');
    return;
  }

  const userText = promptInput.value.trim();
  if (!userText && attachedFiles.length === 0 && activeMentions.length === 0) return;

  // Build the full prompt with context from mentions + files
  let prompt = userText;

  // Inject @mention context
  const mentionCtx = resolveMentions();
  if (mentionCtx) prompt += mentionCtx;

  // Inject attached files into prompt
  if (attachedFiles.length > 0) {
    let attachContext = '\n\n═══ ATTACHED FILES ═══\n';
    for (const f of attachedFiles) {
      attachContext += `\n--- ${f.name} ---\n${f.content}\n`;
    }
    prompt += attachContext;
    attachedFiles = [];
    renderAttachPreview();
  }

  // Show clean user text in chat, but send full context to model
  const displayText = activeMentions.length > 0 || attachedFiles.length > 0
    ? userText  // Already resolved above, just show typed text
    : userText;
  appendMessage('user', displayText);
  chatHistory.push({ role: 'user', content: prompt });
  persistMessage('user', prompt);
  const historyToSend = buildContextWindow();

  promptInput.value = '';
  promptInput.style.height = 'auto';

  isStreaming = true;
  sendBtn.innerHTML = '■';
  sendBtn.classList.add('stop');

  const responseEl = appendMessage('assistant', '');

  // Show animated thinking indicator (use ownerDocument for detached popup support)
  const thinkingEl = chatOutput.ownerDocument.createElement('div');
  thinkingEl.className = 'agent-thinking-anim';
  thinkingEl.innerHTML = `
    <div class="agent-thinking-spinner"></div>
    <span class="agent-thinking-status">Pensando</span>
    <span class="agent-thinking-dots"><span>.</span><span>.</span><span>.</span></span>
  `;
  responseEl.appendChild(thinkingEl);
  // Smart scroll: only auto-scroll if user is near the bottom
  const isNearBottom = (chatOutput.scrollHeight - chatOutput.scrollTop - chatOutput.clientHeight) < 150;
  if (isNearBottom) chatOutput.scrollTop = chatOutput.scrollHeight;

  // Rotate status text
  const statusTexts = ['Pensando', 'Processando', 'Analisando', 'Gerando código'];
  let statusIdx = 0;
  const statusInterval = setInterval(() => {
    statusIdx = (statusIdx + 1) % statusTexts.length;
    const statusSpan = thinkingEl.querySelector('.agent-thinking-status');
    if (statusSpan) statusSpan.textContent = statusTexts[statusIdx];
  }, 2500);

  let fullResponse = '';
  let thinkingRemoved = false;

  const callbacks: StreamCallbacks = {
    onToken: (token: string) => {
      fullResponse += token;
      // Process thinking blocks (strip them)
      const rendered = processThinking(fullResponse);

      // Remove thinking animation once we have visible content
      if (!thinkingRemoved && rendered.replace(/<[^>]*>/g, '').trim().length > 0) {
        thinkingEl.classList.add('fade-out');
        setTimeout(() => thinkingEl.remove(), 300);
        clearInterval(statusInterval);
        thinkingRemoved = true;
      }

      responseEl.innerHTML = rendered;
      // Smart scroll: only if user hasn't scrolled up
      const nearBottom = (chatOutput.scrollHeight - chatOutput.scrollTop - chatOutput.clientHeight) < 150;
      if (nearBottom) chatOutput.scrollTop = chatOutput.scrollHeight;
    },
    onDone: () => {
      console.log('[AgentPanel] onDone — stream finished. Response length:', fullResponse.length);
      clearInterval(statusInterval);
      if (thinkingEl.parentElement) thinkingEl.remove();
      // Final render — strip thinking completely
      responseEl.innerHTML = processThinking(fullResponse);
      chatHistory.push({ role: 'assistant', content: fullResponse });
      persistMessage('assistant', fullResponse);
      isStreaming = false;
      sendBtn.innerHTML = '✦';
      sendBtn.classList.remove('stop');
      currentAbort = null;
    },
    onError: (err: Error) => {
      clearInterval(statusInterval);
      if (thinkingEl.parentElement) thinkingEl.remove();
      responseEl.innerHTML += `<div class="agent-error">⚠ ${err.message}</div>`;
      isStreaming = false;
      sendBtn.innerHTML = '✦';
      sendBtn.classList.remove('stop');
      currentAbort = null;
    },
    onFiles: (files) => {
      console.log('[AgentPanel] ✅ onFiles received:', JSON.stringify(files));
      const doc = chatOutput.ownerDocument;
      const filesEl = doc.createElement('div');
      filesEl.className = 'agent-file-ops';
      for (const f of files) {
        const icon = f.status === 'deleted' ? '🗑' : f.status === 'created' ? '✚' : '✎';
        const chip = doc.createElement('div');
        chip.className = `agent-file-chip ${f.status}`;
        chip.innerHTML = `<span class="agent-file-icon">${icon}</span><span>${f.path.split('/').pop() || f.path}</span>`;
        
        // If there's a diff, make the chip clickable to toggle it
        const fileDiff = (f as Record<string, unknown>).diff as string | undefined;
        if (fileDiff) {
          chip.style.cursor = 'pointer';
          chip.title = 'Clique para ver diff';
          const diffView = doc.createElement('div');
          diffView.className = 'agent-diff-view';
          diffView.style.display = 'none';
          diffView.innerHTML = colorDiffLines(fileDiff);
          chip.addEventListener('click', () => {
            diffView.style.display = diffView.style.display === 'none' ? 'block' : 'none';
          });
          filesEl.appendChild(chip);
          filesEl.appendChild(diffView);
        } else {
          filesEl.appendChild(chip);
        }
      }
      chatOutput.appendChild(filesEl);
      PubSub.emit('agent:files:created');
    },
    onPendingConfirmation: (changeId: string, blocks: unknown[]) => {
      console.log('[AgentPanel] ⚠️ onPendingConfirmation received:', changeId, 'blocks:', JSON.stringify(blocks));
      const doc = chatOutput.ownerDocument;
      const confirmEl = doc.createElement('div');
      confirmEl.className = 'agent-confirm-card';
      confirmEl.innerHTML = `
        <div class="agent-confirm-header">⚠️ Autorização Necessária</div>
        <div class="agent-confirm-text">O agente quer executar ${blocks.length} operação(ões) perigosa(s). Autorizar?</div>
        <div class="agent-confirm-actions">
          <button id="btn-conf-${changeId}" class="agent-confirm-yes">✅ Autorizar</button>
          <button id="btn-ccl-${changeId}" class="agent-confirm-no">🔒 Bloquear</button>
        </div>
      `;
      chatOutput.appendChild(confirmEl);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      doc.getElementById(`btn-conf-${changeId}`)?.addEventListener('click', async () => {
        confirmEl.innerHTML = '<div class="agent-confirm-text" style="color:var(--accent-green);">✅ Authorized. Executing...</div>';
        try {
          const result = await confirmChanges(changeId);
          if (callbacks.onFiles && result.files) callbacks.onFiles(result.files);
        } catch (err) {
          confirmEl.innerHTML = `<div class="agent-error">Execution error: ${err}</div>`;
        }
      });

      doc.getElementById(`btn-ccl-${changeId}`)?.addEventListener('click', () => {
        confirmEl.innerHTML = '<div class="agent-confirm-text" style="color:var(--text-muted);">🔒 Blocked safely.</div>';
      });
    },
    // ── Tool Calling Handlers (Ollama 0.19+) ──
    onToolCall: (call) => {
      const toolEl = chatOutput.ownerDocument.createElement('div');
      toolEl.className = 'agent-tool-card';
      toolEl.innerHTML = `<span class="agent-tool-icon">🔧</span> <strong>${call.name}</strong><span class="agent-tool-status running">executando...</span>`;
      toolEl.id = `tool-${call.name}-${Date.now()}`;
      chatOutput.appendChild(toolEl);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    },
    onToolResult: (result) => {
      // Update the last tool card with result status
      const toolCards = chatOutput.querySelectorAll('.agent-tool-card');
      const lastCard = toolCards[toolCards.length - 1] as HTMLElement | null;
      if (lastCard) {
        const statusEl = lastCard.querySelector('.agent-tool-status');
        if (statusEl) {
          const isOk = (result.result as Record<string, unknown>).status === 'ok';
          statusEl.className = `agent-tool-status ${isOk ? 'success' : 'error'}`;
          statusEl.textContent = isOk ? '✅ concluído' : '❌ erro';
        }
      }
    },
    onPendingTool: (tool) => {
      const doc = chatOutput.ownerDocument;
      const confirmEl = doc.createElement('div');
      confirmEl.className = 'agent-confirm-card';
      const toolId = `tool-${Date.now()}`;
      confirmEl.innerHTML = `
        <div class="agent-confirm-header">⚠️ Operação Sensível</div>
        <div class="agent-confirm-text">O agente quer executar: <strong>${tool.name}</strong><br><code>${JSON.stringify(tool.arguments)}</code></div>
        <div class="agent-confirm-actions">
          <button id="btn-tool-ok-${toolId}" class="agent-confirm-yes">✅ Permitir</button>
          <button id="btn-tool-no-${toolId}" class="agent-confirm-no">🔒 Bloquear</button>
        </div>
      `;
      chatOutput.appendChild(confirmEl);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      doc.getElementById(`btn-tool-ok-${toolId}`)?.addEventListener('click', () => {
        confirmEl.innerHTML = '<div class="agent-confirm-text" style="color:var(--accent-green);">✅ Permitido (será executado na próxima iteração)</div>';
      });
      doc.getElementById(`btn-tool-no-${toolId}`)?.addEventListener('click', () => {
        confirmEl.innerHTML = '<div class="agent-confirm-text" style="color:var(--text-muted);">🔒 Operação bloqueada.</div>';
      });
    },
    // ── Bash Output Inline Rendering ──
    onBashOutput: (output) => {
      const doc = chatOutput.ownerDocument;
      const card = doc.createElement('div');
      card.className = 'agent-bash-card';
      const isOk = output.status === 'ok' && output.exit_code === 0;
      const isBlocked = output.status === 'blocked';
      const statusIcon = isBlocked ? '⛔' : isOk ? '✅' : output.status === 'timeout' ? '⏱️' : '❌';
      const statusClass = isBlocked ? 'blocked' : isOk ? 'success' : 'error';

      // Escape HTML in output
      const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      let outputHtml = '';
      if (output.stdout) {
        outputHtml += `<pre class="agent-bash-stdout">${escapeHtml(output.stdout)}</pre>`;
      }
      if (output.stderr) {
        outputHtml += `<pre class="agent-bash-stderr">${escapeHtml(output.stderr)}</pre>`;
      }
      if (!output.stdout && !output.stderr) {
        outputHtml = '<div class="agent-bash-empty">(sem output)</div>';
      }

      card.innerHTML = `
        <div class="agent-bash-header">
          <span class="agent-bash-icon">💻</span>
          <code class="agent-bash-cmd">${escapeHtml(output.command)}</code>
          <span class="agent-bash-status ${statusClass}">${statusIcon} ${isBlocked ? 'bloqueado' : isOk ? `exit 0` : `exit ${output.exit_code}`}</span>
        </div>
        <div class="agent-bash-output" style="display:none;">
          ${outputHtml}
        </div>
      `;

      // Toggle output on click
      const header = card.querySelector('.agent-bash-header') as HTMLElement;
      const outputEl = card.querySelector('.agent-bash-output') as HTMLElement;
      header.style.cursor = 'pointer';
      header.title = 'Clique para ver/ocultar output';
      header.addEventListener('click', () => {
        const showing = outputEl.style.display !== 'none';
        outputEl.style.display = showing ? 'none' : 'block';
      });
      // Auto-expand if there's stderr or an error
      if (output.stderr || !isOk) {
        outputEl.style.display = 'block';
      }

      chatOutput.appendChild(card);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Auto-open terminal panel if not visible
      PubSub.emit('terminal:ensure-open');
    },
    // ── Multi-turn Agent Loop Progress ──
    onAgentCycle: (cycle) => {
      if (cycle.round > 1) {
        const doc = chatOutput.ownerDocument;
        const divider = doc.createElement('div');
        divider.className = 'agent-cycle-indicator';
        divider.innerHTML = `<span class="agent-cycle-icon">🔄</span> Ciclo ${cycle.round}/${cycle.max_rounds} <span class="agent-cycle-detail">(${cycle.tool_count} tool${cycle.tool_count > 1 ? 's' : ''})</span>`;
        chatOutput.appendChild(divider);
        chatOutput.scrollTop = chatOutput.scrollHeight;
      }
    },
  };

  // Determine mode from toggle
  const isCloud = chatOutput.ownerDocument.getElementById('projecty-mode-cloud')?.classList.contains('active');
  const mode = isCloud ? 'cloud' : 'local';

  currentAbort = streamGenerate(
    {
      prompt,
      mode,
      model: modelSelect.value,
      history: historyToSend,
      strict_library_mode: strictLibraryCheck.checked,
      thinking_mode: thinkingModeCheck.checked
    },
    callbacks
  );
}

function processThinking(text: string): string {
  const showThinking = thinkingModeCheck?.checked ?? false;

  if (showThinking) {
    // Extract thinking blocks BEFORE markdown parsing to avoid marked corrupting our HTML
    const blocks: string[] = [];
    let processed = text;

    // Replace closed thinking blocks with placeholders
    processed = processed.replace(
      /<(?:thought|thinking)>([\s\S]*?)<\/(?:thought|thinking)>/gi,
      (_match, content: string) => {
        const escapedContent = content.trim()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const html = `<details class="agent-thinking-block" open><summary>🧠 Raciocínio</summary><div class="thinking-content">${escapedContent}</div></details>`;
        const placeholder = `%%THINKING_${blocks.length}%%`;
        blocks.push(html);
        return placeholder;
      }
    );

    // Replace unclosed thinking tags (still streaming)
    processed = processed.replace(
      /<(?:thought|thinking)>([\s\S]*)$/gi,
      (_match, content: string) => {
        const escapedContent = content.trim()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const html = `<details class="agent-thinking-block" open><summary>🧠 Raciocínio <span class="thinking-streaming">⟳</span></summary><div class="thinking-content">${escapedContent}▌</div></details>`;
        const placeholder = `%%THINKING_${blocks.length}%%`;
        blocks.push(html);
        return placeholder;
      }
    );

    // Parse remaining markdown (placeholders survive as plain text)
    let result = marked.parse(processed) as string;

    // Reinject thinking block HTML in place of placeholders
    for (let i = 0; i < blocks.length; i++) {
      result = result.replace(`%%THINKING_${i}%%`, blocks[i]);
      // Also handle if marked wrapped it in <p> tags
      result = result.replace(`<p>%%THINKING_${i}%%</p>`, blocks[i]);
    }

    return result;
  } else {
    // Strip <thinking>/<thought> blocks completely — user should not see LLM reasoning
    let cleaned = text.replace(/<(?:thought|thinking)>[\s\S]*?<\/(?:thought|thinking)>/gi, '');
    // Also strip unclosed thinking tags (still streaming)
    cleaned = cleaned.replace(/<(?:thought|thinking)>[\s\S]*$/gi, '');
    return marked.parse(cleaned) as string;
  }
}

/** Show/hide token warning when cloud + thinking are both active */
function updateThinkingWarn(): void {
  const warnEl = chatOutput?.ownerDocument?.getElementById('projecty-thinking-warn');
  if (!warnEl) return;
  const isCloud = chatOutput.ownerDocument.getElementById('projecty-mode-cloud')?.classList.contains('active');
  warnEl.style.display = (isCloud && thinkingModeCheck?.checked) ? 'inline' : 'none';
}

function appendMessage(role: 'user' | 'assistant', text: string): HTMLElement {
  // Use ownerDocument so DOM works correctly when panel is detached to popup
  const doc = chatOutput.ownerDocument;
  const wrapper = doc.createElement('div');
  wrapper.className = `agent-message agent-message-${role}`;

  const avatar = doc.createElement('div');
  avatar.className = 'agent-avatar';
  avatar.textContent = role === 'user' ? 'U' : '✦';

  const bubble = doc.createElement('div');
  bubble.className = 'agent-bubble';

  const label = doc.createElement('div');
  label.className = 'agent-bubble-label';
  label.textContent = role === 'user' ? 'YOU' : 'LUMINA';
  label.style.textTransform = 'uppercase';

  const content = doc.createElement('div');
  content.className = 'agent-bubble-content';
  if (role === 'user') {
    content.textContent = text;
  }

  bubble.appendChild(label);
  bubble.appendChild(content);

  if (role === 'user') {
    wrapper.appendChild(bubble);
    wrapper.appendChild(avatar);
  } else {
    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
  }

  chatOutput.appendChild(wrapper);
  chatOutput.scrollTop = chatOutput.scrollHeight;

  return content;
}

/** Convert unified diff text to color-coded HTML */
function colorDiffLines(diff: string): string {
  const escaped = diff
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.split('\n').map(line => {
    if (line.startsWith('+++') || line.startsWith('---')) {
      return `<span style="color:var(--text-muted);font-style:italic;">${line}</span>`;
    }
    if (line.startsWith('@@')) {
      return `<span style="color:#7aa2f7;font-weight:bold;">${line}</span>`;
    }
    if (line.startsWith('+')) {
      return `<span style="color:#9ece6a;background:rgba(158,206,106,0.08);">${line}</span>`;
    }
    if (line.startsWith('-')) {
      return `<span style="color:#f7768e;background:rgba(247,118,142,0.08);">${line}</span>`;
    }
    return `<span style="color:var(--text-muted);">${line}</span>`;
  }).join('\n');
}
