/**
 * Lumina IDE — JSON Canvas ↔ React Flow Adapter
 * Converts between Obsidian's JSON Canvas spec and React Flow data format.
 * Pure functions — no React, no DOM.
 */

import { MarkerType, type Node, type Edge } from '@xyflow/react';

// ─── JSON Canvas Types (Obsidian Spec 1.0) ──────────────────────────

export type NodeSide = 'top' | 'right' | 'bottom' | 'left';

export interface CanvasNodeBase {
  id: string;
  type: 'text' | 'file' | 'link' | 'group';
  x: number; y: number;
  width: number; height: number;
  color?: string;
}
export interface CanvasTextNode extends CanvasNodeBase { type: 'text'; text: string; }
export interface CanvasFileNode extends CanvasNodeBase { type: 'file'; file: string; subpath?: string; }
export interface CanvasLinkNode extends CanvasNodeBase { type: 'link'; url: string; }
export interface CanvasGroupNode extends CanvasNodeBase { type: 'group'; label?: string; background?: string; }
export type CanvasNode = CanvasTextNode | CanvasFileNode | CanvasLinkNode | CanvasGroupNode;

export interface CanvasEdge {
  id: string;
  fromNode: string; fromSide?: NodeSide;
  toNode: string; toSide?: NodeSide;
  fromEnd?: string; toEnd?: string;
  color?: string; label?: string;
}

export interface CanvasData {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}

// ─── Color Presets (Obsidian) ────────────────────────────────────────

export const COLOR_MAP: Record<string, string> = {
  '1': '#fb4934',
  '2': '#fe8019',
  '3': '#fabd2f',
  '4': '#b8bb26',
  '5': '#83a598',
  '6': '#d3869b',
};

function resolveColor(c?: string): string | undefined {
  if (!c) return undefined;
  return c.startsWith('#') ? c : COLOR_MAP[c];
}

// ─── Side → Handle mapping ──────────────────────────────────────────

function sideToHandle(side?: NodeSide): string | undefined {
  return side; // React Flow handles are named 'top', 'right', 'bottom', 'left'
}

function handleToSide(handle?: string | null): NodeSide | undefined {
  if (!handle) return undefined;
  if (['top', 'right', 'bottom', 'left'].includes(handle)) return handle as NodeSide;
  return undefined;
}

// ─── JSON Canvas → React Flow ────────────────────────────────────────

export function canvasToFlow(data: CanvasData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Process groups first so they get lower z-index
  const sortedNodes = [...(data.nodes || [])].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return 0;
  });

  for (const n of sortedNodes) {
    const color = resolveColor(n.color);
    const isGroup = n.type === 'group';
    const isTextOrFile = n.type === 'text' || n.type === 'file';

    const flowNode: Node = {
      id: n.id,
      type: `canvas-${n.type}`,
      position: { x: n.x, y: n.y },
      data: { ...n, accentColor: color },
      // Groups sit behind children and use a custom drag handle
      ...(isGroup ? { zIndex: -1, dragHandle: '.custom-drag-handle' } : {}),
      style: {
        width: n.width,
        ...(isTextOrFile ? { minHeight: 30 } : { height: n.height }),
      },
    };

    nodes.push(flowNode);
  }

  for (const e of data.edges || []) {
    const edgeColor = resolveColor(e.color) || '#6c7086';
    // Default: show arrow unless explicitly set to 'none'
    const showArrow = e.toEnd !== 'none';
    const flowEdge: Edge = {
      id: e.id,
      source: e.fromNode,
      target: e.toNode,
      sourceHandle: sideToHandle(e.fromSide),
      targetHandle: sideToHandle(e.toSide),
      label: e.label,
      style: { stroke: edgeColor, strokeWidth: 3 },
      markerEnd: showArrow ? {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 20,
        height: 20,
      } : undefined,
      type: 'default',
    };
    edges.push(flowEdge);
  }

  return { nodes, edges };
}

// ─── React Flow → JSON Canvas ────────────────────────────────────────

export function flowToCanvas(nodes: Node[], edges: Edge[]): CanvasData {
  const canvasNodes: CanvasNode[] = [];
  const canvasEdges: CanvasEdge[] = [];
  for (const n of nodes) {
    const d = n.data as Record<string, unknown>;
    const w = (n.measured?.width ?? n.style?.width ?? 240) as number;
    const h = (n.measured?.height ?? n.style?.height ?? 120) as number;

    const base = {
      id: n.id,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      width: Math.round(w),
      height: Math.round(h),
      color: (d.color as string) || undefined,
    };

    switch (n.type) {
      case 'canvas-text':
        canvasNodes.push({ ...base, type: 'text', text: (d.text as string) || '' });
        break;
      case 'canvas-link':
        canvasNodes.push({ ...base, type: 'link', url: (d.url as string) || '' });
        break;
      case 'canvas-file':
        canvasNodes.push({ ...base, type: 'file', file: (d.file as string) || '' });
        break;
      case 'canvas-group':
        canvasNodes.push({ ...base, type: 'group', label: (d.label as string) || undefined });
        break;
    }
  }

  for (const e of edges) {
    canvasEdges.push({
      id: e.id,
      fromNode: e.source,
      toNode: e.target,
      fromSide: handleToSide(e.sourceHandle),
      toSide: handleToSide(e.targetHandle),
      label: e.label as string | undefined,
      toEnd: e.markerEnd ? 'arrow' : 'none',
      color: (e.style as Record<string, string>)?.stroke,
    });
  }

  return { nodes: canvasNodes, edges: canvasEdges };
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function generateId(): string {
  return crypto.randomUUID?.() ??
    'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
