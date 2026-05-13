/**
 * Project Y — Settings Panel (v5.0)
 * Connects the settings sidebar to real backend endpoints.
 * Pure DOM manipulation — no frameworks.
 */

import { fetchConfig, updateConfig, fetchMotorStatus, toggleMotor, fetchPermissions, updatePermissions } from '../api/client';
import { PubSub } from '../core/PubSub';
import { t } from '../core/i18n';

export function initSettingsPanel(): void {
  const panel = document.getElementById('projecty-panel-settings') as HTMLElement;
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header">${t('settings.title')}</div>
    <div class="settings-content-wrapper" style="padding:12px; display:flex; flex-direction:column; gap:16px; overflow-y:auto; flex:1;">

      <!-- Ollama Config -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>⚙️ ${t('settings.motor_ollama')}</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>Host</label>
            <input id="projecty-settings-host" class="settings-input" type="text" value="127.0.0.1" />
          </div>
          <div class="setting-field">
            <label>${t('settings.ollama_port')}</label>
            <input id="projecty-settings-port" class="settings-input" type="number" value="11434" />
          </div>
          <div class="setting-field">
            <label>
              ${t('settings.motor_status')}
              <span id="projecty-settings-motor-badge" class="settings-badge">offline</span>
            </label>
            <button id="projecty-settings-motor-toggle" style="background:linear-gradient(135deg, #00A3FF, #0070CC); color:white; border:none; border-radius:6px; padding:8px 12px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.15s;">
              Toggle Motor
            </button>
          </div>
          <div class="setting-field">
            <label>Conexão Ollama <span id="projecty-settings-conn-status" class="settings-badge"></span></label>
            <button id="projecty-settings-test-conn" style="background:linear-gradient(135deg, #a855f7, #7c3aed); color:white; border:none; border-radius:6px; padding:8px 12px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.15s;">
              🔌 Testar Conexão
            </button>
          </div>
        </div>
      </div>

      <!-- Agent Autonomy -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>🤖 ${t('settings.autonomy')}</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>${t('settings.perm_level')}</label>
            <select id="projecty-settings-agent-level" class="settings-input">
              <option value="Manual">${t('settings.perm_manual')}</option>
              <option value="Hybrid">${t('settings.perm_hybrid')}</option>
              <option value="Agent">${t('settings.perm_agent')}</option>
            </select>
          </div>
          <div class="setting-field" style="flex-direction:row; align-items:center; gap:8px;">
            <input type="checkbox" id="projecty-settings-override" style="accent-color: var(--accent);" />
            <label for="projecty-settings-override" style="margin:0; font-size:10px; text-transform:none; letter-spacing:normal;">${t('settings.override')}</label>
          </div>
        </div>
      </div>

      <!-- Sentinel -->
      <div class="settings-card">
        <div class="settings-card-header"><h3>🛡️ Sentinel Active Defense</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>
              ${t('settings.sentinel')}
              <span id="projecty-settings-sentinel-status" style="color:var(--accent-green); margin-left:4px;">${t('settings.sentinel_active')}</span>
            </label>
            <p style="font-size:10px; color:var(--text-muted); margin:0; line-height:1.5;">${t('settings.sentinel_desc')}</p>
          </div>
        </div>
      </div>

      <!-- Cloud API -->
      <div class="settings-card" style="border-left:3px solid #00A3FF; background:linear-gradient(135deg, rgba(0,163,255,0.04), transparent);">
        <div class="settings-card-header"><h3 style="color:#00A3FF;">☁️ Cloud API</h3></div>
        <div class="settings-card-body">
          <div class="setting-field">
            <label>
              API Key
              <span id="projecty-settings-cloud-provider" class="settings-badge" style="margin-left:6px;"></span>
            </label>
            <input id="projecty-settings-cloud-key" class="settings-input" type="password" placeholder="sk-..." autocomplete="off" />
          </div>
          <div class="setting-field">
            <label>${t('settings.cloud_model')}</label>
            <input id="projecty-settings-cloud-model" class="settings-input" type="text" value="gpt-4o" placeholder="gpt-4o, claude-sonnet-4-20250514, etc." />
          </div>
          <p style="font-size:10px; color:var(--text-muted); margin:0; line-height:1.5;">${t('settings.cloud_providers')}</p>
        </div>
      </div>

      <!-- Save Button -->
      <button id="projecty-settings-save" class="settings-save-btn" style="align-self:flex-end;">
        ${t('settings.save')}
      </button>

      <!-- Version Info -->
      <div class="settings-version-info">
        Lumina IDE v8.0 — Intelligent Development Environment<br/>
        © 2026 m1kezera
      </div>
    </div>
  `;

  // Load current config
  loadConfig();

  // Wire motor toggle
  const motorToggle = document.getElementById('projecty-settings-motor-toggle');
  if (motorToggle) {
    motorToggle.addEventListener('click', async () => {
      await toggleMotor();
      const status = await fetchMotorStatus();
      updateMotorBadge(status.status);
    });
  }

  // Wire save button
  const saveBtn = document.getElementById('projecty-settings-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveConfig);
  }

  // Wire connection test
  const testBtn = document.getElementById('projecty-settings-test-conn');
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      const connStatus = document.getElementById('projecty-settings-conn-status');
      const hostInput = document.getElementById('projecty-settings-host') as HTMLInputElement;
      const portInput = document.getElementById('projecty-settings-port') as HTMLInputElement;
      const host = hostInput?.value || '127.0.0.1';
      const port = portInput?.value || '11434';
      if (connStatus) {
        connStatus.textContent = '⏳ Testando...';
        connStatus.className = 'settings-badge neon';
      }
      try {
        // First: save the host/port to backend config
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ollama_host: host, ollama_port: parseInt(port) }),
        });
        // Then: test via backend's models endpoint (which proxies to Ollama)
        const resp = await fetch('/api/models');
        if (resp.ok) {
          const data = await resp.json();
          const models = data.models || [];
          if (models.length > 0) {
            if (connStatus) {
              connStatus.textContent = `✅ ${host}:${port} (${models.length} modelos)`;
              connStatus.className = 'settings-badge success';
              connStatus.style.cssText = 'background:rgba(166,227,161,0.15);color:#a6e3a1';
            }
          } else {
            if (connStatus) {
              connStatus.textContent = `⚠️ ${host}:${port} (0 modelos — faça ollama pull)`;
              connStatus.className = 'settings-badge';
              connStatus.style.cssText = 'background:rgba(249,226,175,0.15);color:#f9e2af';
            }
          }
        } else {
          if (connStatus) { connStatus.textContent = `❌ Ollama offline em ${host}:${port}`; connStatus.className = 'settings-badge'; connStatus.style.cssText = 'background:rgba(243,139,168,0.15);color:#f38ba8'; }
        }
      } catch {
        if (connStatus) { connStatus.textContent = '❌ Sem resposta do backend'; connStatus.className = 'settings-badge'; connStatus.style.cssText = 'background:rgba(243,139,168,0.15);color:#f38ba8'; }
      }
    });
  }

  // Periodic motor status
  setInterval(async () => {
    try {
      const status = await fetchMotorStatus();
      updateMotorBadge(status.status);
    } catch (err) { console.warn('[Settings] Motor status poll failed:', err); }
  }, 5000);
}

async function loadConfig(): Promise<void> {
  try {
    const config = await fetchConfig();
    const hostInput = document.getElementById('projecty-settings-host') as HTMLInputElement;
    const portInput = document.getElementById('projecty-settings-port') as HTMLInputElement;
    const levelSelect = document.getElementById('projecty-settings-agent-level') as HTMLSelectElement;
    const overrideCheck = document.getElementById('projecty-settings-override') as HTMLInputElement;
    const cloudKeyInput = document.getElementById('projecty-settings-cloud-key') as HTMLInputElement;
    const cloudModelInput = document.getElementById('projecty-settings-cloud-model') as HTMLInputElement;
    const cloudProviderBadge = document.getElementById('projecty-settings-cloud-provider');

    if (hostInput && config.ollama_host) hostInput.value = config.ollama_host;
    if (portInput && config.ollama_port) portInput.value = String(config.ollama_port);
    
    // Cloud fields
    if (cloudKeyInput && config.cloud_api_key) cloudKeyInput.value = config.cloud_api_key as string;
    if (cloudModelInput && config.cloud_model) cloudModelInput.value = config.cloud_model as string;
    if (cloudProviderBadge && config.cloud_provider) {
      const provider = config.cloud_provider as string;
      cloudProviderBadge.textContent = provider.toUpperCase();
      cloudProviderBadge.className = 'settings-badge success';
    } else if (cloudProviderBadge) {
      cloudProviderBadge.textContent = '';
    }

    try {
      const perms = await fetchPermissions();
      if (levelSelect) levelSelect.value = perms.level || 'Hybrid';
      if (overrideCheck) overrideCheck.checked = !!perms.override_protection;
    } catch { /* keep defaults */ }

    // Motor status
    const motorStatus = await fetchMotorStatus();
    updateMotorBadge(motorStatus.status);
  } catch {
    console.warn('[Settings] Could not load config');
  }
}

async function saveConfig(): Promise<void> {
  const hostInput = document.getElementById('projecty-settings-host') as HTMLInputElement;
  const portInput = document.getElementById('projecty-settings-port') as HTMLInputElement;
  const levelSelect = document.getElementById('projecty-settings-agent-level') as HTMLSelectElement;
  const overrideCheck = document.getElementById('projecty-settings-override') as HTMLInputElement;
  const cloudKeyInput = document.getElementById('projecty-settings-cloud-key') as HTMLInputElement;
  const cloudModelInput = document.getElementById('projecty-settings-cloud-model') as HTMLInputElement;
  const saveBtn = document.getElementById('projecty-settings-save') as HTMLButtonElement;

  try {
    const configPayload: Record<string, unknown> = {
      ollama_host: hostInput.value,
      ollama_port: parseInt(portInput.value, 10),
    };
    // Only send cloud key if it's not masked (user typed a new one)
    if (cloudKeyInput && cloudKeyInput.value && !cloudKeyInput.value.startsWith('•')) {
      configPayload.cloud_api_key = cloudKeyInput.value;
    }
    if (cloudModelInput && cloudModelInput.value) {
      configPayload.cloud_model = cloudModelInput.value;
    }
    
    await updateConfig(configPayload);
    
    await updatePermissions({
      level: levelSelect ? levelSelect.value : 'Hybrid',
      override_protection: overrideCheck ? overrideCheck.checked : false,
    });
    saveBtn.textContent = '✓ Salvo!';
    saveBtn.classList.add('saved');
    PubSub.emit('config:updated');
    
    // Reload to show detected provider
    await loadConfig();
    
    setTimeout(() => {
      saveBtn.textContent = 'Salvar Configurações';
      saveBtn.classList.remove('saved');
    }, 2000);
  } catch (err) {
    saveBtn.textContent = '✗ Erro';
    console.error('[Settings] Save failed:', err);
  }
}

function updateMotorBadge(status: string): void {
  const badge = document.getElementById('projecty-settings-motor-badge');
  if (!badge) return;
  badge.textContent = status;
  if (status === 'ready') {
    badge.className = 'settings-badge success';
  } else if (status === 'starting') {
    badge.className = 'settings-badge neon';
  } else {
    badge.className = 'settings-badge';
    badge.style.background = 'rgba(243,139,168,0.15)';
    badge.style.color = 'var(--accent-red)';
  }
}
