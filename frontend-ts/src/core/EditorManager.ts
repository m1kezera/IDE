/**
 * Project Y — Editor Manager (v5.0)
 * Vanilla TS file editor with tab management, Ctrl+S save, and line numbers.
 * Listens to PubSub 'file:select' events from the Sidebar.
 */

import { readFile, writeFile, fetchAutocomplete } from '../api/client';
import { PubSub } from '../core/PubSub';
import { marked } from 'marked';

interface OpenTab {
  path: string;
  name: string;
  ext: string;
  content: string;
  modified: boolean;
}

let openTabs: OpenTab[] = [];
export let activeTabPath: string | null = null;

let tabBarEl: HTMLElement;
let editorContentEl: HTMLElement;
let welcomeEl: HTMLElement;
let activeTextarea: HTMLTextAreaElement | null = null;

// Language display names
const LANG_MAP: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript React', js: 'JavaScript', jsx: 'JavaScript React',
  py: 'Python', css: 'CSS', scss: 'SCSS', html: 'HTML', htm: 'HTML',
  json: 'JSON', md: 'Markdown', txt: 'Plain Text', yaml: 'YAML', yml: 'YAML',
  xml: 'XML', svg: 'SVG', sh: 'Shell Script', bat: 'Batch', ps1: 'PowerShell',
  rs: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C', h: 'C Header',
  vue: 'Vue', svelte: 'Svelte', toml: 'TOML', env: 'Environment',
  canvas: 'JSON Canvas',
};

function updateStatusBar(textarea?: HTMLTextAreaElement): void {
  const tab = openTabs.find(t => t.path === activeTabPath);
  if (!tab) return;

  // Line / Column
  const lnColEl = document.getElementById('projecty-status-ln-col');
  if (lnColEl && textarea) {
    const val = textarea.value;
    const pos = textarea.selectionStart;
    const lines = val.substring(0, pos).split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    lnColEl.textContent = `Ln ${ln}, Col ${col}`;
  }

  // Language
  const langEl = document.getElementById('projecty-status-lang');
  if (langEl) langEl.textContent = LANG_MAP[tab.ext] || tab.ext.toUpperCase() || 'Plain Text';

  // EOL detection
  const eolEl = document.getElementById('projecty-status-eol');
  if (eolEl) eolEl.textContent = tab.content.includes('\r\n') ? 'CRLF' : 'LF';

  // Encoding (always UTF-8 for now)
  const encEl = document.getElementById('projecty-status-encoding');
  if (encEl) encEl.textContent = 'UTF-8';
}

export function initEditor(): void {
  tabBarEl = document.getElementById('projecty-tab-bar') as HTMLElement;
  editorContentEl = document.getElementById('projecty-editor-content') as HTMLElement;
  welcomeEl = document.getElementById('projecty-welcome') as HTMLElement;

  // Listen for file selections from Explorer
  PubSub.on('file:select', (data) => {
    const file = data as { path: string; name: string; ext: string };
    openFile(file.path, file.name, file.ext);
  });

  // Wire autocomplete toggle button
  const toggleBtn = document.getElementById('projecty-autocomplete-toggle');
  if (toggleBtn) {
    // Restore saved state
    const saved = localStorage.getItem('lumina_autocomplete');
    if (saved === 'off') {
      toggleBtn.classList.remove('on');
    } else {
      toggleBtn.classList.add('on'); // default ON
    }
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('on');
      const isOn = toggleBtn.classList.contains('on');
      localStorage.setItem('lumina_autocomplete', isOn ? 'on' : 'off');
      toggleBtn.title = isOn ? 'Autocomplete: ON' : 'Autocomplete: OFF';
    });
  }

  // Listen for Web Studio insert content
  PubSub.on('editor:insert_content', (data) => {
    const { content } = data as { content: string; language: string };
    if (activeTextarea) {
      // Insert at cursor position
      const start = activeTextarea.selectionStart;
      const end = activeTextarea.selectionEnd;
      activeTextarea.value = activeTextarea.value.substring(0, start) + content + activeTextarea.value.substring(end);
      activeTextarea.selectionStart = activeTextarea.selectionEnd = start + content.length;
      activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // No active editor — create a temp file
      const tab: OpenTab = {
        path: '__web-studio-export__.html',
        name: 'design-export.html',
        ext: 'html',
        content,
        modified: true,
      };
      openTabs.push(tab);
      activateTab(tab.path);
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
  updateStatusBar(activeTextarea || undefined);
}

export function closeTab(path: string): void {
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
      ${tab.ext === 'md' ? '<button class="md-preview-toggle" title="Toggle Markdown Preview">👁 Preview MD</button>' : ''}
      ${tab.ext === 'canvas' ? '<button class="editor-canvas-btn" title="Infinite Preview" style="background:linear-gradient(135deg,#a855f7,#6366f1);color:white;border:none;border-radius:3px;padding:2px 8px;font-weight:bold;cursor:pointer;margin-right:4px;">∞ Canvas</button>' : ''}
      <button class="editor-preview-btn" title="Live Preview" style="background:var(--accent); color:black; border:none; border-radius:3px; padding:2px 6px; font-weight:bold; cursor:pointer; margin-right:8px;">▶ Preview</button>
      <button class="editor-save-btn" title="Salvar (Ctrl+S)">💾</button>
    </div>
  `;

  // Code area with line numbers
  const codeArea = document.createElement('div');
  codeArea.className = 'code-area';

  const lineNumbers = document.createElement('div');
  lineNumbers.className = 'line-numbers';
  lineNumbers.id = 'projecty-line-numbers';

  const textareaWrapper = document.createElement('div');
  textareaWrapper.style.position = 'relative';
  textareaWrapper.style.flex = '1';
  textareaWrapper.style.overflow = 'hidden';

  // Ghost text overlay — floats at cursor position
  const ghostOverlay = document.createElement('div');
  ghostOverlay.className = 'ghost-inline-suggestion';
  ghostOverlay.style.cssText = `
    position: absolute; pointer-events: none; z-index: 3;
    color: rgba(137, 180, 250, 0.5); font-family: inherit; font-size: inherit;
    line-height: inherit; white-space: pre; display: none;
    text-shadow: 0 0 8px rgba(137, 180, 250, 0.15);
  `;

  // Hidden measurement div for cursor position calculation
  const measureDiv = document.createElement('div');
  measureDiv.style.cssText = `
    position: absolute; visibility: hidden; white-space: pre; pointer-events: none;
    font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
    font-size: 13px; line-height: 20px; padding: 8px 16px; tab-size: 4;
  `;

  const textarea = document.createElement('textarea');
  textarea.className = 'code-textarea';
  textarea.style.position = 'absolute';
  textarea.style.inset = '0';
  textarea.style.background = 'transparent';
  textarea.style.zIndex = '2';
  textarea.value = tab.content;
  textarea.spellcheck = false;
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocapitalize', 'off');

  textareaWrapper.appendChild(textarea);
  textareaWrapper.appendChild(ghostOverlay);
  textareaWrapper.appendChild(measureDiv);
  codeArea.appendChild(lineNumbers);
  codeArea.appendChild(textareaWrapper);

  // Update line numbers
  const updateLineNumbers = (): void => {
    const lines = textarea.value.split('\n');
    lineNumbers.innerHTML = lines
      .map((_, i) => `<div class="line-num">${i + 1}</div>`)
      .join('');
  };

  // --- Autocomplete UI & Logic ---
  editorEl.style.position = 'relative';
  const suggestionBox = document.createElement('div');
  suggestionBox.className = 'editor-suggestion-box';
  suggestionBox.style.display = 'none';
  suggestionBox.style.position = 'absolute';
  suggestionBox.style.bottom = '30px';
  suggestionBox.style.right = '30px';
  suggestionBox.style.background = 'var(--bg-overlay)';
  suggestionBox.style.border = '1px solid var(--border)';
  suggestionBox.style.padding = '8px 12px';
  suggestionBox.style.borderRadius = '6px';
  suggestionBox.style.fontFamily = "'JetBrains Mono', monospace";
  suggestionBox.style.fontSize = '12px';
  suggestionBox.style.color = 'var(--text-accent)';
  suggestionBox.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
  suggestionBox.style.zIndex = '100';
  suggestionBox.style.pointerEvents = 'none';
  suggestionBox.style.whiteSpace = 'pre-wrap';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let currentSuggestion: string | null = null;

  textarea.addEventListener('input', () => {
    tab.content = textarea.value;
    tab.modified = true;
    updateLineNumbers();
    renderTabBar(); // refresh dot indicator

    // Clear autocomplete
    suggestionBox.style.display = 'none';
    ghostOverlay.style.display = 'none';
    ghostOverlay.textContent = '';
    currentSuggestion = null;

    if (debounceTimer) clearTimeout(debounceTimer);
    
    const toggleBtn = document.getElementById('projecty-autocomplete-toggle');
    const isToggleOn = toggleBtn ? toggleBtn.classList.contains('on') : false;
    console.log('[Autocomplete] input event, toggle:', isToggleOn, 'toggleBtn:', !!toggleBtn);
    if (toggleBtn && !isToggleOn) return;

    debounceTimer = setTimeout(async () => {
      const code = textarea.value;
      const cursorPos = textarea.selectionStart;
      const textBefore = code.substring(0, cursorPos);
      const linesBefore = textBefore.split('\n');
      const cursorLine = linesBefore.length - 1;
      const cursorCol = linesBefore[linesBefore.length - 1].length;

      try {
        console.log('[Autocomplete] Fetching...', { cursorLine, cursorCol, filename: tab.name });
        const res = await fetchAutocomplete({
          code,
          cursorLine,
          cursorCol,
          filename: tab.name,
          mode: 'local'
        });
        console.log('[Autocomplete] Response:', res);
        if (res.suggestion) {
          currentSuggestion = res.suggestion;
          
          // Calculate cursor pixel position
          const currentCode = textarea.value;
          const currentCursorPos = textarea.selectionStart;
          const textBeforeCursor = currentCode.substring(0, currentCursorPos);
          const linesBeforeCursor = textBeforeCursor.split('\n');
          const currentLineText = linesBeforeCursor[linesBeforeCursor.length - 1];
          const lineIndex = linesBeforeCursor.length - 1;

          // Measure the width of text before cursor on current line
          measureDiv.textContent = currentLineText;
          const textWidth = measureDiv.scrollWidth;
          const lineTop = lineIndex * 20; // 20px line-height

          // Position ghost overlay at cursor
          ghostOverlay.textContent = res.suggestion.split('\n')[0]; // show first line only
          ghostOverlay.style.left = `${textWidth}px`;
          ghostOverlay.style.top = `${lineTop - textarea.scrollTop}px`;
          ghostOverlay.style.display = 'block';
          console.log('[Autocomplete] Ghost overlay shown:', { textWidth, lineTop, suggestion: res.suggestion.substring(0, 40) });

          // Show tooltip with brain indicator and Tab hint
          suggestionBox.innerHTML = `<span style="color:var(--text-muted);font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">⇥ TAB aceitar · ESC ignorar ${res.used_brain ? '· 🧠 Brain' : ''}</span>`;
          suggestionBox.style.display = 'block';
        }
      } catch (err) { console.error('[Autocomplete] Error:', err); }
    }, 800);
  });

  // Sync scroll
  textarea.addEventListener('scroll', () => {
    lineNumbers.scrollTop = textarea.scrollTop;
    // Hide ghost while scrolling (reposition is complex)
    ghostOverlay.style.display = 'none';
  });

  // Tab key support + Hide suggestion on other keys
  textarea.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (currentSuggestion) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + currentSuggestion + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + currentSuggestion.length;
        tab.content = textarea.value;
        tab.modified = true;
        updateLineNumbers();
        suggestionBox.style.display = 'none';
        ghostOverlay.style.display = 'none';
        ghostOverlay.textContent = '';
        currentSuggestion = null;
        renderTabBar();
      } else {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 4;
        tab.content = textarea.value;
        tab.modified = true;
        updateLineNumbers();
      }
    } else if (e.key === 'Escape' && currentSuggestion) {
      suggestionBox.style.display = 'none';
      ghostOverlay.style.display = 'none';
      ghostOverlay.textContent = '';
      currentSuggestion = null;
    } else {
      if (e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
        suggestionBox.style.display = 'none';
        ghostOverlay.style.display = 'none';
        ghostOverlay.textContent = '';
        currentSuggestion = null;
      }
    }
  });

  // ── Markdown Preview Panel ──
  let mdPreviewEl: HTMLDivElement | null = null;
  let mdPreviewActive = false;

  if (tab.ext === 'md') {
    mdPreviewEl = document.createElement('div');
    mdPreviewEl.className = 'md-preview';
    mdPreviewEl.style.display = 'none';
    mdPreviewEl.style.position = 'absolute';
    mdPreviewEl.style.inset = '0';
    mdPreviewEl.style.overflowY = 'auto';
    mdPreviewEl.style.zIndex = '5';
    mdPreviewEl.style.background = 'var(--bg-secondary, #1a1a2e)';
    codeArea.style.position = 'relative';
    codeArea.appendChild(mdPreviewEl);

    // Update preview on input
    textarea.addEventListener('input', () => {
      if (mdPreviewActive && mdPreviewEl) {
        mdPreviewEl.innerHTML = marked.parse(textarea.value) as string;
      }
    });
  }

  editorEl.appendChild(toolbar);
  editorEl.appendChild(codeArea);
  editorEl.appendChild(suggestionBox);
  editorContentEl.appendChild(editorEl);

  // ── Markdown Preview Toggle Button ──
  const mdToggleBtn = toolbar.querySelector('.md-preview-toggle');
  if (mdToggleBtn && mdPreviewEl) {
    mdToggleBtn.addEventListener('click', () => {
      mdPreviewActive = !mdPreviewActive;
      mdToggleBtn.classList.toggle('active', mdPreviewActive);
      if (mdPreviewActive && mdPreviewEl) {
        mdPreviewEl.innerHTML = marked.parse(textarea.value) as string;
        mdPreviewEl.style.display = 'block';
        textarea.style.visibility = 'hidden';
        lineNumbers.style.visibility = 'hidden';
      } else if (mdPreviewEl) {
        mdPreviewEl.style.display = 'none';
        textarea.style.visibility = 'visible';
        lineNumbers.style.visibility = 'visible';
      }
    });
  }

  // Preview button
  const previewBtn = toolbar.querySelector('.editor-preview-btn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const tabList = openTabs.map(t => ({ path: t.path, name: t.name, ext: t.ext }));
      PubSub.emit('editor:preview', { content: tab.content, ext: tab.ext, openTabs: tabList });
    });
  }

  // Infinite Preview button for .canvas files
  const canvasBtn = toolbar.querySelector('.editor-canvas-btn');
  if (canvasBtn) {
    canvasBtn.addEventListener('click', () => {
      PubSub.emit('canvas:open', {
        content: tab.content,
        path: tab.path,
        onUpdate: (json: string) => {
          tab.content = json;
          tab.modified = true;
          renderTabBar();  // Show ● dot
          textarea.value = json;
          updateLineNumbers();
        },
      });
    });
  }

  // Handle preview:rerun — re-execute current file
  PubSub.on('preview:rerun', (data) => {
    const { mode } = data as { mode: string };
    const activeTab = openTabs.find(t => t.path === activeTabPath);
    if (activeTab) {
      PubSub.emit('preview:file_content', { content: activeTab.content, ext: mode === 'auto' ? activeTab.ext : mode });
    }
  });

  // Handle preview:request_file — preview a specific tab
  PubSub.on('preview:request_file', (data) => {
    const { path, mode } = data as { path: string; mode: string };
    const targetTab = openTabs.find(t => t.path === path);
    if (targetTab) {
      PubSub.emit('preview:file_content', { content: targetTab.content, ext: mode === 'auto' ? targetTab.ext : mode });
    }
  });

  // Save button
  const saveBtn = toolbar.querySelector('.editor-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveActiveFile);
  }

  updateLineNumbers();
  textarea.focus();

  // Wire real status bar updates
  activeTextarea = textarea;
  const trackCursor = () => updateStatusBar(textarea);
  textarea.addEventListener('click', trackCursor);
  textarea.addEventListener('keyup', trackCursor);
  textarea.addEventListener('select', trackCursor);
  trackCursor(); // initial update

  // ── Search Bar (Ctrl+F) ──
  let searchBarEl: HTMLDivElement | null = null;
  let searchInput: HTMLInputElement | null = null;
  let searchMatchIndex = 0;
  let searchMatches: number[] = []; // positions of matches in textarea

  function showSearchBar() {
    if (searchBarEl) { searchInput?.focus(); searchInput?.select(); return; }

    searchBarEl = document.createElement('div');
    searchBarEl.className = 'editor-search-bar';
    searchBarEl.innerHTML = `
      <input type="text" class="editor-search-input" placeholder="Buscar... (Enter=próx, Shift+Enter=ant)" spellcheck="false" />
      <span class="editor-search-count">0/0</span>
      <button class="editor-search-btn" title="Anterior (Shift+Enter)">▲</button>
      <button class="editor-search-btn" title="Próximo (Enter)">▼</button>
      <button class="editor-search-btn editor-search-close" title="Fechar (Esc)">✕</button>
    `;

    // Insert before the code area
    editorEl.insertBefore(searchBarEl, codeArea);

    searchInput = searchBarEl.querySelector('.editor-search-input') as HTMLInputElement;
    const countEl = searchBarEl.querySelector('.editor-search-count') as HTMLSpanElement;
    const [prevBtn, nextBtn, closeBtn] = searchBarEl.querySelectorAll('.editor-search-btn');

    function doSearch() {
      const query = searchInput!.value.toLowerCase();
      searchMatches = [];
      if (query.length > 0) {
        const text = textarea.value.toLowerCase();
        let idx = text.indexOf(query);
        while (idx !== -1) {
          searchMatches.push(idx);
          idx = text.indexOf(query, idx + 1);
        }
      }
      searchMatchIndex = 0;
      countEl.textContent = searchMatches.length > 0 ? `1/${searchMatches.length}` : '0/0';
      goToMatch();
    }

    function goToMatch() {
      if (searchMatches.length === 0) return;
      const pos = searchMatches[searchMatchIndex];
      const query = searchInput!.value;
      textarea.focus();
      textarea.setSelectionRange(pos, pos + query.length);
      // Scroll textarea to show the match
      const textBefore = textarea.value.substring(0, pos);
      const lineNum = textBefore.split('\n').length - 1;
      textarea.scrollTop = Math.max(0, lineNum * 20 - 100); // 20px per line
      countEl.textContent = `${searchMatchIndex + 1}/${searchMatches.length}`;
    }

    function nextMatch() {
      if (searchMatches.length === 0) return;
      searchMatchIndex = (searchMatchIndex + 1) % searchMatches.length;
      goToMatch();
    }

    function prevMatch() {
      if (searchMatches.length === 0) return;
      searchMatchIndex = (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
      goToMatch();
    }

    function closeSearch() {
      searchBarEl?.remove();
      searchBarEl = null;
      searchInput = null;
      searchMatches = [];
      textarea.focus();
    }

    searchInput.addEventListener('input', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? prevMatch() : nextMatch(); }
      if (e.key === 'Escape') { e.preventDefault(); closeSearch(); }
    });
    prevBtn.addEventListener('click', prevMatch);
    nextBtn.addEventListener('click', nextMatch);
    closeBtn.addEventListener('click', closeSearch);

    searchInput.focus();
  }

  // Listen for Ctrl+F event
  PubSub.on('editor:search', () => {
    if (activeTabPath === tab.path) showSearchBar();
  });
}

export async function saveActiveFile(): Promise<void> {
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
    // Emit for ProblemsPanel auto-check
    PubSub.emit('file:saved', { path: tab.path, content: tab.content });
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
