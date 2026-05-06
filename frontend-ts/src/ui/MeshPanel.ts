/**
 * Project Y — Mesh Panel (v6.0)
 * Swarm network status with GPU info, VRAM bar, and node discovery.
 * Pure DOM manipulation — no frameworks.
 */

import { fetchMeshStatus, updateMeshConfig, fetchConfig, updateConfig, probeOllamaNode } from '../api/client';
import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';
import type { MeshReachabilityNode } from './Telemetry';

let refreshInterval: ReturnType<typeof setInterval> | null = null;
let currentOllamaHost: string = '127.0.0.1';

export function initMeshPanel(): void {
  const panel = document.getElementById('projecty-panel-swarm') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header" data-i18n="panel.colmeia">${t('mesh.header')}</div>
    <div style="padding:12px; display:flex; flex-direction:column; gap:12px; flex:1; overflow-y:auto;">
      <!-- Local Config -->
      <div style="background:var(--bg-overlay); border:1px solid var(--border); border-radius:6px; padding:12px;">
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
          <div style="font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); line-height:1.3;">${t('mesh.broadcast')}</div>
          <label style="display:flex; align-items:center; gap:6px; font-size:10px; cursor:pointer;">
            <input type="checkbox" id="projecty-mesh-toggle" />
            ${t('mesh.active')}
          </label>
        </div>

        <!-- GPU Info Section -->
        <div style="padding-top:8px; border-top:1px dashed var(--border);">
          <div style="margin-bottom:6px;">
            <span style="color:var(--text-muted); text-transform:uppercase; font-size:9px; letter-spacing:0.5px;">GPU</span>
            <div id="projecty-mesh-gpu-name" style="color:var(--text); font-weight:600; font-size:11px; margin-top:2px; word-break:break-word;">—</div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
            <span style="color:var(--text-secondary);">${t('mesh.vram_free')}</span>
            <span id="projecty-mesh-vram" style="color:var(--accent-green); font-weight:600;">—</span>
          </div>
          <!-- VRAM Usage Bar -->
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin:6px 0;">
            <div id="projecty-mesh-vram-bar" style="height:100%; background:linear-gradient(90deg, var(--accent-green), var(--accent)); border-radius:3px; transition:width 0.5s ease; width:0%;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span style="color:var(--text-secondary);">${t('mesh.type')}</span>
            <span id="projecty-mesh-type" style="color:var(--accent); font-weight:600;">—</span>
          </div>
        </div>
      </div>
      <!-- Nodes -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">${t('mesh.detected_nodes')}</h3>
          <span id="projecty-mesh-count" style="font-size:10px; color:var(--text-muted);">0</span>
        </div>
        <div id="projecty-mesh-nodes" style="display:flex; flex-direction:column; gap:6px;"></div>
        <div id="projecty-mesh-ollama-source" style="margin-top:8px; padding:8px; background:rgba(51,255,170,0.06); border:1px solid rgba(51,255,170,0.2); border-radius:6px; font-size:10px; color:var(--accent-green); display:none;">
          🎯 Ollama ativo em: <strong id="projecty-mesh-ollama-ip">127.0.0.1</strong>
          <button id="projecty-mesh-ollama-local" style="margin-left:8px; background:var(--bg-overlay); border:1px solid var(--border); color:var(--text-muted); border-radius:3px; font-size:9px; padding:2px 6px; cursor:pointer;">Usar Local</button>
        </div>
      </div>

      <!-- Resource Limits & System Monitor Section -->
      <div id="projecty-mesh-limits" style="background:var(--bg-overlay); border:1px solid var(--border); border-radius:6px; padding:10px;">
        <div style="font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span>⚖️ Resource Limits</span>
          <span id="projecty-mesh-throttle-badge" style="font-size:8px; padding:2px 6px; border-radius:10px; background:rgba(51,255,170,0.1); color:var(--accent-green); font-weight:700;">SOLO</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:4px;">
          <span>Machines</span>
          <span id="projecty-mesh-machine-count" style="color:var(--text); font-weight:600;">1</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:6px;">
          <span>Context</span>
          <span id="projecty-mesh-ctx-limit" style="color:var(--accent); font-weight:600; font-family:'JetBrains Mono',monospace; font-size:9px;">32000 tk</span>
        </div>

        <!-- VRAM Max -->
        <div style="margin-bottom:6px;">
          <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px;">
            <span style="color:var(--text-muted);">VRAM Max</span>
            <span id="projecty-mesh-vram-limit" style="color:var(--accent-green); font-weight:600; font-family:'JetBrains Mono',monospace;">100%</span>
          </div>
          <div style="width:100%; height:4px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden;">
            <div id="projecty-mesh-vram-limit-bar" style="height:100%; width:100%; border-radius:2px; transition:width 0.6s ease, background 0.6s ease; background:linear-gradient(90deg, var(--accent-green), var(--accent));"></div>
          </div>
        </div>

        <!-- RAM -->
        <div style="margin-bottom:6px;">
          <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px; align-items:baseline;">
            <span style="color:var(--text-muted);">RAM</span>
            <span id="projecty-mesh-ram-real" style="color:var(--text); font-family:'JetBrains Mono',monospace; font-size:8px;">0/0 GB</span>
          </div>
          <div style="width:100%; height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; position:relative;">
            <div id="projecty-mesh-ram-usage-bar" style="height:100%; width:0%; border-radius:3px; transition:width 0.6s ease; background:linear-gradient(90deg, #89b4fa, #cba6f7); position:absolute; top:0; left:0;"></div>
            <div id="projecty-mesh-ram-limit-bar" style="height:100%; width:100%; border-radius:3px; border-right:2px solid #f38ba8; background:transparent; position:absolute; top:0; left:0;"></div>
          </div>
          <div style="text-align:right; font-size:8px; color:var(--text-muted); margin-top:1px;">max <span id="projecty-mesh-ram-limit" style="color:var(--accent-green); font-weight:600;">100%</span></div>
        </div>

        <!-- CPU -->
        <div>
          <div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:2px; align-items:baseline;">
            <span style="color:var(--text-muted);">CPU</span>
            <span id="projecty-mesh-cpu-real" style="color:var(--text); font-family:'JetBrains Mono',monospace; font-size:8px;">0%</span>
          </div>
          <div style="width:100%; height:5px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden; position:relative;">
            <div id="projecty-mesh-cpu-usage-bar" style="height:100%; width:0%; border-radius:3px; transition:width 0.6s ease; background:linear-gradient(90deg, #f9e2af, #fab387); position:absolute; top:0; left:0;"></div>
            <div id="projecty-mesh-cpu-limit-bar" style="height:100%; width:100%; border-radius:3px; border-right:2px solid #f38ba8; background:transparent; position:absolute; top:0; left:0;"></div>
          </div>
          <div style="text-align:right; font-size:8px; color:var(--text-muted); margin-top:1px;">max <span id="projecty-mesh-cpu-limit" style="color:var(--accent-green); font-weight:600;">100%</span></div>
        </div>
      </div>

      <!-- LLM Cache Stats -->
      <div style="background:var(--bg-overlay); border:1px solid var(--border); border-radius:6px; padding:10px; margin-top:8px;">
        <div style="font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); margin-bottom:6px;">
          ⚡ LLM Cache
        </div>
        <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-bottom:3px;">
          <span>Entries</span>
          <span style="font-family:'JetBrains Mono',monospace; font-size:9px;"><span id="projecty-mesh-cache-entries" style="color:var(--accent); font-weight:600;">0</span> / <span id="projecty-mesh-cache-max" style="color:var(--text);">50</span></span>
        </div>
        <div style="width:100%; height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden;">
          <div id="projecty-mesh-cache-bar" style="height:100%; width:0%; border-radius:2px; transition:width 0.6s ease; background:linear-gradient(90deg, #89b4fa, #b4befe);"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); margin-top:3px;">
          <span>TTL</span>
          <span id="projecty-mesh-cache-ttl" style="color:var(--text); font-family:'JetBrains Mono',monospace; font-size:8px;">30 min</span>
        </div>
      </div>
    </div>
  `;

  const toggle = document.getElementById('projecty-mesh-toggle') as HTMLInputElement;
  toggle.addEventListener('change', async () => {
     try {
       await updateMeshConfig(toggle.checked, 0); // port managed by backend
     } catch {
       console.warn('[MeshPanel] Failed to update mesh config');
     }
  });

  // Mesh update listener (v5.0)
  PubSub.on('mesh:nodes_updated', (data) => {
    renderMeshNodes(data as MeshReachabilityNode[]);
  });

  // Load current Ollama config to know which host is active
  fetchConfig().then(cfg => {
    currentOllamaHost = (cfg.ollama_host as string) || '127.0.0.1';
    updateOllamaSourceUI();
  }).catch(() => {});

  // Usar Local button
  const localBtn = document.getElementById('projecty-mesh-ollama-local');
  if (localBtn) {
    localBtn.addEventListener('click', async () => {
      await updateConfig({ ollama_host: '127.0.0.1', ollama_port: 11434 });
      currentOllamaHost = '127.0.0.1';
      updateOllamaSourceUI();
      PubSub.emit('config:updated');
    });
  }

  // Polling for local status remains
  refreshLocalMeshStatus();
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(refreshLocalMeshStatus, 5000);
}

async function refreshLocalMeshStatus(): Promise<void> {
  try {
    const status = await fetchMeshStatus();
    const gpuNameEl = document.getElementById('projecty-mesh-gpu-name');
    const vramEl = document.getElementById('projecty-mesh-vram');
    const vramBarEl = document.getElementById('projecty-mesh-vram-bar');
    const typeEl = document.getElementById('projecty-mesh-type');
    const toggleChecked = document.getElementById('projecty-mesh-toggle') as HTMLInputElement;


    if (gpuNameEl) gpuNameEl.textContent = status.gpu_name || 'N/A';
    
    if (vramEl) {
      const free = status.vram_free_gb ?? 0;
      const total = status.vram_total_gb ?? 0;
      vramEl.textContent = total > 0 ? `${free.toFixed(1)} / ${total.toFixed(1)} GB` : `${free.toFixed(1)} GB`;
    }
    
    if (vramBarEl && status.vram_total_gb && status.vram_total_gb > 0) {
      const usedPct = ((status.vram_total_gb - status.vram_free_gb) / status.vram_total_gb) * 100;
      vramBarEl.style.width = `${Math.min(100, Math.max(0, usedPct)).toFixed(1)}%`;
      // Color shift: green < 50%, yellow < 80%, red >= 80%
      if (usedPct >= 80) {
        vramBarEl.style.background = 'linear-gradient(90deg, #f9e2af, #f38ba8)';
      } else if (usedPct >= 50) {
        vramBarEl.style.background = 'linear-gradient(90deg, var(--accent-green), #f9e2af)';
      } else {
        vramBarEl.style.background = 'linear-gradient(90deg, var(--accent-green), var(--accent))';
      }
    }
    
    if (typeEl) typeEl.textContent = status.is_cortex ? `🧠 ${t('mesh.cortex_node')}` : `💡 ${t('mesh.light_node')}`;
    if (toggleChecked && document.activeElement !== toggleChecked && status.is_running !== undefined) toggleChecked.checked = status.is_running;


    // Update Resource Limits UI
    const limits = status.resource_limits;
    if (limits) {
      const badge = document.getElementById('projecty-mesh-throttle-badge');
      const machineCount = document.getElementById('projecty-mesh-machine-count');
      const ctxLimit = document.getElementById('projecty-mesh-ctx-limit');
      const vramLimit = document.getElementById('projecty-mesh-vram-limit');
      const ramLimit = document.getElementById('projecty-mesh-ram-limit');
      const cpuLimit = document.getElementById('projecty-mesh-cpu-limit');
      const vramBar = document.getElementById('projecty-mesh-vram-limit-bar');
      const ramLimitBar = document.getElementById('projecty-mesh-ram-limit-bar');
      const cpuLimitBar = document.getElementById('projecty-mesh-cpu-limit-bar');
      const ramUsageBar = document.getElementById('projecty-mesh-ram-usage-bar');
      const cpuUsageBar = document.getElementById('projecty-mesh-cpu-usage-bar');
      const ramReal = document.getElementById('projecty-mesh-ram-real');
      const cpuReal = document.getElementById('projecty-mesh-cpu-real');

      if (machineCount) machineCount.textContent = String(limits.total_machines);
      if (ctxLimit) ctxLimit.textContent = ((status as any).effective_context_limit || 32000) + ' tk';
      if (vramLimit) vramLimit.textContent = limits.max_vram_pct + '%';
      if (ramLimit) ramLimit.textContent = limits.max_ram_pct + '%';
      if (cpuLimit) cpuLimit.textContent = limits.max_cpu_pct + '%';

      if (vramBar) vramBar.style.width = limits.max_vram_pct + '%';
      if (ramLimitBar) ramLimitBar.style.width = limits.max_ram_pct + '%';
      if (cpuLimitBar) cpuLimitBar.style.width = limits.max_cpu_pct + '%';

      // Real RAM usage
      const ramTotal = (status as any).ram_total_gb || 0;
      const ramFree = (status as any).ram_free_gb || 0;
      const ramUsedPct = (status as any).ram_used_pct || 0;
      const cpuUsagePct = (status as any).cpu_usage_pct || 0;

      if (ramReal) ramReal.textContent = `${(ramTotal - ramFree).toFixed(1)} / ${ramTotal.toFixed(1)} GB`;
      if (cpuReal) cpuReal.textContent = `${cpuUsagePct.toFixed(0)}%`;

      if (ramUsageBar) ramUsageBar.style.width = ramUsedPct + '%';
      if (cpuUsageBar) cpuUsageBar.style.width = cpuUsagePct + '%';

      // Color coding based on throttle level
      const pct = limits.max_vram_pct;
      const limitColor = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? '#f9e2af' : '#f38ba8';
      if (vramLimit) vramLimit.style.color = limitColor;
      if (ramLimit) ramLimit.style.color = limitColor;
      if (cpuLimit) cpuLimit.style.color = limitColor;

      // Bar gradient based on level
      if (vramBar) {
        vramBar.style.background = pct >= 80
          ? 'linear-gradient(90deg, var(--accent-green), var(--accent))'
          : pct >= 50 ? 'linear-gradient(90deg, #f9e2af, #fab387)'
          : 'linear-gradient(90deg, #f38ba8, #e64553)';
      }

      // Badge
      if (badge) {
        if (!limits.throttle_active) {
          badge.textContent = 'SOLO';
          badge.style.background = 'rgba(51,255,170,0.1)';
          badge.style.color = 'var(--accent-green)';
        } else if (pct >= 80) {
          badge.textContent = 'LOW';
          badge.style.background = 'rgba(51,255,170,0.1)';
          badge.style.color = 'var(--accent-green)';
        } else if (pct >= 50) {
          badge.textContent = 'MED';
          badge.style.background = 'rgba(249,226,175,0.15)';
          badge.style.color = '#f9e2af';
        } else {
          badge.textContent = 'HIGH';
          badge.style.background = 'rgba(243,139,168,0.15)';
          badge.style.color = '#f38ba8';
        }
      }

      // Cache stats
      const cacheStats = (status as any).cache_stats;
      if (cacheStats) {
        const cacheEntries = document.getElementById('projecty-mesh-cache-entries');
        const cacheMax = document.getElementById('projecty-mesh-cache-max');
        const cacheBar = document.getElementById('projecty-mesh-cache-bar');
        const cacheTtl = document.getElementById('projecty-mesh-cache-ttl');
        if (cacheEntries) cacheEntries.textContent = String(cacheStats.entries || 0);
        if (cacheMax) cacheMax.textContent = String(cacheStats.max || 50);
        if (cacheBar) {
          const fillPct = cacheStats.max > 0 ? ((cacheStats.entries || 0) / cacheStats.max) * 100 : 0;
          cacheBar.style.width = `${Math.min(100, fillPct).toFixed(1)}%`;
        }
        if (cacheTtl) {
          const mins = Math.round((cacheStats.ttl_seconds || 1800) / 60);
          cacheTtl.textContent = `${mins} min`;
        }
      }
    }
  } catch (err) { console.warn('[Mesh] Failed to poll mesh status:', err); }
}

function renderMeshNodes(nodes: MeshReachabilityNode[]): void {
  const nodesEl = document.getElementById('projecty-mesh-nodes');
  const countEl = document.getElementById('projecty-mesh-count');
  if (!nodesEl) return;

  if (countEl) countEl.textContent = `${nodes.length}`;

  if (nodes.length === 0) {
    nodesEl.innerHTML = `<p style="font-size:11px; color:var(--text-muted); text-align:center; padding:8px;">${t('mesh.no_nodes')}</p>`;
    return;
  }

  nodesEl.innerHTML = '';
  for (const node of nodes) {
    nodesEl.appendChild(createNodeCard(node));
  }
}

function createNodeCard(node: MeshReachabilityNode): HTMLElement {
  const card = document.createElement('div');
  const statusText = node.isReachable ? 'Online' : t('mesh.blocked');
  const tooltip = node.isReachable 
    ? `${t('mesh.node_ready')} ${node.ip}`
    : t('mesh.node_blocked');
  const isActiveOllama = node.ip === currentOllamaHost;

  card.style.cssText = `
    background: var(--bg-overlay); border: 1px solid ${isActiveOllama ? 'var(--accent-green)' : 'var(--border)'};
    border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 4px;
    ${isActiveOllama ? 'box-shadow: 0 0 8px rgba(51,255,170,0.15);' : ''}
  `;
  card.setAttribute('title', tooltip);

  // v7.0: Show nickname (from shield) if available, otherwise hostname
  const displayName = node.nickname || node.hostname || t('mesh.unknown');

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:12px; font-weight:600; color:var(--text);" title="${node.hostname}">${displayName}</span>
      <div style="display:flex; gap:4px; align-items:center;">
        <span style="width:6px; height:6px; border-radius:50%; background:${node.isReachable ? 'var(--accent-green)' : '#f9e2af'};"></span>
        <span style="font-size:10px; font-weight:700; text-transform:uppercase; color:${node.isReachable ? 'var(--accent-green)' : '#f9e2af'};">${statusText}</span>
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:10px; padding:2px 6px; border-radius:3px; background:${node.is_cortex ? 'rgba(51,255,170,0.1)' : 'rgba(0,163,255,0.1)'}; color:${node.is_cortex ? 'var(--accent-green)' : 'var(--accent)'};">
        ${node.is_cortex ? 'Cortex Node' : 'Light Node'}
      </span>
      <span style="font-size:11px; color:var(--text-muted); font-family:'JetBrains Mono',monospace;">${node.ip}</span>
    </div>
    <div style="font-size:11px; color:var(--accent-green); font-weight:bold; margin-top:4px;">
      VRAM: ${node.vram_free_gb.toFixed(1)} GB
    </div>
    <button class="mesh-use-ollama-btn" data-ip="${node.ip}" style="
      margin-top:6px; padding:6px 10px; border:none; border-radius:5px; cursor:pointer;
      font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.3px;
      transition:all 0.2s;
      background:${isActiveOllama ? 'linear-gradient(135deg, var(--accent-green), #2dd4bf)' : 'linear-gradient(135deg, #a855f7, #7c3aed)'};
      color:white;
    ">${isActiveOllama ? '✅ Ollama Ativo' : '🎯 Usar Ollama'}</button>
  `;

  // Wire button
  const btn = card.querySelector('.mesh-use-ollama-btn') as HTMLButtonElement;
  if (btn && !isActiveOllama) {
    btn.addEventListener('click', async () => {
      btn.textContent = '⏳ Verificando...';
      try {
        const probeData = await probeOllamaNode(node.ip, 11434);
        if (probeData.reachable) {
          // Connect to remote Ollama
          await updateConfig({ ollama_host: node.ip, ollama_port: 11434 });
          currentOllamaHost = node.ip;

          // Auto-select first available model on the remote to avoid model swapping
          if (probeData.models && probeData.models.length > 0) {
            await updateConfig({ selected_model: probeData.models[0] });
          }

          updateOllamaSourceUI();
          PubSub.emit('config:updated');
          PubSub.emit('models:refresh');
          btn.textContent = '✅ Ollama Ativo';
          btn.style.background = 'linear-gradient(135deg, var(--accent-green), #2dd4bf)';
        } else {
          // v7.0: Ollama is not running or unreachable on the remote node
          const reason = probeData.error || 'Não encontrado';
          btn.textContent = `❌ Ollama: ${reason.length > 30 ? 'Offline' : reason}`;
          btn.style.background = 'rgba(243,139,168,0.3)';
          setTimeout(() => { btn.textContent = '🎯 Usar Ollama'; btn.style.background = 'linear-gradient(135deg, #a855f7, #7c3aed)'; }, 4000);
        }
      } catch {
        btn.textContent = '❌ Backend offline';
        btn.style.background = 'rgba(243,139,168,0.3)';
        setTimeout(() => { btn.textContent = '🎯 Usar Ollama'; btn.style.background = 'linear-gradient(135deg, #a855f7, #7c3aed)'; }, 4000);
      }
    });
  }

  return card;
}

function updateOllamaSourceUI(): void {
  const sourceEl = document.getElementById('projecty-mesh-ollama-source');
  const ipEl = document.getElementById('projecty-mesh-ollama-ip');
  const localBtn = document.getElementById('projecty-mesh-ollama-local');
  if (!sourceEl || !ipEl) return;

  if (currentOllamaHost && currentOllamaHost !== '127.0.0.1') {
    sourceEl.style.display = 'block';
    ipEl.textContent = currentOllamaHost + ':11434';
    if (localBtn) localBtn.style.display = 'inline';
  } else {
    sourceEl.style.display = 'none';
  }
}
