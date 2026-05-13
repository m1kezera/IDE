/**
 * Design Studio — Selection Manager
 * Multi-select, group/ungroup, copy/paste style.
 */

export interface ElementStyle {
  [key: string]: any;
}

// Selection state
let selectedIds: Set<string> = new Set();
let copiedStyle: ElementStyle | null = null;

/** Get all selected IDs */
export function getSelectedIds(): Set<string> { return selectedIds; }

/** Check if an element is selected */
export function isSelected(id: string): boolean { return selectedIds.has(id); }

/** Select a single element (clears previous) */
export function selectOne(id: string): void {
  selectedIds.clear();
  selectedIds.add(id);
}

/** Toggle selection (for Shift+Click) */
export function toggleSelect(id: string): void {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
}

/** Add to selection without clearing */
export function addToSelection(id: string): void {
  selectedIds.add(id);
}

/** Select all elements from a list */
export function selectAll(ids: string[]): void {
  selectedIds.clear();
  ids.forEach(id => selectedIds.add(id));
}

/** Clear all selections */
export function clearSelection(): void {
  selectedIds.clear();
}

/** Get count of selected elements */
export function selectionCount(): number { return selectedIds.size; }

/** Copy style from an element */
export function copyStyle(style: ElementStyle): void {
  copiedStyle = { ...style };
}

/** Get copied style (or null) */
export function getCopiedStyle(): ElementStyle | null {
  return copiedStyle ? { ...copiedStyle } : null;
}

/** Check if there's a copied style available */
export function hasCopiedStyle(): boolean { return copiedStyle !== null; }

/**
 * Compute a bounding box for multiple elements (for group selection visual)
 * Elements need x,y,w,h for this to work (absolute positioning mode)
 */
export function computeBoundingBox(elements: { x: number; y: number; w: number; h: number }[]): { x: number; y: number; w: number; h: number } | null {
  if (elements.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.w);
    maxY = Math.max(maxY, el.y + el.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
