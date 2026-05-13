/**
 * Design Studio — Resize Handles
 * Provides 8-point resize handles overlaid on selected elements.
 */

export interface ResizeState {
  isResizing: boolean;
  handle: string; // 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  elementId: string;
}

let resizeState: ResizeState | null = null;
let overlayEl: HTMLElement | null = null;
let onResizeEnd: ((elId: string, w: number, h: number) => void) | null = null;

const HANDLE_SIZE = 8;
const MIN_SIZE = 20;

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type HandleDir = typeof HANDLES[number];

function getCursor(dir: HandleDir): string {
  const map: Record<HandleDir, string> = {
    nw: 'nwse-resize', n: 'ns-resize', ne: 'nesw-resize', e: 'ew-resize',
    se: 'nwse-resize', s: 'ns-resize', sw: 'nesw-resize', w: 'ew-resize',
  };
  return map[dir];
}

function getHandlePosition(dir: HandleDir, rect: DOMRect): { left: string; top: string } {
  const hs = HANDLE_SIZE / 2;
  const map: Record<HandleDir, { left: string; top: string }> = {
    nw: { left: `${-hs}px`, top: `${-hs}px` },
    n:  { left: `calc(50% - ${hs}px)`, top: `${-hs}px` },
    ne: { left: `calc(100% - ${hs}px)`, top: `${-hs}px` },
    e:  { left: `calc(100% - ${hs}px)`, top: `calc(50% - ${hs}px)` },
    se: { left: `calc(100% - ${hs}px)`, top: `calc(100% - ${hs}px)` },
    s:  { left: `calc(50% - ${hs}px)`, top: `calc(100% - ${hs}px)` },
    sw: { left: `${-hs}px`, top: `calc(100% - ${hs}px)` },
    w:  { left: `${-hs}px`, top: `calc(50% - ${hs}px)` },
  };
  void rect; // positions are relative via CSS calc
  return map[dir];
}

/**
 * Create and show resize handles over a selected element.
 */
export function showResizeHandles(
  targetEl: HTMLElement,
  elementId: string,
  zoom: number,
  callback: (elId: string, w: number, h: number) => void,
): void {
  removeResizeHandles();
  onResizeEnd = callback;

  const rect = targetEl.getBoundingClientRect();

  overlayEl = document.createElement('div');
  overlayEl.className = 'ds-resize-overlay';
  overlayEl.style.cssText = `
    position: absolute; pointer-events: none;
    left: 0; top: 0; width: 100%; height: 100%;
    z-index: 10;
  `;

  for (const dir of HANDLES) {
    const handle = document.createElement('div');
    handle.className = `ds-resize-handle ds-resize-${dir}`;
    handle.dataset.dir = dir;
    const pos = getHandlePosition(dir, rect);
    handle.style.cssText = `
      position: absolute; width: ${HANDLE_SIZE}px; height: ${HANDLE_SIZE}px;
      background: #7c3aed; border: 1px solid #fff; border-radius: 2px;
      cursor: ${getCursor(dir)}; pointer-events: auto; z-index: 11;
      left: ${pos.left}; top: ${pos.top};
      box-shadow: 0 0 4px rgba(0,0,0,0.3);
      transition: background 0.1s;
    `;

    handle.addEventListener('mouseenter', () => { handle.style.background = '#9f67ff'; });
    handle.addEventListener('mouseleave', () => { handle.style.background = '#7c3aed'; });

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const elRect = targetEl.getBoundingClientRect();
      resizeState = {
        isResizing: true,
        handle: dir,
        startX: e.clientX,
        startY: e.clientY,
        startW: elRect.width / zoom,
        startH: elRect.height / zoom,
        elementId,
      };
      document.body.style.cursor = getCursor(dir);
    });

    overlayEl.appendChild(handle);
  }

  // Bounding box border
  const border = document.createElement('div');
  border.style.cssText = `
    position: absolute; inset: 0;
    border: 1px dashed rgba(124,58,237,0.6);
    pointer-events: none; border-radius: 2px;
  `;
  overlayEl.appendChild(border);

  // Dimension label
  const dimLabel = document.createElement('div');
  dimLabel.className = 'ds-resize-dim-label';
  dimLabel.style.cssText = `
    position: absolute; bottom: -20px; left: 50%;
    transform: translateX(-50%);
    background: #7c3aed; color: #fff; font-size: 9px;
    padding: 1px 6px; border-radius: 4px; white-space: nowrap;
    pointer-events: none;
  `;
  const elRect = targetEl.getBoundingClientRect();
  dimLabel.textContent = `${Math.round(elRect.width / zoom)} × ${Math.round(elRect.height / zoom)}`;
  overlayEl.appendChild(dimLabel);

  // Make wrapper relative for absolute handles
  targetEl.style.position = 'relative';
  targetEl.appendChild(overlayEl);
}

/**
 * Remove resize handles from the DOM.
 */
export function removeResizeHandles(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
  resizeState = null;
}

/**
 * Initialize global mousemove/mouseup listeners for resize.
 * Call once during init.
 */
export function initResizeListeners(
  getZoom: () => number,
  getElement: (id: string) => HTMLElement | null,
): void {

  window.addEventListener('mousemove', (e) => {
    if (!resizeState?.isResizing) return;
    const zoom = getZoom();
    const dx = (e.clientX - resizeState.startX) / zoom;
    const dy = (e.clientY - resizeState.startY) / zoom;
    const dir = resizeState.handle as HandleDir;

    let newW = resizeState.startW;
    let newH = resizeState.startH;

    // Calculate new dimensions based on handle direction
    if (dir.includes('e')) newW = Math.max(MIN_SIZE, resizeState.startW + dx);
    if (dir.includes('w')) newW = Math.max(MIN_SIZE, resizeState.startW - dx);
    if (dir.includes('s')) newH = Math.max(MIN_SIZE, resizeState.startH + dy);
    if (dir.includes('n')) newH = Math.max(MIN_SIZE, resizeState.startH - dy);

    // Shift = maintain aspect ratio (guard against division by zero)
    if (e.shiftKey && resizeState.startH > 0 && resizeState.startW > 0) {
      const ratio = resizeState.startW / resizeState.startH;
      if (Math.abs(dx) > Math.abs(dy)) {
        newH = newW / ratio;
      } else {
        newW = newH * ratio;
      }
    }

    // Apply to DOM element directly for instant feedback
    const el = getElement(resizeState.elementId);
    if (el) {
      el.style.width = `${Math.round(newW)}px`;
      el.style.height = `${Math.round(newH)}px`;

      // Update dimension label
      const label = el.querySelector('.ds-resize-dim-label');
      if (label) label.textContent = `${Math.round(newW)} × ${Math.round(newH)}`;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!resizeState?.isResizing) return;
    document.body.style.cursor = '';

    // Use the same getElement callback as mousemove for consistency
    const el = getElement(resizeState.elementId);
    if (el && onResizeEnd) {
      const w = parseInt(el.style.width) || resizeState.startW;
      const h = parseInt(el.style.height) || resizeState.startH;
      onResizeEnd(resizeState.elementId, w, h);
    }
    resizeState = null;
  });
}

/** Check if currently resizing */
export function isResizing(): boolean {
  return resizeState?.isResizing === true;
}
