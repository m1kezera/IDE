/**
 * Lumina IDE — Custom React Flow Node: Link
 * Obsidian-style: colored background, iframe, URL bar.
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

function LinkNodeComponent({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const url = (d.url as string) || '';
  const color = d.accentColor as string | undefined;

  return (
    <div
      className={`cn-card ${selected ? 'cn-selected' : ''}`}
      style={{
        ...(colorToBg(color) ? { background: colorToBg(color) } : {}),
        ...(colorToBorder(color) ? { borderColor: colorToBorder(color) } : {}),
      }}
    >
      <NodeResizer color={color || '#7c3aed'} isVisible={!!selected} minWidth={120} minHeight={60} />
      {color && <div className="cn-accent" style={{ background: color }} />}
      <div className="cn-iframe-wrap">
        <iframe
          src={url}
          sandbox="allow-scripts allow-same-origin"
          loading="lazy"
          title={url}
        />
      </div>
      <div className="cn-url-bar">{url}</div>
      <Handle type="source" position={Position.Top} id="top" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Left} id="left" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Right} id="right" isConnectableEnd className="cn-handle" />
    </div>
  );
}

export const LinkNode = memo(LinkNodeComponent);
