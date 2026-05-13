/**
 * Lumina IDE — Canvas Interaction (v2.0)
 * State machine for all pointer interactions.
 * States: idle → panning | dragging | resizing | connecting | editing
 */

import { CanvasEngine, generateId, type TextNode, type NodeSide } from './CanvasEngine';
import { CanvasRenderer } from './CanvasRenderer';
import { renderMarkdown } from './CanvasNodeElement';

export type InteractionState = 'idle' | 'panning' | 'dragging' | 'resizing' | 'connecting' | 'editing';

interface ConnectInfo {
  nodeId: string;
  side: NodeSide;
  startPos: { x: number; y: number };
}

export class CanvasInteraction {
  private engine: CanvasEngine;
  private renderer: CanvasRenderer;
  private viewport: HTMLElement;
  private world: HTMLElement;

  // State machine
  state: InteractionState = 'idle';

  // Transform state (managed externally, passed in)
  private getTransform: () => { tx: number; ty: number; scale: number };
  private setTransform: (tx: number, ty: number, scale: number) => void;

  // Selection
  readonly selectedNodes = new Set<string>();

  // Pointer tracking
  private pointerStartX = 0;
  private pointerStartY = 0;
  private panStartTx = 0;
  private panStartTy = 0;

  // Drag state
  private dragStartPositions = new Map<string, { x: number; y: number }>();

  // Resize state
  private resizeNodeId = '';
  private resizeCorner: 'nw' | 'ne' | 'sw' | 'se' = 'se';
  private resizeStartBounds = { x: 0, y: 0, w: 0, h: 0 };

  // Connect state
  private connectInfo: ConnectInfo | null = null;

  // Context menu
  private contextMenuEl: HTMLElement | null = null;
  private _isActive = false;

  // Callbacks
  onSelectionChange?: () => void;
  onTransformChange?: () => void;
  onUndoRedo?: () => void;

  constructor(
    engine: CanvasEngine,
    renderer: CanvasRenderer,
    viewport: HTMLElement,
    world: HTMLElement,
    getTransform: () => { tx: number; ty: number; scale: number },
    setTransform: (tx: number, ty: number, scale: number) => void,
  ) {
    this.engine = engine;
    this.renderer = renderer;
    this.viewport = viewport;
    this.world = world;
    this.getTransform = getTransform;
    this.setTransform = setTransform;
  }

  bind(): void {
    this._isActive = true;
    const vp = this.viewport;

    // ── Wheel Zoom ──
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { tx, ty, scale } = this.getTransform();
      const factor = Math.pow(0.999, e.deltaY);
      const newScale = Math.min(5, Math.max(0.1, scale * factor));
      const newTx = mx - (mx - tx) * (newScale / scale);
      const newTy = my - (my - ty) * (newScale / scale);
      this.setTransform(newTx, newTy, newScale);
      this.onTransformChange?.();
    }, { passive: false });

    // ── Pointer Down ──
    vp.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;

      // Resize handle?
      const resizeEl = target.closest('.canvas-node-resize') as HTMLElement;
      if (resizeEl) {
        e.preventDefault();
        this.startResize(resizeEl, e);
        vp.setPointerCapture(e.pointerId);
        return;
      }

      // Connection port?
      const portEl = target.closest('.canvas-node-port') as HTMLElement;
      if (portEl) {
        e.preventDefault();
        this.startConnect(portEl, e);
        vp.setPointerCapture(e.pointerId);
        return;
      }

      // Node?
      const nodeEl = target.closest('.canvas-node') as HTMLElement;
      if (nodeEl) {
        e.preventDefault();
        const nodeId = nodeEl.dataset.nodeId || '';

        // Selection logic
        if (!e.ctrlKey && !this.selectedNodes.has(nodeId)) {
          this.clearSelection();
        }
        this.selectedNodes.add(nodeId);
        this.renderer.setSelection(this.selectedNodes);
        this.onSelectionChange?.();

        // Start drag
        this.state = 'dragging';
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;
        this.dragStartPositions.clear();
        for (const id of this.selectedNodes) {
          const n = this.engine.getNode(id);
          if (n) this.dragStartPositions.set(id, { x: n.x, y: n.y });
        }
        vp.setPointerCapture(e.pointerId);
        return;
      }

      // Background → pan
      const isBg = target === vp || target === this.world || target.tagName === 'svg';
      if (isBg) {
        if (!e.ctrlKey) {
          this.clearSelection();
          this.onSelectionChange?.();
        }

        this.state = 'panning';
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;
        const { tx, ty } = this.getTransform();
        this.panStartTx = tx;
        this.panStartTy = ty;
        vp.classList.add('is-panning');
        vp.setPointerCapture(e.pointerId);
      }
    });

    // ── Pointer Move ──
    vp.addEventListener('pointermove', (e) => {
      const { scale } = this.getTransform();

      if (this.state === 'panning') {
        const newTx = this.panStartTx + (e.clientX - this.pointerStartX);
        const newTy = this.panStartTy + (e.clientY - this.pointerStartY);
        this.setTransform(newTx, newTy, scale);
        this.onTransformChange?.();
        return;
      }

      if (this.state === 'dragging') {
        const dx = (e.clientX - this.pointerStartX) / scale;
        const dy = (e.clientY - this.pointerStartY) / scale;

        for (const [id, start] of this.dragStartPositions) {
          const node = this.engine.getNode(id);
          if (node) {
            node.x = Math.round(start.x + dx);
            node.y = Math.round(start.y + dy);
            this.renderer.updateNodePosition(id);
          }
        }
        // Update edges for all dragged nodes
        for (const id of this.dragStartPositions.keys()) {
          this.renderer.updateEdgesForNode(id);
        }
        return;
      }

      if (this.state === 'resizing') {
        this.doResize(e);
        return;
      }

      if (this.state === 'connecting' && this.connectInfo) {
        const wp = this.screenToWorld(e.clientX, e.clientY);
        this.renderer.updateTempEdge(this.connectInfo.startPos, wp);

        // Highlight nearest port
        this.highlightNearestPort(e.clientX, e.clientY);
        return;
      }
    });

    // ── Pointer Up ──
    vp.addEventListener('pointerup', (e) => {
      if (this.state === 'dragging' || this.state === 'resizing') {
        this.engine.notifyChange();
      }

      if (this.state === 'panning') {
        vp.classList.remove('is-panning');
      }

      if (this.state === 'connecting') {
        this.finishConnect(e);
      }

      this.state = 'idle';
      vp.releasePointerCapture(e.pointerId);
    });

    // ── Double Click (inline edit) ──
    vp.addEventListener('dblclick', (e) => {
      if (this.engine.mode !== 'edit') return;
      const target = e.target as HTMLElement;
      const nodeEl = target.closest('.canvas-node') as HTMLElement;
      if (!nodeEl) return;

      const id = nodeEl.dataset.nodeId || '';
      const node = this.engine.getNode(id);
      if (node && node.type === 'text') {
        this.startInlineEdit(id, node as TextNode);
      }
    });

    // ── Keyboard ──
    document.addEventListener('keydown', (e) => {
      if (!this.isActive()) return;
      if (this.engine.mode !== 'edit') return;
      if (this.state === 'editing') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        this.deleteSelected();
      }
      if (e.key === 'Escape') {
        this.closeContextMenu();
        this.clearSelection();
        this.onSelectionChange?.();
      }
      // Select All
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        for (const n of this.engine.data.nodes || []) {
          this.selectedNodes.add(n.id);
        }
        this.renderer.setSelection(this.selectedNodes);
        this.onSelectionChange?.();
      }
      // Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (this.engine.undo()) {
          this.clearSelection();
          this.onUndoRedo?.();
        }
      }
      // Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
        e.preventDefault();
        if (this.engine.redo()) {
          this.clearSelection();
          this.onUndoRedo?.();
        }
      }
    });

    // ── Context Menu (right-click) ──
    vp.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.engine.mode !== 'edit') return;

      const target = e.target as HTMLElement;
      const nodeEl = target.closest('.canvas-node') as HTMLElement;
      const nodeId = nodeEl?.dataset.nodeId || '';

      // Select the node if right-clicking on one
      if (nodeId && !this.selectedNodes.has(nodeId)) {
        this.clearSelection();
        this.selectedNodes.add(nodeId);
        this.renderer.setSelection(this.selectedNodes);
        this.onSelectionChange?.();
      }

      this.showContextMenu(e.clientX, e.clientY, nodeId);
    });

    // Close context menu on any click
    document.addEventListener('click', () => this.closeContextMenu());
  }

  // ─── Resize ─────────────────────────────────────────────────────────

  private startResize(handleEl: HTMLElement, e: PointerEvent): void {
    this.state = 'resizing';
    this.resizeNodeId = handleEl.dataset.nodeId || '';
    this.resizeCorner = (handleEl.dataset.corner || 'se') as 'nw' | 'ne' | 'sw' | 'se';
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;

    const node = this.engine.getNode(this.resizeNodeId);
    if (node) {
      this.resizeStartBounds = { x: node.x, y: node.y, w: node.width, h: node.height };
    }
  }

  private doResize(e: PointerEvent): void {
    const node = this.engine.getNode(this.resizeNodeId);
    if (!node) return;
    const { scale } = this.getTransform();
    const dx = (e.clientX - this.pointerStartX) / scale;
    const dy = (e.clientY - this.pointerStartY) / scale;
    const b = this.resizeStartBounds;
    const MIN_W = 80, MIN_H = 60;

    switch (this.resizeCorner) {
      case 'se':
        node.width = Math.max(MIN_W, Math.round(b.w + dx));
        node.height = Math.max(MIN_H, Math.round(b.h + dy));
        break;
      case 'sw':
        node.x = Math.round(b.x + dx);
        node.width = Math.max(MIN_W, Math.round(b.w - dx));
        node.height = Math.max(MIN_H, Math.round(b.h + dy));
        break;
      case 'ne':
        node.width = Math.max(MIN_W, Math.round(b.w + dx));
        node.y = Math.round(b.y + dy);
        node.height = Math.max(MIN_H, Math.round(b.h - dy));
        break;
      case 'nw':
        node.x = Math.round(b.x + dx);
        node.y = Math.round(b.y + dy);
        node.width = Math.max(MIN_W, Math.round(b.w - dx));
        node.height = Math.max(MIN_H, Math.round(b.h - dy));
        break;
    }

    this.renderer.updateNodePosition(this.resizeNodeId);
    this.renderer.updateEdgesForNode(this.resizeNodeId);
  }

  // ─── Connect (drag from port) ───────────────────────────────────────

  private startConnect(portEl: HTMLElement, _e: PointerEvent): void {
    this.state = 'connecting';
    const nodeId = portEl.dataset.nodeId || '';
    const side = (portEl.dataset.side || 'right') as NodeSide;
    const node = this.engine.getNode(nodeId);
    if (!node) return;

    const startPos = this.renderer.portPos(node, side);
    this.connectInfo = { nodeId, side, startPos };
    this.renderer.createTempEdge(startPos);
    this.viewport.classList.add('is-connecting');
  }

  private finishConnect(e: PointerEvent): void {
    if (!this.connectInfo) return;
    this.renderer.removeTempEdge();
    this.viewport.classList.remove('is-connecting');
    this.clearPortHighlights();

    // Find port under cursor
    const target = this.findPortUnderCursor(e.clientX, e.clientY);
    if (target && target.nodeId !== this.connectInfo.nodeId) {
      this.engine.addEdge({
        id: generateId(),
        fromNode: this.connectInfo.nodeId,
        fromSide: this.connectInfo.side,
        toNode: target.nodeId,
        toSide: target.side,
        toEnd: 'arrow',
      });
    }

    this.connectInfo = null;
  }

  private findPortUnderCursor(cx: number, cy: number): { nodeId: string; side: NodeSide } | null {
    const wp = this.screenToWorld(cx, cy);
    const SNAP = 20;

    for (const node of this.engine.data.nodes || []) {
      for (const side of ['top', 'right', 'bottom', 'left'] as NodeSide[]) {
        const pp = this.renderer.portPos(node, side);
        const dx = wp.x - pp.x;
        const dy = wp.y - pp.y;
        if (Math.sqrt(dx * dx + dy * dy) < SNAP) {
          return { nodeId: node.id, side };
        }
      }
    }
    return null;
  }

  private highlightNearestPort(cx: number, cy: number): void {
    this.clearPortHighlights();
    const target = this.findPortUnderCursor(cx, cy);
    if (target && this.connectInfo && target.nodeId !== this.connectInfo.nodeId) {
      const el = this.renderer.getElement(target.nodeId);
      const port = el?.querySelector(`.canvas-node-port[data-side="${target.side}"]`);
      port?.classList.add('is-target');
    }
  }

  private clearPortHighlights(): void {
    this.world.querySelectorAll('.canvas-node-port.is-target').forEach(el => el.classList.remove('is-target'));
  }

  // ─── Inline Editing ─────────────────────────────────────────────────

  private startInlineEdit(nodeId: string, node: TextNode): void {
    const el = this.renderer.getElement(nodeId);
    const content = el?.querySelector('.canvas-node-content');
    if (!content) return;

    this.state = 'editing';

    const textarea = document.createElement('textarea');
    textarea.className = 'canvas-inline-editor';
    textarea.value = node.text;
    content.innerHTML = '';
    content.appendChild(textarea);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    const save = () => {
      if (this.state !== 'editing') return;
      node.text = textarea.value;
      this.engine.notifyChange();

      // Re-render markdown
      const md = document.createElement('div');
      md.className = 'markdown-body';
      md.innerHTML = renderMarkdown(node.text);
      content.innerHTML = '';
      content.appendChild(md);
      (content as HTMLElement).dataset.text = node.text;

      this.state = 'idle';
    };

    textarea.addEventListener('blur', save);
    textarea.addEventListener('keydown', (ke) => {
      if (ke.key === 'Escape') {
        ke.stopPropagation();
        save();
      }
    });
  }

  // ─── Selection Helpers ──────────────────────────────────────────────

  clearSelection(): void {
    this.selectedNodes.clear();
    this.renderer.setSelection(this.selectedNodes);
  }

  deleteSelected(): void {
    if (!this.selectedNodes.size) return;
    for (const id of this.selectedNodes) {
      this.engine.removeNode(id);
    }
    this.clearSelection();
    this.onSelectionChange?.();
  }

  // ─── Coordinate Conversion ──────────────────────────────────────────

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.viewport.getBoundingClientRect();
    const { tx, ty, scale } = this.getTransform();
    return {
      x: (sx - rect.left - tx) / scale,
      y: (sy - rect.top - ty) / scale,
    };
  }

  isActive(): boolean { return this._isActive; }
  deactivate(): void { this._isActive = false; this.closeContextMenu(); }

  // ─── Context Menu ───────────────────────────────────────────────────

  private showContextMenu(x: number, y: number, nodeId: string): void {
    this.closeContextMenu();
    const menu = document.createElement('div');
    menu.className = 'canvas-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.zIndex = '10001';

    const items: Array<{ icon: string; label: string; shortcut?: string; action: () => void; danger?: boolean }> = [];

    if (nodeId) {
      const node = this.engine.getNode(nodeId);
      if (node?.type === 'text') {
        items.push({ icon: '✏️', label: 'Editar texto', action: () => {
          this.startInlineEdit(nodeId, node as TextNode);
        }});
      }
      items.push({ icon: '🎨', label: 'Alterar cor', action: () => {
        // Cycle through colors 1-6
        const current = node?.color || '0';
        const next = String((parseInt(current) % 6) + 1);
        this.engine.updateNode(nodeId, { color: next });
        this.renderer.updateNodeFull(nodeId);
      }});
      items.push({ icon: '📋', label: 'Duplicar', action: () => {
        if (!node) return;
        const clone = JSON.parse(JSON.stringify(node));
        clone.id = generateId();
        clone.x += 30;
        clone.y += 30;
        this.engine.addNode(clone);
        this.onUndoRedo?.();
      }});
      items.push({ icon: '🗑️', label: 'Deletar', shortcut: 'Del', action: () => {
        this.deleteSelected();
      }, danger: true });
    } else {
      items.push({ icon: '📝', label: 'Novo nó de texto', action: () => {
        const wp = this.screenToWorld(x, y);
        this.engine.addNode({
          id: generateId(), type: 'text',
          x: Math.round(wp.x), y: Math.round(wp.y),
          width: 240, height: 120,
          text: '# Novo nó\n\nClique duplo para editar.',
        } as TextNode);
        this.onUndoRedo?.();
      }});
      items.push({ icon: '📦', label: 'Novo grupo', action: () => {
        const wp = this.screenToWorld(x, y);
        this.engine.addNode({
          id: generateId(), type: 'group',
          x: Math.round(wp.x), y: Math.round(wp.y),
          width: 400, height: 300, label: 'Grupo',
        } as any);
        this.onUndoRedo?.();
      }});
    }

    // Separator + Undo/Redo always
    if (items.length > 0) {
      const sep = document.createElement('div');
      sep.className = 'canvas-ctx-sep';
      menu.appendChild(sep);
    }

    items.push({ icon: '↩️', label: 'Desfazer', shortcut: 'Ctrl+Z', action: () => {
      if (this.engine.undo()) { this.clearSelection(); this.onUndoRedo?.(); }
    }});
    items.push({ icon: '↪️', label: 'Refazer', shortcut: 'Ctrl+Y', action: () => {
      if (this.engine.redo()) { this.clearSelection(); this.onUndoRedo?.(); }
    }});

    // Build DOM
    menu.innerHTML = ''; // clear separator added above, rebuild properly
    let addedSep = false;
    for (const item of items) {
      if ((item.icon === '↩️') && !addedSep) {
        const sep = document.createElement('div');
        sep.className = 'canvas-ctx-sep';
        menu.appendChild(sep);
        addedSep = true;
      }
      const btn = document.createElement('button');
      btn.className = 'canvas-ctx-item';
      if (item.danger) btn.style.color = 'var(--accent-red)';
      btn.innerHTML = `
        <span class="canvas-ctx-icon">${item.icon}</span>
        <span>${item.label}</span>
        ${item.shortcut ? `<span class="canvas-ctx-shortcut">${item.shortcut}</span>` : ''}
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeContextMenu();
        item.action();
      });
      menu.appendChild(btn);
    }

    // Prevent off-screen
    document.body.appendChild(menu);
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 8}px`;

    this.contextMenuEl = menu;
  }

  closeContextMenu(): void {
    this.contextMenuEl?.remove();
    this.contextMenuEl = null;
  }
}
