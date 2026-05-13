/**
 * Lumina IDE — LLM Panel (v2.0)
 * Ollama model manager with system info, size filters, scrollbar.
 */

import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

const isElectron = window.location.protocol === 'file:';
const API = isElectron ? 'http://127.0.0.1:8001/api' : '/api';

interface CatalogModel {
  id: string;
  name: string;
  params?: string;
  desc: string;
  ram: string;
  vram: string;
  disk: string;
  tags: string[];
  installed: boolean;
  installed_name?: string;
}

interface SysInfo {
  ram_total: string; ram_free: string;
  disk_total: string; disk_free: string;
  vram_total: string; vram_free: string;
}

let panelEl: HTMLElement | null = null;
const pullingModels = new Set<string>();
let activeFilter = 'all';

const FILTERS = [
  { id: 'all', label: t('llm.all') },
  { id: '0-3', label: '≤3B' },
  { id: '6-8', label: '6-8B' },
  { id: '13-14', label: '13-14B' },
  { id: '24-35', label: '24-35B' },
  { id: '70+', label: '70B+' },
  { id: 'installed', label: '✅' },
];

export function initLLMPanel(): void {
  panelEl = document.getElementById('projecty-panel-llm');
  if (!panelEl) return;

  PubSub.on('panel:toggle', (id) => {
    if (id === 'llm') setTimeout(() => renderPanel(), 100);
  });
  PubSub.on('lang:changed', () => {
    if (panelEl && !panelEl.classList.contains('hidden')) renderPanel();
  });
}

function parseParamSize(params: string | undefined): number {
  if (!params) return 0;
  const m = params.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}

function matchesFilter(m: CatalogModel): boolean {
  if (activeFilter === 'all') return true;
  if (activeFilter === 'installed') return m.installed;
  const size = parseParamSize(m.params);
  switch (activeFilter) {
    case '0-3': return size > 0 && size <= 3.9;
    case '6-8': return size >= 6 && size <= 9.9;
    case '13-14': return size >= 10 && size <= 16;
    case '24-35': return size >= 17 && size <= 49;
    case '70+': return size >= 50;
    default: return true;
  }
}

async function renderPanel(): Promise<void> {
  if (!panelEl) return;

  panelEl.innerHTML =
    '<div class="panel-header">🧠 ' + t('llm.title') + '</div>'
    + '<div style="padding:8px 10px;"><p style="font-size:9px;color:var(--text-muted);">⏳ ' + t('llm.loading') + '</p></div>';

  // Fetch system info + catalog in parallel
  let sysInfo: SysInfo = { ram_total: '?', ram_free: '?', disk_total: '?', disk_free: '?', vram_total: '?', vram_free: '?' };
  let catalog: CatalogModel[] = [];
  let ollamaOk = false;

  try {
    const [sysResp, catResp] = await Promise.all([
      fetch(`${API}/ollama/sysinfo`).catch(() => null),
      fetch(`${API}/ollama/available`),
    ]);
    if (sysResp) sysInfo = await sysResp.json();
    const catData = await catResp.json();
    catalog = catData.catalog || [];
    ollamaOk = !catData.error;
  } catch {
    panelEl.innerHTML = '<div class="panel-header">🧠 ' + t('llm.title') + '</div>'
      + '<div style="padding:12px;"><p style="font-size:10px;">❌ ' + t('llm.error') + '</p></div>';
    return;
  }

  const filtered = catalog.filter(matchesFilter);
  const installed = filtered.filter(m => m.installed);
  const available = filtered.filter(m => !m.installed);

  let html = '<div class="panel-header">🧠 ' + t('llm.title') + '</div>';

  // Custom scrollbar styles
  html += '<style>'
    + '#projecty-panel-llm:not(.hidden){display:flex!important;flex-direction:column;height:100%;overflow:hidden}'
    + '#llm-scroll::-webkit-scrollbar{width:5px}'
    + '#llm-scroll::-webkit-scrollbar-track{background:transparent}'
    + '#llm-scroll::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}'
    + '#llm-scroll::-webkit-scrollbar-thumb:hover{background:var(--accent)}'
    + '.llm-pull:hover{background:rgba(0,163,255,0.15)!important;transform:scale(1.03)}'
    + '.llm-delete:hover{background:rgba(255,100,100,0.15)!important}'
    + '.llm-filter.active{background:var(--accent)!important;color:#000!important;font-weight:bold!important}'
    + '.llm-filter:hover{border-color:var(--accent)!important}'
    + '</style>';

  html += '<div id="llm-scroll" style="padding:6px 8px;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;">';

  // System info card
  html += '<div style="padding:8px 10px;border-radius:6px;background:var(--bg-overlay);border:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:9px;">'
    + '<div style="grid-column:1/-1;font-size:10px;font-weight:700;color:var(--text);margin-bottom:2px;">💻 ' + t('llm.your_system') + '</div>'
    + '<div><span style="color:var(--text-muted);">🧠 RAM:</span> <span style="color:var(--accent-green);">' + sysInfo.ram_free + '</span> / ' + sysInfo.ram_total + '</div>'
    + '<div><span style="color:var(--text-muted);">🎮 VRAM:</span> <span style="color:var(--accent-green);">' + sysInfo.vram_free + '</span> / ' + sysInfo.vram_total + '</div>'
    + '<div style="grid-column:1/-1;"><span style="color:var(--text-muted);">💾 Disco:</span> <span style="color:var(--accent-green);">' + sysInfo.disk_free + '</span> / ' + sysInfo.disk_total + '</div>'
    + '</div>';

  // Ollama status
  html += '<div style="padding:4px 8px;border-radius:4px;font-size:8px;'
    + 'background:' + (ollamaOk ? 'rgba(100,255,100,0.05)' : 'rgba(255,100,100,0.05)') + ';'
    + 'border:1px solid ' + (ollamaOk ? 'rgba(100,255,100,0.12)' : 'rgba(255,100,100,0.12)') + ';'
    + 'color:' + (ollamaOk ? 'var(--accent-green)' : 'var(--accent-red)') + ';">'
    + (ollamaOk
      ? '✅ Ollama — ' + catalog.filter(c => c.installed).length + ' ' + t('llm.models_installed')
      : '❌ Ollama ' + t('llm.not_found'))
    + '</div>';

  // Filter buttons
  html += '<div style="display:flex;gap:3px;flex-wrap:wrap;">';
  for (const f of FILTERS) {
    html += '<button class="llm-filter' + (activeFilter === f.id ? ' active' : '') + '" data-filter="' + f.id + '" '
      + 'style="font-size:8px;padding:2px 7px;border-radius:3px;cursor:pointer;transition:all 0.15s;'
      + 'background:' + (activeFilter === f.id ? 'var(--accent)' : 'var(--bg-overlay)') + ';'
      + 'color:' + (activeFilter === f.id ? '#000' : 'var(--text-muted)') + ';'
      + 'border:1px solid ' + (activeFilter === f.id ? 'var(--accent)' : 'var(--border)') + ';">'
      + f.label + '</button>';
  }
  html += '</div>';

  // Installed
  if (installed.length > 0) {
    html += '<div style="font-size:9px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;">✅ ' + t('llm.installed') + ' (' + installed.length + ')</div>';
    for (const m of installed) html += renderModelCard(m, true);
  }

  // Available
  if (available.length > 0) {
    html += '<div style="font-size:9px;font-weight:700;color:var(--text);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">📥 ' + t('llm.available') + ' (' + available.length + ')</div>';
    for (const m of available) html += renderModelCard(m, false);
  }

  if (filtered.length === 0) {
    html += '<p style="font-size:10px;color:var(--text-muted);text-align:center;padding:16px;">' + t('llm.no_filter') + '</p>';
  }

  html += '</div>';
  panelEl.innerHTML = html;

  // Wire events
  panelEl.querySelectorAll('.llm-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = (btn as HTMLElement).dataset.filter || 'all';
      renderPanel();
    });
  });
  panelEl.querySelectorAll('.llm-pull').forEach(btn => {
    btn.addEventListener('click', () => pullModel((btn as HTMLElement).dataset.model || ''));
  });
  panelEl.querySelectorAll('.llm-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteModel((btn as HTMLElement).dataset.model || ''));
  });
}

function renderModelCard(m: CatalogModel, isInstalled: boolean): string {
  const isPulling = pullingModels.has(m.id);
  const tagColors: Record<string, string> = {
    fast: '#4ade80', light: '#60a5fa', balanced: '#facc15', recommended: '#f472b6',
    pro: '#c084fc', code: '#38bdf8', versatile: '#34d399', moe: '#818cf8',
    quality: '#fb923c', reasoning: '#e879f9', local: '#94a3b8',
  };

  const tags = m.tags.map(tag =>
    '<span style="font-size:7px;padding:1px 4px;border-radius:2px;background:' + (tagColors[tag] || '#666') + '18;color:' + (tagColors[tag] || '#888') + ';font-weight:600;text-transform:uppercase;">' + tag + '</span>'
  ).join(' ');

  const paramsBadge = m.params
    ? '<span style="font-size:8px;padding:1px 4px;border-radius:2px;background:var(--accent);color:#000;font-weight:700;">' + m.params.toUpperCase() + '</span>'
    : '';

  let actionBtn = '';
  if (isPulling) {
    actionBtn = '<span style="font-size:7px;color:var(--accent-yellow);">⏳</span>';
  } else if (isInstalled) {
    actionBtn = '<button class="llm-delete" data-model="' + (m.installed_name || m.id) + '" style="font-size:7px;padding:1px 6px;border:1px solid rgba(255,100,100,0.2);background:rgba(255,100,100,0.05);color:var(--accent-red);border-radius:2px;cursor:pointer;transition:all 0.15s;">🗑️</button>';
  } else {
    actionBtn = '<button class="llm-pull" data-model="' + m.id + '" style="font-size:7px;padding:1px 6px;border:1px solid rgba(0,163,255,0.2);background:rgba(0,163,255,0.05);color:var(--accent);border-radius:2px;cursor:pointer;transition:all 0.15s;font-weight:600;">📥</button>';
  }

  // Progress bar for pulling models
  const progressBar = isPulling
    ? '<div id="llm-progress-' + m.id.replace(/[:.]/g, '-') + '" style="margin-top:3px;">'
      + '<div style="display:flex;justify-content:space-between;font-size:7px;color:var(--text-muted);margin-bottom:1px;">'
      + '<span class="llm-prog-status">' + t('llm.starting') + '</span><span class="llm-prog-pct">0%</span></div>'
      + '<div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;">'
      + '<div class="llm-prog-bar" style="height:100%;width:0%;background:linear-gradient(90deg,var(--accent),var(--accent-green));border-radius:2px;transition:width 0.3s ease;"></div>'
      + '</div>'
      + '<div class="llm-prog-size" style="font-size:6px;color:var(--text-muted);margin-top:1px;"></div>'
      + '</div>'
    : '';

  return '<div style="padding:6px 8px;background:var(--bg-overlay);border:1px solid var(--border);border-radius:5px;'
    + (isInstalled ? 'border-left:2px solid var(--accent-green);' : '') + '">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">'
    + '<div style="display:flex;align-items:center;gap:4px;min-width:0;">'
    + paramsBadge
    + '<span style="font-size:10px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + m.name + '</span>'
    + '</div>'
    + actionBtn
    + '</div>'
    + '<p style="margin:2px 0;font-size:8px;color:var(--text-muted);line-height:1.2;">' + m.desc + '</p>'
    + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">'
    + '<span style="font-size:7px;color:var(--text-secondary);">💾' + m.disk + '</span>'
    + '<span style="font-size:7px;color:var(--text-secondary);">🧠' + m.ram + '</span>'
    + '<span style="font-size:7px;color:var(--text-secondary);">🎮' + m.vram + '</span>'
    + tags
    + '</div>'
    + progressBar
    + '</div>';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function pullModel(modelId: string): Promise<void> {
  if (!modelId || pullingModels.has(modelId)) return;
  pullingModels.add(modelId);
  renderPanel();

  const safeId = modelId.replace(/[:.]/g, '-');

  try {
    const resp = await fetch(`${API}/ollama/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId }),
    });

    if (!resp.body) {
      pullingModels.delete(modelId);
      renderPanel();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          const pct = data.percent || 0;
          const status = data.status || '';
          const completed = data.completed || 0;
          const total = data.total || 0;

          // Update progress bar in DOM without re-rendering
          const progEl = document.getElementById('llm-progress-' + safeId);
          if (progEl) {
            const bar = progEl.querySelector('.llm-prog-bar') as HTMLElement;
            const pctEl = progEl.querySelector('.llm-prog-pct');
            const statusEl = progEl.querySelector('.llm-prog-status');
            const sizeEl = progEl.querySelector('.llm-prog-size');
            if (bar) bar.style.width = pct + '%';
            if (pctEl) pctEl.textContent = pct + '%';
            if (statusEl) statusEl.textContent = status.length > 30 ? status.slice(0, 30) + '...' : status;
            if (sizeEl && total > 0) sizeEl.textContent = formatBytes(completed) + ' / ' + formatBytes(total);
          }

          if (data.status === 'done' || data.status === 'error') break;
        } catch { /* skip malformed */ }
      }
    }

    pullingModels.delete(modelId);
    renderPanel(); // Refresh to show installed
  } catch {
    pullingModels.delete(modelId);
    renderPanel();
  }
}

async function deleteModel(modelId: string): Promise<void> {
  if (!modelId) return;
  try {
    await fetch(`${API}/ollama/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelId }),
    });
    renderPanel();
  } catch (err) { console.warn('[LLM] Failed to delete model:', err); }
}
