/**
 * Lumina IDE — Canvas Renderer (v2.0)
 * Viewport culling + dirty rendering.
 * Only visible nodes exist in the DOM.
 */

import { CanvasEngine, type CanvasNode, type CanvasEdge, type NodeSide, resolveColor } from './CanvasEngine';
import { createNodeElement, applyNodePosition, updateNodeContent, setNodeSelected } from './CanvasNodeElement';

export class CanvasRenderer {
  private engine: CanvasEngine;
  private world: HTMLElement;
  private edgesSvg: SVGSVGElement;

  // DOM state
  private nodeElements = new Map<string, HTMLElement>();
  private visibleNodes = new Set<string>();
  private edgePaths = new Map<string, SVGPathElement>();

  constructor(engine: CanvasEngine, world: HTMLElement, edgesSvg: SVGSVGElement) {
    this.engine = engine;
    this.world = world;
    this.edgesSvg = edgesSvg;
  }

  // ─── Viewport Culling ───────────────────────────────────────────────

  /**
   * Recalculates which nodes are visible and mounts/unmounts as needed.
   * Call on every pan/zoom/resize.
   */
  updateVisibility(viewportRect: DOMRect, tx: number, ty: number, scale: number): void {
    const MARGIN = 200; // Extra pixels outside viewport to pre-render
    const viewLeft   = (-tx - MARGIN) / scale;
    const viewTop    = (-ty - MARGIN) / scale;
    const viewRight  = (-tx + viewportRect.width + MARGIN) / scale;
    const viewBottom = (-ty + viewportRect.height + MARGIN) / scale;

    const newVisible = new Set<string>();

    for (const node of this.engine.data.nodes || []) {
      const inView =
        node.x + node.width  > viewLeft  &&
        node.x               < viewRight &&
        node.y + node.height > viewTop   &&
        node.y               < viewBottom;

      if (inView) {
        newVisible.add(node.id);
        if (!this.visibleNodes.has(node.id)) {
          this.mountNode(node);
        }
      } else if (this.visibleNodes.has(node.id)) {
        this.unmountNode(node.id);
      }
    }

    // Remove nodes that were deleted from data
    for (const id of this.visibleNodes) {
      if (!newVisible.has(id) && !this.engine.getNode(id)) {
        this.unmountNode(id);
      }
    }

    this.visibleNodes = newVisible;
    this.renderVisibleEdges();
  }

  /**
   * Full re-sync: remount everything visible. Used after loadJSON.
   */
  fullSync(viewportRect: DOMRect, tx: number, ty: number, scale: number): void {
    // Clear all mounted nodes
    for (const el of this.nodeElements.values()) {
      el.remove();
    }
    this.nodeElements.clear();
    this.visibleNodes.clear();
    this.clearEdges();

    // Re-evaluate visibility
    this.updateVisibility(viewportRect, tx, ty, scale);
  }

  // ─── Mount / Unmount ────────────────────────────────────────────────

  private mountNode(node: CanvasNode): void {
    if (this.nodeElements.has(node.id)) return;

    const el = createNodeElement(node);
    this.world.appendChild(el);
    this.nodeElements.set(node.id, el);
  }

  private unmountNode(id: string): void {
    const el = this.nodeElements.get(id);
    if (el) {
      el.remove();
      this.nodeElements.delete(id);
    }
    this.visibleNodes.delete(id);
  }

  // ─── Dirty Rendering (update single node) ───────────────────────────

  /** Updates position only — fast path for dragging */
  updateNodePosition(nodeId: string): void {
    const el = this.nodeElements.get(nodeId);
    const node = this.engine.getNode(nodeId);
    if (!el || !node) return;
    applyNodePosition(el, node);
  }

  /** Updates content + style — for edits */
  updateNodeFull(nodeId: string): void {
    const el = this.nodeElements.get(nodeId);
    const node = this.engine.getNode(nodeId);
    if (!el || !node) return;
    applyNodePosition(el, node);
    updateNodeContent(el, node);
  }

  /** Updates only the edges connected to a specific node */
  updateEdgesForNode(nodeId: string): void {
    for (const edge of this.engine.data.edges || []) {
      if (edge.fromNode === nodeId || edge.toNode === nodeId) {
        this.renderEdge(edge);
      }
    }
  }

  // ─── Selection ──────────────────────────────────────────────────────

  setSelection(selectedIds: Set<string>): void {
    for (const [id, el] of this.nodeElements) {
      setNodeSelected(el, selectedIds.has(id));
    }
  }

  // ─── Edge Rendering ─────────────────────────────────────────────────

  private renderVisibleEdges(): void {
    this.clearEdges();
    for (const edge of this.engine.data.edges || []) {
      // Only render if at least one endpoint is visible
      if (this.visibleNodes.has(edge.fromNode) || this.visibleNodes.has(edge.toNode)) {
        this.renderEdge(edge);
      }
    }
  }

  private renderEdge(edge: CanvasEdge): void {
    // Remove old path if exists
    this.edgePaths.get(edge.id)?.remove();

    const from = this.engine.getNode(edge.fromNode);
    const to = this.engine.getNode(edge.toNode);
    if (!from || !to) return;

    const fs = edge.fromSide || this.autoSide(from, to);
    const ts = edge.toSide || this.autoSide(to, from);
    const sp = this.portPos(from, fs);
    const ep = this.portPos(to, ts);

    // Bezier control points
    const dist = Math.max(
      Math.abs(ep.x - sp.x) * 0.5,
      Math.abs(ep.y - sp.y) * 0.5,
      50
    );
    const c1 = this.offsetPoint(sp, fs, dist);
    const c2 = this.offsetPoint(ep, ts, dist);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('canvas-edge-path');
    path.dataset.edgeId = edge.id;
    path.setAttribute('d', `M ${sp.x} ${sp.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${ep.x} ${ep.y}`);
    path.setAttribute('stroke', resolveColor(edge.color) || 'rgba(166,173,200,0.4)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    if (edge.toEnd !== 'none') {
      path.setAttribute('marker-end', 'url(#canvas-arrow)');
    }
    this.edgesSvg.appendChild(path);
    this.edgePaths.set(edge.id, path);

    // Edge label
    if (edge.label) {
      const mx = (sp.x + ep.x) / 2;
      const my = (sp.y + ep.y) / 2;

      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bg.classList.add('canvas-edge-label-bg');
      bg.dataset.edgeId = edge.id;

      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.classList.add('canvas-edge-label');
      lbl.dataset.edgeId = edge.id;
      lbl.setAttribute('x', String(mx));
      lbl.setAttribute('y', String(my));
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('dominant-baseline', 'central');
      lbl.textContent = edge.label;

      this.edgesSvg.appendChild(bg);
      this.edgesSvg.appendChild(lbl);

      requestAnimationFrame(() => {
        const bb = lbl.getBBox();
        bg.setAttribute('x', String(bb.x - 4));
        bg.setAttribute('y', String(bb.y - 2));
        bg.setAttribute('width', String(bb.width + 8));
        bg.setAttribute('height', String(bb.height + 4));
        bg.setAttribute('rx', '4');
        bg.setAttribute('fill', 'var(--canvas-bg, #1e1e2e)');
      });
    }
  }

  private clearEdges(): void {
    this.edgesSvg.querySelectorAll('.canvas-edge-path, .canvas-edge-label, .canvas-edge-label-bg').forEach(el => el.remove());
    this.edgePaths.clear();
  }

  // ─── Temp Edge (for drag-to-connect) ────────────────────────────────

  private tempEdgePath: SVGPathElement | null = null;

  createTempEdge(start: { x: number; y: number }): void {
    this.removeTempEdge();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('canvas-edge-temp');
    path.setAttribute('d', `M ${start.x} ${start.y} L ${start.x} ${start.y}`);
    path.setAttribute('stroke', 'var(--accent, #7c3aed)');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '8 4');
    path.setAttribute('fill', 'none');
    path.style.opacity = '0.6';
    this.edgesSvg.appendChild(path);
    this.tempEdgePath = path;
  }

  updateTempEdge(start: { x: number; y: number }, end: { x: number; y: number }): void {
    if (!this.tempEdgePath) return;
    const dx = Math.abs(end.x - start.x) * 0.4;
    const dy = Math.abs(end.y - start.y) * 0.4;
    const clen = Math.max(dx, dy, 40);
    this.tempEdgePath.setAttribute('d',
      `M ${start.x} ${start.y} C ${start.x + clen} ${start.y}, ${end.x - clen} ${end.y}, ${end.x} ${end.y}`
    );
  }

  removeTempEdge(): void {
    this.tempEdgePath?.remove();
    this.tempEdgePath = null;
  }

  // ─── Geometry Helpers ───────────────────────────────────────────────

  private autoSide(a: CanvasNode, b: CanvasNode): NodeSide {
    const acx = a.x + a.width / 2, acy = a.y + a.height / 2;
    const bcx = b.x + b.width / 2, bcy = b.y + b.height / 2;
    const dx = bcx - acx, dy = bcy - acy;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'bottom' : 'top';
  }

  portPos(n: CanvasNode, side: NodeSide): { x: number; y: number } {
    switch (side) {
      case 'top':    return { x: n.x + n.width / 2, y: n.y };
      case 'bottom': return { x: n.x + n.width / 2, y: n.y + n.height };
      case 'left':   return { x: n.x, y: n.y + n.height / 2 };
      case 'right':  return { x: n.x + n.width, y: n.y + n.height / 2 };
    }
  }

  private offsetPoint(p: { x: number; y: number }, side: NodeSide, len: number) {
    switch (side) {
      case 'top':    return { x: p.x, y: p.y - len };
      case 'bottom': return { x: p.x, y: p.y + len };
      case 'left':   return { x: p.x - len, y: p.y };
      case 'right':  return { x: p.x + len, y: p.y };
    }
  }

  // ─── Accessors ──────────────────────────────────────────────────────

  getElement(nodeId: string): HTMLElement | undefined {
    return this.nodeElements.get(nodeId);
  }

  getVisibleCount(): number {
    return this.visibleNodes.size;
  }

  getTotalCount(): number {
    return (this.engine.data.nodes || []).length;
  }

  destroy(): void {
    for (const el of this.nodeElements.values()) el.remove();
    this.nodeElements.clear();
    this.visibleNodes.clear();
    this.clearEdges();
  }
}
