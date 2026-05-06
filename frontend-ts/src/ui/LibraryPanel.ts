/**
 * Lumina IDE — Library Panel (v8.1)
 * Document upload, folder management, drag-drop file organization.
 * Pure DOM manipulation — no frameworks.
 *
 * Improvements:
 * - Drag-and-drop docs between folders
 * - Upload directly to a folder
 * - Context menu on docs (move, delete)
 * - Folder delete/rename
 * - Visual drag indicators
 * - Collapsible folders with state memory
 */

import { fetchLibraryList, createLibraryFolder, deleteLibraryDoc, moveLibraryDoc, savePersonalityText, fetchMemories, createMemory, deleteMemory } from '../api/client';
import { t } from '../core/i18n';

const BASE_HOST = window.location.protocol === 'file:' ? 'http://127.0.0.1:8001' : '';
const UPLOAD_URL = `${BASE_HOST}/api/library/upload`;
const PERSONALITY_URL = `${BASE_HOST}/api/library/personality`;

// Track collapsed folders across reloads
const collapsedFolders = new Set<string>();
let currentDragDoc: string | null = null;

export function initLibraryPanel(): void {
  const panel = document.getElementById('projecty-panel-library') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header">${t('panel.library')}</div>
    <div class="lib-panel-body" style="padding:12px; display:flex; flex-direction:column; gap:12px; flex:1; overflow-y:auto;">
      <!-- Personality Prompt (Inline Editor) -->
      <div class="lib-section" style="border:1px solid var(--border); border-radius:8px; padding:10px; background:var(--bg-overlay);">
        <h3 class="lib-section-title" style="font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px; margin:0 0 6px 0;">🧠 ${t('lib.personality')}</h3>
        <div id="projecty-personality-status" style="font-size:10px; color:var(--text-muted); margin-bottom:6px;">${t('lib.personality_none')}</div>
        <textarea id="projecty-personality-editor" rows="4" placeholder="Defina como o agente deve se comportar..." style="width:100%;box-sizing:border-box;background:var(--bg-primary);border:1px solid var(--border);color:var(--text);font-size:11px;padding:8px;border-radius:6px;resize:vertical;font-family:inherit;outline:none;transition:border 0.15s;"></textarea>
        <div style="display:flex; gap:6px; margin-top:6px;">
          <button id="projecty-personality-save" class="lib-btn lib-btn-accent" style="flex:1;">💾 Salvar</button>
          <button id="projecty-personality-upload" class="lib-btn" style="flex:1;">📄 Importar .txt</button>
          <button id="projecty-personality-delete" class="lib-btn lib-btn-danger" style="display:none;">🗑</button>
          <input id="projecty-personality-input" type="file" accept=".txt" style="display:none;" />
        </div>
      </div>

      <!-- Upload Zone -->
      <div id="projecty-upload-zone" class="lib-upload-zone">
        <span style="font-size:24px; opacity:0.7;">📤</span>
        <span style="font-size:11px; font-weight:600;">${t('lib.drag_hint')}</span>
        <span style="font-size:10px; color:var(--text-muted);">PDF, Word (.docx), Markdown, TXT</span>
        <input id="projecty-upload-input" type="file" accept=".pdf,.docx,.doc,.md,.txt" multiple style="display:none;" />
      </div>

      <!-- Upload Status -->
      <div id="projecty-upload-status" style="display:none; font-size:11px; color:var(--accent); text-align:center;">
        <div class="loading-spinner" style="width:16px;height:16px;margin:0 auto 4px;"></div>
        <span id="projecty-upload-progress">${t('lib.uploading')}</span>
      </div>

      <!-- Folder Management -->
      <div style="display:flex; gap:6px; align-items:center;">
        <input id="projecty-folder-input" type="text" placeholder="${t('lib.new_folder')}" class="lib-input" />
        <button id="projecty-folder-create" class="lib-btn lib-btn-accent" style="white-space:nowrap;">${t('lib.add_folder')}</button>
      </div>

      <!-- Document List by Folder -->
      <div>
        <h3 style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">${t('lib.indexed_docs')}</h3>
        <div id="projecty-library-list" style="display:flex; flex-direction:column; gap:4px;"></div>
      </div>

      <!-- Memories Section -->
      <div class="lib-section" style="border:1px solid var(--border); border-radius:8px; padding:10px; background:var(--bg-overlay);">
        <h3 class="lib-section-title" style="font-size:11px; font-weight:700; color:#f9e2af; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 6px 0;">💭 Memórias do Agente</h3>
        <div id="projecty-memory-list" style="display:flex; flex-direction:column; gap:4px; max-height:200px; overflow-y:auto;"></div>
        <div style="display:flex; gap:4px; margin-top:8px;">
          <select id="projecty-memory-type" style="background:var(--bg-primary);border:1px solid var(--border);color:var(--text);font-size:10px;padding:4px;border-radius:4px;">
            <option value="user">👤 User</option>
            <option value="feedback">📝 Feedback</option>
            <option value="project">📋 Project</option>
            <option value="reference">🔗 Reference</option>
          </select>
          <input id="projecty-memory-content" type="text" placeholder="Nova memória..." class="lib-input" style="flex:1;" />
          <button id="projecty-memory-add" class="lib-btn lib-btn-accent">＋</button>
        </div>
      </div>
    </div>

    <!-- Context Menu (hidden) -->
    <div id="lib-context-menu" class="lib-context-menu" style="display:none;"></div>
  `;

  // Inject styles
  injectLibraryStyles();

  const uploadZone = document.getElementById('projecty-upload-zone') as HTMLElement;
  const uploadInput = document.getElementById('projecty-upload-input') as HTMLInputElement;
  const uploadStatus = document.getElementById('projecty-upload-status') as HTMLElement;
  const folderInput = document.getElementById('projecty-folder-input') as HTMLInputElement;
  const folderCreate = document.getElementById('projecty-folder-create') as HTMLButtonElement;

  // Click to select
  uploadZone.addEventListener('click', () => uploadInput.click());

  // File selected
  uploadInput.addEventListener('change', () => {
    if (uploadInput.files && uploadInput.files.length > 0) {
      uploadFiles(uploadInput.files, uploadStatus);
    }
  });

  // Drag & Drop for upload
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('active');
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('active');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('active');
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files, uploadStatus);
    }
  });

  // Create folder
  folderCreate.addEventListener('click', async () => {
    const name = folderInput.value.trim();
    if (!name) return;
    folderCreate.textContent = '...';
    try {
      await createLibraryFolder(name);
      folderInput.value = '';
      loadDocuments();
    } catch (err) { console.warn('[Library] Failed to create folder:', err); }
    folderCreate.textContent = t('lib.add_folder');
  });

  // Enter key in folder input
  folderInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') folderCreate.click();
  });
  // ── Personality Prompt (Inline Editor) ────────────────────
  const personalityStatus = document.getElementById('projecty-personality-status') as HTMLElement;
  const personalityEditor = document.getElementById('projecty-personality-editor') as HTMLTextAreaElement;
  const personalitySaveBtn = document.getElementById('projecty-personality-save') as HTMLButtonElement;
  const personalityUploadBtn = document.getElementById('projecty-personality-upload') as HTMLButtonElement;
  const personalityDeleteBtn = document.getElementById('projecty-personality-delete') as HTMLButtonElement;
  const personalityInput = document.getElementById('projecty-personality-input') as HTMLInputElement;

  // Save inline text
  personalitySaveBtn.addEventListener('click', async () => {
    const text = personalityEditor.value.trim();
    personalitySaveBtn.textContent = '...';
    try {
      await savePersonalityText(text);
      loadPersonality();
    } catch (err) { console.warn('[Library] Failed to save personality:', err); }
    personalitySaveBtn.textContent = '💾 Salvar';
  });

  // Upload .txt file → populate textarea
  personalityUploadBtn.addEventListener('click', () => personalityInput.click());
  personalityInput.addEventListener('change', async () => {
    const file = personalityInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      personalityEditor.value = text;
      // Also save immediately
      await savePersonalityText(text, file.name);
      loadPersonality();
    } catch (err) { console.warn('[Library] Failed to import personality:', err); }
    personalityInput.value = '';
  });

  // Delete personality
  personalityDeleteBtn.addEventListener('click', async () => {
    try {
      await fetch(PERSONALITY_URL, { method: 'DELETE' });
      personalityEditor.value = '';
      loadPersonality();
    } catch (err) { console.warn('[Library] Failed to delete personality:', err); }
  });

  async function loadPersonality() {
    try {
      const resp = await fetch(PERSONALITY_URL);
      const data = await resp.json();
      if (data.active && data.text) {
        personalityStatus.innerHTML = `<span style="color:var(--accent);">✅ ${data.name || 'Ativa'}</span> <span style="color:var(--text-muted);">(${data.char_count} chars)</span>`;
        personalityDeleteBtn.style.display = 'block';
        // Only populate if editor is empty (don't overwrite user typing)
        if (!personalityEditor.value.trim()) {
          personalityEditor.value = data.text;
        }
      } else {
        personalityStatus.textContent = t('lib.personality_none');
        personalityDeleteBtn.style.display = 'none';
      }
    } catch (err) { console.warn('[Library] Failed to load personality status:', err); }
  }

  // ── Memory Section ────────────────────────────────────────
  const memoryList = document.getElementById('projecty-memory-list') as HTMLElement;
  const memoryTypeSelect = document.getElementById('projecty-memory-type') as HTMLSelectElement;
  const memoryContentInput = document.getElementById('projecty-memory-content') as HTMLInputElement;
  const memoryAddBtn = document.getElementById('projecty-memory-add') as HTMLButtonElement;

  async function loadMemories() {
    try {
      const resp = await fetchMemories();
      const memories = resp.memories || [];
      if (memories.length === 0) {
        memoryList.innerHTML = '<div style="font-size:10px;color:var(--text-muted);text-align:center;padding:8px;">Nenhuma memória salva</div>';
        return;
      }
      const icons: Record<string, string> = { user: '👤', feedback: '📝', project: '📋', reference: '🔗' };
      memoryList.innerHTML = memories.map(m =>
        `<div class="lib-memory-item" style="display:flex;align-items:flex-start;gap:6px;padding:4px 6px;border-radius:4px;background:rgba(255,255,255,0.02);border:1px solid var(--border);font-size:10px;">
          <span style="flex-shrink:0;">${icons[m.type] || '💭'}</span>
          <span style="flex:1;color:var(--text);line-height:1.3;word-break:break-word;">${m.content.length > 100 ? m.content.substring(0, 100) + '…' : m.content}</span>
          <button class="lib-memory-del" data-id="${m.id}" style="flex-shrink:0;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:10px;padding:0 2px;" title="Remover">✕</button>
        </div>`
      ).join('');
      // Wire delete buttons
      memoryList.querySelectorAll('.lib-memory-del').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt((btn as HTMLElement).dataset.id || '0');
          if (id) {
            await deleteMemory(id);
            loadMemories();
          }
        });
      });
    } catch (err) { console.warn('[Library] Failed to load memories:', err); }
  }

  memoryAddBtn.addEventListener('click', async () => {
    const content = memoryContentInput.value.trim();
    if (!content) return;
    const type = memoryTypeSelect.value;
    memoryAddBtn.textContent = '...';
    await createMemory(type, content);
    memoryContentInput.value = '';
    memoryAddBtn.textContent = '＋';
    loadMemories();
  });

  // Close context menu on click outside
  document.addEventListener('click', () => {
    const menu = document.getElementById('lib-context-menu');
    if (menu) menu.style.display = 'none';
  });

  loadPersonality();
  loadDocuments();
  loadMemories();
}

// ── Upload ───────────────────────────────────────────────────────
async function uploadFiles(files: FileList, statusEl: HTMLElement): Promise<void> {
  statusEl.style.display = 'block';
  const progressEl = document.getElementById('projecty-upload-progress');

  for (let i = 0; i < files.length; i++) {
    if (progressEl) progressEl.textContent = `Enviando ${i + 1}/${files.length}: ${files[i].name}`;
    const formData = new FormData();
    formData.append('file', files[i]);

    try {
      await fetch(UPLOAD_URL, { method: 'POST', body: formData });
    } catch (err) {
      console.error('[Library] Upload failed:', err);
    }
  }

  statusEl.style.display = 'none';
  loadDocuments();
}

// ── Document List ────────────────────────────────────────────────
async function loadDocuments(): Promise<void> {
  const listEl = document.getElementById('projecty-library-list') as HTMLElement;
  if (!listEl) return;

  try {
    const data = await fetchLibraryList();
    const docs = (data.documents || []) as Array<{ name?: string; filename?: string; type?: string; folder?: string; pages?: number; words?: number }>;
    const folders = (data.folders || []) as Array<{ name: string; doc_count: number }>;

    if (docs.length === 0 && folders.length <= 1) {
      listEl.innerHTML = `<p style="font-size:11px; color:var(--text-muted); text-align:center; padding:16px 0;">${t('lib.no_docs')}</p>`;
      return;
    }

    listEl.innerHTML = '';

    // Render folders
    for (const folder of folders) {
      const folderDocList = docs.filter(d => (d.folder || 'Geral') === folder.name);
      const folderEl = createFolderElement(folder, folderDocList, folders);
      listEl.appendChild(folderEl);
    }

    // Orphan docs (not in any folder)
    const allFolderNames = new Set(folders.map(f => f.name));
    const orphans = docs.filter(d => d.folder && !allFolderNames.has(d.folder));
    if (orphans.length > 0) {
      const orphanFolder = { name: 'Sem Pasta', doc_count: orphans.length };
      const orphanEl = createFolderElement(orphanFolder, orphans, folders);
      listEl.appendChild(orphanEl);
    }

  } catch {
    listEl.innerHTML = `<p style="font-size:11px; color:var(--accent-red, #f38ba8);">${t('lib.error')}</p>`;
  }
}

function createFolderElement(
  folder: { name: string; doc_count: number },
  folderDocs: Array<{ name?: string; filename?: string; type?: string; folder?: string; pages?: number; words?: number }>,
  allFolders: Array<{ name: string; doc_count: number }>
): HTMLElement {
  const folderEl = document.createElement('div');
  folderEl.className = 'lib-folder';

  const isCollapsed = collapsedFolders.has(folder.name);
  const isDefault = folder.name === 'Geral';

  // ── Folder Header ──
  const folderHeader = document.createElement('div');
  folderHeader.className = 'lib-folder-header';
  folderHeader.innerHTML = `
    <div style="display:flex; align-items:center; gap:6px; flex:1;">
      <span class="lib-folder-icon">${isCollapsed ? '📁' : '📂'}</span>
      <span class="lib-folder-name">${folder.name}</span>
      <span class="lib-folder-count">${folderDocs.length}</span>
    </div>
    ${!isDefault ? '<button class="lib-folder-delete" title="Deletar pasta">✕</button>' : ''}
  `;

  // Drop target for folder
  folderHeader.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    folderHeader.classList.add('lib-drag-over');
  });
  folderHeader.addEventListener('dragleave', () => {
    folderHeader.classList.remove('lib-drag-over');
  });
  folderHeader.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    folderHeader.classList.remove('lib-drag-over');
    if (currentDragDoc) {
      try {
        await moveLibraryDoc(currentDragDoc, folder.name);
        loadDocuments();
      } catch (err) {
        console.warn('[Library] Move failed:', err);
      }
      currentDragDoc = null;
    }
  });

  folderEl.appendChild(folderHeader);

  // ── Folder Body (doc list) ──
  const folderBody = document.createElement('div');
  folderBody.className = 'lib-folder-body';
  folderBody.style.display = isCollapsed ? 'none' : 'block';

  for (const doc of folderDocs) {
    const name = doc.name || doc.filename || t('lib.file');
    const item = createDocElement(name, doc, allFolders);
    folderBody.appendChild(item);
  }

  if (folderDocs.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'lib-empty-folder';
    emptyMsg.textContent = 'Arraste documentos para cá';
    folderBody.appendChild(emptyMsg);
  }

  folderEl.appendChild(folderBody);

  // Drop on empty area of folder body
  folderBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    folderBody.classList.add('lib-drag-over-body');
  });
  folderBody.addEventListener('dragleave', (e) => {
    // Only remove if actually leaving (not entering a child)
    if (!folderBody.contains(e.relatedTarget as Node)) {
      folderBody.classList.remove('lib-drag-over-body');
    }
  });
  folderBody.addEventListener('drop', async (e) => {
    e.preventDefault();
    folderBody.classList.remove('lib-drag-over-body');
    if (currentDragDoc) {
      try {
        await moveLibraryDoc(currentDragDoc, folder.name);
        loadDocuments();
      } catch (err) {
        console.warn('[Library] Move failed:', err);
      }
      currentDragDoc = null;
    }
  });

  // Toggle collapse
  folderHeader.addEventListener('click', (e) => {
    // Don't toggle if clicking delete button
    if ((e.target as HTMLElement).classList.contains('lib-folder-delete')) return;
    const wasCollapsed = collapsedFolders.has(folder.name);
    if (wasCollapsed) {
      collapsedFolders.delete(folder.name);
      folderBody.style.display = 'block';
      folderHeader.querySelector('.lib-folder-icon')!.textContent = '📂';
    } else {
      collapsedFolders.add(folder.name);
      folderBody.style.display = 'none';
      folderHeader.querySelector('.lib-folder-icon')!.textContent = '📁';
    }
  });

  // Delete folder button
  const deleteBtn = folderHeader.querySelector('.lib-folder-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Move all docs to "Geral" first
      for (const doc of folderDocs) {
        const docName = doc.name || doc.filename || '';
        if (docName) {
          try {
            await moveLibraryDoc(docName, 'Geral');
          } catch { /* ignore */ }
        }
      }
      // Reload (backend doesn't have folder delete yet — docs moved back)
      loadDocuments();
    });
  }

  return folderEl;
}

function createDocElement(
  name: string,
  doc: { type?: string; pages?: number; words?: number },
  allFolders: Array<{ name: string; doc_count: number }>
): HTMLElement {
  const item = document.createElement('div');
  item.className = 'lib-doc-item';
  item.draggable = true;
  item.dataset.docName = name;

  const typeIcon = doc.type === 'pdf' ? '📕' : doc.type === 'docx' ? '📘' : doc.type === 'md' ? '📝' : '📄';
  const meta: string[] = [];
  if (doc.pages) meta.push(`${doc.pages}p`);
  if (doc.words) meta.push(`${doc.words}w`);
  const metaStr = meta.length > 0 ? `<span class="lib-doc-meta">${meta.join(' · ')}</span>` : '';

  item.innerHTML = `
    <div style="display:flex; align-items:center; gap:6px; flex:1; min-width:0;">
      <span style="font-size:13px; flex-shrink:0;">${typeIcon}</span>
      <span class="lib-doc-name" title="${name}">${name}</span>
      ${metaStr}
    </div>
    <button class="lib-doc-delete" data-name="${name}" title="${t('lib.remove')}">✕</button>
  `;

  // Drag start
  item.addEventListener('dragstart', (e) => {
    currentDragDoc = name;
    item.classList.add('lib-dragging');
    e.dataTransfer!.setData('text/plain', name);
    e.dataTransfer!.effectAllowed = 'move';
  });
  item.addEventListener('dragend', () => {
    currentDragDoc = null;
    item.classList.remove('lib-dragging');
    // Clean all drag-over states
    document.querySelectorAll('.lib-drag-over, .lib-drag-over-body').forEach(el => {
      el.classList.remove('lib-drag-over', 'lib-drag-over-body');
    });
  });

  // Right-click context menu
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, name, allFolders);
  });

  // Delete button
  const deleteBtn = item.querySelector('.lib-doc-delete') as HTMLButtonElement;
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      deleteBtn.textContent = '...';
      try {
        await deleteLibraryDoc(name);
        loadDocuments();
      } catch {
        deleteBtn.textContent = '✕';
      }
    });
  }

  return item;
}

// ── Context Menu ─────────────────────────────────────────────────
function showContextMenu(x: number, y: number, docName: string, allFolders: Array<{ name: string }>) {
  const menu = document.getElementById('lib-context-menu') as HTMLElement;
  if (!menu) return;

  let html = `<div class="lib-ctx-header">${docName}</div>`;

  // Move to folder options
  if (allFolders.length > 1) {
    html += `<div class="lib-ctx-separator"></div>`;
    html += `<div class="lib-ctx-label">Mover para:</div>`;
    for (const folder of allFolders) {
      html += `<div class="lib-ctx-item" data-action="move" data-folder="${folder.name}">📁 ${folder.name}</div>`;
    }
  }

  html += `<div class="lib-ctx-separator"></div>`;
  html += `<div class="lib-ctx-item lib-ctx-danger" data-action="delete">🗑️ Remover</div>`;

  menu.innerHTML = html;
  menu.style.display = 'block';

  // Position: ensure within viewport
  const rect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width - 8;
  const maxY = window.innerHeight - rect.height - 8;
  menu.style.left = `${Math.min(x, maxX)}px`;
  menu.style.top = `${Math.min(y, maxY)}px`;

  // Handle clicks
  menu.querySelectorAll('.lib-ctx-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      const action = el.dataset.action;

      if (action === 'move') {
        const targetFolder = el.dataset.folder || 'Geral';
        try {
          await moveLibraryDoc(docName, targetFolder);
          loadDocuments();
        } catch (err) {
          console.warn('[Library] Move failed:', err);
        }
      } else if (action === 'delete') {
        try {
          await deleteLibraryDoc(docName);
          loadDocuments();
        } catch (err) {
          console.warn('[Library] Delete failed:', err);
        }
      }

      menu.style.display = 'none';
    });
  });
}

// ── Styles ───────────────────────────────────────────────────────
function injectLibraryStyles() {
  if (document.getElementById('lib-panel-styles')) return;
  const style = document.createElement('style');
  style.id = 'lib-panel-styles';
  style.textContent = `
    /* ── Buttons ── */
    .lib-btn {
      background: none;
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 6px;
      font-size: 10px;
      padding: 5px 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .lib-btn:hover { background: var(--bg-overlay); }
    .lib-btn-accent {
      background: var(--accent);
      color: black;
      border: none;
    }
    .lib-btn-accent:hover { filter: brightness(1.1); }
    .lib-btn-danger {
      border-color: var(--accent-red, #f38ba8);
      color: var(--accent-red, #f38ba8);
    }
    .lib-btn-danger:hover { background: rgba(243, 139, 168, 0.1); }

    /* ── Input ── */
    .lib-input {
      flex: 1;
      background: var(--bg-overlay);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 6px;
      outline: none;
      transition: border 0.15s;
    }
    .lib-input:focus { border-color: var(--accent); }

    /* ── Upload Zone ── */
    .lib-upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 16px;
      border: 2px dashed var(--border);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
    }
    .lib-upload-zone:hover,
    .lib-upload-zone.active {
      border-color: var(--accent);
      background: rgba(var(--accent-rgb, 124,58,237), 0.05);
    }

    /* ── Folders ── */
    .lib-folder {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .lib-folder-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      color: var(--text);
      background: var(--bg-overlay);
      transition: all 0.15s;
      user-select: none;
    }
    .lib-folder-header:hover { background: rgba(var(--accent-rgb, 124,58,237), 0.06); }
    .lib-folder-header.lib-drag-over {
      background: rgba(var(--accent-rgb, 124,58,237), 0.15) !important;
      border-bottom: 2px solid var(--accent);
    }
    .lib-folder-icon { font-size: 14px; }
    .lib-folder-name { flex: 1; }
    .lib-folder-count {
      font-size: 9px;
      font-weight: 500;
      color: var(--text-muted);
      background: rgba(255,255,255,0.05);
      padding: 1px 6px;
      border-radius: 10px;
    }
    .lib-folder-delete {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s;
    }
    .lib-folder-header:hover .lib-folder-delete { opacity: 0.6; }
    .lib-folder-delete:hover { opacity: 1 !important; color: var(--accent-red, #f38ba8); }

    /* ── Folder Body ── */
    .lib-folder-body {
      padding: 4px 6px 6px;
      transition: background 0.2s;
    }
    .lib-folder-body.lib-drag-over-body {
      background: rgba(var(--accent-rgb, 124,58,237), 0.08);
    }
    .lib-empty-folder {
      font-size: 10px;
      color: var(--text-muted);
      text-align: center;
      padding: 8px;
      font-style: italic;
      opacity: 0.6;
    }

    /* ── Document Items ── */
    .lib-doc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 8px;
      border-radius: 6px;
      margin-bottom: 2px;
      cursor: grab;
      transition: all 0.15s;
      background: transparent;
    }
    .lib-doc-item:hover {
      background: var(--bg-overlay);
    }
    .lib-doc-item.lib-dragging {
      opacity: 0.4;
      transform: scale(0.98);
    }
    .lib-doc-name {
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lib-doc-meta {
      font-size: 9px;
      color: var(--text-muted);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .lib-doc-delete {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s;
    }
    .lib-doc-item:hover .lib-doc-delete { opacity: 0.5; }
    .lib-doc-delete:hover { opacity: 1 !important; color: var(--accent-red, #f38ba8); }

    /* ── Context Menu ── */
    .lib-context-menu {
      position: fixed;
      z-index: 10000;
      background: var(--bg-primary, #1e1e2e);
      border: 1px solid var(--border);
      border-radius: 8px;
      min-width: 160px;
      padding: 4px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      backdrop-filter: blur(12px);
    }
    .lib-ctx-header {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      padding: 6px 10px 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .lib-ctx-label {
      font-size: 9px;
      color: var(--text-muted);
      padding: 4px 10px 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .lib-ctx-separator {
      height: 1px;
      background: var(--border);
      margin: 4px 6px;
    }
    .lib-ctx-item {
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.1s;
      white-space: nowrap;
    }
    .lib-ctx-item:hover { background: rgba(var(--accent-rgb, 124,58,237), 0.15); }
    .lib-ctx-danger { color: var(--accent-red, #f38ba8); }
    .lib-ctx-danger:hover { background: rgba(243, 139, 168, 0.12) !important; }
  `;
  document.head.appendChild(style);
}
