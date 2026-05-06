/**
 * Lumina IDE — Canvas Engine (Data Model Only)
 * Pure data — zero DOM, zero events.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type NodeSide = 'top' | 'right' | 'bottom' | 'left';
export type EndShape = 'none' | 'arrow';
export type CanvasColor = string;
export type BackgroundStyle = 'cover' | 'ratio' | 'repeat';
export type CanvasMode = 'source' | 'edit' | 'view';

export interface CanvasNodeBase {
  id: string; type: 'text' | 'file' | 'link' | 'group';
  x: number; y: number; width: number; height: number;
  color?: CanvasColor;
}
export interface TextNode extends CanvasNodeBase { type: 'text'; text: string; }
export interface FileNode extends CanvasNodeBase { type: 'file'; file: string; subpath?: string; }
export interface LinkNode extends CanvasNodeBase { type: 'link'; url: string; }
export interface GroupNode extends CanvasNodeBase { type: 'group'; label?: string; background?: string; backgroundStyle?: BackgroundStyle; }
export type CanvasNode = TextNode | FileNode | LinkNode | GroupNode;

export interface CanvasEdge {
  id: string; fromNode: string; fromSide?: NodeSide; fromEnd?: EndShape;
  toNode: string; toSide?: NodeSide; toEnd?: EndShape;
  color?: CanvasColor; label?: string;
}

export interface CanvasData { nodes?: CanvasNode[]; edges?: CanvasEdge[]; }

// ─── Color Presets ───────────────────────────────────────────────────

export const COLOR_PRESETS: Record<string, string> = {
  '1': '#fb4934', '2': '#fe8019', '3': '#fabd2f',
  '4': '#b8bb26', '5': '#83a598', '6': '#d3869b',
};

export function resolveColor(c?: CanvasColor): string | undefined {
  if (!c) return undefined;
  return c.startsWith('#') ? c : COLOR_PRESETS[c];
}

export function generateId(): string {
  return crypto.randomUUID?.() ??
    'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

// ─── Engine (pure data) ──────────────────────────────────────────────

export class CanvasEngine {
  public data: CanvasData = { nodes: [], edges: [] };
  public mode: CanvasMode = 'edit';
  public onDataChange?: () => void;

  // ─── Undo / Redo History ──────────────────────────────────────────
  private history: string[] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;
  private skipSnapshot = false;

  loadJSON(json: string): boolean {
    try {
      const p = JSON.parse(json) as CanvasData;
      this.data = { nodes: Array.isArray(p.nodes) ? p.nodes : [], edges: Array.isArray(p.edges) ? p.edges : [] };
      // Reset history on load
      this.history = [JSON.stringify(this.data)];
      this.historyIndex = 0;
      return true;
    } catch { this.data = { nodes: [], edges: [] }; return false; }
  }

  toJSON(): string { return JSON.stringify(this.data, null, 2); }

  notifyChange(): void {
    if (!this.skipSnapshot) this.pushSnapshot();
    this.onDataChange?.();
  }

  private pushSnapshot(): void {
    const snap = JSON.stringify(this.data);
    // Don't push duplicate
    if (this.history[this.historyIndex] === snap) return;
    // Truncate forward history
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    if (this.history.length > this.MAX_HISTORY) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo(): boolean {
    if (this.historyIndex <= 0) return false;
    this.historyIndex--;
    this.restoreSnapshot();
    return true;
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    this.historyIndex++;
    this.restoreSnapshot();
    return true;
  }

  private restoreSnapshot(): void {
    const snap = this.history[this.historyIndex];
    if (!snap) return;
    try {
      const p = JSON.parse(snap) as CanvasData;
      this.data = { nodes: Array.isArray(p.nodes) ? p.nodes : [], edges: Array.isArray(p.edges) ? p.edges : [] };
      this.skipSnapshot = true;
      this.onDataChange?.();
      this.skipSnapshot = false;
    } catch { /* ignore */ }
  }

  canUndo(): boolean { return this.historyIndex > 0; }
  canRedo(): boolean { return this.historyIndex < this.history.length - 1; }

  addNode(n: CanvasNode) { (this.data.nodes ??= []).push(n); this.notifyChange(); }
  removeNode(id: string) {
    this.data.nodes = (this.data.nodes || []).filter(n => n.id !== id);
    this.data.edges = (this.data.edges || []).filter(e => e.fromNode !== id && e.toNode !== id);
    this.notifyChange();
  }
  updateNode(id: string, u: Partial<CanvasNode>) {
    const n = this.getNode(id);
    if (n) { Object.assign(n, u); this.notifyChange(); }
  }
  getNode(id: string) { return (this.data.nodes || []).find(n => n.id === id); }

  addEdge(e: CanvasEdge) { (this.data.edges ??= []).push(e); this.notifyChange(); }
  removeEdge(id: string) { this.data.edges = (this.data.edges || []).filter(e => e.id !== id); this.notifyChange(); }

  getBounds() {
    const nodes = this.data.nodes || [];
    if (!nodes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height);
    }
    return { minX, minY, maxX, maxY };
  }
}
