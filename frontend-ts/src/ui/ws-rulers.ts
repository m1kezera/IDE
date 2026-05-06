/**
 * Web Studio — Rulers & Grid
 *
 * Canvas ruler rendering, grid toggle, and ruler toggle.
 * Extracted from WebStudioPanel.ts.
 */

export interface WSRulerContext {
    root: HTMLElement | null;
    zoom: number;
    panX: number;
    panY: number;
    showGrid: boolean;
    showRulers: boolean;
    setShowGrid: (v: boolean) => void;
    setShowRulers: (v: boolean) => void;
    showToast: (msg: string) => void;
}

export function setupRulers(ctx: WSRulerContext): void {
  // Ruler rendering happens in applyTransform via requestAnimationFrame
  void ctx.showRulers;
}

export function renderRulerTicks(ctx: WSRulerContext): void {
  const hRuler = ctx.root?.querySelector('.ds-ruler-h') as HTMLCanvasElement;
  const vRuler = ctx.root?.querySelector('.ds-ruler-v') as HTMLCanvasElement;
  if (!hRuler || !vRuler) return;

  const hCtx = hRuler.getContext('2d');
  const vCtx = vRuler.getContext('2d');
  if (!hCtx || !vCtx) return;

  // Resize canvases
  const hW = hRuler.parentElement?.clientWidth || 800;
  const vH = vRuler.parentElement?.clientHeight || 600;
  hRuler.width = hW; hRuler.height = 20;
  vRuler.width = 20; vRuler.height = vH;

  hCtx.fillStyle = '#11111b'; hCtx.fillRect(0, 0, hW, 20);
  vCtx.fillStyle = '#11111b'; vCtx.fillRect(0, 0, 20, vH);

  // Calculate tick spacing based on zoom
  let step = 100;
  if (ctx.zoom > 2) step = 25;
  else if (ctx.zoom > 1) step = 50;
  else if (ctx.zoom < 0.3) step = 200;

  hCtx.fillStyle = '#585b70';
  hCtx.font = '8px Inter, sans-serif';
  vCtx.fillStyle = '#585b70';
  vCtx.font = '8px Inter, sans-serif';

  // Horizontal ruler
  const startX = Math.floor(-ctx.panX / ctx.zoom / step) * step;
  for (let wx = startX; wx < startX + hW / ctx.zoom + step; wx += step) {
    const sx = wx * ctx.zoom + ctx.panX;
    if (sx < 0 || sx > hW) continue;
    hCtx.fillRect(sx, 14, 1, 6);
    hCtx.fillText(`${wx}`, sx + 2, 12);
    // Minor ticks
    for (let i = 1; i < 5; i++) {
      const minorX = sx + (step / 5 * i * ctx.zoom);
      if (minorX > 0 && minorX < hW) hCtx.fillRect(minorX, 17, 1, 3);
    }
  }

  // Vertical ruler
  const startY = Math.floor(-ctx.panY / ctx.zoom / step) * step;
  for (let wy = startY; wy < startY + vH / ctx.zoom + step; wy += step) {
    const sy = wy * ctx.zoom + ctx.panY;
    if (sy < 0 || sy > vH) continue;
    vCtx.fillRect(14, sy, 6, 1);
    vCtx.save();
    vCtx.translate(10, sy + 2);
    vCtx.rotate(-Math.PI / 2);
    vCtx.fillText(`${wy}`, 0, 0);
    vCtx.restore();
  }
}

export function toggleGrid(ctx: WSRulerContext): void {
  ctx.setShowGrid(!ctx.showGrid);
  const viewport = ctx.root?.querySelector('.ds-canvas-viewport') as HTMLElement;
  if (viewport) {
    viewport.classList.toggle('ds-grid-hidden', !ctx.showGrid);
  }
  ctx.showToast(ctx.showGrid ? '📐 Grid shown' : '📐 Grid hidden');
}

export function toggleRulers(ctx: WSRulerContext): void {
  ctx.setShowRulers(!ctx.showRulers);
  const hR = ctx.root?.querySelector('.ds-ruler-h') as HTMLElement;
  const vR = ctx.root?.querySelector('.ds-ruler-v') as HTMLElement;
  const corner = ctx.root?.querySelector('.ds-ruler-corner') as HTMLElement;
  if (hR) hR.style.display = ctx.showRulers ? '' : 'none';
  if (vR) vR.style.display = ctx.showRulers ? '' : 'none';
  if (corner) corner.style.display = ctx.showRulers ? '' : 'none';
  // Adjust canvas world position when rulers hidden
  const world = ctx.root?.querySelector('.ds-canvas-world') as HTMLElement;
  if (world) {
    world.style.top = ctx.showRulers ? '20px' : '0';
    world.style.left = ctx.showRulers ? '20px' : '0';
  }
  if (ctx.showRulers) renderRulerTicks(ctx);
  ctx.showToast(ctx.showRulers ? '📏 Rulers shown' : '📏 Rulers hidden');
}
