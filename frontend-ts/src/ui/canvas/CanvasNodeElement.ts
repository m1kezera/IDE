/**
 * Lumina IDE — Canvas Node Element Builder
 * Creates Obsidian-style DOM structures for each node type.
 * Pure DOM — no frameworks.
 */

import { resolveColor, type CanvasNode, type TextNode, type LinkNode, type GroupNode, type FileNode, type NodeSide } from './CanvasEngine';
import { readFile } from '../../api/client';

// ─── Simple Markdown Renderer ─────────────────────────────────────────

function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold / Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Line breaks → paragraphs
  html = html
    .split(/\n\n+/)
    .map(block => {
      if (block.startsWith('<h')) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return html;
}

// ─── Async File Content Loader ────────────────────────────────────────

const CODE_EXTS = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'css', 'scss', 'html', 'json', 'yaml', 'yml', 'toml', 'sh', 'bat', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'vue', 'svelte', 'xml', 'svg']);

async function loadFileContent(filePath: string, container: HTMLElement): Promise<void> {
  try {
    const data = await readFile(filePath);
    const ext = data.ext?.toLowerCase() || '';

    if (ext === 'md') {
      // Render markdown
      container.innerHTML = `<div class="markdown-body canvas-file-md">${renderMarkdown(data.content)}</div>`;
    } else if (CODE_EXTS.has(ext)) {
      // Code preview  
      const escaped = data.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const lines = escaped.split('\n').slice(0, 50); // Max 50 lines preview
      const numbered = lines.map((line, i) =>
        `<span class="canvas-code-ln">${i + 1}</span>${line}`
      ).join('\n');
      container.innerHTML = `<pre class="canvas-file-code"><code>${numbered}</code></pre>`;
      if (data.content.split('\n').length > 50) {
        const more = document.createElement('div');
        more.className = 'canvas-file-truncated';
        more.textContent = `... +${data.content.split('\n').length - 50} linhas`;
        container.appendChild(more);
      }
    } else {
      // Plain text or unknown
      const preview = data.content.slice(0, 500);
      container.innerHTML = `<pre class="canvas-file-code"><code>${preview.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    }
  } catch {
    // Error loading — show fallback
    const name = filePath.split('/').pop() || filePath.split('\\').pop() || 'Arquivo';
    container.innerHTML = `<div class="canvas-file-placeholder"><span style="font-size:28px;">📄</span><span>${name}</span><span style="font-size:10px;color:var(--text-muted);">Não foi possível carregar</span></div>`;
  }
}

// ─── Node DOM Builder ─────────────────────────────────────────────────

const NODE_BADGES: Record<string, string> = {
  text: '📝',
  file: '📄',
  link: '🔗',
  group: '📦',
};

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 30);
  }
}

/**
 * Creates the full Obsidian-style DOM element for a canvas node.
 */
export function createNodeElement(node: CanvasNode): HTMLElement {
  if (node.type === 'group') return createGroupElement(node as GroupNode);

  const el = document.createElement('div');
  el.className = 'canvas-node';
  el.dataset.nodeId = node.id;
  el.dataset.nodeType = node.type;
  applyNodePosition(el, node);

  // Accent bar (left colored stripe)
  const accent = document.createElement('div');
  accent.className = 'canvas-node-accent';
  const color = resolveColor(node.color);
  if (color) accent.style.background = color;
  el.appendChild(accent);

  // Header
  const header = document.createElement('div');
  header.className = 'canvas-node-header';

  const badge = document.createElement('span');
  badge.className = 'canvas-node-badge';
  badge.textContent = NODE_BADGES[node.type] || '📝';
  header.appendChild(badge);

  const filename = document.createElement('span');
  filename.className = 'canvas-node-filename';
  if (node.type === 'text') filename.textContent = 'Nota';
  else if (node.type === 'link') filename.textContent = extractDomain((node as LinkNode).url);
  else if (node.type === 'file') filename.textContent = (node as FileNode).file.split('/').pop() || 'Arquivo';
  header.appendChild(filename);

  el.appendChild(header);

  // Content
  const content = document.createElement('div');
  content.className = 'canvas-node-content';

  if (node.type === 'text') {
    const md = document.createElement('div');
    md.className = 'markdown-body';
    md.innerHTML = renderMarkdown((node as TextNode).text);
    content.dataset.text = (node as TextNode).text;
    content.appendChild(md);
  } else if (node.type === 'link') {
    // iframe preview (Obsidian-style)
    const iframe = document.createElement('iframe');
    iframe.className = 'canvas-link-iframe';
    iframe.src = (node as LinkNode).url;
    iframe.sandbox.add('allow-scripts', 'allow-same-origin');
    iframe.style.cssText = 'width:100%; height:100%; border:none; border-radius:0 0 8px 8px; pointer-events:none;';
    iframe.loading = 'lazy';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.appendChild(iframe);

    // URL label at bottom
    const linkLabel = document.createElement('div');
    linkLabel.className = 'canvas-link-label';
    linkLabel.textContent = (node as LinkNode).url;
    el.appendChild(linkLabel);
  } else if (node.type === 'file') {
    const fileContent = document.createElement('div');
    fileContent.className = 'canvas-file-embed';
    fileContent.innerHTML = `<div class="canvas-file-placeholder"><span class="canvas-file-spinner">⟳</span><span>${(node as FileNode).file.split('/').pop() || 'Carregando...'}</span></div>`;
    content.appendChild(fileContent);

    // Async load file content
    const filePath = (node as FileNode).file;
    loadFileContent(filePath, fileContent);
  }

  el.appendChild(content);

  // Connection Ports
  for (const side of ['top', 'right', 'bottom', 'left'] as NodeSide[]) {
    const port = document.createElement('div');
    port.className = 'canvas-node-port';
    port.dataset.nodeId = node.id;
    port.dataset.side = side;
    el.appendChild(port);
  }

  // Resize Handles (4 corners)
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    const handle = document.createElement('div');
    handle.className = 'canvas-node-resize';
    handle.dataset.nodeId = node.id;
    handle.dataset.corner = corner;
    el.appendChild(handle);
  }

  return el;
}

function createGroupElement(node: GroupNode): HTMLElement {
  const el = document.createElement('div');
  el.className = 'canvas-node canvas-node-group';
  el.dataset.nodeId = node.id;
  el.dataset.nodeType = 'group';
  applyNodePosition(el, node);

  const color = resolveColor(node.color);
  if (color) {
    el.style.borderColor = color + '66'; // alpha
    el.style.background = color + '08';
  }

  // Group label (floating above)
  const header = document.createElement('div');
  header.className = 'canvas-group-header';
  const label = document.createElement('span');
  label.className = 'canvas-group-label';
  label.textContent = node.label || 'Grupo';
  if (color) label.style.color = color;
  header.appendChild(label);
  el.appendChild(header);

  // Resize Handles
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    const handle = document.createElement('div');
    handle.className = 'canvas-node-resize';
    handle.dataset.nodeId = node.id;
    handle.dataset.corner = corner;
    el.appendChild(handle);
  }

  // Connection Ports
  for (const side of ['top', 'right', 'bottom', 'left'] as NodeSide[]) {
    const port = document.createElement('div');
    port.className = 'canvas-node-port';
    port.dataset.nodeId = node.id;
    port.dataset.side = side;
    el.appendChild(port);
  }

  return el;
}

// ─── Update helpers ───────────────────────────────────────────────────

export function applyNodePosition(el: HTMLElement, node: CanvasNode): void {
  el.style.left = `${node.x}px`;
  el.style.top = `${node.y}px`;
  el.style.width = `${node.width}px`;
  el.style.height = `${node.height}px`;
  el.style.zIndex = node.type === 'group' ? '0' : '1';
}

export function updateNodeContent(el: HTMLElement, node: CanvasNode): void {
  // Update accent
  const accent = el.querySelector('.canvas-node-accent') as HTMLElement;
  if (accent) {
    accent.style.background = resolveColor(node.color) || 'transparent';
  }

  // Update text content if changed
  if (node.type === 'text') {
    const content = el.querySelector('.canvas-node-content') as HTMLElement;
    if (content && content.dataset.text !== (node as TextNode).text) {
      const md = content.querySelector('.markdown-body');
      if (md) {
        md.innerHTML = renderMarkdown((node as TextNode).text);
        content.dataset.text = (node as TextNode).text;
      }
    }
  }

  // Update group label
  if (node.type === 'group') {
    const label = el.querySelector('.canvas-group-label');
    if (label) label.textContent = (node as GroupNode).label || 'Grupo';
  }
}

export function setNodeSelected(el: HTMLElement, selected: boolean): void {
  el.classList.toggle('canvas-node-selected', selected);
}

export { renderMarkdown };
