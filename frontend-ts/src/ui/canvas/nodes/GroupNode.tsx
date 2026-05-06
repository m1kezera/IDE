/**
 * Lumina IDE — Custom React Flow Node: Group
 * Obsidian-style: colored dashed border, floating label.
 * Uses React Flow's dragHandle class so only the header triggers dragging,
 * while the rest of the group body stays interactive for child nodes.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps, NodeResizer } from '@xyflow/react';

function GroupNodeComponent({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) || 'Grupo';
  const color = (d.accentColor as string) || '#a78bfa';

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return (
    <div
      className={`cn-group ${selected ? 'cn-group-selected' : ''}`}
      style={{
        borderColor: `rgba(${r},${g},${b},0.3)`,
        background: `rgba(${r},${g},${b},0.03)`,
      }}
    >
      <NodeResizer color={color} isVisible={!!selected} minWidth={150} minHeight={100} />

      {/* Drag handle — the custom-drag-handle class is referenced by React Flow's dragHandle prop */}
      <div
        className="cn-group-drag-handle custom-drag-handle"
        style={{ background: `rgba(${r},${g},${b},0.08)`, borderBottomColor: `rgba(${r},${g},${b},0.15)` }}
      >
        <span className="cn-group-label" style={{ color }}>{label}</span>
      </div>

      <Handle type="source" position={Position.Top} id="top" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Left} id="left" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Right} id="right" isConnectableEnd className="cn-handle" />
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
