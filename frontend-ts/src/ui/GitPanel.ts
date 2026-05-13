/**
 * Lumina IDE — Git Panel (v1.0)
 * Source control: status, commit, push/pull, branch, log.
 */

import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

const isElectronGit = window.location.protocol === 'file:';
const API = isElectronGit ? 'http://127.0.0.1:8001/api' : '/api';

interface GitFile { path: string; status: string; code: string; }
interface GitCommit { hash: string; message: string; }

let currentBranch = '';
let changedFiles: GitFile[] = [];
let isRepo = false;

export function initGitPanel(): void {
  renderPanel();
  pollGitStatus();
  setInterval(pollGitStatus, 8000);

  PubSub.on('panel:toggle', (id) => { if (id === 'git') renderPanel(); });
  PubSub.on('workspace:set', () => { setTimeout(pollGitStatus, 1000); });
}

// ─── Poll status ────────────────────────────────────────────────────
async function pollGitStatus(): Promise<void> {
  try {
    const r = await fetch(`${API}/git/status`);
    const d = await r.json();
    isRepo = d.is_repo;
    currentBranch = d.branch || '';
    changedFiles = d.files || [];

    // Update status bar branch
    const brEl = document.getElementById('projecty-git-branch');
    if (brEl) brEl.textContent = isRepo ? (currentBranch ? `⎇ ${currentBranch}` : `⎇ ${t('git.no_branch')}`) : '';

    renderPanel();
  } catch (err) { console.warn('[Git] Failed to poll git status:', err); }
}

// ─── Render ─────────────────────────────────────────────────────────
function renderPanel(): void {
  const p = document.getElementById('projecty-panel-git');
  if (!p) return;

  if (!isRepo) {
    p.innerHTML = `
      <div class="panel-header">${t('panel.git')}</div>
      <div style="padding:12px;text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">🔀</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;">${t('git.no_changes')}</div>
        <button id="git-init-btn" style="padding:6px 16px;border:none;border-radius:4px;background:var(--accent);color:#000;cursor:pointer;font-size:11px;font-weight:bold;">${t('git.commit_btn')}</button>
      </div>
    `;
    p.querySelector('#git-init-btn')?.addEventListener('click', async () => {
      await fetch(`${API}/git/init`, { method: 'POST' });
      pollGitStatus();
    });
    return;
  }

  // Status icons
  const statusIcon = (s: string) => {
    const map: Record<string, string> = { modified: '<span style="color:#f9e2af;">M</span>', added: '<span style="color:#a6e3a1;">A</span>', deleted: '<span style="color:#f38ba8;">D</span>', untracked: '<span style="color:#89b4fa;">U</span>', conflict: '<span style="color:#fab387;">C</span>', renamed: '<span style="color:#cba6f7;">R</span>' };
    return map[s] || `<span style="color:var(--text-muted);">${s}</span>`;
  };

  const filesHtml = changedFiles.length > 0 ? changedFiles.map(f => `
    <div class="git-file" data-path="${f.path}" style="display:flex;align-items:center;gap:6px;padding:3px 8px;cursor:pointer;border-radius:3px;font-size:10px;" title="${f.path}">
      ${statusIcon(f.status)}
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);">${f.path}</span>
    </div>
  `).join('') : `<div style="text-align:center;color:var(--text-muted);font-size:10px;padding:8px;">${t('git.no_changes')}</div>`;

  p.innerHTML = `
    <div class="panel-header">${t('panel.git')}</div>
    <div style="padding:6px 10px;font-size:12px;">

      <!-- Branch -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="font-size:12px;">⎇</span>
          <select id="git-branch-sel" style="background:var(--bg-overlay);color:var(--text);border:1px solid var(--border);border-radius:3px;padding:2px 6px;font-size:10px;outline:none;cursor:pointer;max-width:120px;">
            <option>${currentBranch}</option>
          </select>
        </div>
        <div style="display:flex;gap:3px;">
          <button id="git-pull-btn" title="Pull" style="padding:3px 6px;border:none;border-radius:3px;background:var(--bg-overlay);color:var(--text);cursor:pointer;font-size:10px;border:1px solid var(--border);">⬇ Pull</button>
          <button id="git-push-btn" title="Push" style="padding:3px 6px;border:none;border-radius:3px;background:var(--accent);color:#000;cursor:pointer;font-size:10px;font-weight:bold;">⬆ Push</button>
        </div>
      </div>

      <!-- Commit input -->
      <div style="margin-bottom:8px;">
        <input id="git-msg" type="text" placeholder="${t('git.commit_placeholder') || t('git.message_placeholder')}" style="width:100%;padding:5px 8px;background:var(--bg-overlay);border:1px solid var(--border);border-radius:4px;color:var(--text);font-size:10px;outline:none;box-sizing:border-box;margin-bottom:4px;" />
        <button id="git-commit-btn" style="width:100%;padding:5px;border:none;border-radius:4px;background:var(--accent-green,#a6e3a1);color:#000;cursor:pointer;font-size:10px;font-weight:bold;">✓ ${t('git.commit_btn')} (${changedFiles.length} ${changedFiles.length!==1?t('git.files_plural'):t('git.files')})</button>
      </div>

      <!-- Changed files -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${t('git.changes')} (${changedFiles.length})</span>
        <button id="git-refresh" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:9px;" title="${t('git.refresh')}">🔄</button>
      </div>
      <div style="max-height:150px;overflow-y:auto;margin-bottom:8px;">
        ${filesHtml}
      </div>

      <!-- Diff viewer -->
      <div id="git-diff-view" style="display:none;margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <span id="git-diff-title" style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Diff</span>
          <button id="git-diff-close" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:9px;">✕</button>
        </div>
        <pre id="git-diff-content" style="background:var(--bg-overlay);border:1px solid var(--border);border-radius:4px;padding:6px;font-size:9px;font-family:'JetBrains Mono',monospace;overflow:auto;max-height:180px;margin:0;white-space:pre-wrap;word-break:break-all;"></pre>
      </div>

      <div style="height:1px;background:var(--border);margin:6px 0;"></div>

      <!-- Recent commits -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <span style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">${t('git.recent_commits')}</span>
      </div>
      <div id="git-log" style="max-height:120px;overflow-y:auto;">
        <div style="text-align:center;color:var(--text-muted);font-size:10px;padding:6px;">${t('git.loading')}</div>
      </div>
    </div>

    <style>
      .git-file:hover{background:rgba(255,255,255,0.04);}
    </style>
  `;

  // ─── Wire events ──────
  // Commit
  p.querySelector('#git-commit-btn')?.addEventListener('click', async () => {
    const inp = document.getElementById('git-msg') as HTMLInputElement;
    const msg = inp?.value.trim();
    if (!msg) { inp?.focus(); return; }

    const btn = p.querySelector('#git-commit-btn') as HTMLButtonElement;
    if (btn) { btn.textContent = `⏳ ${t('git.committing')}`; btn.disabled = true; }

    try {
      const r = await fetch(`${API}/git/commit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const d = await r.json();
      if (d.ok) { inp.value = ''; pollGitStatus(); loadLog(); }
      else { if (btn) btn.textContent = `✗ ${d.error?.substring(0, 30) || 'Erro'}`; }
    } catch { if (btn) btn.textContent = `✗ ${t('git.network_error')}`; }

    setTimeout(() => pollGitStatus(), 1000);
  });

  // Enter to commit
  (p.querySelector('#git-msg') as HTMLInputElement)?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') p.querySelector('#git-commit-btn')?.dispatchEvent(new Event('click'));
  });

  // Push
  p.querySelector('#git-push-btn')?.addEventListener('click', async () => {
    const btn = p.querySelector('#git-push-btn') as HTMLButtonElement;
    if (btn) btn.textContent = '⏳...';
    const r = await fetch(`${API}/git/push`, { method: 'POST' });
    const d = await r.json();
    if (btn) btn.textContent = d.ok ? '✓ Push OK' : '✗ Erro';
    setTimeout(() => { if (btn) btn.textContent = '⬆ Push'; }, 3000);
  });

  // Pull
  p.querySelector('#git-pull-btn')?.addEventListener('click', async () => {
    const btn = p.querySelector('#git-pull-btn') as HTMLButtonElement;
    if (btn) btn.textContent = '⏳...';
    const r = await fetch(`${API}/git/pull`, { method: 'POST' });
    const d = await r.json();
    if (btn) btn.textContent = d.ok ? '✓ Pull OK' : '✗ Erro';
    setTimeout(() => { if (btn) btn.textContent = '⬇ Pull'; pollGitStatus(); }, 3000);
  });

  // Refresh
  p.querySelector('#git-refresh')?.addEventListener('click', () => pollGitStatus());

  // File click → show diff
  p.querySelectorAll('.git-file').forEach(el => {
    el.addEventListener('click', async () => {
      const path = (el as HTMLElement).dataset.path || '';
      try {
        const r = await fetch(`${API}/git/diff?file=${encodeURIComponent(path)}`);
        const d = await r.json();
        const view = document.getElementById('git-diff-view');
        const content = document.getElementById('git-diff-content');
        const title = document.getElementById('git-diff-title');
        if (view && content && title) {
          view.style.display = 'block';
          title.textContent = `Diff: ${path}`;
          content.innerHTML = colorDiff(d.diff || t('git.no_diff'));
        }
      } catch (err) { console.warn('[Git] Failed to load diff:', err); }
    });
  });

  // Close diff
  p.querySelector('#git-diff-close')?.addEventListener('click', () => {
    const view = document.getElementById('git-diff-view');
    if (view) view.style.display = 'none';
  });

  // Load branches
  loadBranches();
  loadLog();
}

// ─── Helpers ────────────────────────────────────────────────────────
function colorDiff(diff: string): string {
  return diff.split('\n').map(line => {
    if (line.startsWith('+') && !line.startsWith('+++')) return `<span style="color:#a6e3a1;">${escHtml(line)}</span>`;
    if (line.startsWith('-') && !line.startsWith('---')) return `<span style="color:#f38ba8;">${escHtml(line)}</span>`;
    if (line.startsWith('@@')) return `<span style="color:#89b4fa;">${escHtml(line)}</span>`;
    return escHtml(line);
  }).join('\n');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function loadBranches(): Promise<void> {
  try {
    const r = await fetch(`${API}/git/branch`);
    const d = await r.json();
    const sel = document.getElementById('git-branch-sel') as HTMLSelectElement;
    if (sel && d.branches) {
      sel.innerHTML = d.branches.map((b: string) =>
        `<option value="${b}" ${b === d.current ? 'selected' : ''}>${b}</option>`
      ).join('');
      sel.addEventListener('change', async () => {
        await fetch(`${API}/git/checkout`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch: sel.value })
        });
        pollGitStatus();
      });
    }
  } catch (err) { console.warn('[Git] Failed to load branches:', err); }
}

async function loadLog(): Promise<void> {
  try {
    const r = await fetch(`${API}/git/log?count=10`);
    const d = await r.json();
    const el = document.getElementById('git-log');
    if (el && d.commits) {
      el.innerHTML = (d.commits.length > 0) ? d.commits.map((c: GitCommit) => `
        <div style="display:flex;gap:6px;padding:2px 4px;font-size:10px;">
          <span style="color:var(--accent);font-family:'JetBrains Mono',monospace;font-size:9px;min-width:50px;">${c.hash}</span>
          <span style="color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.message}</span>
        </div>
      `).join('') : '<div style="text-align:center;color:var(--text-muted);font-size:10px;padding:6px;">Nenhum commit</div>';
    }
  } catch (err) { console.warn('[Git] Failed to load commit log:', err); }
}
