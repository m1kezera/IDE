/**
 * Design Studio — Comments / Annotations
 * Place comment pins on the canvas for collaboration.
 */

export interface DSComment {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
  artboardId: string;
}

let comments: DSComment[] = [];
let commentMode = false;

export function isCommentMode(): boolean { return commentMode; }
export function toggleCommentMode(): boolean { commentMode = !commentMode; return commentMode; }
export function setCommentMode(v: boolean): void { commentMode = v; }
export function getComments(): DSComment[] { return comments; }
export function getCommentsByArtboard(abId: string): DSComment[] { return comments.filter(c => c.artboardId === abId); }

export function addComment(abId: string, x: number, y: number, text: string, author: string = 'Designer'): DSComment {
  const c: DSComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    x, y, text, author,
    timestamp: Date.now(),
    resolved: false,
    artboardId: abId,
  };
  comments.push(c);
  return c;
}

export function resolveComment(id: string): void {
  const c = comments.find(c => c.id === id);
  if (c) c.resolved = !c.resolved;
}

export function deleteComment(id: string): void {
  comments = comments.filter(c => c.id !== id);
}

export function updateCommentText(id: string, text: string): void {
  const c = comments.find(c => c.id === id);
  if (c) c.text = text;
}

export function loadComments(data: DSComment[]): void {
  comments = data || [];
}

export function serializeComments(): DSComment[] {
  return comments;
}

// ─── Comment Rendering ──────────────────────────────────────────────

export function renderCommentPins(
  container: HTMLElement,
  abId: string,
  onSelect: (comment: DSComment) => void,
): void {
  // Remove old pins
  container.querySelectorAll('.ds-comment-pin').forEach(el => el.remove());

  const abComments = getCommentsByArtboard(abId);
  for (let i = 0; i < abComments.length; i++) {
    const c = abComments[i];
    const pin = document.createElement('div');
    pin.className = `ds-comment-pin ${c.resolved ? 'resolved' : ''}`;
    pin.dataset.commentId = c.id;
    pin.style.cssText = `
      position: absolute; left: ${c.x}px; top: ${c.y}px;
      width: 24px; height: 24px; border-radius: 50% 50% 50% 0;
      background: ${c.resolved ? '#585b70' : '#7c3aed'};
      color: #fff; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 25; transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.15s;
    `;
    pin.innerHTML = `<span style="transform:rotate(45deg)">${i + 1}</span>`;

    pin.addEventListener('mouseenter', () => { pin.style.transform = 'rotate(-45deg) scale(1.2)'; });
    pin.addEventListener('mouseleave', () => { pin.style.transform = 'rotate(-45deg) scale(1)'; });

    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(c);
    });

    container.appendChild(pin);
  }
}

/** Render the comment detail popover */
export function showCommentPopover(
  comment: DSComment,
  anchorX: number,
  anchorY: number,
  onResolve: () => void,
  onDelete: () => void,
  onUpdate: (text: string) => void,
  onClose: () => void,
): HTMLElement {
  document.querySelector('.ds-comment-popover')?.remove();

  const pop = document.createElement('div');
  pop.className = 'ds-comment-popover';
  pop.style.cssText = `
    position: fixed; left: ${anchorX + 30}px; top: ${anchorY - 10}px;
    width: 260px; background: #1e1e2e; border: 1px solid #313244;
    border-radius: 10px; padding: 12px; z-index: 40001;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: ds-ctx-appear 0.15s ease;
  `;

  pop.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <div style="width:24px;height:24px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">${(comment.author || 'D')[0]}</div>
        <div>
          <div style="font-size:11px;font-weight:600;color:#cdd6f4;">${comment.author}</div>
          <div style="font-size:9px;color:#585b70;">${new Date(comment.timestamp).toLocaleString()}</div>
        </div>
      </div>
      <button class="ds-comment-close" style="background:none;border:none;color:#585b70;cursor:pointer;font-size:14px;">✕</button>
    </div>
    <textarea class="ds-comment-textarea" style="width:100%;min-height:60px;background:#11111b;border:1px solid #313244;color:#cdd6f4;border-radius:6px;padding:8px;font-size:11px;resize:vertical;outline:none;box-sizing:border-box;">${comment.text}</textarea>
    <div style="display:flex;gap:4px;margin-top:8px;">
      <button class="ds-comment-resolve" style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid ${comment.resolved ? '#a6e3a1' : '#313244'};background:${comment.resolved ? 'rgba(166,227,161,0.1)' : 'transparent'};color:${comment.resolved ? '#a6e3a1' : '#585b70'};font-size:10px;cursor:pointer;">${comment.resolved ? '✅ Resolved' : '☐ Resolve'}</button>
      <button class="ds-comment-delete" style="padding:4px 8px;border-radius:6px;border:1px solid #f38ba8;background:transparent;color:#f38ba8;font-size:10px;cursor:pointer;">🗑️</button>
    </div>
  `;

  pop.querySelector('.ds-comment-close')?.addEventListener('click', () => { pop.remove(); onClose(); });
  pop.querySelector('.ds-comment-resolve')?.addEventListener('click', () => { onResolve(); pop.remove(); });
  pop.querySelector('.ds-comment-delete')?.addEventListener('click', () => { onDelete(); pop.remove(); });

  const textarea = pop.querySelector('.ds-comment-textarea') as HTMLTextAreaElement;
  textarea?.addEventListener('blur', () => { onUpdate(textarea.value); });

  // Close on outside click
  setTimeout(() => {
    const closer = (e: MouseEvent) => {
      if (!pop.contains(e.target as Node)) { pop.remove(); onClose(); document.removeEventListener('click', closer); }
    };
    document.addEventListener('click', closer);
  }, 50);

  document.body.appendChild(pop);
  return pop;
}

/** Render comments list for sidebar panel */
export function renderCommentsPanel(
  abId: string,
  onSelect: (c: DSComment) => void,
  onResolve: (id: string) => void,
  onDelete: (id: string) => void,
): HTMLElement {
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px;';

  const abComments = getCommentsByArtboard(abId);

  if (abComments.length === 0) {
    panel.innerHTML = '<div style="text-align:center;padding:20px;color:#585b70;font-size:11px;">No comments yet.<br>Click 💬 in toolbar to add one.</div>';
    return panel;
  }

  for (let i = 0; i < abComments.length; i++) {
    const c = abComments[i];
    const card = document.createElement('div');
    card.style.cssText = `background:#11111b;border:1px solid ${c.resolved ? '#585b70' : '#313244'};border-radius:8px;padding:8px;cursor:pointer;transition:all 0.15s;${c.resolved ? 'opacity:0.5;' : ''}`;

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:700;color:#7c3aed;">#${i + 1}</span>
        <span style="font-size:8px;color:#585b70;">${new Date(c.timestamp).toLocaleTimeString()}</span>
      </div>
      <div style="font-size:11px;color:#cdd6f4;line-height:1.4;max-height:40px;overflow:hidden;text-overflow:ellipsis;">${(c.text || 'Empty comment').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div style="display:flex;gap:4px;margin-top:6px;">
        <button class="ds-cmnt-resolve" style="font-size:8px;padding:2px 6px;border-radius:4px;border:1px solid #313244;background:transparent;color:#585b70;cursor:pointer;">${c.resolved ? '↩️' : '✅'}</button>
        <button class="ds-cmnt-delete" style="font-size:8px;padding:2px 6px;border-radius:4px;border:1px solid #f38ba8;background:transparent;color:#f38ba8;cursor:pointer;">🗑️</button>
      </div>
    `;

    card.addEventListener('click', () => onSelect(c));
    card.querySelector('.ds-cmnt-resolve')?.addEventListener('click', (e) => { e.stopPropagation(); onResolve(c.id); });
    card.querySelector('.ds-cmnt-delete')?.addEventListener('click', (e) => { e.stopPropagation(); onDelete(c.id); });

    card.addEventListener('mouseenter', () => { card.style.borderColor = '#7c3aed'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = c.resolved ? '#585b70' : '#313244'; });

    panel.appendChild(card);
  }

  return panel;
}
