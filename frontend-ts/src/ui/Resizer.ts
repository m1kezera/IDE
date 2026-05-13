/**
 * Lumina IDE — Resizer (v8.0)
 * Drag physics for: sidebar width, agent right width, terminal bottom height.
 * Pure DOM, no frameworks.
 */

export function initResizers(): void {
  initSidebarResizer();
  initAgentRightResizer();
  initTerminalBottomResizer();
}

/** Sidebar vertical resizer — changes grid-template-columns */
function initSidebarResizer(): void {
  const sidebar = document.getElementById('projecty-sidebar') as HTMLElement;
  const ide = document.getElementById('projecty-ide') as HTMLElement;
  if (!sidebar || !ide) return;

  const handle = document.createElement('div');
  handle.style.cssText = `
    position: absolute; right: 0; top: 0; bottom: 0;
    width: 4px; cursor: col-resize; z-index: 10;
    background: transparent; transition: background 0.2s;
  `;
  handle.addEventListener('mouseenter', () => { handle.style.background = 'var(--accent, #00A3FF)'; });
  handle.addEventListener('mouseleave', () => { if (!dragging) handle.style.background = 'transparent'; });
  sidebar.style.position = 'relative';
  sidebar.appendChild(handle);

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = sidebar.getBoundingClientRect().width;
    handle.style.background = 'var(--accent, #00A3FF)';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const newWidth = Math.max(200, Math.min(500, startWidth + delta));
    ide.style.gridTemplateColumns = `48px ${newWidth}px 1fr`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.style.background = 'transparent';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

/** Agent RIGHT resizer — changes agent-zone width */
function initAgentRightResizer(): void {
  const resizer = document.getElementById('projecty-resizer-right') as HTMLElement;
  const agentZone = document.getElementById('projecty-agent-zone') as HTMLElement;
  if (!resizer || !agentZone) return;

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  resizer.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = agentZone.getBoundingClientRect().width;
    resizer.style.background = 'var(--accent, #00A3FF)';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) return;
    // Drag LEFT = bigger agent panel (startX - e.clientX)
    const delta = startX - e.clientX;
    const newWidth = Math.max(200, Math.min(600, startWidth + delta));
    agentZone.style.width = `${newWidth}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.style.background = 'var(--border)';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}

/** Terminal BOTTOM resizer — changes terminal-zone height via grid-template-rows */
function initTerminalBottomResizer(): void {
  const resizer = document.getElementById('projecty-resizer-bottom') as HTMLElement;
  const ide = document.getElementById('projecty-ide') as HTMLElement;
  const termZone = document.getElementById('projecty-terminal-zone') as HTMLElement;
  if (!resizer || !ide || !termZone) return;

  let dragging = false;
  let startY = 0;
  let startHeight = 0;

  resizer.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startHeight = termZone.getBoundingClientRect().height;
    resizer.style.background = 'var(--accent, #00A3FF)';
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) return;
    // Drag UP = bigger terminal panel
    const delta = startY - e.clientY;
    const newHeight = Math.max(80, Math.min(500, startHeight + delta));
    ide.style.gridTemplateRows = `36px 1fr 4px ${newHeight}px 22px`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.style.background = 'var(--border)';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}
