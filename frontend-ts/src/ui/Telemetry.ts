/**
 * Project Y — Telemetry UI (v7.0)
 * Surgical DOM updates with Shield section, mini-tables, and system stats.
 */

import { fetchBrainStatus, fetchSentinelStatus, fetchMotorStatus, fetchDashboard, fetchMeshNodes, pingMeshNode, fetchShieldReport, fetchMeshStatus } from '../api/client';
import type { SentinelStatus, DashboardData, MeshNode, ShieldReport } from '../api/client';
import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

const isElectronTel = window.location.protocol === 'file:';
const API = isElectronTel ? 'http://127.0.0.1:8001/api' : '/api';

let _firstPoll = true;


let pollInterval: ReturnType<typeof setInterval> | null = null;

export interface MeshReachabilityNode extends MeshNode {
  isReachable: boolean;
}

export function initTelemetry(): void {
  poll();
  pollInterval = setInterval(poll, 5000);
  initBlacklistUI();
}

async function poll(): Promise<void> {
  try {
    const [brain, sentinel, motor, dashboard, mesh, shield, gpu] = await Promise.allSettled([
      fetchBrainStatus(),
      fetchSentinelStatus(),
      fetchMotorStatus(),
      fetchDashboard(),
      fetchMeshNodes(),
      fetchShieldReport(),
      fetchMeshStatus(),
    ]);

    // Brain
    if (brain.status === 'fulfilled') {
      if (_firstPoll) console.log(`%c[Telemetry] Brain: is_ready=${brain.value.is_ready}, cache=${brain.value.cache_size}`, 'color:#33ffaa');
      updateElement('projecty-brain-status', brain.value.is_ready ? `🟢 ${t('telem.online')}` : `🔴 ${t('telem.offline')}`);
      updateElement('projecty-brain-latency', `${(brain.value.analysis_latency_ms || 0).toFixed(1)}ms`);
      updateElement('projecty-brain-cache', `${brain.value.cache_size || 0} ${t('telem.files')}`);
      PubSub.emit('brain:updated', brain.value);
    } else {
      console.warn('[Telemetry] Brain FAILED:', (brain as PromiseRejectedResult).reason);
    }

    // Sentinel
    if (sentinel.status === 'fulfilled') {
      const s = sentinel.value as SentinelStatus;
      updateElement('projecty-sentinel-indicator', s.panic_triggered ? `🔴 ${t('telem.alert')}` : `🟢 ${t('telem.secure')}`);
      if (s.panic_triggered) {
        PubSub.emit('sentinel:panic', s.reason || t('telem.intrusion'));
      }
    }

    // Motor
    if (motor.status === 'fulfilled') {
      const m = motor.value;
      if (_firstPoll) console.log(`%c[Telemetry] Motor: status=${m.status}`, 'color:#33ffaa');
      updateElement('projecty-motor-status', m.status === 'ready' ? `🟢 ${t('telem.ready')}` : m.status === 'starting' ? `🟡 ${t('telem.starting')}` : `🔴 ${t('telem.offline')}`);
      PubSub.emit('motor:updated', m.status);
    } else {
      console.warn('[Telemetry] Motor FAILED:', (motor as PromiseRejectedResult).reason);
    }

    // Shield Telemetry (v7.0)
    if (shield.status === 'fulfilled') {
      const s = shield.value as ShieldReport;
      updateElement('projecty-shield-active', s.is_active ? `🟢 ${t('telem.active')}` : `🔴 ${t('telem.inactive')}`);
      updateElement('projecty-shield-scans', s.scans_performed.toLocaleString());
      updateElement('projecty-shield-threats', String(s.threats_blocked));
      updateElement('projecty-shield-blacklist', String(s.blacklist_size));
      const uptimeMin = Math.floor(s.uptime_seconds / 60);
      updateElement('projecty-shield-uptime', uptimeMin > 60 ? `${Math.floor(uptimeMin / 60)}h ${uptimeMin % 60}m` : `${uptimeMin}m`);
    }

    // System Stats (GPU from mesh)
    if (gpu.status === 'fulfilled') {
      const g = gpu.value;
      updateElement('projecty-sys-gpu', g.gpu_name || 'N/A');
      if (g.vram_total_gb > 0) {
        const usedGB = (g.vram_total_gb - g.vram_free_gb).toFixed(1);
        updateElement('projecty-sys-vram', `${usedGB} / ${g.vram_total_gb.toFixed(1)} GB`);
      }
    }

    // Mesh/Swarm (v5.0 Resilience)
    if (mesh.status === 'fulfilled') {
      const nodes = mesh.value.nodes || [];
      const nodesWithPing: MeshReachabilityNode[] = await Promise.all(nodes.map(async (n): Promise<MeshReachabilityNode> => {
        const isReachable = await pingMeshNode(n.ip, n.port);
        return { ...n, isReachable };
      }));
      
      const onlineCount = nodesWithPing.filter(n => n.isReachable).length;
      const blockedCount = nodesWithPing.length - onlineCount;
      const meshSummary = `🕸️ ${onlineCount} ${t('telem.online')}${blockedCount > 0 ? ` (+${blockedCount} ${t('telem.blocked')})` : ''}`;
      updateElement('projecty-mesh-summary', meshSummary);
      PubSub.emit('mesh:nodes_updated', nodesWithPing);
    }

    // Dashboard
    if (dashboard.status === 'fulfilled') {
      const d = dashboard.value as DashboardData;
      updateElement('projecty-total-tokens', (d.total_tokens || 0).toLocaleString());
      updateElement('projecty-prompt-tokens', (d.prompt_tokens || 0).toLocaleString());
      updateElement('projecty-completion-tokens', (d.completion_tokens || 0).toLocaleString());

      const allTime = (d as any).all_time;
      if (allTime) {
        updateElement('projecty-local-tokens', (allTime.tokens_local || 0).toLocaleString());
        updateElement('projecty-cloud-cost', `$${(allTime.cost_usd || 0).toFixed(4)}`);
        updateElement('projecty-savings', `$${(allTime.estimated_savings_usd || 0).toFixed(4)}`);
      } else {
        updateElement('projecty-cloud-cost', `$0.0000`);
        updateElement('projecty-savings', `$0.0000`);
      }
      updateElement('projecty-local-cost', '$0.0000');
    }
  } catch (err) {
    console.error('[Telemetry] Poll error:', err);
  }
  _firstPoll = false;
}

function updateElement(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function disposeTelemetry(): void {
  if (pollInterval) clearInterval(pollInterval);
}

// ─── Shield Blacklist UI ──────────────────────────────────────────
function initBlacklistUI(): void {
  const addBtn = document.getElementById('projecty-blacklist-add');
  const input = document.getElementById('projecty-blacklist-input') as HTMLInputElement;
  
  if (addBtn && input) {
    addBtn.addEventListener('click', async () => {
      const name = input.value.trim();
      if (!name) return;
      try {
        const resp = await fetch(`${API}/shield/blacklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const data = await resp.json();
        renderBlacklist(data.blacklist || []);
        input.value = '';
      } catch (err) { console.warn('[Telemetry] Failed to add to blacklist:', err); }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });
  }

  // Initial load
  loadBlacklist();
}

async function loadBlacklist(): Promise<void> {
  try {
    const resp = await fetch(`${API}/shield/blacklist`);
    const data = await resp.json();
    renderBlacklist(data.blacklist || []);
  } catch (err) { console.warn('[Telemetry] Failed to load blacklist:', err); }
}

function renderBlacklist(items: string[]): void {
  const list = document.getElementById('projecty-blacklist-list');
  if (!list) return;
  
  if (items.length === 0) {
    list.innerHTML = `<div class="telem-detail" style="color:var(--text-muted); font-size:10px;">${t('telem.no_blacklist')}</div>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="telem-detail" style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:10px; color:var(--text);">${item}</span>
      <button class="blacklist-remove-btn" data-name="${item}" style="background:none; border:none; color:var(--accent-red, #f38ba8); cursor:pointer; font-size:11px; padding:0 4px;" title="${t('telem.remove')}">✕</button>
    </div>
  `).join('');

  // Wire remove buttons
  list.querySelectorAll('.blacklist-remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = (btn as HTMLElement).dataset.name;
      if (!name) return;
      try {
        const resp = await fetch(`${API}/shield/blacklist/${encodeURIComponent(name)}`, { method: 'DELETE' });
        const data = await resp.json();
        renderBlacklist(data.blacklist || []);
      } catch (err) { console.warn('[Telemetry] Failed to remove from blacklist:', err); }
    });
  });
}
