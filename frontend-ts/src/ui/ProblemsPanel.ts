/**
 * Lumina IDE — Problems Panel (v1.0)
 * Displays syntax errors and warnings in the terminal zone.
 * Checks files on save and on manual scan.
 */

import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

const isElectron = window.location.protocol === 'file:';
const API = isElectron ? 'http://127.0.0.1:8001/api' : '/api';

interface Diagnostic {
  line: number;
  col: number;
  severity: 'error' | 'warning';
  message: string;
}

interface FileProblems {
  path: string;
  diagnostics: Diagnostic[];
}

let problemsMap: Map<string, Diagnostic[]> = new Map();
let containerEl: HTMLElement | null = null;
let isVisible = false;

export function initProblemsPanel(): void {
  containerEl = document.getElementById('projecty-problems-container');

  // Wire the problems button
  const btn = document.getElementById('projecty-problems-btn');
  if (btn) {
    btn.addEventListener('click', () => toggleProblems());
  }

  // Listen for file saves to auto-check
  PubSub.on('file:saved', (data) => {
    const { path, content } = data as { path: string; content: string };
    checkFile(path, content);
  });

  // Listen for language changes
  PubSub.on('lang:changed', () => {
    if (isVisible) renderProblems();
    updateBadge();
  });
}

export function toggleProblems(): void {
  isVisible = !isVisible;
  const termContainer = document.getElementById('projecty-terminal-container');

  if (isVisible) {
    if (termContainer) termContainer.style.display = 'none';
    if (containerEl) {
      containerEl.style.display = 'flex';
      renderProblems();
    }
  } else {
    if (termContainer) termContainer.style.display = '';
    if (containerEl) containerEl.style.display = 'none';
  }

  // Update button active state
  const btn = document.getElementById('projecty-problems-btn');
  if (btn) btn.classList.toggle('active', isVisible);
}

async function checkFile(path: string, code: string): Promise<void> {
  try {
    const resp = await fetch(`${API}/workspace/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, code }),
    });
    const data = await resp.json() as FileProblems;

    if (data.diagnostics.length > 0) {
      problemsMap.set(path, data.diagnostics);
    } else {
      problemsMap.delete(path);
    }

    updateBadge();
    if (isVisible) renderProblems();
  } catch (err) {
    console.warn('[Problems] Failed to check file:', err);
  }
}

function updateBadge(): void {
  const btn = document.getElementById('projecty-problems-btn');
  if (!btn) return;

  let total = 0;
  problemsMap.forEach(diags => total += diags.length);

  const errorCount = Array.from(problemsMap.values()).flat().filter(d => d.severity === 'error').length;
  const warnCount = total - errorCount;

  if (total > 0) {
    btn.innerHTML = `⚠ ${t('problems.title')} <span style="background:var(--accent-red,#f38ba8);color:#000;border-radius:8px;padding:0 5px;font-size:9px;margin-left:4px;">${errorCount}</span>${warnCount > 0 ? `<span style="background:var(--accent-yellow,#fab387);color:#000;border-radius:8px;padding:0 5px;font-size:9px;margin-left:2px;">${warnCount}</span>` : ''}`;
  } else {
    btn.textContent = `⚠ ${t('problems.title')}`;
  }
}

function renderProblems(): void {
  if (!containerEl) return;

  if (problemsMap.size === 0) {
    containerEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-muted);gap:8px;">
        <span style="font-size:28px;opacity:0.4;">✅</span>
        <span style="font-size:12px;">${t('problems.no_issues')}</span>
      </div>
    `;
    return;
  }

  let html = '<div style="padding:4px 0;overflow-y:auto;height:100%;">';

  problemsMap.forEach((diags, filePath) => {
    const fileName = filePath.split(/[\\/]/).pop() || filePath;
    html += `<div style="padding:4px 12px;font-size:11px;color:var(--text-muted);font-weight:600;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
      <span>📄 ${fileName}</span>
      <span style="font-size:9px;opacity:0.5;">${filePath}</span>
      <span style="margin-left:auto;font-size:9px;background:var(--bg-overlay);padding:1px 6px;border-radius:4px;">${diags.length}</span>
    </div>`;

    for (const d of diags) {
      const icon = d.severity === 'error' ? '🔴' : '🟡';
      const color = d.severity === 'error' ? 'var(--accent-red, #f38ba8)' : 'var(--accent-yellow, #fab387)';
      html += `<div class="problem-row" data-path="${filePath}" data-line="${d.line}" style="padding:3px 12px 3px 24px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.15s;">
        <span>${icon}</span>
        <span style="color:${color};min-width:60px;">[Ln ${d.line}${d.col ? ':' + d.col : ''}]</span>
        <span style="color:var(--text);flex:1;">${d.message}</span>
        <span style="color:var(--text-muted);font-size:9px;">${d.severity === 'error' ? t('problems.error') : t('problems.warning')}</span>
      </div>`;
    }
  });

  html += '</div>';
  containerEl.innerHTML = html;

  // Add hover effects
  containerEl.querySelectorAll('.problem-row').forEach(row => {
    row.addEventListener('mouseenter', () => (row as HTMLElement).style.background = 'rgba(255,255,255,0.04)');
    row.addEventListener('mouseleave', () => (row as HTMLElement).style.background = 'transparent');
    row.addEventListener('click', () => {
      const path = (row as HTMLElement).dataset.path;
      const line = parseInt((row as HTMLElement).dataset.line || '1');
      if (path) {
        PubSub.emit('file:open', path);
        PubSub.emit('editor:goto', { line });
      }
    });
  });
}
