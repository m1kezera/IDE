/**
 * Web Studio — Shell HTML Template & Modals
 *
 * Pure functions for HTML template generation and modal UIs.
 * Extracted from WebStudioPanel.ts.
 */

export function buildWSShell(): string {
  return `<div class="ds-container">
    <!-- Toolbar -->
    <div class="ds-toolbar">
      <div class="ds-toolbar-section">
        <div class="ds-toolbar-brand">
          <span class="ds-toolbar-logo">🌐</span>
          <span class="ds-toolbar-title">Web Studio</span>
        </div>
        <div class="ds-toolbar-sep"></div>
        <div class="ds-toolbar-tools">
          <button id="ds-tool-select" class="ds-tb-btn active" title="Select (V)">🔲</button>
          <button id="ds-tool-hand" class="ds-tb-btn" title="Hand (Space)">✋</button>
        </div>
        <div class="ds-toolbar-sep"></div>
        <div class="ds-toolbar-history">
          <button id="ds-undo" class="ds-tb-btn ds-tb-icon" title="Undo (Ctrl+Z)" disabled>↩️</button>
          <button id="ds-redo" class="ds-tb-btn ds-tb-icon" title="Redo (Ctrl+Y)" disabled>↪️</button>
        </div>
        <div class="ds-toolbar-sep"></div>
        <div class="ds-view-tabs">
          <button class="ds-view-tab active" data-view="design">🖌️ Design</button>
          <button class="ds-view-tab" data-view="code">&lt;/&gt; Code</button>
          <button class="ds-view-tab" data-view="preview">▶ Preview</button>
        </div>
      </div>
      <div class="ds-toolbar-section">
        <div class="ds-toolbar-zoom">
          <button id="ds-zoom-out" class="ds-tb-btn ds-tb-icon" title="Zoom Out">−</button>
          <span id="ds-zoom-value" class="ds-zoom-display">100%</span>
          <button id="ds-zoom-in" class="ds-tb-btn ds-tb-icon" title="Zoom In">+</button>
          <button id="ds-zoom-fit" class="ds-tb-btn ds-tb-icon" title="Zoom to Fit">⊡</button>
          <button id="ds-zoom-100" class="ds-tb-btn ds-tb-icon" title="100%">1:1</button>
        </div>
        <div class="ds-toolbar-sep"></div>
        <div class="ds-toolbar-responsive" id="ds-responsive-bar">
          <button class="ds-tb-btn ds-responsive-btn active" data-bp="desktop" title="Desktop 1440px">🖥️</button>
          <button class="ds-tb-btn ds-responsive-btn" data-bp="tablet" title="Tablet 768px">💻</button>
          <button class="ds-tb-btn ds-responsive-btn" data-bp="mobile" title="Mobile 375px">📱</button>
        </div>
        <div class="ds-toolbar-sep"></div>
        <div class="ds-toolbar-actions">
          <button id="ds-open-templates" class="ds-tb-btn" title="Templates Gallery">📚 Templates</button>
          <button id="ds-upload-image" class="ds-tb-btn" title="Upload Image">🖼️ Image</button>
          <button id="ds-toggle-comment" class="ds-tb-btn" title="Comment Mode">💬</button>
          <button id="ds-toggle-grid" class="ds-tb-btn ds-tb-icon" title="Toggle Grid">📐</button>
          <button id="ds-toggle-rulers" class="ds-tb-btn ds-tb-icon" title="Toggle Rulers">📏</button>
          <button id="ds-zoom-selection" class="ds-tb-btn ds-tb-icon" title="Zoom to Selection (Ctrl+1)">🎯</button>
          <button id="ds-version-history" class="ds-tb-btn" title="Version History">📜</button>
          <button id="ds-show-shortcuts" class="ds-tb-btn" title="Keyboard Shortcuts (?)">⌨️</button>
          <button id="ds-send-agent" class="ds-tb-btn ds-tb-icon" title="Send to Agent">🤖</button>
          <button id="ds-export" class="ds-tb-btn" title="Export HTML">📤 HTML</button>
          <button id="ds-export-png" class="ds-tb-btn" title="Export PNG">📸 PNG</button>
          <button id="ds-export-pdf" class="ds-tb-btn-primary ds-tb-btn" title="Export PDF">📄 PDF</button>
        </div>
        <button id="ds-close" class="ds-tb-btn ds-tb-close" title="Close (Esc)">✕</button>
      </div>
    </div>

    <!-- Body -->
    <div class="ds-body">
      <!-- Left Sidebar -->
      <div class="ds-sidebar-left" id="ds-sidebar-left">
        <div class="ds-sidebar-tabs">
          <button class="ds-sidebar-tab active" data-panel="components" title="Components">🧩 Comp</button>
          <button class="ds-sidebar-tab" data-panel="layers" title="Layers">📑 Layers</button>
          <button class="ds-sidebar-tab" data-panel="pages" title="Pages">📄 Pages</button>
          <button class="ds-sidebar-tab" data-panel="assets" title="Assets">🖼️ Assets</button>
          <button class="ds-sidebar-tab" data-panel="tokens" title="Design Tokens">🎨 Tokens</button>
          <button class="ds-sidebar-tab" data-panel="comments" title="Comments">💬</button>
          <button class="ds-sidebar-tab" data-panel="files" title="Files">📁 Files</button>
        </div>
        <div id="ds-panel-components" class="ds-sidebar-panel active"></div>
        <div id="ds-panel-layers" class="ds-sidebar-panel"></div>
        <div id="ds-panel-pages" class="ds-sidebar-panel"></div>
        <div id="ds-panel-assets" class="ds-sidebar-panel"></div>
        <div id="ds-panel-tokens" class="ds-sidebar-panel"></div>
        <div id="ds-panel-comments" class="ds-sidebar-panel"></div>
        <div id="ds-panel-files" class="ds-sidebar-panel"></div>
      </div>
      <button class="ds-panel-collapse-btn ds-collapse-left" id="ds-collapse-left" title="Toggle Left Panel">«</button>

      <!-- Canvas Viewport -->
      <div class="ds-canvas-viewport">
        <canvas class="ds-ruler-h" style="position:absolute;top:0;left:20px;right:0;height:20px;z-index:5;"></canvas>
        <canvas class="ds-ruler-v" style="position:absolute;top:20px;left:0;bottom:0;width:20px;z-index:5;"></canvas>
        <div class="ds-ruler-corner" style="position:absolute;top:0;left:0;width:20px;height:20px;background:#11111b;z-index:6;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:#585b70;border-right:1px solid #313244;border-bottom:1px solid #313244;" title="Zoom to Fit">⊡</div>
        <div class="ds-canvas-world" style="top:20px;left:20px;">
          <div class="ds-empty-canvas">
            <span style="font-size:48px;opacity:0.3;">🎨</span>
            <p>Your infinite canvas</p>
            <p class="ds-empty-hint">Drag components • Scroll to zoom • Space+drag to pan</p>
          </div>
        </div>
        <!-- Code overlay -->
        <div id="ds-code-overlay" class="ds-code-overlay">
          <pre id="ds-code-content" class="ds-code"></pre>
        </div>
        <!-- Preview overlay -->
        <div id="ds-preview-overlay" class="ds-preview-overlay">
          <iframe id="ds-preview-iframe" class="ds-preview-iframe"></iframe>
        </div>
      </div>

      <button class="ds-panel-collapse-btn ds-collapse-right" id="ds-collapse-right" title="Toggle Right Panel">»</button>
      <!-- Right Sidebar (Props) -->
      <div class="ds-sidebar-right" id="ds-props">
        <div class="ds-props-empty">
          <span style="font-size:32px;opacity:0.3;">📋</span>
          <p>Select an element</p>
        </div>
      </div>
    </div>
  </div>`;
}

export function showShortcutsModal(root: HTMLElement | null): void {
  const existing = root?.querySelector('.ds-shortcuts-modal');
  if (existing) { existing.remove(); return; }

  const shortcuts: [string, [string, string][]][] = [
    ['🔧 Tools', [
      ['V / Click', 'Select (Move)'],
      ['Space', 'Temporary Hand (Pan)'],
      ['Space+Drag', 'Pan canvas'],
      ['Escape', 'Deselect / Close'],
    ]],
    ['🖱️ Elements', [
      ['Click', 'Select element'],
      ['Ctrl+A', 'Select All'],
      ['Delete / Backspace', 'Delete element'],
      ['Double-click', 'Inline edit text'],
      ['↑ ↓ ← →', 'Nudge 1px'],
      ['Shift+Arrow', 'Nudge 10px'],
    ]],
    ['📋 Clipboard & Style', [
      ['Ctrl+D', 'Duplicate'],
      ['Ctrl+Alt+C', 'Copy Style'],
      ['Ctrl+Alt+V', 'Paste Style'],
      ['Ctrl+L', 'Toggle Lock'],
      ['Ctrl+H', 'Toggle Visibility'],
    ]],
    ['📦 Groups', [
      ['Ctrl+G', 'Group elements'],
      ['Ctrl+Shift+G', 'Ungroup'],
    ]],
    ['⏪ History', [
      ['Ctrl+Z', 'Undo'],
      ['Ctrl+Y', 'Redo'],
      ['Ctrl+Shift+Z', 'Redo (alt)'],
    ]],
    ['🔍 Zoom & Pan', [
      ['Ctrl+1', 'Zoom to Selection'],
      ['Scroll', 'Pan vertically'],
      ['Shift+Scroll', 'Pan horizontally'],
      ['Ctrl+Scroll', 'Zoom in/out'],
      ['Space+Drag', 'Pan canvas'],
    ]],
    ['📤 Export', [
      ['Export HTML', 'Toolbar button'],
      ['Export PNG', 'Toolbar button'],
      ['Export PDF', 'Toolbar button'],
      ['Send to Agent', 'Toolbar button'],
    ]],
    ['👁️ View', [
      ['Design / Code / Preview', 'View tabs'],
      ['Grid toggle', 'Toolbar button'],
      ['Rulers toggle', 'Toolbar button'],
      ['Responsive breakpoints', 'Desktop / Tablet / Mobile'],
      ['?', 'Show this shortcuts guide'],
    ]],
    ['💬 Comments', [
      ['Comment Mode', 'Toggle via toolbar'],
      ['Click canvas', 'Place comment (in comment mode)'],
      ['Escape', 'Exit comment mode'],
    ]],
  ];

  const modal = document.createElement('div');
  modal.className = 'ds-shortcuts-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 15000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
  `;

  let html = `<div style="background:#1a1a2e;border:1px solid #3c3c3c;border-radius:16px;padding:28px 32px;max-width:860px;width:92%;max-height:82vh;overflow:auto;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <h2 style="margin:0;font-size:18px;font-weight:700;color:#e8eaed;display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">🌐</span> Web Studio — Keyboard Shortcuts
        </h2>
        <p style="margin:4px 0 0;font-size:11px;color:#585b70;">Complete reference for all available shortcuts</p>
      </div>
      <button class="ds-shortcuts-close" style="background:#2a2a3e;border:1px solid #3c3c3c;color:#aaa;font-size:16px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all 0.15s;" onmouseover="this.style.background='#3c3c4e'" onmouseout="this.style.background='#2a2a3e'">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">`;

  for (const [section, keys] of shortcuts) {
    html += `<div>
      <div style="font-size:11px;font-weight:700;color:#89dceb;margin-bottom:8px;letter-spacing:0.3px;">${section}</div>`;
    for (const [key, desc] of keys) {
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;gap:8px;">
        <span style="color:#cdd6f4;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${desc}</span>
        <kbd style="background:#2a2a3e;border:1px solid #3c3c3c;border-radius:4px;padding:1px 7px;font-size:9px;color:#a0a0b0;font-family:'JetBrains Mono',monospace;white-space:nowrap;flex-shrink:0;">${key}</kbd>
      </div>`;
    }
    html += `</div>`;
  }

  html += `</div>
    <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid #2a2a3e;">
      <span style="color:#585b70;font-size:10px;">Press <kbd style="background:#2a2a3e;border:1px solid #3c3c3c;border-radius:3px;padding:0 5px;font-size:10px;font-family:monospace;">?</kbd> to toggle · <kbd style="background:#2a2a3e;border:1px solid #3c3c3c;border-radius:3px;padding:0 5px;font-size:10px;font-family:monospace;">Esc</kbd> to close</span>
    </div>
  </div>`;

  modal.innerHTML = html;
  root?.appendChild(modal);

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  modal.querySelector('.ds-shortcuts-close')?.addEventListener('click', () => modal.remove());
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape' && root?.querySelector('.ds-shortcuts-modal')) {
      root?.querySelector('.ds-shortcuts-modal')?.remove();
      document.removeEventListener('keydown', esc);
    }
  });
}
