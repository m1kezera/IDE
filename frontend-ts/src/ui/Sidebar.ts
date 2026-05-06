/**
 * Project Y — Sidebar Controller (v5.0)
 * DOM-imperative sidebar panel management.
 * Renders File Explorer tree and handles panel switching.
 */

import { getFileTree, browseFolder, openFolder } from '../api/client';
import type { FileTreeNode } from '../api/client';
import { PubSub } from '../core/PubSub';
import { getIcon, getFileExtIcon } from './ThemeEngine';
import { t } from '../core/i18n';

const isElectronSidebar = window.location.protocol === 'file:';
const API = isElectronSidebar ? 'http://127.0.0.1:8001/api' : '/api';

let currentPanel: string | null = 'explorer';
let fileTree: FileTreeNode[] = [];
let workspaceStartTime: number | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let timerEl: HTMLSpanElement | null = null;

// DOM refs (cached once at init)
let sidebarEl: HTMLElement;
let explorerContent: HTMLElement;

const PANEL_IDS = ['explorer', 'telemetry', 'swarm', 'extensions', 'library', 'git', 'music', 'llm', 'settings'] as const;

export function initSidebar(): void {
  sidebarEl = document.getElementById('projecty-sidebar') as HTMLElement;
  explorerContent = document.getElementById('projecty-explorer-tree') as HTMLElement;

  // Create context menu (hidden)
  createContextMenu();

  // Right-click on explorer background for creating at workspace root
  explorerContent?.addEventListener('contextmenu', (e) => {
    // Only trigger if clicking empty space (not a file/folder row)
    if ((e.target as HTMLElement).closest('.projecty-tree-row')) return;
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, null);
  });

  // Listen for panel switch events from ActivityBar & Keyboard shortcuts
  // Always SHOW the requested panel — never hide. Use Ctrl+B to hide sidebar.
  PubSub.on('panel:toggle', (panelId) => {
    const id = panelId as string;
    currentPanel = id;
    sidebarEl.classList.remove('hidden');
    showPanel(id);
    // Notify activity bar to sync button states
    PubSub.emit('panel:activated', currentPanel);
  });

  PubSub.on('workspace:set', () => {
    refreshTree();
  });

  PubSub.on('agent:files:created', () => {
    refreshTree();
  });

  // Hide context menu on click anywhere
  document.addEventListener('click', () => hideContextMenu());

  // Re-render tree when icon pack changes
  PubSub.on('theme:icons-changed', () => {
    if (fileTree.length > 0) refreshTree();
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
    const resp = await getFileTree();
    fileTree = Array.isArray(resp.tree) ? resp.tree : [];
    
    explorerContent.innerHTML = '';
    
    // Add root folder header
    const rootHeader = document.createElement('div');
    rootHeader.className = 'projecty-tree-item root-header';
    rootHeader.style.fontWeight = 'bold';
    rootHeader.style.textTransform = 'uppercase';
    rootHeader.style.paddingLeft = '8px';
    rootHeader.style.marginBottom = '4px';
    rootHeader.style.color = 'var(--text)';
    
    const rootIcon = document.createElement('span');
    rootIcon.className = 'projecty-tree-icon';
    rootIcon.textContent = '📦';
    
    const rootLabel = document.createElement('span');
    rootLabel.className = 'projecty-tree-label';
    rootLabel.textContent = resp.root || 'WORKSPACE';
    
    // Workspace timer
    if (!timerEl) {
      timerEl = document.createElement('span');
      timerEl.id = 'workspace-timer';
      timerEl.style.cssText = 'margin-left:auto;font-size:9px;font-weight:500;color:var(--accent-light, #a78bfa);font-family:"Consolas","Fira Code",monospace;letter-spacing:1px;padding:2px 8px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.15);border-radius:10px;display:flex;align-items:center;gap:4px;';
    }
    if (!workspaceStartTime) {
      workspaceStartTime = Date.now();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
    }
    updateTimer();
    
    rootHeader.appendChild(rootIcon);
    rootHeader.appendChild(rootLabel);
    rootHeader.appendChild(timerEl);
    rootHeader.style.display = 'flex';
    rootHeader.style.alignItems = 'center';
    
    explorerContent.appendChild(rootHeader);

    // Render tree inside a container
    const treeContainer = document.createElement('div');
    explorerContent.appendChild(treeContainer);
    renderTree(fileTree, treeContainer, 0);
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
    icon.textContent = node.type === 'dir' ? getIcon('folder') : getFileExtIcon(node.name);

    const label = document.createElement('span');
    label.className = 'projecty-tree-label';
    label.textContent = node.name;

    row.appendChild(icon);
    row.appendChild(label);

    if (node.type !== 'dir') {
      row.addEventListener('click', () => {
        PubSub.emit('file:select', { path: node.path, name: node.name, ext: getExt(node.name) });
      });
      row.addEventListener('mouseenter', () => {
        PubSub.emit('file:hover', node.path);
      });

      // Drag support for files
      row.draggable = true;
      row.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', node.path);
        row.style.opacity = '0.4';
      });
      row.addEventListener('dragend', () => {
        row.style.opacity = '1';
      });
    }

    parent.appendChild(row);

    // Right-click context menu for all items
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e.clientX, e.clientY, node);
    });

    if (node.type === 'dir' && node.children) {
      const childContainer = document.createElement('div');
      childContainer.className = 'projecty-tree-children';
      let expanded = false;

      row.addEventListener('click', () => {
        expanded = !expanded;
        childContainer.classList.toggle('hidden', !expanded);
        icon.textContent = expanded ? getIcon('folderOpen') : getIcon('folder');
      });

      // Drop target for folders
      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        row.style.background = 'rgba(124,58,237,0.15)';
      });
      row.addEventListener('dragleave', () => {
        row.style.background = '';
      });
      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.style.background = '';
        const srcPath = e.dataTransfer?.getData('text/plain');
        if (!srcPath || srcPath === node.path) return;
        try {
          await fetch(`${API}/workspace/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src: srcPath, dest: node.path }),
          });
          refreshTree();
        } catch (err) { console.error('Move failed:', err); }
      });

      parent.appendChild(childContainer);
      renderTree(node.children, childContainer, depth + 1);
      childContainer.classList.add('hidden');
    }
  }
}

// File icon resolution now delegated to ThemeEngine.getFileExtIcon()

function getExt(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()! : '';
}

export async function handleBrowseFolder(): Promise<void> {
  try {
    let folderPath: string | null = null;

    // Use Electron's native dialog when available (packaged app)
    const eAPI = (window as any).electronAPI;
    if (eAPI?.selectFolder) {
      const result = await eAPI.selectFolder();
      folderPath = result?.path || null;
    } else {
      // Fallback: use backend API (dev mode)
      const result = await browseFolder();
      folderPath = result?.path || null;
    }

    if (folderPath) {
      await openFolder(folderPath);
      PubSub.emit('workspace:set', folderPath);
      refreshTree();
    }
  } catch (err) { console.warn('[Sidebar] Failed to open folder:', err); }
}

// ─── File Context Menu ──────────────────────────────────────────────
let contextMenuEl: HTMLElement | null = null;

function createContextMenu(): void {
  const menu = document.createElement('div');
  menu.id = 'projecty-file-context-menu';
  menu.style.cssText = `
    display:none; position:fixed; z-index:20000;
    background:var(--bg-surface, #1a1c2e); border:1px solid var(--border);
    border-radius:6px; padding:4px 0; min-width:160px;
    box-shadow:0 8px 24px rgba(0,0,0,0.5); font-size:12px;
  `;
  document.body.appendChild(menu);
  contextMenuEl = menu;
}

function showContextMenu(x: number, y: number, node: FileTreeNode | null): void {
  if (!contextMenuEl) return;

  const isDir = node ? node.type === 'dir' : true;
  let menuHtml = '';

  // Create options (always for dirs and background)
  if (isDir) {
    menuHtml += `<div class="ctx-item" data-action="new-file">📄 ${t('explorer.new_file')}</div>`;
    menuHtml += `<div class="ctx-item" data-action="new-folder">📁 ${t('explorer.new_folder')}</div>`;
    if (node) menuHtml += '<div style="height:1px; background:var(--border); margin:4px 8px;"></div>';
  }

  // Edit options (only when clicking a real node)
  if (node) {
    menuHtml += `<div class="ctx-item" data-action="rename">✏️ ${t('explorer.rename')}</div>`;
    menuHtml += `<div class="ctx-item" data-action="delete" style="color:var(--accent-red, #f38ba8);">🗑️ ${t('explorer.delete')}${isDir ? ' ' + t('explorer.folder') : ''}</div>`;
  }

  contextMenuEl.innerHTML = menuHtml;

  // Style items
  contextMenuEl.querySelectorAll('.ctx-item').forEach(item => {
    (item as HTMLElement).style.cssText = `
      padding:6px 14px; cursor:pointer; color:var(--text);
      transition:background 0.15s;
    `;
    item.addEventListener('mouseenter', () => (item as HTMLElement).style.background = 'rgba(255,255,255,0.06)');
    item.addEventListener('mouseleave', () => (item as HTMLElement).style.background = 'transparent');
  });

  // Wire create actions
  const parentPath = node ? (isDir ? node.path : node.path.substring(0, node.path.lastIndexOf('/') + 1) || node.path.substring(0, node.path.lastIndexOf('\\') + 1)) : '';
  contextMenuEl.querySelector('[data-action="new-file"]')?.addEventListener('click', () => {
    hideContextMenu();
    handleCreateFile(parentPath);
  });
  contextMenuEl.querySelector('[data-action="new-folder"]')?.addEventListener('click', () => {
    hideContextMenu();
    handleCreateFolder(parentPath);
  });

  // Wire edit actions
  if (node) {
    contextMenuEl.querySelector('[data-action="rename"]')?.addEventListener('click', () => {
      hideContextMenu();
      handleRename(node);
    });
    contextMenuEl.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      hideContextMenu();
      handleDelete(node);
    });
  }

  // Position
  contextMenuEl.style.left = `${x}px`;
  contextMenuEl.style.top = `${y}px`;
  contextMenuEl.style.display = 'block';
}

function hideContextMenu(): void {
  if (contextMenuEl) contextMenuEl.style.display = 'none';
}

async function handleCreateFile(parentPath: string): Promise<void> {
  const name = prompt(t('explorer.new_file_prompt'));
  if (!name) return;
  const filePath = parentPath ? `${parentPath}/${name}` : name;
  try {
    await fetch(`${API}/workspace/create-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath }),
    });
    refreshTree();
    // Open the newly created file
    PubSub.emit('file:open', filePath);
  } catch (e) {
    console.error('Create file failed:', e);
  }
}

async function handleCreateFolder(parentPath: string): Promise<void> {
  const name = prompt(t('explorer.new_folder_prompt'));
  if (!name) return;
  const folderPath = parentPath ? `${parentPath}/${name}` : name;
  try {
    await fetch(`${API}/workspace/create-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: folderPath }),
    });
    refreshTree();
  } catch (e) {
    console.error('Create folder failed:', e);
  }
}

async function handleRename(node: FileTreeNode): Promise<void> {
  const newName = prompt(`${t('explorer.rename')} "${node.name}":`, node.name);
  if (!newName || newName === node.name) return;

  try {
    await fetch(`${API}/workspace/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_path: node.path, new_name: newName }),
    });
    refreshTree();
  } catch (e) {
    console.error('Rename failed:', e);
  }
}

async function handleDelete(node: FileTreeNode): Promise<void> {
  const confirmed = confirm(`${t('explorer.delete')} "${node.name}"?\n\n${t('explorer.delete_confirm')}`);
  if (!confirmed) return;

  try {
    await fetch(`${API}/workspace/file?path=${encodeURIComponent(node.path)}`, {
      method: 'DELETE',
    });
    refreshTree();
  } catch (e) {
    console.error('Delete failed:', e);
  }
}

function updateTimer(): void {
  if (!timerEl || !workspaceStartTime) return;
  const elapsed = Math.floor((Date.now() - workspaceStartTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const dot = '<span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;animation:pulse-dot 2s ease-in-out infinite;"></span>';
  timerEl.innerHTML = `${dot}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  // Inject pulse animation if not already present
  if (!document.getElementById('workspace-timer-style')) {
    const style = document.createElement('style');
    style.id = 'workspace-timer-style';
    style.textContent = '@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.3}}';
    document.head.appendChild(style);
  }
}
