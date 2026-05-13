/**
 * Lumina IDE — Main Entry Point (v8.0)
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
import { initEditor, saveActiveFile, closeTab, activeTabPath } from './core/EditorManager';
import { initAgentPanel } from './ui/AgentPanel';
import { initSettingsPanel } from './ui/SettingsPanel';
import { initResizers } from './ui/Resizer';
import { initLibraryPanel } from './ui/LibraryPanel';
import { initPreviewPanel } from './ui/PreviewPanel';
import { initMeshPanel } from './ui/MeshPanel';
import { initExtensionsPanel } from './ui/ExtensionsPanel';
import { initMusicPanel } from './ui/MusicPanel';
import { initGitPanel } from './ui/GitPanel';
import { initThemeEngine } from './ui/ThemeEngine';
import { initOnboarding } from './ui/OnboardingGuide';
import { initLLMPanel } from './ui/LLMPanel';
import { initProblemsPanel } from './ui/ProblemsPanel';
import { initInfinitePreview } from './ui/InfinitePreview';
import { initWebStudio } from './ui/WebStudioPanel';
import './ui/web-studio.css';
// Design Studio removed — now standalone app at C:\designstudioapp

import { t } from './core/i18n';

/** Scan all [data-i18n] elements and set their textContent from i18n */
function applyTranslations(): void {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    }
  });
}

// Re-apply translations whenever language changes
PubSub.on('lang:changed', () => {
  applyTranslations();
  // Re-init all panels to rebuild templates with new language
  initSettingsPanel();
  initGitPanel();
  initMusicPanel();
  initMeshPanel();
  initExtensionsPanel();
  initLibraryPanel();
  initPreviewPanel();
});

// ─── Boot Sequence ───────────────────────────────────────────────
async function boot(): Promise<void> {
  console.log('%c[Lumina IDE] Booting...', 'color: #7c3aed; font-weight: bold;');

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
    // FIX v5.4: Aceita local_model (Python backend) ou selected_model
    const activeModel = (config as Record<string, unknown>).local_model || config.selected_model;
    if (activeModel) {
      const modeEl = document.getElementById('projecty-mode-indicator');
      if (modeEl) modeEl.textContent = `LOCAL — ${activeModel}`;
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
  initResizers();
  initLibraryPanel();
  initMeshPanel();
  initExtensionsPanel();
  initPreviewPanel();
  initMusicPanel();
  initGitPanel();
  initThemeEngine();
  initOnboarding();
  initLLMPanel();
  initProblemsPanel();
  initInfinitePreview();
  initWebStudio();
  // initDesignStudio() — removed, now standalone app
  applyTranslations();

  // Phase 6 & 7: Terminal Manager (Multi-tabs)
  initTerminalManager();

  // Phase 7: Wire Activity Bar buttons
  // Buttons ONLY emit panel:toggle — Sidebar.ts is the single source of truth for panel visibility.
  const activityBtns = document.querySelectorAll<HTMLButtonElement>('#projecty-activity-bar .activity-btn');
  activityBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      if (!panel) return;
      PubSub.emit('panel:toggle', panel);
    });
  });

  // Sync activity bar active state when panel:toggle completes
  PubSub.on('panel:activated', (panelId) => {
    const id = panelId as string | null;
    activityBtns.forEach((b) => {
      b.classList.toggle('active', b.dataset.panel === id);
    });
  });

  // Phase 8: Wire Browse button
  const browseBtn = document.getElementById('projecty-browse-btn');
  if (browseBtn) {
    browseBtn.addEventListener('click', handleBrowseFolder);
  }

  // [FIX] Electron IPC shortcut forwarding — handles shortcuts that Chromium swallows
  // in the packaged app (before-input-event fires before DOM keydown)
  const eAPIShortcut = (window as any).electronAPI;
  if (eAPIShortcut?.onShortcut) {
    eAPIShortcut.onShortcut((action: string) => {
      if (action === 'extensions') PubSub.emit('panel:toggle', 'extensions');
      else if (action === 'toggle-sidebar') {
        const sidebar = document.getElementById('projecty-sidebar');
        if (sidebar) sidebar.classList.toggle('hidden');
      }
    });
  }

  // Phase 9: Keyboard shortcuts (Capture phase to bypass editor/Pty swallowing events)
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Ctrl+` → Toggle terminal (hide/show) — use e.code for PT-BR compatibility
    if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')) {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('projecty-term-detach')?.click();
      return;
    }
    // Ctrl+F → Search in editor
    if (e.ctrlKey && !e.shiftKey && e.key === 'f') {
      e.preventDefault();
      e.stopPropagation();
      PubSub.emit('editor:search', {});
      return;
    }
    // Explorer shortcut removed (Chromium conflict in packaged app)
    // Ctrl+Shift+X → Extensions
    if (e.ctrlKey && e.shiftKey && (e.key === 'X' || e.key === 'x' || e.code === 'KeyX')) {
      e.preventDefault();
      PubSub.emit('panel:toggle', 'extensions');
    }
    // Ctrl+B → Toggle sidebar
    if (e.ctrlKey && !e.shiftKey && (e.key === 'b' || e.code === 'KeyB')) {
      e.preventDefault();
      const sidebar = document.getElementById('projecty-sidebar');
      if (sidebar) sidebar.classList.toggle('hidden');
    }
    // Ctrl+, → Settings
    if (e.ctrlKey && e.key === ',') {
      e.preventDefault();
      PubSub.emit('panel:toggle', 'settings');
    }
    // Ctrl+S → Save
    if (e.ctrlKey && !e.shiftKey && (e.key === 's' || e.code === 'KeyS')) {
      e.preventDefault();
      saveActiveFile();
    }
    // Ctrl+W → Close Tab
    if (e.ctrlKey && (e.key === 'w' || e.code === 'KeyW')) {
      e.preventDefault();
      if (activeTabPath) closeTab(activeTabPath);
    }
    // Ctrl+Shift+D — Design Studio shortcut removed (standalone app)
  }, { capture: true });

  // ── Panel Detach System ──────────────────────────────────────────
  initPanelDetach();

  // ── Frameless Window Controls ───────────────────────────────────
  const eAPI = (window as any).electronAPI;
  document.getElementById('win-minimize')?.addEventListener('click', () => eAPI?.minimize?.());
  document.getElementById('win-maximize')?.addEventListener('click', () => eAPI?.maximize?.());
  document.getElementById('win-close')?.addEventListener('click', () => eAPI?.close?.() ?? window.close());

  document.getElementById('lumina-design-studio-btn')?.addEventListener('click', () => {
    PubSub.emit('webstudio:open', {});
  });
  // Design Studio button removed — standalone app

  // Phase 10: Reveal IDE
  hideBootScreen();
  console.log('%c[Lumina IDE] ✅ Boot complete!', 'color: #a6e3a1; font-weight: bold;');
}

// ─── Panel Controls (Terminal Hide/Show + Agent Undock) ───────────

function initPanelDetach(): void {
  const ide = document.getElementById('projecty-ide') as HTMLElement;

  // ── Terminal Hide/Show ──
  const termDetachBtn = document.getElementById('projecty-term-detach');
  let termHidden = false;

  if (termDetachBtn) {
    termDetachBtn.textContent = '▼';
    termDetachBtn.title = 'Esconder terminal';
  }

  termDetachBtn?.addEventListener('click', () => {
    const termZone = document.getElementById('projecty-terminal-zone');
    const resizer = document.getElementById('projecty-resizer-bottom');
    if (!termZone) return;

    if (termHidden) {
      // Show
      termZone.style.display = '';
      if (resizer) resizer.style.display = '';
      if (ide) ide.style.gridTemplateRows = '32px 1fr 4px 200px 22px';
      termHidden = false;
      if (termDetachBtn) { termDetachBtn.textContent = '▼'; termDetachBtn.title = 'Esconder terminal'; }
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 100);
    } else {
      // Hide
      termZone.style.display = 'none';
      if (resizer) resizer.style.display = 'none';
      if (ide) ide.style.gridTemplateRows = '32px 1fr 0px 0px 22px';
      termHidden = true;
      if (termDetachBtn) { termDetachBtn.textContent = '▲'; termDetachBtn.title = 'Mostrar terminal'; }
    }
  });

  // Statusbar terminal toggle (always visible even when terminal is hidden)
  document.getElementById('projecty-term-toggle-statusbar')?.addEventListener('click', () => {
    termDetachBtn?.click();
  });

  // Agent can request terminal to be opened via PubSub
  PubSub.on('terminal:ensure-open', () => {
    if (termHidden && termDetachBtn) {
      termDetachBtn.click(); // Show the terminal
    }
  });

  // ── Agent Undock (real OS window) ──
  const agentHeader = document.querySelector('.agent-header-right') as HTMLElement;
  let agentDetachBtn: HTMLButtonElement | null = null;
  let agentPopup: Window | null = null;
  let agentIsDetached = false;

  if (agentHeader) {
    agentDetachBtn = document.createElement('button');
    agentDetachBtn.id = 'projecty-agent-detach';
    agentDetachBtn.textContent = '⇱';
    agentDetachBtn.title = 'Destacar agente';
    agentDetachBtn.style.cssText = 'background:transparent; border:1px solid var(--border); color:var(--text-muted); border-radius:3px; cursor:pointer; font-size:12px; padding:2px 6px; line-height:1; margin-left:8px;';
    agentHeader.appendChild(agentDetachBtn);
  }

  function openAgentPopup(panelEl: HTMLElement): Window | null {
    const popup = window.open('about:blank', 'Lumina Agent', 'width=500,height=650');
    if (!popup) return null;

    const doc = popup.document;
    doc.title = 'Lumina Agent';

    // Copy ALL stylesheets (link + style tags)
    for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) {
      doc.head.appendChild(sheet.cloneNode(true));
    }

    // Copy CSS custom properties (theme) from :root to popup body
    const rootStyles = getComputedStyle(document.documentElement);
    const themeVars = [
      '--bg', '--bg-surface', '--bg-panel', '--bg-overlay', '--bg-input',
      '--text', '--text-secondary', '--text-muted',
      '--accent', '--accent-hover', '--accent-glow',
      '--border', '--border-hover',
      '--accent-green', '--accent-red', '--accent-yellow',
      '--shadow', '--shadow-lg',
    ];
    let cssVarBlock = ':root{';
    for (const v of themeVars) {
      const val = rootStyles.getPropertyValue(v).trim();
      if (val) cssVarBlock += `${v}:${val};`;
    }
    cssVarBlock += '}';
    const themeStyle = doc.createElement('style');
    themeStyle.textContent = cssVarBlock + '\nbody{margin:0;padding:0;background:var(--bg,#0d0d15);color:var(--text,#e0e0e0);font-family:Inter,system-ui,sans-serif;overflow:hidden;}';
    doc.head.appendChild(themeStyle);

    // Style the panel to fill the popup
    panelEl.style.cssText = 'display:flex; flex-direction:column; width:100vw; height:100vh; overflow:hidden;';
    doc.body.appendChild(panelEl);

    return popup;
  }

  function detachAgent(): void {
    const agentZone = document.getElementById('projecty-agent-zone');
    const resizer = document.getElementById('projecty-resizer-right');
    if (!agentZone || agentIsDetached) return;

    if (resizer) resizer.style.display = 'none';

    agentPopup = openAgentPopup(agentZone);
    if (!agentPopup) return;

    agentIsDetached = true;
    (window as any).__luminaAgentDetached = true;
    if (agentDetachBtn) { agentDetachBtn.textContent = '⇲'; agentDetachBtn.title = 'Encaixar agente'; }

    agentPopup.addEventListener('pagehide', () => {
      if (agentIsDetached) dockAgent();
    });
  }

  function dockAgent(): void {
    const agentZone = document.getElementById('projecty-agent-zone') ||
                      agentPopup?.document?.getElementById('projecty-agent-zone');
    const resizer = document.getElementById('projecty-resizer-right');
    if (!agentZone) return;

    // Move DOM back
    const resizerRight = document.getElementById('projecty-resizer-right');
    const mainArea = document.getElementById('projecty-main-area');
    if (resizerRight && resizerRight.parentElement) {
      resizerRight.parentElement.insertBefore(agentZone, resizerRight.nextSibling);
    } else if (mainArea) {
      mainArea.appendChild(agentZone);
    }

    agentZone.className = 'agent-zone-right';
    agentZone.style.cssText = '';
    if (resizer) resizer.style.display = '';

    if (agentPopup && !agentPopup.closed) agentPopup.close();
    agentPopup = null;
    agentIsDetached = false;
    (window as any).__luminaAgentDetached = false;
    if (agentDetachBtn) { agentDetachBtn.textContent = '⇱'; agentDetachBtn.title = 'Destacar agente'; }
  }

  agentDetachBtn?.addEventListener('click', () => {
    if (agentIsDetached) dockAgent();
    else detachAgent();
  });
}

// ─── Phase 7: Terminal Manager (Multi-tabs) ───────────────
function initTerminalManager(): void {
  const container = document.getElementById('projecty-terminal-container');
  const tabsContainer = document.getElementById('projecty-terminal-tabs-container');
  if (!container || !tabsContainer) return;

  tabsContainer.innerHTML = '';
  const terminals: { id: string, term: TerminalManager, tab: HTMLElement }[] = [];
  let activeId: string | null = null;
  let termCount = 0;

  function createTerminal(shell: string = 'powershell') {
    termCount++;
    const id = `term-${Date.now()}`;
    const term = new TerminalManager('projecty-terminal-container', id, shell);
    term.mount();

    const tab = document.createElement('span');
    tab.className = 'terminal-tab';
    tab.style.display = 'flex';
    tab.style.alignItems = 'center';
    tab.style.gap = '8px';
    
    // Label
    const label = document.createElement('span');
    label.textContent = `${shell === 'powershell' ? 'pwsh' : shell}-${termCount}`;
    tab.appendChild(label);

    // Close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.opacity = '0.5';
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.5';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTerminal(id);
    };
    tab.appendChild(closeBtn);

    tab.onclick = () => activateTerminal(id);

    tabsContainer!.appendChild(tab);
    terminals.push({ id, term, tab });

    activateTerminal(id);
  }

  function activateTerminal(id: string) {
    terminals.forEach(t => {
      if (t.id === id) {
        t.term.show();
        t.tab.classList.add('active');
        activeId = id;
      } else {
        t.term.hide();
        t.tab.classList.remove('active');
      }
    });
  }

  function closeTerminal(id: string) {
    const idx = terminals.findIndex(t => t.id === id);
    if (idx === -1) return;
    
    const t = terminals[idx];
    t.term.dispose();
    t.tab.remove();
    terminals.splice(idx, 1);

    if (activeId === id) {
      if (terminals.length > 0) {
        // Activate the previous one in the list, or the last one
        const nextIdx = Math.max(0, idx - 1);
        activateTerminal(terminals[nextIdx].id);
      } else {
        activeId = null;
      }
    }
  }

  const addPwshBtn = document.getElementById('projecty-term-add-pwsh');
  const addCmdBtn = document.getElementById('projecty-term-add-cmd');
  
  if (addPwshBtn) addPwshBtn.onclick = () => createTerminal('powershell');
  if (addCmdBtn) addCmdBtn.onclick = () => createTerminal('cmd');

  // Spawn initial terminal
  createTerminal('powershell');
}

// ─── Global Error Handlers ─────────────────────────────────────────
// Captures uncaught errors even in Electron production builds

function sendFrontendLog(level: string, message: string, source?: string): void {
  try {
    const isElectron = window.location.protocol === 'file:';
    const base = isElectron ? 'http://127.0.0.1:8001' : '';
    fetch(`${base}/api/frontend-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, source, timestamp: new Date().toISOString() }),
    }).catch(() => {}); // fire-and-forget
  } catch { /* never crash */ }
}

window.onerror = (message, source, lineno, colno, error) => {
  const msg = `[UNCAUGHT] ${message} at ${source}:${lineno}:${colno}`;
  console.error(msg, error);
  sendFrontendLog('ERROR', msg, source?.toString());
  return false; // don't suppress default handling
};

window.addEventListener('unhandledrejection', (event) => {
  const msg = `[UNHANDLED PROMISE] ${event.reason}`;
  console.error(msg);
  sendFrontendLog('ERROR', msg);
});

// ─── Start ───────────────────────────────────────────────────────
boot().catch((err) => {
  console.error('[Lumina IDE] Fatal boot error:', err);
  sendFrontendLog('FATAL', `Boot failed: ${err?.message || err}`);
});
