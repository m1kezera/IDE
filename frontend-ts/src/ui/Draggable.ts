/**
 * Lumina IDE — Draggable Panel Utility
 * Makes a floating panel draggable by its header grip.
 * Also supports resize via CSS `resize: both`.
 */

export function makeDraggable(panel: HTMLElement, handle: HTMLElement): void {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  handle.style.cursor = 'grab';

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    // Only drag on the handle itself, not buttons inside it
    if ((e.target as HTMLElement).closest('button')) return;

    isDragging = true;
    offsetX = e.clientX - panel.getBoundingClientRect().left;
    offsetY = e.clientY - panel.getBoundingClientRect().top;
    handle.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 200, e.clientX - offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offsetY));
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    // Clear percentage-based positioning
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    handle.style.cursor = 'grab';
    document.body.style.userSelect = '';
  });
}
