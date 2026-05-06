/**
 * Lumina IDE — Infinite Preview v3.0
 * Bridge between vanilla TS IDE and React Flow canvas.
 * Mounts a React island on demand — no React leaks to the rest of the IDE.
 */

import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

// ─── State ──────────────────────────────────────────────────────────

let layerEl: HTMLElement | null = null;
let reactRoot: { unmount(): void } | null = null;
let isVisible = false;
let onContentUpdate: ((json: string) => void) | null = null;

// ─── Init ───────────────────────────────────────────────────────────

export function initInfinitePreview(): void {
  layerEl = document.createElement('div');
  layerEl.className = 'infinite-preview-layer';
  layerEl.innerHTML = buildShell();
  document.body.appendChild(layerEl);

  // Close button
  layerEl.querySelector('#ip-close')?.addEventListener('click', close);

  // PubSub — canvas:open from EditorManager
  PubSub.on('canvas:open', (data) => {
    const { content, onUpdate } = data as {
      content: string;
      path: string;
      onUpdate: (json: string) => void;
    };
    onContentUpdate = onUpdate;
    open(content);
  });

  PubSub.on('canvas:sync', (data) => {
    const { content } = data as { content: string };
    if (isVisible) {
      // Re-mount with new content
      close();
      setTimeout(() => open(content), 50);
    }
  });
}

// ─── Open / Close ───────────────────────────────────────────────────

async function open(jsonContent: string): Promise<void> {
  if (!layerEl) return;
  layerEl.classList.add('visible');
  isVisible = true;

  const container = layerEl.querySelector('#ip-canvas-container') as HTMLElement;
  if (!container) return;
  container.innerHTML = '';

  // Create mount point for React
  const mountDiv = document.createElement('div');
  mountDiv.id = 'canvas-react-root';
  mountDiv.style.cssText = 'width:100%;height:100%;';
  container.appendChild(mountDiv);

  try {
    // Dynamic import — React only loads when canvas opens
    const [{ createRoot }, { CanvasApp }] = await Promise.all([
      import('react-dom/client'),
      import('./canvas/CanvasApp.tsx'),
    ]);

    // Also import the CSS
    await import('./canvas/canvas-flow.css');

    const root = createRoot(mountDiv);
    const { createElement } = await import('react');

    root.render(
      createElement(CanvasApp, {
        initialData: jsonContent,
        onUpdate: (json: string) => {
          onContentUpdate?.(json);
        },
      })
    );

    reactRoot = root;
    console.log('[Canvas v3] React Flow mounted successfully');
  } catch (err) {
    console.error('[Canvas v3] Failed to mount React Flow:', err);
    container.innerHTML = `<div style="color:#f38ba8;padding:20px;font-family:monospace;">
      <h3>⚠️ Erro ao carregar o canvas</h3>
      <pre>${err}</pre>
    </div>`;
  }
}

function close(): void {
  if (!layerEl) return;
  layerEl.classList.remove('visible');
  isVisible = false;

  // Unmount React cleanly
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  const container = layerEl.querySelector('#ip-canvas-container') as HTMLElement;
  if (container) container.innerHTML = '';
}

// ─── Shell UI (vanilla HTML — no React) ─────────────────────────────

function buildShell(): string {
  return `
    <div class="ip-header">
      <div class="ip-header-left">
        <span class="ip-title">∞ Lumina Canvas</span>
      </div>
      <div class="ip-header-right">
        <button id="ip-close" class="ip-btn ip-btn-close" title="${t('canvas.close') || 'Fechar'}">✕</button>
      </div>
    </div>
    <div id="ip-canvas-container" class="ip-canvas-container"></div>
  `;
}

// ─── Exports ────────────────────────────────────────────────────────

export function isCanvasVisible(): boolean { return isVisible; }
