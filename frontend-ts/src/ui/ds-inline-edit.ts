/**
 * Design Studio — Inline Text Editing
 * Double-click on text elements to edit directly on the canvas.
 */

let isEditing = false;
let activeEditor: HTMLElement | null = null;

/** Text-capable component IDs and their primary text prop key */
const TEXT_PROP_MAP: Record<string, string> = {
  'text-block': 'text',
  'hero-centered': 'headline',
  'hero-split': 'headline',
  'blockquote': 'text',
  'cta-section': 'title',
  'heading': 'text',
  'paragraph': 'text',
  'pricing-table': 'title',
  'feature-grid': 'title',
  'nav-bar': 'brand',
  'footer': 'company',
  'testimonial-card': 'name',
  'stats-bar': 'label1',
  'image-banner': 'title',
  'login-form': 'title',
};

/** Check if currently editing inline */
export function isInlineEditing(): boolean {
  return isEditing;
}

/** Set up double-click handlers on element content areas */
export function setupInlineEdit(
  container: HTMLElement,
  elementId: string,
  componentId: string,
  currentProps: Record<string, string>,
  onSave: (elementId: string, propKey: string, value: string) => void,
): void {
  const propKey = TEXT_PROP_MAP[componentId];
  if (!propKey) return; // not a text-editable component

  const contentEl = container.querySelector('.ds-element-content');
  if (!contentEl) return;

  contentEl.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEditing) return;
    // Pass onSave directly via closure — no shared mutable state
    startEditing(contentEl as HTMLElement, elementId, propKey, currentProps[propKey] || '', onSave);
  });
}

function startEditing(
  contentEl: HTMLElement,
  elementId: string,
  propKey: string,
  currentValue: string,
  onSave: (elementId: string, propKey: string, value: string) => void,
): void {
  isEditing = true;

  // Create editable overlay
  const editor = document.createElement('div');
  editor.className = 'ds-inline-editor';
  editor.contentEditable = 'true';
  editor.spellcheck = false;

  // Match text styling from the content
  const firstText = contentEl.querySelector('h1, h2, h3, h4, h5, h6, p, span, div, blockquote, a');

  editor.style.cssText = `
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.85);
    border: 2px solid #7c3aed;
    border-radius: 4px;
    padding: 12px;
    outline: none;
    overflow: auto;
    z-index: 100;
    min-height: 40px;
    white-space: pre-wrap;
    word-wrap: break-word;
    cursor: text;
  `;

  // Apply font styles AFTER cssText so they don't get overwritten
  if (firstText) {
    const cs = getComputedStyle(firstText);
    editor.style.fontSize = cs.fontSize;
    editor.style.fontWeight = cs.fontWeight;
    editor.style.fontFamily = cs.fontFamily;
    editor.style.color = cs.color;
    editor.style.letterSpacing = cs.letterSpacing;
    editor.style.lineHeight = cs.lineHeight;
    editor.style.textAlign = cs.textAlign;
  }

  editor.textContent = currentValue;

  // Save on blur
  editor.addEventListener('blur', () => {
    finishEditing(editor, elementId, propKey, onSave);
  });

  // Handle keyboard
  editor.addEventListener('keydown', (e) => {
    e.stopPropagation(); // prevent design studio shortcuts

    if (e.key === 'Escape') {
      isEditing = false;
      editor.remove();
      activeEditor = null;
      return;
    }

    // Ctrl+Enter to save
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      editor.blur();
      return;
    }

    // Regular Enter = newline (don't prevent)
  });

  // Prevent click from propagating
  editor.addEventListener('click', (e) => e.stopPropagation());
  editor.addEventListener('mousedown', (e) => e.stopPropagation());

  // Mount
  contentEl.style.position = 'relative';
  contentEl.appendChild(editor);
  activeEditor = editor;

  // Focus and select all
  requestAnimationFrame(() => {
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  });
}

function finishEditing(editor: HTMLElement, elementId: string, propKey: string, onSave: (elementId: string, propKey: string, value: string) => void): void {
  if (!isEditing) return;
  const newValue = editor.textContent || '';
  isEditing = false;
  editor.remove();
  activeEditor = null;
  onSave(elementId, propKey, newValue);
}

/** Force close any active editor */
export function cancelInlineEdit(): void {
  if (activeEditor) {
    isEditing = false;
    activeEditor.remove();
    activeEditor = null;
  }
}
