/**
 * Design Studio — Undo/Redo History Engine
 * Maintains a stack of deep-cloned state snapshots.
 * Max 80 entries. Supports branching (redo stack cleared on new push).
 *
 * Used by: WebStudioPanel (directly), DesignStudioPanel (inline system — to be migrated).
 */

export interface HistorySnapshot {
  artboards: any[];
  selectedElementId: string | null;
  activeArtboardId: string | null;
}

const MAX_HISTORY = 80;

let undoStack: string[] = [];  // JSON-stringified snapshots
let redoStack: string[] = [];
let isPaused = false;

/** Pause history recording (e.g. during undo/redo restore) */
export function pauseHistory(): void { isPaused = true; }
export function resumeHistory(): void { isPaused = false; }

/** Push a state snapshot. Clears redo stack (branching). */
export function pushState(snapshot: HistorySnapshot): void {
  if (isPaused) return;
  try {
    const serialized = JSON.stringify(snapshot);
    // Avoid duplicate consecutive states
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === serialized) return;
    undoStack.push(serialized);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = []; // New action clears redo
  } catch { /* ignore serialization errors */ }
}

/** Undo: pop from undo stack, push current to redo, return previous state */
export function undo(currentState: HistorySnapshot): HistorySnapshot | null {
  if (undoStack.length === 0) return null;
  try {
    // Save current state to redo
    redoStack.push(JSON.stringify(currentState));
    // Restore previous
    const prev = undoStack.pop()!;
    return JSON.parse(prev) as HistorySnapshot;
  } catch { return null; }
}

/** Redo: pop from redo stack, push current to undo, return next state */
export function redo(currentState: HistorySnapshot): HistorySnapshot | null {
  if (redoStack.length === 0) return null;
  try {
    undoStack.push(JSON.stringify(currentState));
    const next = redoStack.pop()!;
    return JSON.parse(next) as HistorySnapshot;
  } catch { return null; }
}

export function canUndo(): boolean { return undoStack.length > 0; }
export function canRedo(): boolean { return redoStack.length > 0; }
export function clearHistory(): void { undoStack = []; redoStack = []; }
export function historySize(): { undo: number; redo: number } {
  return { undo: undoStack.length, redo: redoStack.length };
}
