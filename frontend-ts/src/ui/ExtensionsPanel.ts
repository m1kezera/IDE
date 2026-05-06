/**
 * Project Y — Extensions Panel (v5.2)
 * Extension cards with toggle switch.
 * Pure DOM manipulation — no frameworks.
 */

import { fetchExtensions, toggleExtension, fetchExtensionsPath } from '../api/client';
import { t } from '../core/i18n';

interface Extension {
  id: string;
  name: string;
  description?: string;
  version?: string;
  enabled?: boolean;
}

export function initExtensionsPanel(): void {
  const panel = document.getElementById('projecty-panel-extensions') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header" style="display:flex; flex-direction:column; align-items:flex-start; line-height:1.2;">
      <span>${t('panel.extensions')}</span>
      <span id="projecty-extensions-path-label" style="font-size:10px; color:var(--text-muted); font-weight:normal; user-select:all; margin-top:2px;">${t('ext.detecting')}</span>
    </div>
    <div id="projecty-extensions-list" style="padding:12px; display:flex; flex-direction:column; gap:8px; flex:1; overflow-y:auto;"></div>
  `;

  fetchExtensionsPath().then(info => {
    const lbl = document.getElementById('projecty-extensions-path-label');
    if (lbl) lbl.textContent = info.path;
  }).catch(() => {
    const lbl = document.getElementById('projecty-extensions-path-label');
    if (lbl) lbl.textContent = './extensions';
  });

  loadExtensions();
}

async function loadExtensions(): Promise<void> {
  const listEl = document.getElementById('projecty-extensions-list') as HTMLElement;
  if (!listEl) return;

  try {
    const extensions = (await fetchExtensions()) as Extension[];

    if (!extensions || extensions.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:24px; color:var(--text-muted);">
          <div style="font-size:24px; margin-bottom:8px;">🧩</div>
          <div style="font-size:12px;">${t('ext.no_extensions')}</div>
          <div style="font-size:11px; margin-top:4px; color:var(--text-muted);">${t('ext.hint')}</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = '';
    for (const ext of extensions) {
      listEl.appendChild(createExtensionCard(ext));
    }
  } catch {
    listEl.innerHTML = `<p style="font-size:11px; color:var(--accent-red); padding:8px;">${t('ext.error')}</p>`;
  }
}

function createExtensionCard(ext: Extension): HTMLElement {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--bg-overlay); border: 1px solid var(--border);
    border-radius: 6px; padding: 12px; display: flex; flex-direction: column; gap: 6px;
    transition: border-color 0.2s;
  `;
  if (ext.enabled) {
    card.style.borderColor = 'rgba(0, 163, 255, 0.3)';
  }

  const header = document.createElement('div');
  header.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

  const nameEl = document.createElement('span');
  nameEl.style.cssText = 'font-size:13px; font-weight:600; color:var(--text);';
  nameEl.textContent = ext.name;

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.style.cssText = `
    width: 36px; height: 18px; border-radius: 9px; border: none; cursor: pointer;
    position: relative; transition: background 0.2s;
    background: ${ext.enabled ? 'var(--accent-green)' : 'var(--text-muted)'};
  `;

  const toggleDot = document.createElement('span');
  toggleDot.style.cssText = `
    position: absolute; top: 2px; width: 14px; height: 14px;
    border-radius: 50%; background: white; transition: left 0.2s;
    left: ${ext.enabled ? '20px' : '2px'};
  `;
  toggleBtn.appendChild(toggleDot);

  toggleBtn.addEventListener('click', async () => {
    try {
      await toggleExtension(ext.id);
      ext.enabled = !ext.enabled;
      toggleBtn.style.background = ext.enabled ? 'var(--accent-green)' : 'var(--text-muted)';
      toggleDot.style.left = ext.enabled ? '20px' : '2px';
      card.style.borderColor = ext.enabled ? 'rgba(0, 163, 255, 0.3)' : 'var(--border)';
    } catch (err) {
      console.error('[Extensions] Toggle failed:', err);
    }
  });

  header.appendChild(nameEl);
  header.appendChild(toggleBtn);
  card.appendChild(header);

  // Description
  if (ext.description) {
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:11px; color:var(--text-secondary); line-height:1.4;';
    desc.textContent = ext.description;
    card.appendChild(desc);
  }

  // Version
  if (ext.version) {
    const ver = document.createElement('div');
    ver.style.cssText = 'font-size:10px; color:var(--text-muted);';
    ver.textContent = `v${ext.version}`;
    card.appendChild(ver);
  }

  return card;
}
