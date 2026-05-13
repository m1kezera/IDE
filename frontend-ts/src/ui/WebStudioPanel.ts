/**
 * Lumina IDE — Web Studio v4.0
 * Website builder with infinite canvas, artboards, pan/zoom,
 * multi-page support, file browser, component drag-and-drop,
 * undo/redo, multi-select, free-form drag, smart snap,
 * responsive breakpoints, visual editors, templates, and assets.
 */

import { PubSub } from '../core/PubSub';
import { readFile, getFileTree, writeFile } from '../api/client';
import type { FileTreeNode } from '../api/client';
import { COMPONENTS } from './ds-components';
import type { ComponentDef } from './ds-components';
import { pushState, undo as historyUndo, redo as historyRedo, canUndo, canRedo, pauseHistory, resumeHistory } from './ds-history';
import type { HistorySnapshot } from './ds-history';
import * as Sel from './ds-selection';
import { SCROLL_ANIMATION_KEYFRAMES } from './ds-editors';
import { renderPropsPanel } from './ws-properties';
import { buildWSShell, showShortcutsModal as _showShortcutsModal } from './ws-shell';
import { exportWSPNG, exportWSPDF } from './ws-export';
import { renderRulerTicks as _renderRulerTicks, toggleGrid as _toggleGrid, toggleRulers as _toggleRulers } from './ws-rulers';
import type { WSRulerContext } from './ws-rulers';
import { renderTemplateModal } from './ds-templates';
import type { DSTemplate } from './ds-templates';
import { renderAssetPanel, scanArtboardsForAssets } from './ds-assets';
import { showResizeHandles, removeResizeHandles, initResizeListeners, isResizing } from './ds-resize';
void removeResizeHandles; // used imperatively
import { setupInlineEdit, isInlineEditing, cancelInlineEdit } from './ds-inline-edit';
import { calculateSnap } from './ds-snap';
void calculateSnap; // used by drag engine — WebStudio uses its own DOM-based rendering for now
import * as Comments from './ds-comments';
import { renderTokensPanel, serializeTokens, loadTokens, resolveTokens } from './ds-tokens';
void resolveTokens; // used by visual editors at runtime

interface Artboard {
  id: string;
  name: string;
  route: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  borderRadius: number;
  overflow: 'hidden' | 'visible';
  // Flexbox Layout capabilities
  display: 'block' | 'flex';
  flexDirection: 'row' | 'column';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap: number;
  flexWrap: 'nowrap' | 'wrap';
  elements: CanvasElement[];
}

// Background presets for artboards

interface CanvasElement {
  id: string;
  componentId: string;
  props: Record<string, string>;
  order: number;
  style: ElementStyle;
  hoverStyle?: Partial<ElementStyle>;
  hoverEffect?: string;
  // Interaction / navigation
  actionType: 'none' | 'navigate' | 'url' | 'scroll';
  navigateTo: string;   // artboard ID for 'navigate'
  actionUrl: string;    // URL for 'url' action
  // Layer management
  visible: boolean;
  locked: boolean;
  name: string;         // custom display name
  // Absolute positioning (free-form drag)
  x: number;
  y: number;
  w: number;
  h: number;
  // Grouping
  groupId?: string;     // which group this element belongs to
  _grouped?: boolean;   // whether this element is hidden (rendered by a group)
}

interface ElementStyle {
  opacity: number;
  blur: number;
  shadow: string;
  borderRadius: number;
  padding: string;
  margin: string;
  transform: string;
  animation: string;
  width: string;
  height: string;
  bgOverride: string;
  borderWidth: string;
  borderColor: string;
  filter: string;
  textAlign: string;
  cursor: string;
  // --- Premium Customizations ---
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  letterSpacing: string;
  lineHeight: string;
  mixBlendMode: string;
  backdropFilter: string;
  backgroundGradient: string;
  textGradient: string;
}

const ANIMATION_PRESETS = [
  { name: 'none', label: 'None', css: '' },
  { name: 'fadeIn', label: 'Fade In', css: 'ds-fadeIn 0.6s ease both' },
  { name: 'slideUp', label: 'Slide Up', css: 'ds-slideUp 0.6s ease both' },
  { name: 'slideDown', label: 'Slide Down', css: 'ds-slideDown 0.6s ease both' },
  { name: 'slideLeft', label: 'Slide Left', css: 'ds-slideLeft 0.6s ease both' },
  { name: 'scaleIn', label: 'Scale In', css: 'ds-scaleIn 0.5s ease both' },
  { name: 'bounce', label: 'Bounce', css: 'ds-bounce 0.8s ease both' },
  { name: 'pulse', label: 'Pulse', css: 'ds-pulse 2s ease infinite' },
  { name: 'float', label: 'Float', css: 'ds-float 3s ease-in-out infinite' },
  { name: 'shake', label: 'Shake', css: 'ds-shake 0.5s ease both' },
];






const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  opacity: 1, blur: 0, shadow: '', borderRadius: 0,
  padding: '', margin: '', transform: '', animation: 'none',
  width: '', height: '', bgOverride: '', borderWidth: '', borderColor: '',
  filter: '', textAlign: '', cursor: '',
  fontFamily: '', fontWeight: '', fontSize: '', color: '', letterSpacing: '', lineHeight: '',
  mixBlendMode: 'normal', backdropFilter: '', backgroundGradient: '', textGradient: ''
};

/** Convert ElementStyle to a raw CSS string for inline styles */
function buildElementCSSString(s: ElementStyle): string {
  let css = '';
  if (s.opacity < 1) css += `opacity: ${s.opacity}; `;
  if (s.blur) css += `filter: blur(${s.blur}px); `;
  if (s.filter) css += `filter: ${s.filter}; `;
  if (s.shadow) css += `box-shadow: ${s.shadow}; `;
  if (s.borderRadius) css += `border-radius: ${s.borderRadius}px; `;
  if (s.padding) css += `padding: ${s.padding}; `;
  if (s.margin) css += `margin: ${s.margin}; `;
  if (s.transform) css += `transform: ${s.transform}; `;
  if (s.width) css += `width: ${s.width}; `;
  if (s.height) css += `height: ${s.height}; `;
  if (s.bgOverride) css += `background: ${s.bgOverride}; `;
  if (s.backgroundGradient) css += `background: ${s.backgroundGradient}; `;
  if (s.borderWidth || s.borderColor) css += `border: ${s.borderWidth || '1px'} solid ${s.borderColor || 'transparent'}; `;
  if (s.textAlign) css += `text-align: ${s.textAlign}; `;
  if (s.cursor) css += `cursor: ${s.cursor}; `;
  
  // Premium typography
  if (s.fontFamily) css += `font-family: '${s.fontFamily}', sans-serif; `;
  if (s.fontWeight) css += `font-weight: ${s.fontWeight}; `;
  if (s.fontSize) css += `font-size: ${s.fontSize}; `;
  if (s.color) css += `color: ${s.color}; `;
  if (s.letterSpacing) css += `letter-spacing: ${s.letterSpacing}; `;
  if (s.lineHeight) css += `line-height: ${s.lineHeight}; `;
  
  // Premium effects
  if (s.mixBlendMode && s.mixBlendMode !== 'normal') css += `mix-blend-mode: ${s.mixBlendMode}; `;
  if (s.backdropFilter) css += `backdrop-filter: ${s.backdropFilter}; -webkit-backdrop-filter: ${s.backdropFilter}; `;
  
  if (s.textGradient) {
    css += `background: ${s.textGradient}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; `;
  }
  
  return css.trim();
}

/** Generates the raw layout CSS string for HTML/Svelte/Vue wrappers */
function buildArtboardLayoutStyleHTML(ab: Artboard): string {
  return `background:${ab.background || '#0d0d15'};min-height:100vh;padding:24px;display:${ab.display || 'flex'};flex-direction:${ab.flexDirection || 'column'};justify-content:${ab.justifyContent || 'flex-start'};align-items:${ab.alignItems || 'stretch'};gap:${ab.gap ?? 16}px;flex-wrap:${ab.flexWrap || 'nowrap'};box-sizing:border-box;`;
}

/** Generates the React JSX inline style string for wrappers */
function buildArtboardLayoutStyleJSX(ab: Artboard): string {
  return `{{ background: '${ab.background || '#0d0d15'}', minHeight: '100vh', padding: '24px', display: '${ab.display || 'flex'}', flexDirection: '${ab.flexDirection || 'column'}', justifyContent: '${ab.justifyContent || 'flex-start'}', alignItems: '${ab.alignItems || 'stretch'}', gap: '${ab.gap ?? 16}px', flexWrap: '${ab.flexWrap || 'nowrap'}', boxSizing: 'border-box' }}`;
}

/** Wraps an HTML template string with a styled div if the element has custom style overrides */
function getElementHTMLWrapped(el: CanvasElement, def: ComponentDef): string {
  let html = resolveTemplate(def.html, el.props).trim();
  const css = buildElementCSSString(el.style || DEFAULT_ELEMENT_STYLE);
  if (css) html = `<div style="${css}">\n  ${html}\n</div>`;
  return html;
}


// ─── Artboard Presets ───────────────────────────────────────────────

const PRESETS = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Laptop', width: 1280, height: 800 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 812 },
];

// ─── State ──────────────────────────────────────────────────────────

let layerEl: HTMLElement | null = null;
let isVisible = false;

// Canvas transform
let panX = 0, panY = 0, zoom = 1;
let isPanning = false;
let panStartX = 0, panStartY = 0;
let spaceHeld = false;

// Artboards
let artboards: Artboard[] = [];
let activeArtboardId: string | null = null;
let selectedElementId: string | null = null;
let nextOrder = 0;
let nextArtboardX = 100;

// Active tool
let activeTool: 'select' | 'hand' = 'select';

// Prototyping & Style Editor State
let propsEditState: 'normal' | 'hover' = 'normal';

// ─── Framework Detection ────────────────────────────────────────────

interface DetectedFramework {
  name: string;       // 'nextjs' | 'react' | 'vue' | 'svelte' | 'html'
  label: string;      // 'Next.js' | 'React' | 'Vue' | 'Svelte' | 'HTML'
  icon: string;       // emoji
  fileExt: string;    // '.tsx' | '.jsx' | '.vue' | '.svelte' | '.html'
  componentDir: string; // typical component directory
}

interface ProjectComponent {
  name: string;        // 'Header', 'Button', etc.
  path: string;        // 'src/components/Header.tsx'
  exports: string[];   // ['Header', 'default']
  framework: string;
}

let detectedFramework: DetectedFramework | null = null;
let projectComponents: ProjectComponent[] = [];
let frameworkScanned = false;



// ─── Init ───────────────────────────────────────────────────────────

export function initWebStudio(): void {
  layerEl = document.createElement('div');
  layerEl.className = 'ds-layer';
  layerEl.innerHTML = buildWSShell();
  document.body.appendChild(layerEl);

  wireToolbar();
  setupSidebarTabs();
  setupPalette();
  setupCanvasPanZoom();
  loadFileTree();
  injectScrollAnimKeyframes();
  initResizeListeners(() => zoom, (id) => layerEl?.querySelector(`.ds-element[data-el-id="${id}"]`) as HTMLElement | null);
  setupRulers();

  // Try to restore previous session
  if (!autoLoad()) {
    // Create default artboard if no saved data
    addArtboard('Desktop', 100, 100, 1440, 900);
  }

  // Load version history
  loadVersions();

  // Auto-save version every 5 minutes
  setInterval(() => {
    if (artboards.length > 0 && isVisible) {
      saveVersion('Auto-save', true);
    }
  }, 5 * 60 * 1000);

  PubSub.on('webstudio:open', () => toggle());
}

// ─── Open / Close ───────────────────────────────────────────────────

function toggle(): void { isVisible ? close() : open(); }

function open(): void {
  if (!layerEl) return;
  layerEl.classList.add('visible');
  isVisible = true;
  renderAll();
  // Scan workspace framework on first open
  if (!frameworkScanned) {
    frameworkScanned = true;
    scanWorkspaceFramework();
  }
}

function close(): void {
  if (!layerEl) return;
  layerEl.classList.remove('visible');
  isVisible = false;
}

// ─── Toolbar ────────────────────────────────────────────────────────

function wireToolbar(): void {
  if (!layerEl) return;

  // Tool buttons
  layerEl.querySelector('#ds-tool-select')?.addEventListener('click', () => setTool('select'));
  layerEl.querySelector('#ds-tool-hand')?.addEventListener('click', () => setTool('hand'));

  // Zoom
  layerEl.querySelector('#ds-zoom-in')?.addEventListener('click', () => setZoom(zoom + 0.15));
  layerEl.querySelector('#ds-zoom-out')?.addEventListener('click', () => setZoom(zoom - 0.15));
  layerEl.querySelector('#ds-zoom-fit')?.addEventListener('click', zoomToFit);
  layerEl.querySelector('#ds-zoom-100')?.addEventListener('click', () => setZoom(1));

  // View tabs
  layerEl.querySelectorAll<HTMLButtonElement>('.ds-view-tab').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view as 'design' | 'code' | 'preview'));
  });

  // Actions
  layerEl.querySelector('#ds-upload-image')?.addEventListener('click', handleUploadImage);
  layerEl.querySelector('#ds-export')?.addEventListener('click', exportHTML);
  layerEl.querySelector('#ds-export-png')?.addEventListener('click', () => exportWSPNG(artboards, activeArtboardId, showToast, generateHTML));
  layerEl.querySelector('#ds-export-pdf')?.addEventListener('click', () => exportWSPDF(artboards, activeArtboardId, showToast, generateHTML));
  layerEl.querySelector('#ds-send-agent')?.addEventListener('click', sendToAgent);
  layerEl.querySelector('#ds-close')?.addEventListener('click', close);

  // Undo / Redo buttons
  layerEl.querySelector('#ds-undo')?.addEventListener('click', performUndo);
  layerEl.querySelector('#ds-redo')?.addEventListener('click', performRedo);

  // Responsive breakpoint buttons
  layerEl.querySelectorAll<HTMLButtonElement>('.ds-responsive-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bp = btn.dataset.bp as string;
      setBreakpoint(bp);
      layerEl!.querySelectorAll('.ds-responsive-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Templates button
  layerEl.querySelector('#ds-open-templates')?.addEventListener('click', openTemplatesModal);

  // v5 toolbar buttons
  layerEl.querySelector('#ds-toggle-comment')?.addEventListener('click', () => {
    const active = Comments.toggleCommentMode();
    const btn = layerEl?.querySelector('#ds-toggle-comment') as HTMLElement;
    if (btn) btn.style.background = active ? 'rgba(124,58,237,0.3)' : '';
    showToast(active ? '💬 Click on canvas to place comment' : '💬 Comment mode off');
  });
  layerEl.querySelector('#ds-toggle-grid')?.addEventListener('click', () => toggleGrid());
  layerEl.querySelector('#ds-toggle-rulers')?.addEventListener('click', () => toggleRulers());
  layerEl.querySelector('#ds-zoom-selection')?.addEventListener('click', () => zoomToSelection());
  layerEl.querySelector('#ds-version-history')?.addEventListener('click', () => showVersionHistoryModal());
  layerEl.querySelector('.ds-ruler-corner')?.addEventListener('click', () => zoomToFit());
  layerEl.querySelector('#ds-show-shortcuts')?.addEventListener('click', () => _showShortcutsModal(layerEl));

  // Panel collapse toggles
  layerEl.querySelector('#ds-collapse-left')?.addEventListener('click', () => {
    const sidebar = layerEl?.querySelector('#ds-sidebar-left') as HTMLElement;
    const btn = layerEl?.querySelector('#ds-collapse-left') as HTMLElement;
    if (!sidebar || !btn) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    btn.textContent = collapsed ? '»' : '«';
    try { localStorage.setItem('ws-left-collapsed', String(collapsed)); } catch {}
  });
  layerEl.querySelector('#ds-collapse-right')?.addEventListener('click', () => {
    const sidebar = layerEl?.querySelector('#ds-props') as HTMLElement;
    const btn = layerEl?.querySelector('#ds-collapse-right') as HTMLElement;
    if (!sidebar || !btn) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    btn.textContent = collapsed ? '«' : '»';
    try { localStorage.setItem('ws-right-collapsed', String(collapsed)); } catch {}
  });

  // Restore collapsed state from localStorage
  try {
    if (localStorage.getItem('ws-left-collapsed') === 'true') {
      layerEl.querySelector('#ds-sidebar-left')?.classList.add('collapsed');
      const lb = layerEl.querySelector('#ds-collapse-left');
      if (lb) lb.textContent = '»';
    }
    if (localStorage.getItem('ws-right-collapsed') === 'true') {
      layerEl.querySelector('#ds-props')?.classList.add('collapsed');
      const rb = layerEl.querySelector('#ds-collapse-right');
      if (rb) rb.textContent = '«';
    }
  } catch {}

  // Keyboard shortcuts — ONLY when DS is visible and focus isn't in an editable element
  const isEditable = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable || isInlineEditing() || isResizing();
  };

  document.addEventListener('keydown', (e) => {
    if (!isVisible) return;
    // Escape: cancel current action, or close DS
    if (e.key === 'Escape') {
      if (isInlineEditing()) { cancelInlineEdit(); return; }
      if (Comments.isCommentMode()) { Comments.setCommentMode(false); const btn = layerEl?.querySelector('#ds-toggle-comment') as HTMLElement; if (btn) btn.style.background = ''; showToast('💬 Comment mode off'); return; }
      close();
      return;
    }
    if (e.code === 'Space' && !spaceHeld && !isEditable(e)) {
      e.preventDefault();
      spaceHeld = true;
      setTool('hand');
    }
    // Undo: Ctrl+Z
    if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.code === 'KeyZ') && !isEditable(e)) {
      e.preventDefault();
      performUndo();
    }
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if ((e.ctrlKey && (e.key === 'y' || e.code === 'KeyY')) || (e.ctrlKey && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.code === 'KeyZ'))) {
      if (!isEditable(e)) { e.preventDefault(); performRedo(); }
    }
    // Select All: Ctrl+A
    if (e.ctrlKey && (e.key === 'a' || e.code === 'KeyA') && !isEditable(e)) {
      e.preventDefault();
      const ab = artboards.find(a => a.id === activeArtboardId);
      if (ab) {
        Sel.selectAll(ab.elements.filter(el => !el._grouped && el.visible !== false).map(el => el.id));
        renderAll();
      }
    }
    // Delete selected
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditable(e)) {
      e.preventDefault();
      deleteSelected();
    }
    // Copy style: Ctrl+Alt+C
    if (e.ctrlKey && e.altKey && (e.key === 'c' || e.code === 'KeyC') && !isEditable(e)) {
      e.preventDefault();
      const el = findSelectedElement();
      if (el) {
        Sel.copyStyle(el.style || {});
        showToast('📋 Style copied');
      }
    }
    // Paste style: Ctrl+Alt+V
    if (e.ctrlKey && e.altKey && (e.key === 'v' || e.code === 'KeyV') && !isEditable(e)) {
      e.preventDefault();
      const copiedStyle = Sel.getCopiedStyle();
      if (copiedStyle) {
        const ids = Sel.getSelectedIds();
        const ab = artboards.find(a => a.id === activeArtboardId);
        if (ab) {
          for (const id of ids) {
            const el = ab.elements.find(e => e.id === id);
            if (el) el.style = { ...el.style, ...copiedStyle } as any;
          }
          recordState();
          renderAll();
          showToast('🎨 Style pasted');
        }
      }
    }
    // Duplicate: Ctrl+D
    if (e.ctrlKey && (e.key === 'd' || e.code === 'KeyD') && !isEditable(e)) {
      e.preventDefault();
      duplicateSelected();
    }
    // Arrow key nudge: move element by 1px (Shift = 10px)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isEditable(e)) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const el = findSelectedElement();
      if (el && !el.locked) {
        recordState();
        switch (e.key) {
          case 'ArrowUp': el.style.margin = nudgeMargin(el.style.margin || '0', 'top', -step); break;
          case 'ArrowDown': el.style.margin = nudgeMargin(el.style.margin || '0', 'top', step); break;
          case 'ArrowLeft': el.style.margin = nudgeMargin(el.style.margin || '0', 'left', -step); break;
          case 'ArrowRight': el.style.margin = nudgeMargin(el.style.margin || '0', 'left', step); break;
        }
        renderArtboards();
      }
    }
    // Lock: Ctrl+L
    if (e.ctrlKey && (e.key === 'l' || e.code === 'KeyL') && !isEditable(e)) {
      e.preventDefault();
      const el = findSelectedElement();
      if (el) {
        el.locked = !el.locked;
        renderAll();
        showToast(el.locked ? '🔒 Locked' : '🔓 Unlocked');
      }
    }
    // Hide: Ctrl+H
    if (e.ctrlKey && (e.key === 'h' || e.code === 'KeyH') && !isEditable(e)) {
      e.preventDefault();
      const el = findSelectedElement();
      if (el) {
        el.visible = !(el.visible !== false);
        renderAll();
        showToast(el.visible ? '👁️ Visible' : '👁️‍🗨️ Hidden');
      }
    }
    // Group: Ctrl+G
    if (e.ctrlKey && !e.shiftKey && (e.key === 'g' || e.code === 'KeyG') && !isEditable(e)) {
      e.preventDefault();
      groupSelected();
    }
    // Ungroup: Ctrl+Shift+G
    if (e.ctrlKey && e.shiftKey && (e.key === 'G' || e.code === 'KeyG') && !isEditable(e)) {
      e.preventDefault();
      ungroupSelected();
    }
    // Zoom to selection: Ctrl+1
    if (e.ctrlKey && e.key === '1' && !isEditable(e)) {
      e.preventDefault();
      zoomToSelection();
    }
    // Shortcuts reference: ?
    if (e.key === '?' && !isEditable(e)) {
      e.preventDefault();
      _showShortcutsModal(layerEl);
    }
    // (Escape already handled at top of handler)
  });
  document.addEventListener('keyup', (e) => {
    if (!isVisible) return;
    if (e.code === 'Space' && !isEditable(e)) {
      spaceHeld = false;
      setTool('select');
    }
  });
}

/** Record current state for undo */
function recordState(): void {
  pushState(getSnapshot());
  updateUndoRedoButtons();
  autoSave();
}

function getSnapshot(): HistorySnapshot {
  return {
    artboards: JSON.parse(JSON.stringify(artboards)),
    selectedElementId,
    activeArtboardId,
  };
}

function performUndo(): void {
  const restored = historyUndo(getSnapshot());
  if (!restored) return;
  pauseHistory();
  artboards = restored.artboards;
  selectedElementId = restored.selectedElementId;
  activeArtboardId = restored.activeArtboardId;
  if (selectedElementId) Sel.selectOne(selectedElementId);
  else Sel.clearSelection();
  resumeHistory();
  renderAll();
  updateUndoRedoButtons();
  showToast('↩️ Undo');
}

function performRedo(): void {
  const restored = historyRedo(getSnapshot());
  if (!restored) return;
  pauseHistory();
  artboards = restored.artboards;
  selectedElementId = restored.selectedElementId;
  activeArtboardId = restored.activeArtboardId;
  if (selectedElementId) Sel.selectOne(selectedElementId);
  else Sel.clearSelection();
  resumeHistory();
  renderAll();
  updateUndoRedoButtons();
  showToast('↪️ Redo');
}

function updateUndoRedoButtons(): void {
  const undoBtn = layerEl?.querySelector('#ds-undo') as HTMLButtonElement;
  const redoBtn = layerEl?.querySelector('#ds-redo') as HTMLButtonElement;
  if (undoBtn) undoBtn.disabled = !canUndo();
  if (redoBtn) redoBtn.disabled = !canRedo();
}

function deleteSelected(): void {
  const ids = new Set(Sel.getSelectedIds()); // copy to avoid mutating selection state
  if (ids.size === 0 && selectedElementId) ids.add(selectedElementId);
  if (ids.size === 0) return;
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) return;
  recordState();
  // When deleting a group, also collect its grouped children
  const allDeleteIds = new Set(ids);
  for (const id of ids) {
    const el = ab.elements.find(e => e.id === id);
    if (el?.componentId === '__group__') {
      try {
        const childIds = JSON.parse(el.props.children || '[]') as string[];
        childIds.forEach(cid => allDeleteIds.add(cid));
      } catch { /* ok */ }
    }
  }
  ab.elements = ab.elements.filter(el => !allDeleteIds.has(el.id) || el.locked);
  Sel.clearSelection();
  selectedElementId = null;
  renderAll();
}

function findSelectedElement() {
  if (!selectedElementId) return null;
  for (const ab of artboards) {
    const el = ab.elements.find(e => e.id === selectedElementId);
    if (el) return el;
  }
  return null;
}

/** Duplicate selected element(s) */
function duplicateSelected(): void {
  const el = findSelectedElement();
  if (!el) return;
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) return;
  const idx = ab.elements.findIndex(e => e.id === el.id);
  if (idx !== -1) handleElementAction(ab.id, el.id, 'dup');
}

/** Nudge margin value by offset */
function nudgeMargin(current: string, side: 'top' | 'left', offset: number): string {
  const parts = current.replace(/px/g, '').trim().split(/\s+/).map(Number);
  let top = 0, right = 0, bottom = 0, left = 0;
  if (parts.length === 1) { top = right = bottom = left = parts[0] || 0; }
  else if (parts.length === 2) { top = bottom = parts[0] || 0; right = left = parts[1] || 0; }
  else if (parts.length === 4) { top = parts[0] || 0; right = parts[1] || 0; bottom = parts[2] || 0; left = parts[3] || 0; }
  if (side === 'top') top += offset;
  else left += offset;
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

/** Auto-save design to localStorage */
function autoSave(): void {
  try {
    const data = JSON.stringify({
      artboards, activeArtboardId, nextOrder, nextArtboardX,
      comments: Comments.serializeComments(),
      tokens: serializeTokens(),
    });
    localStorage.setItem('lumina-ds-autosave', data);
  } catch { /* ignore quota errors */ }
}

/** Auto-load design from localStorage */
function autoLoad(): boolean {
  try {
    const raw = localStorage.getItem('lumina-ds-autosave');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.artboards && data.artboards.length > 0) {
      artboards = data.artboards;
      activeArtboardId = data.activeArtboardId || artboards[0]?.id || null;
      nextOrder = data.nextOrder || 100;
      nextArtboardX = data.nextArtboardX || 100;
      // Ensure new fields exist on loaded elements
      for (const ab of artboards) {
        for (const el of ab.elements) {
          if (el.visible === undefined) el.visible = true;
          if (el.locked === undefined) el.locked = false;
          if (!el.name) el.name = COMPONENTS.find(c => c.id === el.componentId)?.name || 'Element';
          if (el.x === undefined) el.x = 0;
          if (el.y === undefined) el.y = 0;
          if (el.w === undefined) el.w = 0;
          if (el.h === undefined) el.h = 0;
        }
      }
      // Restore comments and tokens if present
      if (data.comments) Comments.loadComments(data.comments);
      if (data.tokens) loadTokens(data.tokens);
      return true;
    }
  } catch { /* ignore parse errors */ }
  return false;
}

/** Responsive breakpoint handler */
let currentBreakpoint = 'desktop';
void currentBreakpoint; // used in setBreakpoint
function setBreakpoint(bp: string): void {
  currentBreakpoint = bp;
  const widths: Record<string, number> = { desktop: 1440, tablet: 768, mobile: 375 };
  const w = widths[bp] || 1440;
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (ab) {
    ab.width = w;
    renderArtboards();
  }
}

/** Open templates gallery modal */
function openTemplatesModal(): void {
  const modal = renderTemplateModal((template: DSTemplate) => {
    applyTemplate(template);
  }, () => {
    modal.remove();
  });
  document.body.appendChild(modal);
}

function applyTemplate(template: DSTemplate): void {
  // Create a new artboard or use the active one
  let ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab || ab.elements.length > 0) {
    // Create new artboard
    const name = template.name;
    addArtboard(name, nextArtboardX, 100, 1440, 900);
    ab = artboards[artboards.length - 1];
    nextArtboardX += 1540;
  }
  if (!ab) return;
  recordState();

  // Add template elements
  for (const tEl of template.elements) {
    const def = COMPONENTS.find(c => c.id === tEl.componentId);
    if (!def) continue;
    const el: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      componentId: tEl.componentId,
      props: { ...def.defaultProps, ...tEl.props },
      order: nextOrder++,
      style: { ...DEFAULT_ELEMENT_STYLE },
      actionType: 'none', navigateTo: '', actionUrl: '',
      visible: true, locked: false, name: def.name,
      x: 0, y: 0, w: 0, h: 0,
    };
    ab.elements.push(el);
  }
  activeArtboardId = ab.id;
  renderAll();
  showToast(`📚 Template "${template.name}" applied!`);
}

function setTool(tool: 'select' | 'hand'): void {
  activeTool = tool;
  if (!layerEl) return;
  layerEl.querySelector('#ds-tool-select')?.classList.toggle('active', tool === 'select');
  layerEl.querySelector('#ds-tool-hand')?.classList.toggle('active', tool === 'hand');
  const viewport = layerEl.querySelector('.ds-canvas-viewport') as HTMLElement;
  viewport?.classList.toggle('panning', tool === 'hand');
}

function setZoom(z: number): void {
  zoom = Math.max(0.1, Math.min(5, z));
  applyTransform();
  updateZoomDisplay();
}

function updateZoomDisplay(): void {
  const el = layerEl?.querySelector('#ds-zoom-value');
  if (el) el.textContent = `${Math.round(zoom * 100)}%`;
}

function applyTransform(): void {
  const world = layerEl?.querySelector('.ds-canvas-world') as HTMLElement;
  if (!world) return;
  world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  // Update grid
  const viewport = layerEl?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (viewport) {
    const gridSize = 24 * zoom;
    viewport.style.setProperty('--ds-grid-size', `${gridSize}px`);
    viewport.style.setProperty('--ds-grid-offset-x', `${panX % gridSize}px`);
    viewport.style.setProperty('--ds-grid-offset-y', `${panY % gridSize}px`);
  }
  // Throttle ruler re-rendering via rAF to avoid redraw on every mousemove
  if (showRulers) {
    cancelAnimationFrame(rulerRafId);
    rulerRafId = requestAnimationFrame(renderRulerTicks);
  }
}

function zoomToFit(): void {
  if (artboards.length === 0) { panX = 0; panY = 0; zoom = 1; applyTransform(); updateZoomDisplay(); return; }
  const viewport = layerEl?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (!viewport) return;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ab of artboards) {
    minX = Math.min(minX, ab.x);
    minY = Math.min(minY, ab.y);
    maxX = Math.max(maxX, ab.x + ab.width);
    maxY = Math.max(maxY, ab.y + ab.height);
  }
  const cw = maxX - minX + 100;
  const ch = maxY - minY + 100;
  zoom = Math.min(vw / cw, vh / ch, 1.5);
  panX = (vw - cw * zoom) / 2 - minX * zoom + 50 * zoom;
  panY = (vh - ch * zoom) / 2 - minY * zoom + 50 * zoom;
  applyTransform();
  updateZoomDisplay();
}

// ─── Pan & Zoom Engine ──────────────────────────────────────────────

function setupCanvasPanZoom(): void {
  const viewport = layerEl?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (!viewport) return;

  // Mouse wheel → zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const oldZoom = zoom;
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    zoom = Math.max(0.1, Math.min(5, zoom + delta));
    // Zoom toward cursor
    panX = mx - (mx - panX) * (zoom / oldZoom);
    panY = my - (my - panY) * (zoom / oldZoom);
    applyTransform();
    updateZoomDisplay();
  }, { passive: false });

  // Middle-click pan or hand tool pan
  viewport.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && activeTool === 'hand')) {
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => { isPanning = false; });

  // Click on empty canvas = deselect
  viewport.addEventListener('click', (e) => {
    if (e.target === viewport || (e.target as HTMLElement).classList.contains('ds-canvas-world')) {
      selectedElementId = null;
      activeArtboardId = null;
      renderProps();
      renderArtboards();
      renderPages();
    }
  });
}

// ─── Sidebar Tabs ───────────────────────────────────────────────────

function setupSidebarTabs(): void {
  if (!layerEl) return;
  layerEl.querySelectorAll<HTMLButtonElement>('.ds-sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.panel!;
      layerEl!.querySelectorAll('.ds-sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      layerEl!.querySelectorAll('.ds-sidebar-panel').forEach(p => p.classList.remove('active'));
      layerEl!.querySelector(`#ds-panel-${target}`)?.classList.add('active');
    });
  });
}

// ─── Components Palette ─────────────────────────────────────────────

function setupPalette(): void {
  if (!layerEl) return;
  const palette = layerEl.querySelector('#ds-panel-components') as HTMLElement;
  if (!palette) return;

  // ── Project Components section (populated by scanner) ──
  const projectSection = document.createElement('div');
  projectSection.id = 'ds-project-components';
  projectSection.innerHTML = `<div class="ds-project-header">
    <div class="ds-cat-label">YOUR PROJECT</div>
    <span class="ds-project-badge" id="ds-framework-badge">Scanning...</span>
  </div>
  <div id="ds-project-list" class="ds-project-list"><div class="ds-files-loading">Detecting framework...</div></div>
  <div class="ds-project-actions">
    <button class="ds-project-btn" id="ds-btn-insert-editor" title="Insert the generated code into the active editor">📥 Insert to Editor</button>
    <button class="ds-project-btn" id="ds-btn-create-comp" title="Create a new component file in your project">➕ Create Component</button>
  </div>`;
  palette.appendChild(projectSection);

  // Wire insert/create buttons
  projectSection.querySelector('#ds-btn-insert-editor')?.addEventListener('click', insertToEditor);
  projectSection.querySelector('#ds-btn-create-comp')?.addEventListener('click', createComponent);

  // ── Built-in Components ──
  const builtinLabel = document.createElement('div');
  builtinLabel.className = 'ds-cat-label';
  builtinLabel.style.marginTop = '12px';
  builtinLabel.textContent = '── BUILT-IN ──';
  palette.appendChild(builtinLabel);

  const categories = ['sections', 'navigation', 'content', 'data', 'form', 'media', 'interactive', 'effects'] as const;
  for (const cat of categories) {
    const comps = COMPONENTS.filter(c => c.category === cat);
    if (!comps.length) continue;
    const label = document.createElement('div');
    label.className = 'ds-cat-label';
    label.textContent = cat.toUpperCase();
    palette.appendChild(label);

    for (const comp of comps) {
      const item = document.createElement('div');
      item.className = 'ds-palette-item';
      item.draggable = true;
      item.innerHTML = `<span class="ds-palette-icon">${comp.icon}</span><span class="ds-palette-name">${comp.name}</span>`;
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', comp.id);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dblclick', () => {
        const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
        if (ab) addElement(ab.id, comp.id);
      });
      palette.appendChild(item);
    }
  }
}

// ─── Artboard Management ────────────────────────────────────────────

function addArtboard(name: string, x: number, y: number, w: number, h: number): void {
  const route = artboards.length === 0 ? '/' : `/${name.toLowerCase().replace(/\s+/g, '-')}`;
  const ab: Artboard = {
    id: `ab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name, route, x, y, width: w, height: h,
    background: '#0d0d15', borderRadius: 4, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
    alignItems: 'stretch', gap: 16, flexWrap: 'nowrap',
    elements: [],
  };
  artboards.push(ab);
  activeArtboardId = ab.id;
  nextArtboardX = x + w + 80;
  renderAll();
}

// ─── Image Upload ──────────────────────────────────────────────────

async function handleUploadImage(): Promise<void> {
  const eAPI = (window as any).electronAPI;
  let dataUrl: string | null = null;
  let fileName = 'image';

  if (eAPI?.selectImage) {
    const result = await eAPI.selectImage();
    if (!result?.dataUrl) return;
    dataUrl = result.dataUrl;
    fileName = result.name || 'image';
  } else {
    // Fallback: file input for dev mode
    dataUrl = await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      };
      // Handle cancel: when focus returns from the native dialog, if no file was picked, resolve null
      const onFocusBack = () => {
        window.removeEventListener('focus', onFocusBack);
        setTimeout(() => { if (!input.files?.length) resolve(null); }, 300);
      };
      window.addEventListener('focus', onFocusBack);
      input.click();
    });
    if (!dataUrl) return;
  }

  // Add user-image element with the uploaded data URL
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab) return;
  const el: CanvasElement = {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    componentId: 'user-image',
    props: {
      src: dataUrl!,
      alt: fileName,
      width: '100%',
      height: 'auto',
      maxWidth: '100%',
      objectFit: 'cover',
      radius: '8px',
      borderStyle: 'none',
    },
    order: nextOrder++,
    style: { ...DEFAULT_ELEMENT_STYLE },
    actionType: 'none', navigateTo: '', actionUrl: '',
    visible: true, locked: false, name: 'Image',
    x: 0, y: 0, w: 0, h: 0,
  };
  ab.elements.push(el);
  selectedElementId = el.id;
  activeArtboardId = ab.id;
  renderAll();
  showToast(`📤 Image "${fileName}" added!`);
}

function removeArtboard(id: string): void {
  artboards = artboards.filter(a => a.id !== id);
  if (activeArtboardId === id) activeArtboardId = artboards[0]?.id || null;
  renderAll();
}

function addElement(artboardId: string, compId: string): void {
  const ab = artboards.find(a => a.id === artboardId);
  const def = COMPONENTS.find(c => c.id === compId);
  if (!ab || !def) return;
  recordState();
  const el: CanvasElement = {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    componentId: compId,
    props: { ...def.defaultProps },
    order: nextOrder++,
    style: { ...DEFAULT_ELEMENT_STYLE },
    actionType: 'none', navigateTo: '', actionUrl: '',
    visible: true, locked: false, name: def.name,
    x: 0, y: 0, w: 0, h: 0,
  };
  ab.elements.push(el);
  selectedElementId = el.id;
  Sel.selectOne(el.id);
  activeArtboardId = artboardId;
  renderAll();
}

// ─── Render Everything ──────────────────────────────────────────────

function renderAll(): void {
  renderArtboards();
  renderPages();
  renderLayers();
  renderProps();
  renderAssetsPanel();
  renderTokensSidebar();
  renderCommentsSidebar();
  applyTransform();
  updateZoomDisplay();
  updateUndoRedoButtons();
}

function renderTokensSidebar(): void {
  const panel = layerEl?.querySelector('#ds-panel-tokens') as HTMLElement;
  if (!panel) return;
  panel.innerHTML = '';
  panel.appendChild(renderTokensPanel(() => { recordState(); renderAll(); }));
}

function renderCommentsSidebar(): void {
  const panel = layerEl?.querySelector('#ds-panel-comments') as HTMLElement;
  if (!panel) return;
  panel.innerHTML = '';
  const abId = activeArtboardId || (artboards[0]?.id || '');
  if (!abId) {
    panel.innerHTML = '<div style="padding:20px;text-align:center;color:#585b70;font-size:11px;">Select an artboard first</div>';
    return;
  }
  panel.appendChild(Comments.renderCommentsPanel(
    abId,
    (c) => {
      // Scroll to comment on canvas
      showToast(`📍 Comment #${Comments.getCommentsByArtboard(abId).indexOf(c) + 1}`);
    },
    (id) => { Comments.resolveComment(id); recordState(); renderAll(); },
    (id) => { Comments.deleteComment(id); recordState(); renderAll(); },
  ));
}

function renderArtboards(): void {
  const world = layerEl?.querySelector('.ds-canvas-world') as HTMLElement;
  if (!world) return;

  // Clear previous artboards
  world.querySelectorAll('.ds-artboard').forEach(el => el.remove());
  world.querySelectorAll('style.ds-dynamic-styles').forEach(el => el.remove());

  const styleTag = document.createElement('style');
  styleTag.className = 'ds-dynamic-styles';
  let cssRules = '';

  // Empty state
  const emptyEl = world.querySelector('.ds-empty-canvas') as HTMLElement;
  if (emptyEl) emptyEl.style.display = artboards.length === 0 ? '' : 'none';

  for (const ab of artboards) {
    const div = document.createElement('div');
    div.className = `ds-artboard ${ab.id === activeArtboardId ? 'selected' : ''}`;
    div.style.left = `${ab.x}px`;
    div.style.top = `${ab.y}px`;
    div.style.width = `${ab.width}px`;
    if (ab.borderRadius) div.style.borderRadius = `${ab.borderRadius}px`;
    if (ab.overflow) div.style.overflow = ab.overflow;
    div.dataset.artboardId = ab.id;

    // Label above artboard
    const label = document.createElement('div');
    label.className = 'ds-artboard-label';
    label.textContent = `${ab.name} — ${ab.width}×${ab.height}`;
    label.addEventListener('dblclick', () => {
      const newName = prompt('Renomear artboard:', ab.name);
      if (newName) { ab.name = newName; renderAll(); }
    });

    // Header (drag handle)
    const header = document.createElement('div');
    header.className = 'ds-artboard-header';
    header.innerHTML = `<span class="ds-artboard-header-title">${ab.name}</span>`;
    setupArtboardDrag(header, ab);

    // Content area (drop zone)
    const content = document.createElement('div');
    content.className = 'ds-artboard-content';
    content.style.minHeight = `${ab.height - 30}px`;
    content.style.background = ab.background || '#0d0d15';
    // Native Flexbox rendering matching the schema
    content.style.display = ab.display || 'flex';
    content.style.flexDirection = ab.flexDirection || 'column';
    content.style.justifyContent = ab.justifyContent || 'flex-start';
    content.style.alignItems = ab.alignItems || 'stretch';
    content.style.gap = `${ab.gap ?? 16}px`;
    content.style.flexWrap = ab.flexWrap || 'nowrap';
    content.style.boxSizing = 'border-box';
    
    // Drag & drop
    content.addEventListener('dragover', (e) => { e.preventDefault(); content.classList.add('drag-over'); });
    content.addEventListener('dragleave', () => content.classList.remove('drag-over'));
    content.addEventListener('drop', (e) => {
      e.preventDefault();
      content.classList.remove('drag-over');
      const compId = e.dataTransfer?.getData('text/plain');
      if (compId && COMPONENTS.find(c => c.id === compId)) addElement(ab.id, compId);
    });

    // Render elements
    const sorted = [...ab.elements].sort((a, b) => a.order - b.order);
    for (const el of sorted) {
      // Skip invisible elements (applies to ALL types)
      if (el.visible === false) continue;

      // Skip grouped child elements (rendered by their group)
      if (el._grouped === true) continue;

      // ── Group container ──
      if (el.componentId === '__group__') {
        const wrapper = document.createElement('div');
        const isElSelected = el.id === selectedElementId || Sel.isSelected(el.id);
        wrapper.className = `ds-element ds-group-element ${isElSelected ? 'selected' : ''}`;
        wrapper.dataset.elId = el.id;
        wrapper.style.cssText = 'border:1px dashed rgba(124,58,237,0.3);border-radius:8px;padding:8px;position:relative;';

        const toolbar = document.createElement('div');
        toolbar.className = 'ds-element-toolbar';
        toolbar.innerHTML = `<span class="ds-el-label">📦 ${el.name || 'Group'}</span><div class="ds-el-actions"><button class="ds-el-btn" data-action="dup">📋</button><button class="ds-el-btn ds-el-btn-danger" data-action="delete">✕</button></div>`;

        wrapper.appendChild(toolbar);

        // Render child elements inside the group
        try {
          const childIds = JSON.parse(el.props.children || '[]') as string[];
          for (const childId of childIds) {
            const child = ab.elements.find(e => e.id === childId);
            if (child && child.visible !== false) {
              const childDef = COMPONENTS.find(c => c.id === child.componentId);
              if (childDef) {
                const childContent = document.createElement('div');
                childContent.className = 'ds-element-content';
                childContent.innerHTML = resolveTemplate(childDef.html, child.props);
                wrapper.appendChild(childContent);
              }
            }
          }
        } catch { /* ignore JSON parse errors */ }

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedElementId = el.id;
          Sel.selectOne(el.id);
          activeArtboardId = ab.id;
          renderAll();
        });
        toolbar.addEventListener('click', (e) => {
          const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
          if (!action) return;
          e.stopPropagation();
          handleElementAction(ab.id, el.id, action);
        });

        content.appendChild(wrapper);
        continue;
      }

      // ── Raw HTML files (imported from workspace) ──
      if (el.componentId === '__raw__') {
        const wrapper = document.createElement('div');
        wrapper.className = `ds-element ${el.id === selectedElementId ? 'selected' : ''}`;

        const toolbar = document.createElement('div');
        toolbar.className = 'ds-element-toolbar';
        toolbar.innerHTML = `<span class="ds-el-label">📄 ${el.props.fileName || 'HTML File'}</span><div class="ds-el-actions"><button class="ds-el-btn ds-el-btn-danger" data-action="delete">✕</button></div>`;

        // Render HTML inside a sandboxed iframe
        const frame = document.createElement('iframe');
        frame.className = 'ds-raw-iframe';
        frame.sandbox.add('allow-same-origin');
        frame.style.cssText = 'width:100%;min-height:400px;border:none;border-radius:4px;background:#fff;pointer-events:none;';

        wrapper.appendChild(toolbar);
        wrapper.appendChild(frame);

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedElementId = el.id;
          activeArtboardId = ab.id;
          renderAll();
        });
        toolbar.addEventListener('click', (e) => {
          const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
          if (!action) return;
          e.stopPropagation();
          handleElementAction(ab.id, el.id, action);
        });

        content.appendChild(wrapper);

        // Write HTML content after the iframe is in the DOM
        requestAnimationFrame(() => {
          const doc = frame.contentDocument;
          if (doc) {
            doc.open();
            doc.write(el.props.html || '');
            doc.close();
            setTimeout(() => {
              const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 400;
              frame.style.height = `${Math.max(h, 200)}px`;
            }, 100);
          }
        });

        continue;
      }

      const def = COMPONENTS.find(c => c.id === el.componentId);
      if (!def) continue;

      const wrapper = document.createElement('div');
      const isElSelected = el.id === selectedElementId || Sel.isSelected(el.id);
      wrapper.className = `ds-element ${isElSelected ? 'selected' : ''} ${el.locked ? 'ds-locked' : ''}`;

      // Apply element style overrides
      const s = el.style || DEFAULT_ELEMENT_STYLE;
      wrapper.style.cssText = buildElementCSSString(s);
      
      if (s.animation && s.animation !== 'none') {
        const preset = ANIMATION_PRESETS.find(a => a.name === s.animation);
        if (preset) wrapper.style.animation = preset.css;
      }

      wrapper.dataset.elId = el.id;

      // Handle custom hover styles and magic interactions
      const hasHoverStyle = el.hoverStyle && Object.keys(el.hoverStyle).length > 0;
      const hasHoverEffect = el.hoverEffect && el.hoverEffect !== 'none';
      if (hasHoverStyle || hasHoverEffect) {
        cssRules += `\n.ds-element[data-el-id="${el.id}"] { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }`;
        cssRules += `\n.ds-element[data-el-id="${el.id}"] .ds-element-content { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }`;
      }
      if (hasHoverStyle) {
        // Merge base + hover to get the complete hover state CSS
        const mergedHover = { ...s, ...(el.hoverStyle as ElementStyle) };
        cssRules += `\n.ds-element[data-el-id="${el.id}"]:hover { ${buildElementCSSString(mergedHover)} }`;
      }
      if (hasHoverEffect) {
        if (el.hoverEffect === 'h-scale-up') cssRules += `\n.ds-element[data-el-id="${el.id}"]:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 24px rgba(0,0,0,0.2) !important; }`;
        if (el.hoverEffect === 'h-glass-tilt') cssRules += `\n.ds-element[data-el-id="${el.id}"] { perspective: 1000px; }\n.ds-element[data-el-id="${el.id}"]:hover { transform: rotateX(5deg) rotateY(-5deg) translateZ(10px); box-shadow: -10px 10px 20px rgba(0,0,0,0.15) !important; }`;
        if (el.hoverEffect === 'h-neon-glow') cssRules += `\n.ds-element[data-el-id="${el.id}"]:hover { box-shadow: 0 0 15px rgba(124,58,237,0.5), 0 0 45px rgba(124,58,237,0.2) !important; }`;
        if (el.hoverEffect === 'h-slide-up') cssRules += `\n.ds-element[data-el-id="${el.id}"]:hover { transform: translateY(-8px); }`;
        if (el.hoverEffect === 'h-blur-out') cssRules += `\n.ds-element[data-el-id="${el.id}"]:hover { filter: blur(4px); opacity: 0.7; }`;
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'ds-element-toolbar';
      toolbar.innerHTML = `<span class="ds-el-label">${def.icon} ${el.name || def.name}${el.locked ? ' 🔒' : ''}</span><div class="ds-el-actions"><button class="ds-el-btn" data-action="up">▲</button><button class="ds-el-btn" data-action="down">▼</button><button class="ds-el-btn" data-action="dup">📋</button><button class="ds-el-btn ds-el-btn-danger" data-action="delete">✕</button></div>`;

      const elContent = document.createElement('div');
      elContent.className = 'ds-element-content';
      elContent.innerHTML = resolveTemplate(def.html, el.props);

      wrapper.appendChild(toolbar);
      wrapper.appendChild(elContent);

      // Click to select (Shift = multi-select)
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        if ((e as MouseEvent).shiftKey) {
          Sel.toggleSelect(el.id);
          selectedElementId = el.id;
        } else {
          selectedElementId = el.id;
          Sel.selectOne(el.id);
        }
        activeArtboardId = ab.id;
        propsEditState = 'normal';
        renderAll();
      });

      // Right-click context menu
      wrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectedElementId = el.id;
        activeArtboardId = ab.id;
        showContextMenu(e.clientX, e.clientY, ab.id, el.id, el.locked);
      });

      toolbar.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
        if (!action) return;
        e.stopPropagation();
        if (el.locked && action !== 'toggle-lock') return;
        handleElementAction(ab.id, el.id, action);
      });

      // Inline text editing
      setupInlineEdit(wrapper, el.id, el.componentId, el.props, (elId, propKey, value) => {
        const foundEl = ab.elements.find(e => e.id === elId);
        if (foundEl) {
          recordState();
          foundEl.props[propKey] = value;
          renderAll();
        }
      });

      // Show resize handles on selected elements
      if (isElSelected && !el.locked) {
        requestAnimationFrame(() => {
          showResizeHandles(wrapper, el.id, zoom, (elId, w, h) => {
            const resizedEl = ab.elements.find(e => e.id === elId);
            if (resizedEl) {
              recordState();
              resizedEl.style.width = `${w}px`;
              resizedEl.style.height = `${h}px`;
              resizedEl.w = w;
              resizedEl.h = h;
              renderAll();
            }
          });
        });
      }

      content.appendChild(wrapper);
    }

    // Click artboard to select it
    div.addEventListener('click', (e) => {
      if (e.target === div || e.target === content || e.target === header) {
        // Comment mode: place comment on click
        if (Comments.isCommentMode() && ab.id) {
          const rect = content.getBoundingClientRect();
          const cx = (e.clientX - rect.left) / zoom;
          const cy = (e.clientY - rect.top) / zoom;
          const text = prompt('Add comment:');
          if (text) {
            Comments.addComment(ab.id, cx, cy, text);
            Comments.setCommentMode(false);
            renderAll();
            showToast('💬 Comment added');
          }
          return;
        }
        activeArtboardId = ab.id;
        selectedElementId = null;
        renderAll();
      }
    });

    div.appendChild(label);
    div.appendChild(header);
    div.appendChild(content);

    // Render comment pins on artboard content
    Comments.renderCommentPins(content, ab.id, (comment) => {
      const pin = content.querySelector(`[data-comment-id="${comment.id}"]`);
      const rect = pin?.getBoundingClientRect();
      Comments.showCommentPopover(
        comment,
        rect?.left || 0,
        rect?.top || 0,
        () => { Comments.resolveComment(comment.id); renderAll(); },
        () => { Comments.deleteComment(comment.id); renderAll(); },
        (text) => { Comments.updateCommentText(comment.id, text); },
        () => {},
      );
    });

    world.appendChild(div);
  }

  styleTag.textContent = cssRules;
  world.appendChild(styleTag);

  // Re-render rulers when artboards change
  renderRulerTicks();
}

function setupArtboardDrag(handle: HTMLElement, ab: Artboard): void {
  let startX = 0, startY = 0, origX = 0, origY = 0, dragging = false;

  handle.addEventListener('mousedown', (e) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = ab.x;
    origY = ab.y;
    activeArtboardId = ab.id;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    ab.x = origX + (e.clientX - startX) / zoom;
    ab.y = origY + (e.clientY - startY) / zoom;
    renderArtboards();
  });

  window.addEventListener('mouseup', () => { dragging = false; });
}

function handleElementAction(abId: string, elId: string, action: string): void {
  const ab = artboards.find(a => a.id === abId);
  if (!ab) return;
  const idx = ab.elements.findIndex(e => e.id === elId);
  if (idx === -1) return;
  recordState();
  switch (action) {
    case 'up':
      if (idx > 0) { const t = ab.elements[idx].order; ab.elements[idx].order = ab.elements[idx - 1].order; ab.elements[idx - 1].order = t; }
      break;
    case 'down':
      if (idx < ab.elements.length - 1) { const t = ab.elements[idx].order; ab.elements[idx].order = ab.elements[idx + 1].order; ab.elements[idx + 1].order = t; }
      break;
    case 'dup': {
      const o = ab.elements[idx];
      const newEl: CanvasElement = {
        id: `el-${Date.now()}`, componentId: o.componentId, props: { ...o.props }, order: nextOrder++,
        style: o.style ? { ...o.style } : { ...DEFAULT_ELEMENT_STYLE },
        hoverStyle: o.hoverStyle ? { ...o.hoverStyle } : undefined,
        hoverEffect: o.hoverEffect || undefined,
        actionType: o.actionType || 'none', navigateTo: o.navigateTo || '', actionUrl: o.actionUrl || '',
        visible: true, locked: false, name: `${o.name || 'Element'} Copy`,
        x: (o.x || 0) + 20, y: (o.y || 0) + 20, w: o.w || 0, h: o.h || 0,
      };
      ab.elements.push(newEl);
      selectedElementId = newEl.id;
      Sel.selectOne(newEl.id);
      break;
    }
    case 'delete':
      ab.elements.splice(idx, 1);
      if (selectedElementId === elId) selectedElementId = null;
      break;
    case 'toggle-visibility':
      ab.elements[idx].visible = !(ab.elements[idx].visible !== false);
      break;
    case 'toggle-lock':
      ab.elements[idx].locked = !ab.elements[idx].locked;
      break;
  }
  renderAll();
}
// ─── Assets Panel ───────────────────────────────────────────────────

function renderAssetsPanel(): void {
  const panel = layerEl?.querySelector('#ds-panel-assets') as HTMLElement;
  if (!panel) return;
  panel.innerHTML = '';
  scanArtboardsForAssets(artboards);
  const assetUI = renderAssetPanel((dataUrl) => {
    // Insert asset into selected element's first image prop
    const el = findSelectedElement();
    if (el) {
      const imgKey = Object.keys(el.props).find(k => /^(src|imgUrl|bgImg|thumbUrl|bannerImg|imageUrl|heroImg)$/i.test(k));
      if (imgKey) {
        recordState();
        el.props[imgKey] = dataUrl;
        renderAll();
        showToast('📸 Asset inserted!');
      }
    }
  });
  panel.appendChild(assetUI);
}

// Inject scroll animation keyframes once
function injectScrollAnimKeyframes(): void {
  if (!document.querySelector('#ds-scroll-anim-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ds-scroll-anim-keyframes';
    style.textContent = SCROLL_ANIMATION_KEYFRAMES;
    document.head.appendChild(style);
  }
}

// ─── Pages Panel ────────────────────────────────────────────────────

function renderPages(): void {
  const panel = layerEl?.querySelector('#ds-panel-pages') as HTMLElement;
  if (!panel) return;

  let html = '';
  for (const ab of artboards) {
    html += `<div class="ds-page-item ${ab.id === activeArtboardId ? 'active' : ''}" data-ab-id="${ab.id}">
      <span class="ds-page-icon">📄</span>
      <div class="ds-page-info">
        <div class="ds-page-name">${ab.name}</div>
        <div class="ds-page-dims">${ab.route} · ${ab.width}×${ab.height} · ${ab.elements.length} el</div>
      </div>
      <div class="ds-page-actions">
        <button class="ds-page-act-btn" data-action="focus" title="Focus">🎯</button>
        <button class="ds-page-act-btn" data-action="delete" title="Delete">✕</button>
      </div>
    </div>`;
  }

  html += `<div class="ds-add-page-btn" id="ds-add-artboard">+ Add Frame</div>`;

  // Preset buttons
  html += `<div style="padding:0 12px 8px;display:flex;flex-wrap:wrap;gap:4px;">`;
  for (const p of PRESETS) {
    html += `<button class="ds-tb-btn" data-preset="${p.name}" style="font-size:10px;padding:3px 8px;">${p.name} (${p.width}×${p.height})</button>`;
  }
  html += `</div>`;

  panel.innerHTML = html;

  // Wire events
  panel.querySelectorAll('.ds-page-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const abId = (item as HTMLElement).dataset.abId!;
      const action = (e.target as HTMLElement).closest('[data-action]')?.getAttribute('data-action');
      if (action === 'delete') { removeArtboard(abId); return; }
      if (action === 'focus') { focusArtboard(abId); return; }
      activeArtboardId = abId;
      renderAll();
    });
  });

  panel.querySelector('#ds-add-artboard')?.addEventListener('click', () => {
    addArtboard('Page ' + (artboards.length + 1), nextArtboardX, 100, 1440, 900);
  });

  panel.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = (btn as HTMLElement).dataset.preset!;
      const p = PRESETS.find(pr => pr.name === name)!;
      addArtboard(name, nextArtboardX, 100, p.width, p.height);
    });
  });
}

function focusArtboard(id: string): void {
  const ab = artboards.find(a => a.id === id);
  if (!ab) return;
  const viewport = layerEl?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (!viewport) return;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  zoom = Math.min(vw / (ab.width + 100), vh / (ab.height + 100), 1.2);
  panX = (vw - ab.width * zoom) / 2 - ab.x * zoom;
  panY = (vh - ab.height * zoom) / 2 - ab.y * zoom;
  activeArtboardId = id;
  renderAll();
}

// ─── Layers Panel ───────────────────────────────────────────────────

function renderLayers(): void {
  const panel = layerEl?.querySelector('#ds-panel-layers') as HTMLElement;
  if (!panel) return;

  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) {
    panel.innerHTML = '<div class="ds-files-loading">Select an Artboard to view layers</div>';
    return;
  }

  let html = `<div class="ds-page-item" style="font-weight:600; font-size:12px; margin-bottom: 8px; display:flex; align-items:center; justify-content:space-between;">
    <span>🎯 ${ab.name}</span>
    <span style="font-size:10px;color:#585b70;">${ab.elements.length} layers</span>
  </div>`;

  // Alignment tools
  html += `<div style="display:flex;gap:2px;margin-bottom:8px;flex-wrap:wrap;">
    <button class="ds-layer-align-btn" data-align-action="align-left" title="Align Left" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">⬅</button>
    <button class="ds-layer-align-btn" data-align-action="align-center-h" title="Align Center H" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">⬌</button>
    <button class="ds-layer-align-btn" data-align-action="align-right" title="Align Right" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">➡</button>
    <button class="ds-layer-align-btn" data-align-action="align-top" title="Align Top" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">⬆</button>
    <button class="ds-layer-align-btn" data-align-action="align-center-v" title="Align Center V" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">⬍</button>
    <button class="ds-layer-align-btn" data-align-action="align-bottom" title="Align Bottom" style="font-size:9px;padding:2px 4px;background:#11111b;border:1px solid #313244;color:#585b70;border-radius:3px;cursor:pointer;">⬇</button>
  </div>`;

  const sorted = [...ab.elements].sort((a, b) => b.order - a.order);

  for (const el of sorted) {
    // Skip grouped children
    if (el._grouped === true) continue;

    const isSelected = el.id === selectedElementId || Sel.isSelected(el.id);
    const def = COMPONENTS.find(c => c.id === el.componentId);
    if (!def && el.componentId !== '__raw__' && el.componentId !== '__group__') continue;

    const icon = el.componentId === '__raw__' ? '📄' : el.componentId === '__group__' ? '📦' : (def?.icon || '📦');
    const label = el.name || (el.componentId === '__raw__' ? (el.props.fileName || 'HTML File') : el.componentId === '__group__' ? 'Group' : (def?.name || 'Unknown'));
    const hasAction = el.actionType && el.actionType !== 'none';
    const isHidden = el.visible === false;
    const isLocked = el.locked === true;

    html += `
      <div class="ds-file-item ${isSelected ? 'active' : ''}" data-layer-el-id="${el.id}" style="padding:3px 6px 3px 10px;cursor:pointer;border-radius:4px;margin-bottom:2px;display:flex;align-items:center;gap:4px;${isHidden ? 'opacity:0.4;' : ''}">
        <button class="ds-layer-icon-btn" data-layer-action="toggle-visibility" data-layer-id="${el.id}" title="${isHidden ? 'Show' : 'Hide'}" style="background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;color:${isHidden ? '#f38ba8' : '#585b70'};">${isHidden ? '👁️‍🗨️' : '👁️'}</button>
        <button class="ds-layer-icon-btn" data-layer-action="toggle-lock" data-layer-id="${el.id}" title="${isLocked ? 'Unlock' : 'Lock'}" style="background:none;border:none;cursor:pointer;font-size:10px;padding:0 2px;color:${isLocked ? '#f9e2af' : '#585b70'};">${isLocked ? '🔒' : '🔓'}</button>
        <span class="ds-file-icon" style="flex-shrink:0;font-size:11px;">${icon}</span>
        <span class="ds-layer-name" data-layer-id="${el.id}" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;cursor:text;" title="Double-click to rename">${label}</span>
        ${hasAction ? '<span style="font-size:8px;color:#7c3aed;" title="Has interaction">🔗</span>' : ''}
        <div class="ds-layer-actions" style="display:flex;gap:1px;flex-shrink:0;">
          <button class="ds-layer-btn" data-layer-action="up" data-layer-id="${el.id}" title="Move Up" style="background:none;border:none;color:#585b70;cursor:pointer;font-size:9px;padding:1px 2px;border-radius:3px;">▲</button>
          <button class="ds-layer-btn" data-layer-action="down" data-layer-id="${el.id}" title="Move Down" style="background:none;border:none;color:#585b70;cursor:pointer;font-size:9px;padding:1px 2px;border-radius:3px;">▼</button>
          <button class="ds-layer-btn" data-layer-action="dup" data-layer-id="${el.id}" title="Duplicate" style="background:none;border:none;color:#89b4fa;cursor:pointer;font-size:9px;padding:1px 2px;border-radius:3px;">⧉</button>
          <button class="ds-layer-btn" data-layer-action="delete" data-layer-id="${el.id}" title="Delete" style="background:none;border:none;color:#f38ba8;cursor:pointer;font-size:9px;padding:1px 2px;border-radius:3px;">✕</button>
        </div>
      </div>
    `;
  }

  if (sorted.length === 0) {
    html += '<div class="ds-files-loading" style="font-size: 11px;">No elements in Artboard</div>';
  }

  panel.innerHTML = html;

  // Wire click for selection (Shift = multi-select)
  panel.querySelectorAll('.ds-file-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.ds-layer-btn') || (e.target as HTMLElement).closest('.ds-layer-icon-btn')) return;
      const elId = (item as HTMLElement).dataset.layerElId;
      if (!elId) return;
      if ((e as MouseEvent).shiftKey) {
        Sel.toggleSelect(elId);
        selectedElementId = elId;
      } else {
        selectedElementId = elId;
        Sel.selectOne(elId);
      }
      activeArtboardId = ab.id;
      renderAll();
    });
  });

  // Wire layer action buttons
  panel.querySelectorAll<HTMLButtonElement>('.ds-layer-btn, .ds-layer-icon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = btn.dataset.layerAction;
      const layerId = btn.dataset.layerId;
      if (!action || !layerId) return;
      handleElementAction(ab.id, layerId, action);
    });
  });

  // Wire double-click rename
  panel.querySelectorAll<HTMLElement>('.ds-layer-name').forEach(nameEl => {
    nameEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const layerId = nameEl.dataset.layerId;
      const el = ab.elements.find(el => el.id === layerId);
      if (!el) return;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = el.name || '';
      input.style.cssText = 'width:100%;background:#0d0d15;border:1px solid #7c3aed;color:#cdd6f4;border-radius:3px;padding:1px 4px;font-size:11px;outline:none;';
      input.addEventListener('blur', () => {
        if (input.value.trim()) el.name = input.value.trim();
        recordState();
        renderLayers();
      });
      input.addEventListener('keydown', (ke) => {
        if (ke.key === 'Enter') input.blur();
        if (ke.key === 'Escape') { input.value = el.name || ''; input.blur(); }
      });
      nameEl.replaceWith(input);
      input.focus();
      input.select();
    });
  });

  // Wire alignment buttons
  panel.querySelectorAll<HTMLButtonElement>('.ds-layer-align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.alignAction;
      if (action) alignElements(action);
    });
  });
}

/** Alignment tools for selected elements */
function alignElements(action: string): void {
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) return;
  const ids = Sel.getSelectedIds();
  if (ids.size === 0 && selectedElementId) ids.add(selectedElementId);
  if (ids.size < 1) return;
  const elements = ab.elements.filter(el => ids.has(el.id));
  if (elements.length === 0) return;
  recordState();
  switch (action) {
    case 'align-left':
      elements.forEach(el => { el.style.textAlign = 'left'; el.style.margin = 'auto auto auto 0'; });
      break;
    case 'align-center-h':
      elements.forEach(el => { el.style.textAlign = 'center'; el.style.margin = 'auto'; });
      break;
    case 'align-right':
      elements.forEach(el => { el.style.textAlign = 'right'; el.style.margin = 'auto 0 auto auto'; });
      break;
    case 'align-top':
      elements.forEach(el => { el.style.margin = '0 auto auto auto'; });
      break;
    case 'align-center-v':
      elements.forEach(el => { el.style.margin = 'auto'; });
      break;
    case 'align-bottom':
      elements.forEach(el => { el.style.margin = 'auto auto 0 auto'; });
      break;
  }
  renderAll();
}

// ─── File Browser ───────────────────────────────────────────────────

async function loadFileTree(): Promise<void> {
  const panel = layerEl?.querySelector('#ds-panel-files') as HTMLElement;
  if (!panel) return;
  panel.innerHTML = '<div class="ds-files-loading">Loading workspace...</div>';

  try {
    const data = await getFileTree();
    const frontendExts = ['.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss'];
    const filtered = filterTree(data.tree || [], frontendExts);
    panel.innerHTML = '';
    renderFileTree(panel, filtered, 0);
    if (filtered.length === 0) {
      panel.innerHTML = '<div class="ds-files-loading">No frontend files found</div>';
    }
  } catch {
    panel.innerHTML = '<div class="ds-files-loading">Could not load workspace</div>';
  }
}

function filterTree(nodes: FileTreeNode[], exts: string[]): FileTreeNode[] {
  const result: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'dir') {
      const name = (node.name || '').toLowerCase();
      if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.next') continue;
      const children = filterTree(node.children || [], exts);
      if (children.length > 0) result.push({ ...node, children });
    } else {
      const ext = '.' + (node.name || '').split('.').pop()?.toLowerCase();
      if (exts.includes(ext)) result.push(node);
    }
  }
  return result;
}

function renderFileTree(container: HTMLElement, nodes: FileTreeNode[], depth: number): void {
  for (const node of nodes) {
    if (node.type === 'dir') {
      const dirEl = document.createElement('div');
      dirEl.className = 'ds-file-item ds-file-dir';
      dirEl.style.paddingLeft = `${14 + depth * 12}px`;
      dirEl.innerHTML = `<span class="ds-file-icon">📂</span><span class="ds-file-name">${node.name}</span>`;
      let expanded = false;
      const childContainer = document.createElement('div');
      childContainer.style.display = 'none';
      dirEl.addEventListener('click', () => {
        expanded = !expanded;
        childContainer.style.display = expanded ? '' : 'none';
        dirEl.querySelector('.ds-file-icon')!.textContent = expanded ? '📂' : '📁';
      });
      container.appendChild(dirEl);
      renderFileTree(childContainer, node.children || [], depth + 1);
      container.appendChild(childContainer);
    } else {
      const file = document.createElement('div');
      file.className = 'ds-file-item';
      file.style.paddingLeft = `${14 + depth * 12}px`;
      const ext = (node.name || '').split('.').pop() || '';
      const icon = { html: '🌐', htm: '🌐', jsx: '⚛️', tsx: '⚛️', vue: '💚', svelte: '🔥', css: '🎨', scss: '🎨' }[ext] || '📄';
      file.innerHTML = `<span class="ds-file-icon">${icon}</span><span class="ds-file-name">${node.name}</span>`;
      file.addEventListener('click', () => openFileAsArtboard(node.path || node.name || ''));
      container.appendChild(file);
    }
  }
}

async function openFileAsArtboard(path: string): Promise<void> {
  try {
    const data = await readFile(path);
    const name = path.split('/').pop() || path;
    const ab = addArtboardFromFile(name, data.content || '');
    if (ab) showToast(`📄 ${name} loaded`);
  } catch (err) {
    showToast(`❌ Failed to load: ${err}`);
  }
}

function addArtboardFromFile(name: string, content: string): Artboard | null {
  const ab: Artboard = {
    id: `ab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name, route: `/${name.toLowerCase().replace(/\s+/g, '-')}`, x: nextArtboardX, y: 100, width: 1440, height: 900,
    background: '#0d0d15', borderRadius: 4, overflow: 'hidden',
    display: 'block', flexDirection: 'column', justifyContent: 'flex-start',
    alignItems: 'stretch', gap: 16, flexWrap: 'nowrap',
    elements: [],
  };
  // Add a single "raw html" element
  ab.elements.push({
    id: `el-${Date.now()}`,
    componentId: '__raw__',
    props: { html: content, fileName: name },
    order: 0,
    style: { ...DEFAULT_ELEMENT_STYLE },
    actionType: 'none', navigateTo: '', actionUrl: '',
    visible: true, locked: false, name: name,
    x: 0, y: 0, w: 0, h: 0,
  });
  artboards.push(ab);
  activeArtboardId = ab.id;
  nextArtboardX += 1540;
  renderAll();
  focusArtboard(ab.id);
  return ab;
}
// ─── Framework Scanner ──────────────────────────────────────────────

async function scanWorkspaceFramework(): Promise<void> {
  try {
    const tree = await getFileTree();
    const nodes = tree.tree || [];

    // 1. Detect framework from package.json
    detectedFramework = await detectFramework(nodes);

    // 2. Scan for component files
    projectComponents = scanForComponents(nodes, detectedFramework);

    // 3. Update UI
    updateProjectPanel();
    showToast(`🔍 Detected: ${detectedFramework.label} (${projectComponents.length} components)`);
  } catch {
    detectedFramework = { name: 'html', label: 'HTML', icon: '🌐', fileExt: '.html', componentDir: '' };
    updateProjectPanel();
  }
}

async function detectFramework(nodes: FileTreeNode[]): Promise<DetectedFramework> {
  // Check for package.json
  const pkgNode = nodes.find(n => n.name === 'package.json');
  if (pkgNode) {
    try {
      const data = await readFile(pkgNode.path || 'package.json');
      const pkg = JSON.parse(data.content || '{}');
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['next']) return { name: 'nextjs', label: 'Next.js', icon: '▲', fileExt: '.tsx', componentDir: 'src/components' };
      if (deps['nuxt'] || deps['nuxt3']) return { name: 'vue', label: 'Nuxt/Vue', icon: '💚', fileExt: '.vue', componentDir: 'components' };
      if (deps['svelte'] || deps['@sveltejs/kit']) return { name: 'svelte', label: 'Svelte', icon: '🔥', fileExt: '.svelte', componentDir: 'src/lib/components' };
      if (deps['vue']) return { name: 'vue', label: 'Vue', icon: '💚', fileExt: '.vue', componentDir: 'src/components' };
      if (deps['react']) return { name: 'react', label: 'React', icon: '⚛️', fileExt: deps['typescript'] ? '.tsx' : '.jsx', componentDir: 'src/components' };
    } catch { /* ignore parse errors */ }
  }

  // Check for common framework files
  const hasNext = nodes.some(n => n.name === 'next.config.js' || n.name === 'next.config.mjs' || n.name === 'next.config.ts');
  if (hasNext) return { name: 'nextjs', label: 'Next.js', icon: '▲', fileExt: '.tsx', componentDir: 'src/components' };

  const hasVue = nodes.some(n => n.name === 'vue.config.js' || n.name === 'nuxt.config.ts');
  if (hasVue) return { name: 'vue', label: 'Vue', icon: '💚', fileExt: '.vue', componentDir: 'src/components' };

  const hasSvelte = nodes.some(n => n.name === 'svelte.config.js');
  if (hasSvelte) return { name: 'svelte', label: 'Svelte', icon: '🔥', fileExt: '.svelte', componentDir: 'src/lib/components' };

  return { name: 'html', label: 'HTML', icon: '🌐', fileExt: '.html', componentDir: '' };
}

function scanForComponents(nodes: FileTreeNode[], fw: DetectedFramework): ProjectComponent[] {
  const result: ProjectComponent[] = [];
  const compExts = ['.tsx', '.jsx', '.vue', '.svelte'];

  function walk(items: FileTreeNode[], parentPath = ''): void {
    for (const node of items) {
      if (node.type === 'dir') {
        const name = (node.name || '').toLowerCase();
        if (name === 'node_modules' || name === '.git' || name === 'dist' || name === '.next' || name === '.nuxt') continue;
        walk(node.children || [], `${parentPath}${node.name}/`);
      } else {
        const fileName = node.name || '';
        const ext = '.' + fileName.split('.').pop()?.toLowerCase();
        if (!compExts.includes(ext)) continue;

        // Skip non-component files
        const lower = fileName.toLowerCase();
        if (lower.startsWith('index.') || lower.includes('.test.') || lower.includes('.spec.') || lower.includes('.stories.')) continue;
        if (lower === 'app.tsx' || lower === 'app.jsx' || lower === 'main.tsx' || lower === 'main.jsx') continue;
        if (lower.startsWith('layout.') || lower.startsWith('page.') || lower.startsWith('loading.') || lower.startsWith('error.')) continue;

        // Extract component name from filename (PascalCase)
        const baseName = fileName.replace(/\.(tsx|jsx|vue|svelte)$/i, '');
        const compName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

        result.push({
          name: compName,
          path: node.path || `${parentPath}${fileName}`,
          exports: [compName, 'default'],
          framework: fw.name,
        });
      }
    }
  }

  walk(nodes);
  return result;
}

function updateProjectPanel(): void {
  const badge = layerEl?.querySelector('#ds-framework-badge') as HTMLElement;
  const list = layerEl?.querySelector('#ds-project-list') as HTMLElement;
  if (!badge || !list) return;

  const fw = detectedFramework || { icon: '🌐', label: 'HTML', name: 'html' };
  badge.textContent = `${fw.icon} ${fw.label}`;
  badge.className = 'ds-project-badge ds-badge-active';

  if (projectComponents.length === 0) {
    list.innerHTML = '<div class="ds-files-loading" style="font-size:11px;padding:8px 14px;">No components found in workspace</div>';
    return;
  }

  list.innerHTML = '';
  for (const comp of projectComponents) {
    const item = document.createElement('div');
    item.className = 'ds-palette-item ds-project-comp';
    const fwIcon = { nextjs: '▲', react: '⚛️', vue: '💚', svelte: '🔥' }[comp.framework] || '📄';
    item.innerHTML = `<span class="ds-palette-icon">${fwIcon}</span><span class="ds-palette-name">${comp.name}</span><span class="ds-comp-path">${comp.path.split('/').pop()}</span>`;
    item.title = comp.path;
    item.addEventListener('dblclick', () => {
      // Open the component file in editor
      PubSub.emit('file:open', comp.path);
      showToast(`📄 Opened: ${comp.name}`);
    });
    list.appendChild(item);
  }
}

function insertToEditor(): void {
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab || ab.elements.length === 0) {
    showToast('⚠️ No elements to insert');
    return;
  }

  const fw = detectedFramework || { name: 'html', label: 'HTML', fileExt: '.html' };
  let code = '';

  if (fw.name === 'html') {
    code = generateHTML();
  } else if (fw.name === 'nextjs' || fw.name === 'react') {
    // Generate React/JSX component
    const bodyParts: string[] = [];
    const sorted = [...ab.elements].sort((a, b) => a.order - b.order);
    for (const el of sorted) {
      if (el.componentId === '__raw__') {
        bodyParts.push(`      {/* Raw HTML */}\n      <div dangerouslySetInnerHTML={{ __html: \`${(el.props.html || '').replace(/`/g, '\\`')}\` }} />`);
        continue;
      }
      const def = COMPONENTS.find(c => c.id === el.componentId);
      if (def) {
        // Convert HTML to JSX-ish (basic conversion)
        let jsx = getElementHTMLWrapped(el, def)
          .replace(/class="/g, 'className="')
          .replace(/style="([^"]*)"/g, (_, s) => {
            const obj = s.split(';').filter(Boolean).map((p: string) => {
              const [k, v] = p.split(':').map((x: string) => x.trim());
              const camel = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
              return `${camel}: '${v}'`;
            }).join(', ');
            return `style={{ ${obj} }}`;
          });
        bodyParts.push(`      ${jsx.trim()}`);
      }
    }

    const compName = ab.name.replace(/[^a-zA-Z0-9]/g, '') || 'DesignComponent';
    code = `'use client';\n\nexport default function ${compName}() {\n  return (\n    <div style=${buildArtboardLayoutStyleJSX(ab)}>\n${bodyParts.join('\n\n')}\n    </div>\n  );\n}\n`;
  } else if (fw.name === 'vue') {
    const bodyParts: string[] = [];
    const sorted = [...ab.elements].sort((a, b) => a.order - b.order);
    for (const el of sorted) {
      if (el.componentId === '__raw__') { bodyParts.push(el.props.html || ''); continue; }
      const def = COMPONENTS.find(c => c.id === el.componentId);
      if (def) bodyParts.push(`    ${getElementHTMLWrapped(el, def)}`);
    }
    code = `<template>\n  <div style="${buildArtboardLayoutStyleHTML(ab)}">\n${bodyParts.join('\n\n')}\n  </div>\n</template>\n\n<script setup lang="ts">\n// Generated by Lumina Design Studio\n</script>\n`;
  } else if (fw.name === 'svelte') {
    const bodyParts: string[] = [];
    const sorted = [...ab.elements].sort((a, b) => a.order - b.order);
    for (const el of sorted) {
      if (el.componentId === '__raw__') { bodyParts.push(el.props.html || ''); continue; }
      const def = COMPONENTS.find(c => c.id === el.componentId);
      if (def) bodyParts.push(`  ${getElementHTMLWrapped(el, def)}`);
    }
    code = `<script lang="ts">\n  // Generated by Lumina Design Studio\n</script>\n\n<div style="${buildArtboardLayoutStyleHTML(ab)}">\n${bodyParts.join('\n\n')}\n</div>\n`;
  } else {
    code = generateHTML();
  }

  // Copy to clipboard (also dispatch event in case editor listens)
  const event = new CustomEvent('ds:insert-code', { detail: { code } });
  document.dispatchEvent(event);
  navigator.clipboard.writeText(code).then(() => {
    showToast(`📋 ${fw.label} code copied to clipboard`);
  }).catch(() => {
    showToast('⚠️ Could not copy — code logged to console');
    console.log('[Design Studio] Generated code:\n', code);
  });
}

async function createComponent(): Promise<void> {
  const fw = detectedFramework || { name: 'html', label: 'HTML', fileExt: '.html', componentDir: '' };
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab) { showToast('⚠️ No active artboard'); return; }

  const defaultName = ab.name.replace(/[^a-zA-Z0-9]/g, '') || 'NewComponent';
  const name = prompt(`Component name (${fw.label}):`, defaultName);
  if (!name) return;

  const dir = fw.componentDir || prompt('Component directory:', 'src/components') || 'src/components';
  const fileName = `${name}${fw.fileExt}`;
  const filePath = `${dir}/${fileName}`;

  // Generate code same as insertToEditor but save to file
  let code = '';
  const bodyParts: string[] = [];
  const sorted = [...ab.elements].sort((a, b) => a.order - b.order);

  for (const el of sorted) {
    if (el.componentId === '__raw__') continue;
    const def = COMPONENTS.find(c => c.id === el.componentId);
    // Since createComponent could be anything, we must duplicate the React JSX formatting logic from insertToEditor if it is react/nextjs.
    // For simplicity, we implement it properly checking the framework formatting again:
    if (def) {
      if (fw.name === 'react' || fw.name === 'nextjs') {
        let jsx = getElementHTMLWrapped(el, def)
          .replace(/class="/g, 'className="')
          .replace(/style="([^"]*)"/g, (_, s) => {
            const obj = s.split(';').filter(Boolean).map((p: string) => {
              const [k, v] = p.split(':').map((x: string) => x.trim());
              const camel = k.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
              return `${camel}: '${v}'`;
            }).join(', ');
            return `style={{ ${obj} }}`;
          });
        bodyParts.push(jsx.trim());
      } else {
        bodyParts.push(`${getElementHTMLWrapped(el, def)}`);
      }
    }
  }

  if (fw.name === 'nextjs' || fw.name === 'react') {
    code = `'use client';\n\nexport default function ${name}() {\n  return (\n    <div style=${buildArtboardLayoutStyleJSX(ab)}>\n${bodyParts.map(p => `      ${p}`).join('\n\n')}\n    </div>\n  );\n}\n`;
  } else if (fw.name === 'vue') {
    code = `<template>\n  <div style="${buildArtboardLayoutStyleHTML(ab)}">\n${bodyParts.join('\n\n')}\n  </div>\n</template>\n\n<script setup lang="ts">\n// ${name} — Generated by Lumina Design Studio\n</script>\n`;
  } else if (fw.name === 'svelte') {
    code = `<script lang="ts">\n  // ${name} — Generated by Lumina Design Studio\n</script>\n\n<div style="${buildArtboardLayoutStyleHTML(ab)}">\n${bodyParts.join('\n\n')}\n</div>\n`;
  } else {
    code = generateHTML();
  }

  try {
    await writeFile(filePath, code);
    showToast(`✅ Created: ${filePath}`);
    // Re-scan to pick up the new component
    frameworkScanned = false;
    scanWorkspaceFramework();
  } catch (err) {
    showToast(`❌ Failed to create: ${err}`);
  }
}

// ─── Props Panel ────────────────────────────────────────────────────

function renderProps(): void {
  const panel = layerEl?.querySelector('#ds-props') as HTMLElement;
  if (!panel) return;
  renderPropsPanel({
    panel,
    artboards,
    activeArtboardId,
    selectedElementId,
    propsEditState,
    renderArtboards,
    renderAll,
    renderPages,
    renderProps,
    recordState,
    showToast,
    setPropsEditState: (s) => { propsEditState = s; },
  });
}

// ─── View Switching ─────────────────────────────────────────────────

function setView(view: 'design' | 'code' | 'preview'): void {
  if (!layerEl) return;
  layerEl.querySelectorAll('.ds-view-tab').forEach(t => t.classList.remove('active'));
  layerEl.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  const codeOverlay = layerEl.querySelector('#ds-code-overlay') as HTMLElement;
  const previewOverlay = layerEl.querySelector('#ds-preview-overlay') as HTMLElement;
  codeOverlay?.classList.toggle('visible', view === 'code');
  previewOverlay?.classList.toggle('visible', view === 'preview');
  if (view === 'code') updateCodeView();
  if (view === 'preview') updatePreview();
}

function updateCodeView(): void {
  const el = layerEl?.querySelector('#ds-code-content') as HTMLElement;
  if (el) el.textContent = generateHTML();
}

function updatePreview(): void {
  const iframe = layerEl?.querySelector('#ds-preview-iframe') as HTMLIFrameElement;
  if (!iframe) return;
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  const previewOverlay = layerEl?.querySelector('#ds-preview-overlay') as HTMLElement;
  if (!previewOverlay || !ab) return;

  // Set iframe to artboard resolution
  iframe.style.width = `${ab.width}px`;
  iframe.style.maxWidth = '100%';
  iframe.style.height = '100%';
  iframe.style.margin = '0 auto';
  iframe.style.display = 'block';
  iframe.style.boxShadow = ab.width <= 768 ? '0 0 0 1px #313244, 0 8px 32px rgba(0,0,0,0.4)' : 'none';
  iframe.style.borderRadius = ab.width <= 768 ? '12px' : '0';

  // Update device label
  let deviceLabel = '🖥️ Desktop';
  if (ab.width <= 480) deviceLabel = '📱 Mobile';
  else if (ab.width <= 768) deviceLabel = '📱 Tablet';
  else if (ab.width <= 1024) deviceLabel = '💻 Small Desktop';

  let bar = previewOverlay.querySelector('.ds-preview-bar') as HTMLElement;
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'ds-preview-bar';
    previewOverlay.insertBefore(bar, iframe);
  }
  bar.innerHTML = `<span class="ds-preview-device">${deviceLabel}</span><span class="ds-preview-res">${ab.width} × ${ab.height}</span>`;

  // Revoke previous blob URL to prevent memory leak
  if (iframe.src && iframe.src.startsWith('blob:')) {
    URL.revokeObjectURL(iframe.src);
  }
  iframe.src = URL.createObjectURL(new Blob([generateHTML()], { type: 'text/html' }));
}

// ─── Helpers ────────────────────────────────────────────────────────

function resolveTemplate(html: string, props: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => props[k] || '');
}

function generateHTML(): string {
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab) return '<!-- No artboard -->';
  const sorted = [...ab.elements].sort((a, b) => a.order - b.order);
  let body = '';
  let customStyles = '';

  for (const el of sorted) {
    if (el.componentId === '__raw__') { body += el.props.html || ''; continue; }
    const def = COMPONENTS.find(c => c.id === el.componentId);
    if (def) {
      const elHtml = getElementHTMLWrapped(el, def).replace('<div ', `<div data-el-id="${el.id}" `);
      body += '  ' + elHtml + '\n\n';
      
      // Inject hover styles natively
      const pvHasHover = el.hoverStyle && Object.keys(el.hoverStyle).length > 0;
      const pvHasEffect = el.hoverEffect && el.hoverEffect !== 'none';
      if (pvHasHover || pvHasEffect) {
        customStyles += `\n    [data-el-id="${el.id}"] { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; }`;
      }
      if (pvHasHover) {
        const mergedHv = { ...(el.style || DEFAULT_ELEMENT_STYLE), ...(el.hoverStyle as ElementStyle) };
        customStyles += `\n    [data-el-id="${el.id}"]:hover { ${buildElementCSSString(mergedHv)} }`;
      }
      if (pvHasEffect) {
        if (el.hoverEffect === 'h-scale-up') customStyles += `\n    [data-el-id="${el.id}"]:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 24px rgba(0,0,0,0.2) !important; }`;
        if (el.hoverEffect === 'h-glass-tilt') customStyles += `\n    [data-el-id="${el.id}"] { perspective: 1000px; }\n    [data-el-id="${el.id}"]:hover { transform: rotateX(5deg) rotateY(-5deg) translateZ(10px); box-shadow: -10px 10px 20px rgba(0,0,0,0.15) !important; }`;
        if (el.hoverEffect === 'h-neon-glow') customStyles += `\n    [data-el-id="${el.id}"]:hover { box-shadow: 0 0 15px rgba(124,58,237,0.5), 0 0 45px rgba(124,58,237,0.2) !important; }`;
        if (el.hoverEffect === 'h-slide-up') customStyles += `\n    [data-el-id="${el.id}"]:hover { transform: translateY(-8px); }`;
        if (el.hoverEffect === 'h-blur-out') customStyles += `\n    [data-el-id="${el.id}"]:hover { filter: blur(4px); opacity: 0.7; }`;
      }
    }
  }
  // Use the artboard's actual background
  const layoutObj = buildArtboardLayoutStyleHTML(ab);

  // Detect if any carousel components exist — inject JS for prev/next
  const hasCarousel = sorted.some(el => el.componentId === 'carousel');
  const carouselJS = hasCarousel ? `
<script>
document.querySelectorAll('[data-el-id]').forEach(wrapper => {
  const track = wrapper.querySelector('[style*="display:flex"][style*="transition:transform"]') ||
                wrapper.querySelector('[style*="display: flex"]');
  if (!track || !track.children.length) return;
  const slides = track.children;
  let current = 0;
  const total = slides.length;
  const dots = wrapper.querySelectorAll('[style*="width:24px"][style*="height:4px"]');
  const btns = wrapper.querySelectorAll('button');
  const prevBtn = btns.length >= 2 ? btns[btns.length - 2] : null;
  const nextBtn = btns.length >= 2 ? btns[btns.length - 1] : null;
  function go(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach((d, i) => d.style.background = i === current ? '${sorted.find(e => e.componentId === 'carousel')?.props?.accent || '#7c3aed'}' : 'rgba(255,255,255,0.3)');
  }
  if (prevBtn) prevBtn.addEventListener('click', () => go(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(current + 1));
  dots.forEach((d, i) => d.style.cursor = 'pointer');
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  // Auto-advance every 5s
  setInterval(() => go(current + 1), 5000);
});
</script>` : '';

  return `<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${ab.name}</title>\n  <style>\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n    body { font-family:'Inter',system-ui,sans-serif; color:#cdd6f4; overflow-x: hidden; }\n    .wrapper { ${layoutObj} }${customStyles}\n  </style>\n  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />\n</head>\n<body>\n<div class="wrapper">\n${body}\n</div>${carouselJS}\n</body>\n</html>`;
}

function exportHTML(): void {
  const blob = new Blob([generateHTML()], { type: 'text/html' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `${(artboards.find(a2 => a2.id === activeArtboardId) || artboards[0])?.name || 'export'}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('📤 HTML exported');
}



// ─── Zoom to Selection ──────────────────────────────────────────────

function zoomToSelection(): void {
  const el = findSelectedElement();
  if (!el) { showToast('⚠️ Select an element first'); return; }
  const domEl = layerEl?.querySelector(`.ds-element[data-el-id="${el.id}"]`) as HTMLElement;
  if (!domEl) return;

  const viewport = layerEl?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (!viewport) return;

  const rect = domEl.getBoundingClientRect();
  const vpRect = viewport.getBoundingClientRect();

  // Calculate the center of the element in world space
  const elCenterX = (rect.left + rect.width / 2 - vpRect.left - panX) / zoom;
  const elCenterY = (rect.top + rect.height / 2 - vpRect.top - panY) / zoom;

  // Set zoom to show element nicely (2x normal)
  const targetZoom = Math.min(2, vpRect.width / (rect.width / zoom * 1.5));
  zoom = Math.max(0.2, Math.min(4, targetZoom));

  // Center element in viewport
  panX = vpRect.width / 2 - elCenterX * zoom;
  panY = vpRect.height / 2 - elCenterY * zoom;

  applyTransform();
  updateZoomDisplay();
  showToast('🔍 Zoomed to selection');
}

// ─── Group / Ungroup ────────────────────────────────────────────────

function groupSelected(): void {
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) return;
  const ids = new Set(Sel.getSelectedIds()); // copy to avoid mutating selection state
  if (ids.size === 0 && selectedElementId) ids.add(selectedElementId);
  if (ids.size < 2) { showToast('⚠️ Select 2+ elements to group'); return; }

  recordState();
  const children = ab.elements.filter(el => ids.has(el.id));
  const childIds = children.map(el => el.id);

  // Mark children as grouped
  children.forEach(el => { el.groupId = `group-${Date.now()}`; });

  // Create group wrapper element
  const group: CanvasElement = {
    id: `group-${Date.now()}`,
    componentId: '__group__',
    props: { children: JSON.stringify(childIds) },
    order: nextOrder++,
    style: { ...DEFAULT_ELEMENT_STYLE },
    actionType: 'none', navigateTo: '', actionUrl: '',
    visible: true, locked: false, name: `Group (${children.length})`,
    x: 0, y: 0, w: 0, h: 0,
  };

  // Hide children from normal rendering
  children.forEach(el => { el._grouped = true; });
  ab.elements.push(group);
  selectedElementId = group.id;
  Sel.clearSelection();
  Sel.selectOne(group.id);
  renderAll();
  showToast(`📦 Grouped ${children.length} elements`);
}

function ungroupSelected(): void {
  const ab = artboards.find(a => a.id === activeArtboardId);
  if (!ab) return;
  const el = findSelectedElement();
  if (!el || el.componentId !== '__group__') { showToast('⚠️ Select a group to ungroup'); return; }

  recordState();
  try {
    const childIds = JSON.parse(el.props.children || '[]') as string[];
    // Unhide children
    ab.elements.forEach(child => {
      if (childIds.includes(child.id)) {
        child._grouped = false;
        delete child.groupId;
      }
    });
    // Remove group
    ab.elements = ab.elements.filter(e => e.id !== el.id);
    selectedElementId = null;
    renderAll();
    showToast(`📦 Ungrouped ${childIds.length} elements`);
  } catch { /* ignore parsing errors */ }
}

// ─── Rulers ─────────────────────────────────────────────────────────

let showGrid = true;
let showRulers = true;
let rulerRafId = 0;


// ─── Version History ────────────────────────────────────────────────

interface VersionSnapshot {
  id: string;
  timestamp: number;
  label: string;
  data: string; // serialized artboards JSON
  elementCount: number;
}

let versions: VersionSnapshot[] = [];
const MAX_VERSIONS = 20;

function saveVersion(label: string = 'Auto-save', silent: boolean = false): void {
  const data = JSON.stringify(artboards);
  let totalEls = 0;
  artboards.forEach(ab => totalEls += ab.elements.length);
  const snap: VersionSnapshot = {
    id: `ver-${Date.now()}`,
    timestamp: Date.now(),
    label,
    data,
    elementCount: totalEls,
  };
  versions.push(snap);
  if (versions.length > MAX_VERSIONS) versions.shift();
  try { localStorage.setItem('lumina-ds-versions', JSON.stringify(versions)); } catch { /* ok */ }
  if (!silent) showToast(`💾 Version saved: ${label}`);
}

function loadVersions(): void {
  try {
    const raw = localStorage.getItem('lumina-ds-versions');
    if (raw) versions = JSON.parse(raw);
  } catch { /* ok */ }
}

function restoreVersion(verId: string): void {
  const ver = versions.find(v => v.id === verId);
  if (!ver) return;
  try {
    // Save current state to undo history before overwriting
    recordState();
    const data = JSON.parse(ver.data);
    artboards = data;
    // Ensure all elements have required fields (backward compat)
    for (const ab of artboards) {
      for (const el of ab.elements) {
        if (el.visible === undefined) el.visible = true;
        if (el.locked === undefined) el.locked = false;
        if (!el.name) el.name = 'Element';
        if (el.x === undefined) el.x = 0;
        if (el.y === undefined) el.y = 0;
        if (el.w === undefined) el.w = 0;
        if (el.h === undefined) el.h = 0;
      }
    }
    activeArtboardId = artboards[0]?.id || null;
    selectedElementId = null;
    Sel.clearSelection();
    renderAll();
    autoSave();
    showToast(`↩️ Restored: ${ver.label}`);
  } catch { /* ok */ }
}


// suppress unused warnings for functions used by toolbar buttons

function getRulerContext(): WSRulerContext {
  return {
    root: layerEl, zoom, panX, panY, showGrid, showRulers,
    setShowGrid: (v) => { showGrid = v; },
    setShowRulers: (v) => { showRulers = v; },
    showToast,
  };
}
function setupRulers(): void { void showRulers; }
function renderRulerTicks(): void { _renderRulerTicks(getRulerContext()); }
function toggleGrid(): void { _toggleGrid(getRulerContext()); }
function toggleRulers(): void { _toggleRulers(getRulerContext()); }

void toggleGrid; void toggleRulers;
function sendToAgent(): void {
  const html = generateHTML();
  const agentInput = document.getElementById('projecty-prompt-input') as HTMLTextAreaElement;
  if (agentInput) {
    agentInput.value = `Adapte este protótipo ao meu projeto:\n\n\`\`\`html\n${html}\n\`\`\``;
    agentInput.dispatchEvent(new Event('input', { bubbles: true }));
    close();
    document.getElementById('projecty-send-btn')?.click();
  }
}

// ─── Context Menu ───────────────────────────────────────────────────

function showContextMenu(x: number, y: number, abId: string, elId: string, locked: boolean): void {
  // Remove existing menu
  document.querySelector('.ds-context-menu')?.remove();

  const menu = document.createElement('div');
  menu.className = 'ds-context-menu';
  menu.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:40000;background:#1e1e2e;border:1px solid #313244;border-radius:8px;padding:4px 0;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.4);`;

  const items = [
    { label: '📋 Duplicate', shortcut: 'Ctrl+D', action: () => handleElementAction(abId, elId, 'dup') },
    { label: '✂️ Copy Style', shortcut: 'Ctrl+Alt+C', action: () => { const el = findSelectedElement(); if (el) Sel.copyStyle(el.style || {}); showToast('📋 Style copied'); } },
    { label: '📋 Paste Style', shortcut: 'Ctrl+Alt+V', action: () => { const cs = Sel.getCopiedStyle(); if (cs) { const el = findSelectedElement(); if (el) { el.style = { ...el.style, ...cs } as any; recordState(); renderAll(); } } } },
    { label: '---' },
    { label: locked ? '🔓 Unlock' : '🔒 Lock', shortcut: 'Ctrl+L', action: () => handleElementAction(abId, elId, 'toggle-lock') },
    { label: '👁️ Toggle Visibility', shortcut: 'Ctrl+H', action: () => handleElementAction(abId, elId, 'toggle-visibility') },
    { label: '---' },
    { label: '▲ Move Up', action: () => handleElementAction(abId, elId, 'up') },
    { label: '▼ Move Down', action: () => handleElementAction(abId, elId, 'down') },
    { label: '---' },
    { label: '🗑️ Delete', shortcut: 'Del', action: () => handleElementAction(abId, elId, 'delete') },
  ];

  for (const item of items) {
    if (item.label === '---') {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#313244;margin:4px 0;';
      menu.appendChild(sep);
      continue;
    }
    const btn = document.createElement('button');
    btn.style.cssText = 'display:flex;justify-content:space-between;align-items:center;width:100%;padding:6px 14px;background:none;border:none;color:#cdd6f4;font-size:12px;cursor:pointer;text-align:left;';
    btn.innerHTML = `<span>${item.label}</span>${item.shortcut ? `<span style="font-size:10px;color:#585b70;">${item.shortcut}</span>` : ''}`;
    btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(124,58,237,0.15)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
    btn.addEventListener('click', () => { menu.remove(); item.action?.(); });
    menu.appendChild(btn);
  }

  document.body.appendChild(menu);

  // Close on click outside
  const closeMenu = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) { menu.remove(); document.removeEventListener('click', closeMenu); }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 10);
}

// ─── Style Property Helper ──────────────────────────────────────────

// @ts-ignore — used in runtime callbacks for visual editors
function setStyleProp(key: string, value: any): void {
  const el = findSelectedElement();
  if (!el) return;
  (el.style as any)[key] = value;
}

// ─── Keyboard Shortcuts Modal ───────────────────────────────────────


// ─── Toast ──────────────────────────────────────────────────────────

function showToast(msg: string): void {
  const t = document.createElement('div');
  t.className = 'ds-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 2500);
}


function showVersionHistoryModal(): void {
  loadVersions();
  document.querySelector('.ds-version-modal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'ds-version-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:30000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);';

  const content = document.createElement('div');
  content.style.cssText = 'background:#1e1e2e;border:1px solid #313244;border-radius:16px;width:400px;max-height:70vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.5);';

  let html = `<div style="padding:16px 20px;border-bottom:1px solid #313244;display:flex;align-items:center;justify-content:space-between;">
    <div><h3 style="margin:0;font-size:16px;color:#cdd6f4;">📜 Version History</h3><p style="margin:2px 0 0;font-size:11px;color:#585b70;">${versions.length} versions saved</p></div>
    <div style="display:flex;gap:4px;">
      <button id="ds-ver-save" style="padding:4px 10px;border-radius:6px;border:1px solid #7c3aed;background:rgba(124,58,237,0.15);color:#7c3aed;font-size:10px;cursor:pointer;">💾 Save Now</button>
      <button id="ds-ver-close" style="background:none;border:none;color:#585b70;font-size:16px;cursor:pointer;">✕</button>
    </div>
  </div>`;
  html += '<div style="overflow-y:auto;padding:12px;">';

  if (versions.length === 0) {
    html += '<div style="text-align:center;padding:30px;color:#585b70;font-size:12px;">No versions yet.<br>Click "Save Now" to create one.</div>';
  } else {
    for (let i = versions.length - 1; i >= 0; i--) {
      const v = versions[i];
      const date = new Date(v.timestamp);
      const isLatest = i === versions.length - 1;
      html += `<div class="ds-ver-item" data-ver-id="${v.id}" style="padding:10px;border:1px solid ${isLatest ? '#7c3aed' : '#313244'};border-radius:8px;margin-bottom:6px;cursor:pointer;transition:all 0.15s;${isLatest ? 'background:rgba(124,58,237,0.05);' : ''}">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:12px;font-weight:600;color:#cdd6f4;">${isLatest ? '🟣 ' : ''}${v.label}</span>
          <span style="font-size:9px;color:#585b70;">${v.elementCount} elements</span>
        </div>
        <div style="font-size:10px;color:#585b70;margin-top:2px;">${date.toLocaleString()}</div>
      </div>`;
    }
  }
  html += '</div>';
  content.innerHTML = html;
  modal.appendChild(content);

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  content.querySelector('#ds-ver-close')?.addEventListener('click', () => modal.remove());
  content.querySelector('#ds-ver-save')?.addEventListener('click', () => {
    saveVersion('Manual save');
    modal.remove();
    showVersionHistoryModal(); // Reopen with new version
  });

  content.querySelectorAll('.ds-ver-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = (item as HTMLElement).dataset.verId;
      if (id && confirm('Restore this version? Current changes will be lost.')) {
        restoreVersion(id);
        modal.remove();
      }
    });
    item.addEventListener('mouseenter', () => { (item as HTMLElement).style.borderColor = '#7c3aed'; });
    item.addEventListener('mouseleave', () => {
      const isLt = (item as HTMLElement).dataset.verId === versions[versions.length - 1]?.id;
      (item as HTMLElement).style.borderColor = isLt ? '#7c3aed' : '#313244';
    });
  });
}

// ─── Shell HTML ─────────────────────────────────────────────────────


// ─── Public API ─────────────────────────────────────────────────────

export function getWebStudioHTML(): string {
  if (artboards.length === 0) return '';
  return generateHTML();
}

export function isWebStudioVisible(): boolean { return isVisible; }
