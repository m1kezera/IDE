/**
 * Lumina IDE — Custom React Flow Node: Text
 * Obsidian-style: colored background tint, content-only, no header.
 */

import { memo } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { marked } from 'marked';

// Obsidian uses pastel/dark tints of the accent color as card background
function colorToBg(hex?: string): string | undefined {
  if (!hex) return undefined;
  // Convert hex to RGB and create a very dark tint
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

function TextNodeComponent({ data, selected }: NodeProps) {
  const d = data as Record<string, unknown>;
  const text = (d.text as string) || '';
  const color = d.accentColor as string | undefined;
  const html = marked.parse(text, { async: false }) as string;

  const bgTint = colorToBg(color);
  const borderTint = colorToBorder(color);

  return (
    <div
      className={`cn-card ${selected ? 'cn-selected' : ''}`}
      style={{
        ...(bgTint ? { background: bgTint } : {}),
        ...(borderTint ? { borderColor: borderTint } : {}),
      }}
    >
      <NodeResizer color={color || '#7c3aed'} isVisible={!!selected} minWidth={80} minHeight={30} />
      {color && <div className="cn-accent" style={{ background: color }} />}
      <div
        className="cn-body cn-markdown"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <Handle type="source" position={Position.Top} id="top" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Left} id="left" isConnectableEnd className="cn-handle" />
      <Handle type="source" position={Position.Right} id="right" isConnectableEnd className="cn-handle" />
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
