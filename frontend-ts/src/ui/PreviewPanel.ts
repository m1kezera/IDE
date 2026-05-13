/**
 * Lumina IDE — Live Preview (v9.0 — WASM Edge + Static Server)
 * Uses Edge Runtime (Wasm sandbox) for full project preview.
 * Falls back to /preview/ static server.
 * Supports: HTML, JS/TS, React JSX/TSX, Vue, Svelte, CSS.
 * QR Code for mobile preview on same Wi-Fi.
 */

import { PubSub } from '../core/PubSub';
import { activeTabPath } from '../core/EditorManager';
import { t } from '../core/i18n';

const isElectronPreview = window.location.protocol === 'file:';
const API_BASE = isElectronPreview ? 'http://127.0.0.1:8001/api' : '/api';

let previewContainer: HTMLElement | null = null;
let previewIframe: HTMLIFrameElement | null = null;
let consoleOutput: HTMLElement | null = null;
let currentMode: string = 'auto';
let activeSandboxId: string | null = null;

export function initPreviewPanel(): void {
  const layer = document.createElement('div');
  layer.id = 'projecty-preview-layer';
  layer.style.display = 'none';
  layer.style.position = 'fixed';
  layer.style.inset = '0';
  layer.style.background = 'rgba(0,0,0,0.85)';
  layer.style.zIndex = '10000';
  layer.style.padding = '30px';
  layer.style.flexDirection = 'column';
  layer.style.gap = '10px';

  layer.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <h2 style="color:#00A3FF; font-size:16px; margin:0;">⚡ Live Preview</h2>
        <select id="projecty-preview-mode" style="background:var(--bg-overlay); color:var(--text); border:1px solid var(--border); border-radius:4px; padding:3px 8px; font-size:11px; outline:none; cursor:pointer;">
          <option value="auto">${t('preview.auto')}</option>
          <option value="project">🚀 Projeto Completo (WASM)</option>
          <option value="html">HTML</option>
          <option value="js">JavaScript</option>
          <option value="jsx">React (JSX/TSX)</option>
          <option value="vue">Vue (SFC)</option>
          <option value="svelte">Svelte</option>
          <option value="css">CSS Visual</option>
        </select>
        <select id="projecty-preview-file" style="background:var(--bg-overlay); color:var(--text); border:1px solid var(--border); border-radius:4px; padding:3px 8px; font-size:11px; outline:none; cursor:pointer; max-width:200px;">
          <option value="current">${t('preview.current_file')}</option>
        </select>
        <button id="projecty-preview-run" style="background:linear-gradient(135deg, #00A3FF, #0070CC); color:white; border:none; border-radius:4px; padding:3px 10px; font-size:11px; font-weight:bold; cursor:pointer;">▶ Executar</button>
        <button id="projecty-preview-qr" style="background:var(--bg-overlay); color:var(--text); border:1px solid var(--border); border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer;" title="QR Code para preview mobile">📱 QR</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span id="projecty-preview-badge" style="font-size:9px; padding:2px 8px; border-radius:10px; background:rgba(0,163,255,0.15); color:#00A3FF; font-weight:700; text-transform:uppercase;"></span>
        <button id="projecty-preview-close" style="background:var(--accent-red, #f38ba8); color:white; border:none; border-radius:4px; padding:4px 12px; cursor:pointer; font-size:11px;">${t('preview.close')}</button>
      </div>
    </div>
    <div style="flex:1; display:flex; gap:10px; overflow:hidden;">
      <iframe id="projecty-preview-frame" style="flex:2; background:white; border:none; border-radius:8px;"></iframe>
      <div id="projecty-preview-console" style="flex:1; background:#1e1e2e; color:#a6e3a1; font-family:'JetBrains Mono', monospace; font-size:11px; padding:10px; border-radius:8px; overflow-y:auto; border:1px solid var(--border);">
        <div style="color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; font-size:9px; border-bottom:1px solid var(--border); padding-bottom:4px;">Console Output</div>
      </div>
    </div>
    <!-- QR Code overlay -->
    <div id="projecty-preview-qr-overlay" style="display:none; position:absolute; inset:0; background:rgba(0,0,0,0.9); z-index:10001; align-items:center; justify-content:center; flex-direction:column; gap:16px;">
      <h3 style="color:white; font-size:14px;">📱 ${t('preview.scan_qr') || 'Escaneie para preview mobile'}</h3>
      <img id="projecty-preview-qr-img" style="width:200px; height:200px; border-radius:12px;" />
      <p id="projecty-preview-qr-url" style="color:#a6adc8; font-size:12px; font-family:monospace;"></p>
      <button id="projecty-preview-qr-close" style="background:var(--accent-red, #f38ba8); color:white; border:none; border-radius:4px; padding:6px 16px; cursor:pointer; font-size:12px;">${t('preview.close')}</button>
    </div>
  `;

  document.body.appendChild(layer);
  previewContainer = layer;
  previewIframe = layer.querySelector('#projecty-preview-frame') as HTMLIFrameElement;
  consoleOutput = layer.querySelector('#projecty-preview-console') as HTMLElement;

  // Close button
  layer.querySelector('#projecty-preview-close')?.addEventListener('click', () => {
    layer.style.display = 'none';
    stopSandbox();
    // Also stop any running dev servers
    fetch(`${API_BASE}/preview/dev-server`, { method: 'DELETE' }).catch(() => {});
  });

  // Run button
  layer.querySelector('#projecty-preview-run')?.addEventListener('click', () => {
    const modeSelect = document.getElementById('projecty-preview-mode') as HTMLSelectElement;
    const fileSelect = document.getElementById('projecty-preview-file') as HTMLSelectElement;
    currentMode = modeSelect.value;

    if (currentMode === 'project') {
      const folder = fileSelect.value === 'current' ? '.' : fileSelect.value;
      showProjectPreview(folder);
      return;
    }

    if (fileSelect.value !== 'current') {
      PubSub.emit('preview:request_file', { path: fileSelect.value, mode: currentMode });
    } else {
      PubSub.emit('preview:rerun', { mode: currentMode });
    }
  });

  // Mode change: switch selector between files and folders
  const modeSelect = layer.querySelector('#projecty-preview-mode') as HTMLSelectElement;
  modeSelect?.addEventListener('change', async () => {
    const fileSelect = document.getElementById('projecty-preview-file') as HTMLSelectElement;
    if (!fileSelect) return;

    if (modeSelect.value === 'project') {
      // Load workspace folders
      fileSelect.innerHTML = '<option value=".">📁 / (raiz do workspace)</option>';
      try {
        const resp = await fetch(`${API_BASE}/preview/folders`);
        const data = await resp.json();
        for (const folder of data.folders) {
          if (folder.path === '.') continue; // already added
          const icon = folder.has_entry ? '📦' : '📂';
          const opt = document.createElement('option');
          opt.value = folder.path;
          opt.textContent = `${icon} ${folder.name}`;
          fileSelect.appendChild(opt);
        }
      } catch (err) { console.warn('[Preview] Failed to load file tree for preview:', err); }
    }
  });

  // QR button
  layer.querySelector('#projecty-preview-qr')?.addEventListener('click', showQRCode);
  layer.querySelector('#projecty-preview-qr-close')?.addEventListener('click', () => {
    const overlay = document.getElementById('projecty-preview-qr-overlay');
    if (overlay) overlay.style.display = 'none';
  });

  // Console messages from iframe
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'console') {
      appendConsole(e.data.method, e.data.content);
    }
  });

  // Listen for preview requests from editor
  PubSub.on('editor:preview', (data) => {
    const { content, ext, openTabs } = data as { content: string; ext: string; openTabs?: Array<{ path: string; name: string; ext: string }> };
    populateFileSelector(openTabs || []);
    const modeSelect = document.getElementById('projecty-preview-mode') as HTMLSelectElement;
    if (modeSelect) modeSelect.value = 'auto';
    currentMode = 'auto';
    showPreview(content, ext);
  });

  PubSub.on('preview:file_content', (data) => {
    const { content, ext } = data as { content: string; ext: string };
    showPreview(content, ext);
  });
}

async function populateFileSelector(openTabs: Array<{ path: string; name: string; ext: string }>): Promise<void> {
  const fileSelect = document.getElementById('projecty-preview-file') as HTMLSelectElement;
  if (!fileSelect) return;
  fileSelect.innerHTML = `<option value="current">${t('preview.current_file')}</option>`;
  const previewable = ['html', 'htm', 'js', 'ts', 'jsx', 'tsx', 'vue', 'svelte', 'css', 'scss'];

  // Add open tabs
  const addedPaths = new Set<string>();
  if (openTabs.length > 0) {
    const group = document.createElement('optgroup');
    group.label = '📑 Abas Abertas';
    for (const tab of openTabs) {
      if (previewable.includes(tab.ext)) {
        const opt = document.createElement('option');
        opt.value = tab.path;
        opt.textContent = tab.name;
        group.appendChild(opt);
        addedPaths.add(tab.path);
      }
    }
    if (group.children.length > 0) fileSelect.appendChild(group);
  }

  // Fetch workspace files
  try {
    const resp = await fetch(`${API_BASE}/preview/folders`);
    const data = await resp.json();
    if (data.folders && data.folders.length > 0) {
      const wsGroup = document.createElement('optgroup');
      wsGroup.label = '📁 Workspace';
      for (const folder of data.folders) {
        if (!addedPaths.has(folder.path)) {
          const opt = document.createElement('option');
          opt.value = folder.path;
          opt.textContent = `${folder.has_entry ? '📦' : '📂'} ${folder.name || folder.path}`;
          wsGroup.appendChild(opt);
        }
      }
      if (wsGroup.children.length > 0) fileSelect.appendChild(wsGroup);
    }
  } catch { /* workspace files not available */ }
}

function setBadge(text: string): void {
  const badge = document.getElementById('projecty-preview-badge');
  if (badge) badge.textContent = text;
}

function appendConsole(method: string, content: string): void {
  if (!consoleOutput) return;
  const line = document.createElement('div');
  line.style.marginBottom = '4px';
  line.style.wordBreak = 'break-all';
  if (method === 'error') line.style.color = '#f38ba8';
  if (method === 'warn') line.style.color = '#f9e2af';
  line.textContent = `> [${method.toUpperCase()}] ${content}`;
  consoleOutput.appendChild(line);
  consoleOutput.scrollTo(0, consoleOutput.scrollHeight);
}

// ─── Console Intercept Script (injected into single-file previews) ──
const INTERCEPT = `<script>
(function(){
  var _l=console.log,_e=console.error,_w=console.warn;
  function _n(t,a){try{window.parent.postMessage({type:'console',method:t,content:Array.from(a).map(function(x){return typeof x==='object'?JSON.stringify(x):String(x)}).join(' ')},'*')}catch(e){}}
  console.log=function(){_n('log',arguments);_l.apply(console,arguments)};
  console.error=function(){_n('error',arguments);_e.apply(console,arguments)};
  console.warn=function(){_n('warn',arguments);_w.apply(console,arguments)};
  window.onerror=function(m,u,l){_n('error',[m+' (line '+l+')'])};
})();
<\/script>`;

// ─── Helper: detect relative links in HTML ──────────────────────────
function hasRelativeLinks(html: string): boolean {
  // Check for relative href/src attributes (not http, https, data, blob, //)
  const linkPattern = /(?:href|src)\s*=\s*["'](?!https?:\/\/|data:|blob:|\/\/)([^"']+)["']/i;
  return linkPattern.test(html);
}

// ─── Single-File Preview (HTML, JS, JSX, Vue, Svelte, CSS) ─────────
export function showPreview(content: string, ext: string): void {
  if (!previewContainer || !previewIframe || !consoleOutput) return;
  previewContainer.style.display = 'flex';

  // Reset console
  consoleOutput.innerHTML = '<div style="color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; font-size:9px; border-bottom:1px solid var(--border); padding-bottom:4px;">Console Output</div>';

  const mode = currentMode === 'auto' ? ext : currentMode;
  let html = '';

  if (mode === 'html' || mode === 'htm') {
    setBadge('HTML');

    // Smart detection: if HTML has relative links (link href, script src, img src)
    // → use /preview/ static server so relative paths resolve correctly
    if (hasRelativeLinks(content)) {
      appendConsole('log', '🔗 Relative links detected → using static server');
      setBadge('PROJECT');
      // Use the actual active file name, not hardcoded index.html
      const tabPath = activeTabPath ?? '';
      const fileName = tabPath ? tabPath.split('/').pop()?.split('\\').pop() || 'index.html' : 'index.html';
      previewIframe.src = `${API_BASE}/preview/${fileName}`;
      appendConsole('log', `✅ Preview loaded via /preview/${fileName} (relative paths work!)`);
      return;
    }

    html = content.includes('<head>') ? content.replace('<head>', '<head>' + INTERCEPT) : INTERCEPT + content;

  } else if (mode === 'js' || mode === 'ts') {
    setBadge(mode.toUpperCase());
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${INTERCEPT}</head>
      <body style="background:#f8f9fa; padding:20px; font-family:system-ui;">
        <h3 style="color:#333; margin-top:0;">${mode.toUpperCase()} Output</h3>
        <div id="app"></div>
        <script type="module">${content}<\/script>
      </body></html>`;

  } else if (mode === 'jsx' || mode === 'tsx') {
    setBadge('REACT');
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${INTERCEPT}
      <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin><\/script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin><\/script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
      </head><body style="background:#f8f9fa; padding:20px; font-family:system-ui;">
        <div id="root"></div>
        <script type="text/babel">
          ${content}
          try {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            if (typeof App !== 'undefined') { root.render(React.createElement(App)); console.log('✅ React App renderizado'); }
            else { document.getElementById('root').innerHTML = '<p style="color:#666;">Defina uma função <code>App</code> para auto-render.</p>'; }
          } catch(e) { console.error('React error:', e.message); }
        <\/script></body></html>`;

  } else if (mode === 'vue') {
    setBadge('VUE');
    // Extract template/script/style from SFC
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const tpl = templateMatch ? templateMatch[1] : '<div>{{ msg }}</div>';
    const scr = scriptMatch ? scriptMatch[1] : "export default { data() { return { msg: 'Hello Vue' } } }";
    const sty = styleMatch ? styleMatch[1] : '';

    html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${INTERCEPT}
      <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\/script>
      <style>${sty}</style>
      </head><body style="background:#f8f9fa; padding:20px; font-family:system-ui;">
        <div id="app">${tpl}</div>
        <script>
          try {
            const _comp = (function() { ${scr.replace(/export\s+default/, 'return')} })();
            Vue.createApp(_comp).mount('#app');
            console.log('✅ Vue App montado');
          } catch(e) { console.error('Vue error:', e.message); }
        <\/script></body></html>`;

  } else if (mode === 'svelte') {
    setBadge('SVELTE');
    // Basic Svelte preview — extract script + html + style
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    let markup = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .trim();
    const scr = scriptMatch ? scriptMatch[1] : '';
    const sty = styleMatch ? styleMatch[1] : '';

    html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${INTERCEPT}
      <style>${sty}</style>
      </head><body style="background:#f8f9fa; padding:20px; font-family:system-ui;">
        <div id="app">${markup}</div>
        <script>
          ${scr}
          console.log('⚡ Svelte preview (markup only — full compilation requires build step)');
        <\/script></body></html>`;

  } else if (mode === 'css' || mode === 'scss') {
    setBadge('CSS');
    html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${INTERCEPT}
      <style>${content}</style>
      </head><body style="padding:20px; font-family:system-ui;">
        <h1>Heading 1</h1><h2>Heading 2</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <button>Button</button> <input type="text" placeholder="Input field" />
        <a href="#">Link example</a>
        <div class="container"><div class="card"><p>Card Element</p></div></div>
        <ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>
      </body></html>`;
  } else {
    setBadge(ext.toUpperCase());
    html = `<html><body><pre>${content}</pre></body></html>`;
  }

  const blob = new Blob([html], { type: 'text/html' });
  previewIframe.src = URL.createObjectURL(blob);
}

// ─── Full Project Preview (Dev Server for bundled, Static for HTML) ─────
async function showProjectPreview(subfolder: string = '.'): Promise<void> {
  if (!previewContainer || !previewIframe || !consoleOutput) return;
  previewContainer.style.display = 'flex';

  consoleOutput.innerHTML = '<div style="color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; font-size:9px; border-bottom:1px solid var(--border); padding-bottom:4px;">Console Output</div>';
  appendConsole('log', `🔍 Loading project: ${subfolder === '.' ? 'root' : subfolder}...`);

  let basePath = subfolder === '.' ? '' : subfolder + '/';

  // 1. Detect project type from package.json
  let framework = 'vanilla';
  let hasPackageJson = false;
  let actualFolder = subfolder;
  try {
    const pkgResp = await fetch(`${API_BASE}/preview/${basePath}package.json`);
    if (pkgResp.ok) {
      hasPackageJson = true;
      const pkg = await pkgResp.json();
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if ('react' in allDeps || 'react-dom' in allDeps) framework = 'react';
      else if ('vue' in allDeps) framework = 'vue';
      else if ('next' in allDeps) framework = 'next';
      else if ('svelte' in allDeps) framework = 'svelte';
      else if ('vite' in allDeps) framework = 'vite';
      appendConsole('log', `📦 package.json detected → ${framework.toUpperCase()}`);
    }
  } catch { /* no package.json */ }

  // 1b. If root has no package.json, auto-search subdirectories
  if (!hasPackageJson && subfolder === '.') {
    appendConsole('log', '🔍 No package.json at root — scanning subdirectories...');
    try {
      const foldersResp = await fetch(`${API_BASE}/preview/folders`);
      if (foldersResp.ok) {
        const foldersData = await foldersResp.json();
        for (const f of (foldersData.folders || [])) {
          if (f.path === '.') continue;
          if (f.has_entry) {
            appendConsole('log', `📦 Found project in: ${f.path}`);
            actualFolder = f.path;
            basePath = actualFolder + '/';
            // Re-fetch package.json from subfolder
            try {
              const subPkg = await fetch(`${API_BASE}/preview/${basePath}package.json`);
              if (subPkg.ok) {
                hasPackageJson = true;
                const pkg = await subPkg.json();
                const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
                if ('react' in allDeps || 'react-dom' in allDeps) framework = 'react';
                else if ('vue' in allDeps) framework = 'vue';
                else if ('next' in allDeps) framework = 'next';
                else if ('svelte' in allDeps) framework = 'svelte';
                else if ('vite' in allDeps) framework = 'vite';
                appendConsole('log', `📦 package.json detected in ${f.path} → ${framework.toUpperCase()}`);
              }
            } catch (err) { console.warn('[Preview] Failed to parse package.json:', err); }
            break;
          }
        }
      }
    } catch (err) { console.warn('[Preview] Failed to detect framework from file tree:', err); }
  }

  // 2. For bundled frameworks (React, Vue, Next, Svelte, Vite) → spawn dev server
  if (hasPackageJson && framework !== 'vanilla') {
    appendConsole('log', `🚀 Starting ${framework.toUpperCase()} dev server...`);
    setBadge(`${framework.toUpperCase()} DEV`);

    try {
      const resp = await fetch(`${API_BASE}/preview/dev-server`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: actualFolder })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          appendConsole('log', `✅ Dev server running on port ${data.port}`);
          appendConsole('log', `📍 URL: ${data.url}`);

          // Wait for the server to be fully ready (poll until responding)
          appendConsole('log', '⏳ Waiting for server to be ready...');
          const serverUrl = data.url;
          let ready = false;
          for (let attempt = 0; attempt < 30; attempt++) {
            await new Promise(r => setTimeout(r, 500));
            try {
              await fetch(serverUrl, { mode: 'no-cors', signal: AbortSignal.timeout(2000) });
              ready = true;
              break;
            } catch {
              // Server not ready yet, keep trying
            }
          }

          if (!ready) {
            appendConsole('warn', '⚠ Server took too long to start — loading anyway...');
          }

          previewIframe!.src = serverUrl;
          appendConsole('log', '✅ Preview loaded via dev server!');
          return;
        }
      } else {
        const err = await resp.json().catch(() => ({ detail: 'Unknown error' }));
        appendConsole('warn', `⚠ Dev server failed: ${err.detail || resp.statusText}`);
        appendConsole('log', '📁 Falling back to static file serving...');
      }
    } catch (e) {
      appendConsole('warn', `⚠ Dev server error: ${e}`);
      appendConsole('log', '📁 Falling back to static file serving...');
    }
  }

  // 3. Try Edge Runtime (WASM sandbox) — uses /api/edge/preview/{id}/path
  try {
    appendConsole('log', '🚀 Trying WASM Edge sandbox...');
    setBadge('WASM EDGE');
    const resp = await fetch(`${API_BASE}/edge/start`, { method: 'POST' });
    if (resp.ok) {
      const data = await resp.json();
      if (data.status === 'success' && data.sandbox_id) {
        activeSandboxId = data.sandbox_id;

        // Build the correct preview URL using our own API base (not hardcoded port 8000)
        const entryFile = basePath ? `${basePath}index.html` : 'index.html';
        const previewUrl = `${API_BASE}/edge/preview/${data.sandbox_id}/${entryFile}`;

        // Verify the URL actually responds before showing it
        try {
          const check = await fetch(previewUrl, { method: 'HEAD' });
          if (check.ok) {
            appendConsole('log', `✅ WASM Sandbox active [${data.sandbox_id}]`);
            if (data.is_emulated) {
              appendConsole('warn', '⚠ Wasmtime not available — using emulated mode (static server)');
              setBadge('STATIC');
            }
            if (data.delegated_to) {
              appendConsole('log', `🕸️ Offloaded to: ${data.delegated_to}`);
            }
            previewIframe!.src = previewUrl;
            appendConsole('log', '✅ Preview loaded via Edge Runtime!');
            return;
          } else {
            appendConsole('warn', `⚠ Edge preview file not found: ${entryFile}`);
          }
        } catch {
          appendConsole('warn', '⚠ Edge preview URL not reachable');
        }
      }
    }
  } catch (e) {
    appendConsole('warn', `⚠ Edge Runtime unavailable: ${e}`);
  }

  // 4. Final fallback: direct static file server — try multiple entry points
  appendConsole('log', '📁 Serving via static file server...');
  setBadge('STATIC');

  // Try basePath/index.html first, then root index.html
  const candidates = [
    `${basePath}index.html`,
    `${basePath}dist/index.html`,
    `${basePath}public/index.html`,
    'index.html',
  ];

  for (const candidate of candidates) {
    try {
      const check = await fetch(`${API_BASE}/preview/${candidate}`, { method: 'HEAD' });
      if (check.ok) {
        previewIframe!.src = `${API_BASE}/preview/${candidate}`;
        appendConsole('log', `✅ Preview loaded: ${candidate}`);
        return;
      }
    } catch { /* try next */ }
  }

  // Absolute last resort
  previewIframe!.src = `${API_BASE}/preview/${basePath}index.html`;
  appendConsole('log', `✅ Preview loaded: ${basePath}index.html`);
}

// ─── QR Code ────────────────────────────────────────────────────────
async function showQRCode(): Promise<void> {
  const overlay = document.getElementById('projecty-preview-qr-overlay');
  const qrImg = document.getElementById('projecty-preview-qr-img') as HTMLImageElement;
  const qrUrl = document.getElementById('projecty-preview-qr-url');
  if (!overlay || !qrImg || !qrUrl) return;

  try {
    const resp = await fetch(`${API_BASE}/preview/qr`);
    if (resp.headers.get('content-type')?.includes('image/png')) {
      const blob = await resp.blob();
      qrImg.src = URL.createObjectURL(blob);
      qrUrl.textContent = resp.headers.get('X-Preview-URL') || '';
    } else {
      // JSON fallback
      const data = await resp.json();
      qrUrl.textContent = data.url || 'QR indisponível';
      qrImg.style.display = 'none';
    }
  } catch {
    qrUrl.textContent = 'Erro ao gerar QR Code';
    qrImg.style.display = 'none';
  }

  overlay.style.display = 'flex';
}

// ─── Cleanup ────────────────────────────────────────────────────────
async function stopSandbox(): Promise<void> {
  if (activeSandboxId) {
    try {
      await fetch(`${API_BASE}/edge/stop/${activeSandboxId}`, { method: 'DELETE' });
    } catch (err) { console.warn('[Preview] Failed to stop sandbox:', err); }
    activeSandboxId = null;
  }
}
