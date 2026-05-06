/**
 * Lumina IDE — Canvas App v2 (React Flow)
 * Full-featured canvas with context menu, undo/redo, edge labels, etc.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,

  BackgroundVariant,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import { TextNode } from './nodes/TextNode';
import { LinkNode } from './nodes/LinkNode';
import { FileNode } from './nodes/FileNode';
import { GroupNode } from './nodes/GroupNode';
import { ImageNode } from './nodes/ImageNode';
import {
  canvasToFlow,
  flowToCanvas,
  generateId,
  type CanvasData,
  COLOR_MAP,
} from './canvasAdapter';

// ─── Node & Edge Types ──────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  'canvas-text': TextNode,
  'canvas-link': LinkNode,
  'canvas-file': FileNode,
  'canvas-group': GroupNode,
  'canvas-image': ImageNode,
};

// ─── Custom Editable Edge ───────────────────────────────────────────

function EditableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  label, markerEnd, style, selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState((label as string) || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  });

  useEffect(() => { setText((label as string) || ''); }, [label]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commitLabel = () => {
    setEditing(false);
    const val = text.trim();
    setEdges(es => es.map(e => e.id === id ? { ...e, label: val || undefined } : e));
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="cn-edge-label"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        >
          {editing ? (
            <input
              ref={inputRef}
              className="cn-edge-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setText((label as string) || ''); setEditing(false); } }}
            />
          ) : (
            (label ? <span className="cn-edge-text">{label as string}</span>
              : selected ? <span className="cn-edge-text cn-edge-placeholder">+ label</span> : null)
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes: EdgeTypes = {
  default: EditableEdge,
};

// ─── Undo/Redo History ──────────────────────────────────────────────

interface HistoryEntry { nodes: Node[]; edges: Edge[]; }

function useHistory(maxSize = 50) {
  const stack = useRef<HistoryEntry[]>([]);
  const index = useRef(-1);
  const skip = useRef(false);

  const push = useCallback((nodes: Node[], edges: Edge[]) => {
    if (skip.current) return;
    const snap = JSON.stringify({ nodes, edges });
    if (index.current >= 0 && JSON.stringify(stack.current[index.current]) === snap) return;
    stack.current = stack.current.slice(0, index.current + 1);
    stack.current.push({ nodes: JSON.parse(snap).nodes, edges: JSON.parse(snap).edges });
    if (stack.current.length > maxSize) stack.current.shift();
    index.current = stack.current.length - 1;
  }, [maxSize]);

  const undo = useCallback((): HistoryEntry | null => {
    if (index.current <= 0) return null;
    index.current--;
    skip.current = true;
    const entry = stack.current[index.current];
    setTimeout(() => { skip.current = false; }, 50);
    return entry ? { nodes: [...entry.nodes], edges: [...entry.edges] } : null;
  }, []);

  const redo = useCallback((): HistoryEntry | null => {
    if (index.current >= stack.current.length - 1) return null;
    index.current++;
    skip.current = true;
    const entry = stack.current[index.current];
    setTimeout(() => { skip.current = false; }, 50);
    return entry ? { nodes: [...entry.nodes], edges: [...entry.edges] } : null;
  }, []);

  return { push, undo, redo };
}

// ─── Context Menu Component ─────────────────────────────────────────

interface MenuProps {
  x: number; y: number;
  items: { icon: string; label: string; danger?: boolean; action: () => void }[];
  onClose: () => void;
}

function ContextMenu({ x, y, items, onClose }: MenuProps) {
  useEffect(() => {
    const handler = (e: Event) => {
      // Don't close if clicking inside the menu
      const target = e.target as HTMLElement;
      if (target.closest?.('.cn-context-menu')) return;
      onClose();
    };
    // Delay binding so the opening right-click doesn't immediately close
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handler);
      window.addEventListener('contextmenu', handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  // Keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div
      className="cn-context-menu"
      style={{ position: 'fixed', left: adjustedX, top: adjustedY, zIndex: 10001 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          className={`cn-ctx-item ${item.danger ? 'cn-ctx-danger' : ''}`}
          onClick={() => { item.action(); onClose(); }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Props ──────────────────────────────────────────────────────────

interface CanvasAppProps {
  initialData: string;
  onUpdate?: (json: string) => void;
}

// ─── Main Canvas ────────────────────────────────────────────────────

function CanvasInner({ initialData, onUpdate }: CanvasAppProps) {
  const parsed = useMemo<CanvasData>(() => {
    const trimmed = (initialData || '').trim();
    // Empty file, just whitespace, or minimal {} → valid empty canvas
    if (!trimmed || trimmed === '{}' || trimmed === '[]') {
      return { nodes: [], edges: [] };
    }
    try {
      const data = JSON.parse(trimmed);
      return {
        nodes: Array.isArray(data.nodes) ? data.nodes : [],
        edges: Array.isArray(data.edges) ? data.edges : [],
      };
    } catch {
      return { nodes: [], edges: [] };
    }
  }, [initialData]);

  const initial = useMemo(() => canvasToFlow(parsed), [parsed]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;
  const { push, undo, redo } = useHistory();

  // ─── Context Menu State ──────────────────────────────────────────
  const menuRef = useRef<{ x: number; y: number; items: MenuProps['items'] } | null>(null);

  const setMenu = useCallback((menu: typeof menuRef.current) => {
    menuRef.current = menu;
    // Force re-render by touching state
    setNodes(ns => [...ns]);
  }, [setNodes]);

  // ─── Debounced save ──────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChanges = useCallback((ns: Node[], es: Edge[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const data = flowToCanvas(ns, es);
      updateRef.current?.(JSON.stringify(data, null, 2));
    }, 400);
  }, []);

  // Snapshot + save on changes
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    push(nodes, edges);
    saveChanges(nodes, edges);
  }, [nodes, edges, push, saveChanges]);

  // ─── Connect edges ───────────────────────────────────────────────
  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge({
      ...params,
      type: 'default',
      animated: false,
      style: { stroke: '#a6adc8', strokeWidth: 3 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a6adc8', width: 20, height: 20 },
    }, eds));
  }, [setEdges]);

  // ─── Reconnect edges (drag endpoint to new handle) ──────────────
  const reconnectDone = useRef(false);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    reconnectDone.current = true;
    setEdges(eds => reconnectEdge(oldEdge, newConnection, eds));
  }, [setEdges]);

  const onReconnectStart = useCallback(() => {
    reconnectDone.current = false;
  }, []);

  const onReconnectEnd = useCallback((_event: MouseEvent | TouchEvent, edge: Edge) => {
    // If dropped on empty space (not reconnected), delete the edge
    if (!reconnectDone.current) {
      setEdges(eds => eds.filter(e => e.id !== edge.id));
    }
  }, [setEdges]);

  // ─── Context Menu Handlers ───────────────────────────────────────

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    const items: MenuProps['items'] = [];

    if (node.type === 'canvas-text') {
      items.push({ icon: '✏️', label: 'Editar texto', action: () => {
        const text = prompt('Texto (Markdown):', (node.data as Record<string,string>).text || '');
        if (text !== null) setNodes(ns => ns.map(n => n.id === node.id ? { ...n, data: { ...n.data, text } } : n));
      }});
    }

    items.push({ icon: '🎨', label: 'Alterar cor', action: () => {
      const keys = Object.keys(COLOR_MAP);
      const current = (node.data as Record<string,string>).color || '0';
      const next = keys[(keys.indexOf(current) + 1) % keys.length];
      setNodes(ns => ns.map(n => n.id === node.id ? { ...n, data: { ...n.data, color: next, accentColor: COLOR_MAP[next] } } : n));
    }});

    items.push({ icon: '📋', label: 'Duplicar', action: () => {
      const clone: Node = {
        ...JSON.parse(JSON.stringify(node)),
        id: generateId(),
        position: { x: node.position.x + 30, y: node.position.y + 30 },
        selected: false,
      };
      setNodes(ns => [...ns, clone]);
    }});

    items.push({ icon: '🗑️', label: 'Deletar', danger: true, action: () => {
      setNodes(ns => ns.filter(n => n.id !== node.id));
      setEdges(es => es.filter(e => e.source !== node.id && e.target !== node.id));
    }});

    setMenu({ x: event.clientX, y: event.clientY, items });
  }, [setNodes, setEdges, setMenu]);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setMenu({
      x: event.clientX, y: event.clientY,
      items: [
        { icon: '🏷️', label: 'Adicionar label', action: () => {
          const label = prompt('Label da conexão:', (edge.label as string) || '');
          if (label !== null) setEdges(es => es.map(e => e.id === edge.id ? { ...e, label } : e));
        }},
        { icon: '🎨', label: 'Alterar cor', action: () => {
          const colors = ['#a6adc8', '#fb4934', '#fe8019', '#fabd2f', '#b8bb26', '#83a598', '#d3869b'];
          const current = (edge.style as Record<string,string>)?.stroke || '#a6adc8';
          const next = colors[(colors.indexOf(current) + 1) % colors.length];
          setEdges(es => es.map(e => e.id === edge.id ? { ...e, style: { ...e.style, stroke: next }, markerEnd: { type: MarkerType.ArrowClosed, color: next, width: 20, height: 20 } } : e));
        }},
        { icon: '🗑️', label: 'Deletar', danger: true, action: () => {
          setEdges(es => es.filter(e => e.id !== edge.id));
        }},
      ],
    });
  }, [setEdges, setMenu]);

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setMenu({
      x: event.clientX, y: event.clientY,
      items: [
        { icon: '📝', label: 'Novo nó de texto', action: () => {
          setNodes(ns => [...ns, {
            id: generateId(), type: 'canvas-text',
            position: flowPos,
            data: { text: '# Novo nó\n\nEdite com botão direito.', type: 'text' },
            style: { width: 160, height: 80 },
          }]);
        }},
        { icon: '🔗', label: 'Novo nó de link', action: () => {
          const url = prompt('URL:');
          if (!url) return;
          setNodes(ns => [...ns, {
            id: generateId(), type: 'canvas-link',
            position: flowPos,
            data: { url, type: 'link' },
            style: { width: 280, height: 160 },
          }]);
        }},
        { icon: '📦', label: 'Novo grupo', action: () => {
          const label = prompt('Label:') || 'Grupo';
          setNodes(ns => [...ns, {
            id: generateId(), type: 'canvas-group',
            position: flowPos,
            zIndex: -1,
            dragHandle: '.custom-drag-handle',
            data: { label, type: 'group' },
            style: { width: 300, height: 200 },
          }]);
        }},
      ],
    });
  }, [setNodes, screenToFlowPosition, setMenu]);

  // ─── Keyboard Shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const entry = undo();
        if (entry) { setNodes(entry.nodes); setEdges(entry.edges); }
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const entry = redo();
        if (entry) { setNodes(entry.nodes); setEdges(entry.edges); }
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setNodes(ns => ns.map(n => ({ ...n, selected: true })));
        setEdges(es => es.map(ed => ({ ...ed, selected: true })));
      }
      // Duplicate selected (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const selected = nodesRef.current.filter(n => n.selected);
        if (selected.length === 0) return;
        const idMap = new Map<string, string>();
        const newNodes = selected.map(n => {
          const newId = generateId();
          idMap.set(n.id, newId);
          return {
            ...n,
            id: newId,
            position: { x: n.position.x + 30, y: n.position.y + 30 },
            selected: true,
          };
        });
        // Also duplicate edges between selected nodes
        const newEdges = edgesRef.current
          .filter(e => idMap.has(e.source) && idMap.has(e.target))
          .map(e => ({
            ...e,
            id: generateId(),
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
            selected: true,
          }));
        setNodes(ns => [
          ...ns.map(n => ({ ...n, selected: false })),
          ...newNodes,
        ]);
        if (newEdges.length) setEdges(es => [...es, ...newEdges]);
      }
      // Escape — deselect all
      if (e.key === 'Escape') {
        setNodes(ns => ns.map(n => ({ ...n, selected: false })));
        setEdges(es => es.map(ed => ({ ...ed, selected: false })));
        setMenu(null);
      }
      // Arrow keys — nudge selected nodes
      const NUDGE = e.shiftKey ? 20 : 5;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const hasSelected = nodesRef.current.some(n => n.selected);
        if (!hasSelected) return;
        e.preventDefault();
        const dx = e.key === 'ArrowLeft' ? -NUDGE : e.key === 'ArrowRight' ? NUDGE : 0;
        const dy = e.key === 'ArrowUp' ? -NUDGE : e.key === 'ArrowDown' ? NUDGE : 0;
        setNodes(ns => ns.map(n => n.selected
          ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
          : n
        ));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, setNodes, setEdges, setMenu]);

  // ─── Upload helper ──────────────────────────────────────────────
  const uploadAndCreateImageNode = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await fetch('/api/canvas/upload-image', { method: 'POST', body: formData });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const { path } = await resp.json();
      const src = `/api/canvas/images/${path.split('/').pop()}`;
      const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      setNodes(ns => [...ns, {
        id: generateId(), type: 'canvas-image',
        position: pos,
        data: { src, type: 'image', file: path },
        style: { width: 280 },
      }]);
    } catch (err) {
      console.error('[Canvas] Image upload failed:', err);
      // Fallback to base64
      const reader = new FileReader();
      reader.onload = () => {
        const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        setNodes(ns => [...ns, {
          id: generateId(), type: 'canvas-image',
          position: pos,
          data: { src: reader.result as string, type: 'image' },
          style: { width: 280 },
        }]);
      };
      reader.readAsDataURL(file);
    }
  }, [setNodes, screenToFlowPosition]);

  // ─── Paste images ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;
          uploadAndCreateImageNode(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [uploadAndCreateImageNode]);

  // Fit on mount
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15 }), 150);
    return () => clearTimeout(t);
  }, [fitView]);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={() => setMenu(null)}
        fitView
        snapToGrid
        snapGrid={[12, 12]}
        minZoom={0.02}
        maxZoom={4}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Shift"
        zoomOnScroll
        edgesReconnectable
        edgesFocusable
        onReconnect={onReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onNodeDoubleClick={(_event, node) => {
          if (node.type === 'canvas-text') {
            const text = prompt('Texto (Markdown):', (node.data as Record<string,string>).text || '');
            if (text !== null) setNodes(ns => ns.map(n => n.id === node.id ? { ...n, data: { ...n.data, text } } : n));
          } else if (node.type === 'canvas-group') {
            const label = prompt('Nome do grupo:', (node.data as Record<string,string>).label || '');
            if (label !== null) setNodes(ns => ns.map(n => n.id === node.id ? { ...n, data: { ...n.data, label } } : n));
          }
        }}
        className="lumina-canvas"
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: { stroke: '#6c7086', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6c7086',
            width: 20,
            height: 20,
          },
          interactionWidth: 25,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.035)" />
        <Controls
          showInteractive={false}
          position="bottom-right"
        />

        <Panel position="top-center" className="cn-toolbar">
          <button onClick={() => {
            const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            setNodes(ns => [...ns, {
              id: generateId(), type: 'canvas-text',
              position: pos,
              data: { text: '# Novo nó\n\nEdite com botão direito.', type: 'text' },
              style: { width: 160, height: 80 },
            }]);
          }} title="Novo texto">📝</button>
          <button onClick={() => {
            const url = prompt('URL:');
            if (!url) return;
            const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            setNodes(ns => [...ns, {
              id: generateId(), type: 'canvas-link',
              position: pos,
              data: { url, type: 'link' },
              style: { width: 280, height: 160 },
            }]);
          }} title="Novo link">🔗</button>
          <button onClick={() => {
            const label = prompt('Label:') || 'Grupo';
            const pos = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
            setNodes(ns => [...ns, {
              id: generateId(), type: 'canvas-group',
              position: pos,
              zIndex: -1,
              dragHandle: '.custom-drag-handle',
              data: { label, type: 'group' },
              style: { width: 300, height: 200 },
            }]);
          }} title="Novo grupo">📦</button>
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
              const file = input.files?.[0];
              if (file) uploadAndCreateImageNode(file);
            };
            input.click();
          }} title="Adicionar imagem">🖼️</button>
          <span className="cn-sep" />
          {Object.entries(COLOR_MAP).map(([key, hex]) => (
            <button key={key} className="cn-clr" style={{ background: hex }}
              onClick={() => {
                setNodes(ns => ns.map(n => n.selected ? { ...n, data: { ...n.data, color: key, accentColor: hex } } : n));
                setEdges(es => es.map(e => e.selected ? { ...e, style: { ...e.style, stroke: hex }, markerEnd: { type: MarkerType.ArrowClosed, color: hex, width: 20, height: 20 } } : e));
              }} title={`Cor ${key}`} />
          ))}
          <span className="cn-sep" />
          <button onClick={() => { const e = undo(); if (e) { setNodes(e.nodes); setEdges(e.edges); }}} title="Desfazer (Ctrl+Z)">↩️</button>
          <button onClick={() => { const e = redo(); if (e) { setNodes(e.nodes); setEdges(e.edges); }}} title="Refazer (Ctrl+Y)">↪️</button>
          <span className="cn-sep" />
          <button onClick={() => {
            setNodes(ns => ns.map(n => ({ ...n, selected: true })));
            setEdges(es => es.map(e => ({ ...e, selected: true })));
          }} title="Selecionar tudo (Ctrl+A)">⬚</button>
          <button onClick={() => {
            // Duplicate selected
            const selected = nodesRef.current.filter(n => n.selected);
            if (selected.length === 0) return;
            const idMap = new Map<string, string>();
            const newNodes = selected.map(n => {
              const newId = generateId();
              idMap.set(n.id, newId);
              return { ...n, id: newId, position: { x: n.position.x + 30, y: n.position.y + 30 }, selected: true };
            });
            const newEdges = edgesRef.current
              .filter(e => idMap.has(e.source) && idMap.has(e.target))
              .map(e => ({ ...e, id: generateId(), source: idMap.get(e.source)!, target: idMap.get(e.target)!, selected: true }));
            setNodes(ns => [...ns.map(n => ({ ...n, selected: false })), ...newNodes]);
            if (newEdges.length) setEdges(es => [...es, ...newEdges]);
          }} title="Duplicar selecionados (Ctrl+D)">📋</button>
          <button onClick={() => {
            setNodes(ns => ns.filter(n => !n.selected));
            setEdges(es => es.filter(e => !e.selected));
          }} title="Deletar selecionados" className="cn-danger">🗑️</button>
          <button onClick={() => {
            if (confirm('Limpar todo o canvas?')) {
              setNodes([]);
              setEdges([]);
            }
          }} title="Limpar canvas" className="cn-danger">💥</button>
          <span className="cn-sep" />
          <button onClick={() => {
            const data = flowToCanvas(nodesRef.current, edgesRef.current);
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'canvas.canvas';
            a.click();
          }} title="Exportar JSON">📤</button>
          <button onClick={async () => {
            const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewport) return;
            try {
              const dataUrl = await toPng(viewport, {
                backgroundColor: '#181825',
                pixelRatio: 2,
                filter: (node) => {
                  // Exclude controls and toolbar from export
                  if (node.classList?.contains('react-flow__controls')) return false;
                  if (node.classList?.contains('cn-toolbar')) return false;
                  return true;
                },
              });
              const a = document.createElement('a');
              a.href = dataUrl;
              a.download = 'canvas.png';
              a.click();
            } catch (err) {
              console.error('[Canvas] PNG export failed:', err);
            }
          }} title="Exportar PNG">📸</button>
          <span className="cn-sep" />
          <button onClick={() => {
            const selected = nodesRef.current.filter(n => n.selected);
            if (selected.length > 0) {
              fitView({ nodes: selected, padding: 0.3, duration: 300 });
            } else {
              fitView({ padding: 0.15, duration: 300 });
            }
          }} title="Fit view (seleção ou tudo)">⊞</button>
          <span className="cn-stats" title={`${nodes.length} nós · ${edges.length} conexões`}>
            {nodes.length}n · {edges.length}e
          </span>
        </Panel>
      </ReactFlow>

      {/* Context Menu */}
      {menuRef.current && (
        <ContextMenu
          x={menuRef.current.x}
          y={menuRef.current.y}
          items={menuRef.current.items}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}

// ─── Wrapper ────────────────────────────────────────────────────────

export function CanvasApp(props: CanvasAppProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
