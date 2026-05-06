/**
 * Design Studio — Smart Snap Guides + Distance Measurement + Alignment
 * 
 * Works with the Canvas 2D engine (ds-canvas.ts).
 * Calculates snap positions, alignment guides, equal spacing detection,
 * and distance measurement overlays — all rendered via Canvas 2D.
 * 
 * Phase 3 from the Design Studio master plan.
 */

import type { DSElement, DSArtboard, SnapGuide, DistanceLine } from './ds-types';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
}

export interface ElementRect {
  id: string;
  x: number;  // world-space
  y: number;
  w: number;
  h: number;
}

export interface DistanceMeasurement {
  direction: 'top' | 'right' | 'bottom' | 'left';
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  distance: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const SNAP_THRESHOLD = 5;

// ═══════════════════════════════════════════════════════════════════════
// SNAP CALCULATION — used during drag/resize
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate snap-aligned position for a moving element.
 * Checks against artboard edges, artboard center, and other elements.
 * Returns the snapped position + guide lines to visualize.
 */
export function calculateSnap(
  moving: ElementRect,
  others: ElementRect[],
  artboard: DSArtboard,
  ctrlHeld: boolean = false,  // hold Ctrl to disable snap
  gridSize: number = 0,       // canvas grid size (0 = no grid snap)
): SnapResult {
  if (ctrlHeld) {
    return { snappedX: moving.x, snappedY: moving.y, guides: [] };
  }

  let sx = moving.x;
  let sy = moving.y;
  const guides: SnapGuide[] = [];

  const movCx = moving.x + moving.w / 2;
  const movCy = moving.y + moving.h / 2;
  const movR = moving.x + moving.w;
  const movB = moving.y + moving.h;

  // World-space artboard bounds
  const abX = artboard.x;
  const abY = artboard.y;
  const abR = artboard.x + artboard.width;
  const abB = artboard.y + artboard.height;
  const abCx = artboard.x + artboard.width / 2;
  const abCy = artboard.y + artboard.height / 2;

  let bestDx = SNAP_THRESHOLD + 1;
  let bestDy = SNAP_THRESHOLD + 1;

  // ── Helper: try snapping X ──
  function trySnapX(movVal: number, snapVal: number, guideStart: number, guideEnd: number, label?: string): void {
    const d = Math.abs(movVal - snapVal);
    if (d < SNAP_THRESHOLD && d < bestDx) {
      bestDx = d;
      sx = moving.x + (snapVal - movVal);
      // Remove previous X guides and add new one
      for (let i = guides.length - 1; i >= 0; i--) {
        if (guides[i].orientation === 'v') guides.splice(i, 1);
      }
      guides.push({
        orientation: 'v',
        position: snapVal,
        start: guideStart,
        end: guideEnd,
        label,
      });
    }
  }

  // ── Helper: try snapping Y ──
  function trySnapY(movVal: number, snapVal: number, guideStart: number, guideEnd: number, label?: string): void {
    const d = Math.abs(movVal - snapVal);
    if (d < SNAP_THRESHOLD && d < bestDy) {
      bestDy = d;
      sy = moving.y + (snapVal - movVal);
      for (let i = guides.length - 1; i >= 0; i--) {
        if (guides[i].orientation === 'h') guides.splice(i, 1);
      }
      guides.push({
        orientation: 'h',
        position: snapVal,
        start: guideStart,
        end: guideEnd,
        label,
      });
    }
  }

  // ── Snap to artboard edges + center ──
  trySnapX(moving.x, abX, abY, abB);      // left to left
  trySnapX(movR, abR, abY, abB);           // right to right
  trySnapX(movCx, abCx, abY, abB);         // center to center
  trySnapX(moving.x, abR, abY, abB);       // left to right
  trySnapX(movR, abX, abY, abB);           // right to left

  trySnapY(moving.y, abY, abX, abR);       // top to top
  trySnapY(movB, abB, abX, abR);           // bottom to bottom
  trySnapY(movCy, abCy, abX, abR);         // center to center

  // ── Snap to other elements ──
  for (const other of others) {
    if (other.id === moving.id) continue;
    const oCx = other.x + other.w / 2;
    const oCy = other.y + other.h / 2;
    const oR = other.x + other.w;
    const oB = other.y + other.h;

    const yRange = { min: Math.min(moving.y, other.y, movB, oB), max: Math.max(moving.y, other.y, movB, oB) };
    const xRange = { min: Math.min(moving.x, other.x, movR, oR), max: Math.max(moving.x, other.x, movR, oR) };

    // X-axis snapping
    trySnapX(moving.x, other.x, yRange.min, yRange.max);  // left-left
    trySnapX(movR, oR, yRange.min, yRange.max);            // right-right
    trySnapX(moving.x, oR, yRange.min, yRange.max);        // left-right
    trySnapX(movR, other.x, yRange.min, yRange.max);       // right-left
    trySnapX(movCx, oCx, yRange.min, yRange.max);          // center-center

    // Y-axis snapping
    trySnapY(moving.y, other.y, xRange.min, xRange.max);   // top-top
    trySnapY(movB, oB, xRange.min, xRange.max);            // bottom-bottom
    trySnapY(moving.y, oB, xRange.min, xRange.max);        // top-bottom
    trySnapY(movB, other.y, xRange.min, xRange.max);       // bottom-top
    trySnapY(movCy, oCy, xRange.min, xRange.max);          // center-center

    // ── Equal spacing detection ──
    // Check if element is evenly spaced between two others
    for (const other2 of others) {
      if (other2.id === moving.id || other2.id === other.id) continue;
      // Horizontal equal spacing
      const gapLeft = moving.x - oR;
      const gapRight = other2.x - movR;
      if (Math.abs(gapLeft - gapRight) < SNAP_THRESHOLD && gapLeft > 0 && gapRight > 0) {
        const avgGap = (gapLeft + gapRight) / 2;
        sx = oR + avgGap;
        const label = `${Math.round(avgGap)}px`;
        guides.push({ orientation: 'v', position: moving.x, start: Math.min(other.y, moving.y), end: Math.max(oB, movB), label });
        guides.push({ orientation: 'v', position: movR, start: Math.min(other2.y, moving.y), end: Math.max(other2.y + other2.h, movB), label });
      }
    }
  }

  // ── Snap to user guides ──
  if (artboard.userGuides?.length) {
    for (const guide of artboard.userGuides) {
      const worldPos = guide.orientation === 'h'
        ? artboard.y + guide.position
        : artboard.x + guide.position;

      if (guide.orientation === 'v') {
        trySnapX(moving.x, worldPos, abY, abB);    // left edge to guide
        trySnapX(movR, worldPos, abY, abB);         // right edge to guide
        trySnapX(movCx, worldPos, abY, abB);        // center to guide
      } else {
        trySnapY(moving.y, worldPos, abX, abR);     // top edge to guide
        trySnapY(movB, worldPos, abX, abR);          // bottom edge to guide
        trySnapY(movCy, worldPos, abX, abR);         // center to guide
      }
    }
  }

  // ── Snap to canvas grid ──
  if (gridSize > 0) {
    const nearestGridX = Math.round(moving.x / gridSize) * gridSize;
    const nearestGridY = Math.round(moving.y / gridSize) * gridSize;
    trySnapX(moving.x, nearestGridX, abY, abB, `grid`);
    trySnapY(moving.y, nearestGridY, abX, abR, `grid`);
  }

  // Snap to pixel grid (round to integer)
  sx = Math.round(sx);
  sy = Math.round(sy);

  return { snappedX: sx, snappedY: sy, guides };
}

// ═══════════════════════════════════════════════════════════════════════
// SNAP DURING RESIZE
// ═══════════════════════════════════════════════════════════════════════

export interface ResizeSnapResult {
  snappedW: number;
  snappedH: number;
  snappedX: number;
  snappedY: number;
  guides: SnapGuide[];
}

export function calculateResizeSnap(
  el: ElementRect,
  handle: string,
  others: ElementRect[],
  artboard: DSArtboard,
): ResizeSnapResult {
  const guides: SnapGuide[] = [];
  let { x, y, w, h } = el;

  const abX = artboard.x;
  const abY = artboard.y;
  const abR = artboard.x + artboard.width;
  const abB = artboard.y + artboard.height;

  // Snap the edges being resized
  if (handle.includes('e')) {
    const r = x + w;
    for (const o of others) {
      if (o.id === el.id) continue;
      for (const edge of [o.x, o.x + o.w]) {
        if (Math.abs(r - edge) < SNAP_THRESHOLD) {
          w = edge - x;
          guides.push({ orientation: 'v', position: edge, start: Math.min(y, o.y), end: Math.max(y + h, o.y + o.h) });
        }
      }
    }
    if (Math.abs(r - abR) < SNAP_THRESHOLD) { w = abR - x; guides.push({ orientation: 'v', position: abR, start: abY, end: abB }); }
  }
  if (handle.includes('s')) {
    const b = y + h;
    for (const o of others) {
      if (o.id === el.id) continue;
      for (const edge of [o.y, o.y + o.h]) {
        if (Math.abs(b - edge) < SNAP_THRESHOLD) {
          h = edge - y;
          guides.push({ orientation: 'h', position: edge, start: Math.min(x, o.x), end: Math.max(x + w, o.x + o.w) });
        }
      }
    }
    if (Math.abs(b - abB) < SNAP_THRESHOLD) { h = abB - y; guides.push({ orientation: 'h', position: abB, start: abX, end: abR }); }
  }
  if (handle.includes('w')) {
    for (const o of others) {
      if (o.id === el.id) continue;
      for (const edge of [o.x, o.x + o.w]) {
        if (Math.abs(x - edge) < SNAP_THRESHOLD) {
          w += x - edge;
          x = edge;
          guides.push({ orientation: 'v', position: edge, start: Math.min(y, o.y), end: Math.max(y + h, o.y + o.h) });
        }
      }
    }
    if (Math.abs(x - abX) < SNAP_THRESHOLD) { w += x - abX; x = abX; guides.push({ orientation: 'v', position: abX, start: abY, end: abB }); }
  }
  if (handle.includes('n')) {
    for (const o of others) {
      if (o.id === el.id) continue;
      for (const edge of [o.y, o.y + o.h]) {
        if (Math.abs(y - edge) < SNAP_THRESHOLD) {
          h += y - edge;
          y = edge;
          guides.push({ orientation: 'h', position: edge, start: Math.min(x, o.x), end: Math.max(x + w, o.x + o.w) });
        }
      }
    }
    if (Math.abs(y - abY) < SNAP_THRESHOLD) { h += y - abY; y = abY; guides.push({ orientation: 'h', position: abY, start: abX, end: abR }); }
  }

  return { snappedX: Math.round(x), snappedY: Math.round(y), snappedW: Math.max(10, Math.round(w)), snappedH: Math.max(10, Math.round(h)), guides };
}

// ═══════════════════════════════════════════════════════════════════════
// DISTANCE MEASUREMENT — Alt+Hover shows distances
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate distance measurements between selected element and target.
 * Returns measurement lines for all 4 directions (top/right/bottom/left).
 */
export function calculateDistances(
  selected: ElementRect,
  target: ElementRect,
): DistanceMeasurement[] {
  const measurements: DistanceMeasurement[] = [];

  const sCx = selected.x + selected.w / 2;
  const sCy = selected.y + selected.h / 2;
  const sR = selected.x + selected.w;
  const sB = selected.y + selected.h;

  const tR = target.x + target.w;
  const tB = target.y + target.h;

  // Top distance (selected above target)
  if (sB <= target.y) {
    measurements.push({
      direction: 'top',
      fromX: sCx, fromY: sB,
      toX: sCx, toY: target.y,
      distance: Math.round(target.y - sB),
    });
  }

  // Bottom distance (selected below target)
  if (selected.y >= tB) {
    measurements.push({
      direction: 'bottom',
      fromX: sCx, fromY: selected.y,
      toX: sCx, toY: tB,
      distance: Math.round(selected.y - tB),
    });
  }

  // Left distance (selected left of target)
  if (sR <= target.x) {
    measurements.push({
      direction: 'left',
      fromX: sR, fromY: sCy,
      toX: target.x, toY: sCy,
      distance: Math.round(target.x - sR),
    });
  }

  // Right distance (selected right of target)
  if (selected.x >= tR) {
    measurements.push({
      direction: 'right',
      fromX: selected.x, fromY: sCy,
      toX: tR, toY: sCy,
      distance: Math.round(selected.x - tR),
    });
  }

  // If overlapping, calculate edge distances
  if (measurements.length === 0) {
    // Horizontal gaps
    if (selected.x > target.x) {
      measurements.push({ direction: 'left', fromX: target.x, fromY: sCy, toX: selected.x, toY: sCy, distance: Math.round(selected.x - target.x) });
    }
    if (sR < tR) {
      measurements.push({ direction: 'right', fromX: sR, fromY: sCy, toX: tR, toY: sCy, distance: Math.round(tR - sR) });
    }
    // Vertical gaps
    if (selected.y > target.y) {
      measurements.push({ direction: 'top', fromX: sCx, fromY: target.y, toX: sCx, toY: selected.y, distance: Math.round(selected.y - target.y) });
    }
    if (sB < tB) {
      measurements.push({ direction: 'bottom', fromX: sCx, fromY: sB, toX: sCx, toY: tB, distance: Math.round(tB - sB) });
    }
  }

  return measurements;
}

/**
 * Calculate distances to artboard edges.
 */
export function calculateDistancesToArtboard(
  element: ElementRect,
  artboard: DSArtboard,
): DistanceMeasurement[] {
  const eR = element.x + element.w;
  const eB = element.y + element.h;
  const eCx = element.x + element.w / 2;
  const eCy = element.y + element.h / 2;
  const abX = artboard.x;
  const abY = artboard.y;
  const abR = artboard.x + artboard.width;
  const abB = artboard.y + artboard.height;

  return [
    { direction: 'top' as const, fromX: eCx, fromY: abY, toX: eCx, toY: element.y, distance: Math.round(element.y - abY) },
    { direction: 'bottom' as const, fromX: eCx, fromY: eB, toX: eCx, toY: abB, distance: Math.round(abB - eB) },
    { direction: 'left' as const, fromX: abX, fromY: eCy, toX: element.x, toY: eCy, distance: Math.round(element.x - abX) },
    { direction: 'right' as const, fromX: eR, fromY: eCy, toX: abR, toY: eCy, distance: Math.round(abR - eR) },
  ];
}

// ═══════════════════════════════════════════════════════════════════════
// ALIGNMENT & DISTRIBUTION — for multi-select
// ═══════════════════════════════════════════════════════════════════════

export type AlignDirection = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';
export type DistributeDirection = 'horizontal' | 'vertical';

/**
 * Align multiple elements to a given direction.
 * Modifies elements in-place. Returns true if any changed.
 */
export function alignElements(elements: DSElement[], direction: AlignDirection): boolean {
  if (elements.length < 2) return false;

  // Calculate bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    maxX = Math.max(maxX, el.x + el.w);
    minY = Math.min(minY, el.y);
    maxY = Math.max(maxY, el.y + el.h);
  }

  for (const el of elements) {
    switch (direction) {
      case 'left': el.x = minX; break;
      case 'right': el.x = maxX - el.w; break;
      case 'center-h': el.x = (minX + maxX) / 2 - el.w / 2; break;
      case 'top': el.y = minY; break;
      case 'bottom': el.y = maxY - el.h; break;
      case 'center-v': el.y = (minY + maxY) / 2 - el.h / 2; break;
    }
  }
  return true;
}

/**
 * Distribute elements evenly along an axis.
 */
export function distributeElements(elements: DSElement[], direction: DistributeDirection): boolean {
  if (elements.length < 3) return false;

  if (direction === 'horizontal') {
    const sorted = [...elements].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, el) => sum + el.w, 0);
    const minX = sorted[0].x;
    const maxR = sorted[sorted.length - 1].x + sorted[sorted.length - 1].w;
    const totalSpace = maxR - minX - totalWidth;
    const gap = totalSpace / (sorted.length - 1);

    let currentX = sorted[0].x + sorted[0].w + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      sorted[i].x = Math.round(currentX);
      currentX += sorted[i].w + gap;
    }
  } else {
    const sorted = [...elements].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((sum, el) => sum + el.h, 0);
    const minY = sorted[0].y;
    const maxB = sorted[sorted.length - 1].y + sorted[sorted.length - 1].h;
    const totalSpace = maxB - minY - totalHeight;
    const gap = totalSpace / (sorted.length - 1);

    let currentY = sorted[0].y + sorted[0].h + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      sorted[i].y = Math.round(currentY);
      currentY += sorted[i].h + gap;
    }
  }
  return true;
}

/**
 * Tidy up: auto-arrange elements into a neat grid.
 */
export function tidyUp(elements: DSElement[], gap: number = 16): void {
  if (elements.length === 0) return;
  const cols = Math.ceil(Math.sqrt(elements.length));
  const sorted = [...elements].sort((a, b) => a.order - b.order);
  const startX = sorted[0].x;
  const startY = sorted[0].y;
  const maxW = Math.max(...sorted.map(e => e.w));
  const maxH = Math.max(...sorted.map(e => e.h));

  for (let i = 0; i < sorted.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    sorted[i].x = startX + col * (maxW + gap);
    sorted[i].y = startY + row * (maxH + gap);
  }
}

export function calcDistanceLines(a: DSElement, b: DSElement): DistanceLine[] {
    const lines: DistanceLine[] = [];

    const aL = a.x, aR = a.x + a.w, aT = a.y, aB = a.y + a.h;
    const bL = b.x, bR = b.x + b.w, bT = b.y, bB = b.y + b.h;
    const aCX = a.x + a.w / 2, aCY = a.y + a.h / 2;
    const bCX = b.x + b.w / 2, bCY = b.y + b.h / 2;

    const overlapV = Math.max(0, Math.min(aB, bB) - Math.max(aT, bT));
    if (overlapV > 0) {
        const midY = (Math.max(aT, bT) + Math.min(aB, bB)) / 2;
        if (aR <= bL) {
            lines.push({ x1: aR, y1: midY, x2: bL, y2: midY, label: `${Math.round(bL - aR)}px` });
        } else if (bR <= aL) {
            lines.push({ x1: bR, y1: midY, x2: aL, y2: midY, label: `${Math.round(aL - bR)}px` });
        }
    } else {
        const hDist = Math.max(0, Math.max(aL, bL) - Math.min(aR, bR));
        if (hDist > 0) {
            const y = (aCY + bCY) / 2;
            if (aCX < bCX) {
                lines.push({ x1: aR, y1: y, x2: bL, y2: y, label: `${Math.round(hDist)}px` });
            } else {
                lines.push({ x1: bR, y1: y, x2: aL, y2: y, label: `${Math.round(hDist)}px` });
            }
        }
    }

    const overlapH = Math.max(0, Math.min(aR, bR) - Math.max(aL, bL));
    if (overlapH > 0) {
        const midX = (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
        if (aB <= bT) {
            lines.push({ x1: midX, y1: aB, x2: midX, y2: bT, label: `${Math.round(bT - aB)}px` });
        } else if (bB <= aT) {
            lines.push({ x1: midX, y1: bB, x2: midX, y2: aT, label: `${Math.round(aT - bB)}px` });
        }
    } else {
        const vDist = Math.max(0, Math.max(aT, bT) - Math.min(aB, bB));
        if (vDist > 0) {
            const x = (aCX + bCX) / 2;
            if (aCY < bCY) {
                lines.push({ x1: x, y1: aB, x2: x, y2: bT, label: `${Math.round(vDist)}px` });
            } else {
                lines.push({ x1: x, y1: bB, x2: x, y2: aT, label: `${Math.round(vDist)}px` });
            }
        }
    }

    return lines;
}

