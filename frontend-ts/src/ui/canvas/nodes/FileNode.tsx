/**
 * Lumina IDE — Custom React Flow Node: File
 * Obsidian-style: colored, compact.
 */

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';

function colorToBg(hex?: string): string | undefined {
  if (!hex) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

function colorToBorder(hex?: string): string | undefined {
  if (!hex) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.45)`;
}

function FileNodeComponent({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const file = (d.file as string) || '';
  const fileName = file.split('/').pop() || file.split('\\').pop() || 'File';
  const color = d.accentColor as string | undefined;

  return (
    <div
      className={`cn-card ${selected ? 'cn-selected' : ''}`}
      style={{
        ...(colorToBg(color) ? { background: colorToBg(color) } : {}),
        ...(colorToBorder(color) ? { borderColor: colorToBorder(color) } : {}),
      }}
    >
      <NodeResizer color={color || '#7c3aed'} isVisible={!!selected} minWidth={80} minHeight={30} />
      {color && <div className="cn-accent" style={{ background: color }} />}
      <div className="cn-body cn-file-body">
        <span className="cn-file-ico">📄</span>
        <span className="cn-file-label">{fileName}</span>
      </div>
      <Handle type="source" position={Position.Top} id="top" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Left} id="left" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Right} id="right" isConnectableEnd className="cn-handle" />
    </div>
  );
}

export const FileNode = memo(FileNodeComponent);
