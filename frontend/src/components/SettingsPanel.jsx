import React, { useState, useEffect, useCallback } from 'react';
import { fetchConfig, updateConfig, fetchModels } from '../services/api';

const PROVIDER_LABELS = {
    openai: '🟢 OpenAI',
    anthropic: '🟠 Anthropic',
    groq: '⚡ Groq',
    google: '🔵 Google AI',
    replicate: '🔮 Replicate',
    huggingface: '🤗 HuggingFace',
    xai: '✖️ xAI (Grok)',
    nvidia: '💚 NVIDIA NIM',
    custom: '🔧 Custom',
};

export default function SettingsPanel() {
    const [config, setConfig] = useState({
        ollama_host: '127.0.0.1',
        ollama_port: 11434,
        local_model: 'mistral',
        cloud_model: 'gpt-4o',
        cloud_api_key: '',
        cloud_provider: '',
    });
    const [models, setModels] = useState([]);
    const [ollamaStatus, setOllamaStatus] = useState('checking');
    const [saved, setSaved] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        fetchConfig()
            .then(setConfig)
            .catch(() => { });
    }, []);

    const loadModels = useCallback(async () => {
        setLoadingModels(true);
        try {
            const data = await fetchModels();
            setModels(data.models || []);
            setOllamaStatus(data.status || 'offline');
        } catch {
            setModels([]);
            setOllamaStatus('offline');
        } finally {
            setLoadingModels(false);
        }
    }, []);

    useEffect(() => { loadModels(); }, [loadModels]);

    const handleSave = async () => {
        try {
            const result = await updateConfig(config);
            if (result.config?.cloud_provider) {
                setConfig(prev => ({ ...prev, cloud_provider: result.config.cloud_provider }));
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { /* handle error */ }
    };

    const selectModel = (modelName) => {
        setConfig({ ...config, local_model: modelName });
        updateConfig({ local_model: modelName }).catch(() => { });
    };

    const detectedProvider = PROVIDER_LABELS[config.cloud_provider] || '';

    return (
        <div className="settings-view">
            <div className="settings-header">
                <img src="/Luminalogo.png" alt="Lumina Logo" className="settings-logo lumina-icon" />
                <div>
                    <h2>Configurações</h2>
                    <p>Gerencie as conexões neurais da sua Lumina IDE</p>
                </div>
            </div>

            {/* Ollama Connection */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <span className="icon">🔌</span>
                    <h3>Conexão Ollama Local</h3>
                </div>
                <div className="settings-card-body">
                    <div className="setting-row-flex">
                        <div className="setting-field">
                            <label>Host / IP</label>
                            <input
                                className="settings-input"
                                value={config.ollama_host}
                                onChange={(e) => setConfig({ ...config, ollama_host: e.target.value })}
                                placeholder="127.0.0.1"
                            />
                        </div>
                        <div className="setting-field">
                            <label>Porta</label>
                            <input
                                className="settings-input"
                                type="number"
                                value={config.ollama_port}
                                onChange={(e) => setConfig({ ...config, ollama_port: Number(e.target.value) })}
                                placeholder="11434"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Local Models */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="icon">🧠</span>
                        <h3>Modelos Locais</h3>
                    </div>
                    <button className="settings-refresh-btn" onClick={loadModels} disabled={loadingModels}>
                        {loadingModels ? '⏳' : '🔄'} Buscar
                    </button>
                </div>
                <div className="settings-card-body">
                    {ollamaStatus === 'offline' && (
                        <div className="settings-alert error">
                            ⚠️ Ollama offline. Verifique se o servidor está rodando na porta {config.ollama_port}.
                        </div>
                    )}

                    {models.length > 0 ? (
                        <div className="model-grid">
                            {models.map((m) => (
                                <div
                                    key={m.name}
                                    className={`model-card ${config.local_model === m.name ? 'selected' : ''}`}
                                    onClick={() => selectModel(m.name)}
                                >
                                    <div className="model-card-header">
                                        <span className="model-name">{m.name}</span>
                                        {config.local_model === m.name && (
                                            <span className="model-active-badge">ATIVO</span>
                                        )}
                                    </div>
                                    <div className="model-card-details">
                                        {m.parameter_size && <span className="model-tag">{m.parameter_size}</span>}
                                        {m.family && <span className="model-tag">{m.family}</span>}
                                        {m.quantization && <span className="model-tag">{m.quantization}</span>}
                                        <span className="model-tag size">{m.size_gb} GB</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        ollamaStatus === 'connected' && (
                            <div className="settings-alert info">
                                Nenhum modelo encontrado. Abra o terminal e use <code>ollama pull mistral</code> para baixar um modelo.
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Cloud API */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <span className="icon">☁️</span>
                    <h3>Provedor Cloud</h3>
                </div>
                <div className="settings-card-body">
                    <div className="setting-field" style={{ marginBottom: '12px' }}>
                        <label>Modelo Cloud (Fallback)</label>
                        <input
                            className="settings-input"
                            value={config.cloud_model}
                            onChange={(e) => setConfig({ ...config, cloud_model: e.target.value })}
                            placeholder="gpt-4o / claude-3.5-sonnet"
                        />
                    </div>
                    <div className="setting-field">
                        <label>
                            API Key
                            {config.has_cloud_key && <span className="settings-badge success">Adicionada</span>}
                        </label>
                        <input
                            className="settings-input"
                            type="password"
                            value={config.cloud_api_key || ''}
                            onChange={(e) => setConfig({ ...config, cloud_api_key: e.target.value })}
                            placeholder="sk-... / sk-ant-..."
                        />
                    </div>
                    {detectedProvider && (
                        <div className="provider-detected">
                            Provedor detectado via Chave: <span className="settings-badge neon">{detectedProvider}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Theme */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <h3>🎨 Tema da Interface</h3>
                </div>
                <div className="settings-card-body">
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className={`settings-theme-btn ${document.documentElement.getAttribute('data-theme') !== 'light' ? 'active' : ''}`}
                            onClick={() => {
                                document.documentElement.removeAttribute('data-theme');
                                localStorage.setItem('lumina-theme', 'dark');
                                setConfig({ ...config, _theme: 'dark' }); // force re-render
                            }}
                        >
                            🌙 Dark
                        </button>
                        <button
                            className={`settings-theme-btn ${document.documentElement.getAttribute('data-theme') === 'light' ? 'active' : ''}`}
                            onClick={() => {
                                document.documentElement.setAttribute('data-theme', 'light');
                                localStorage.setItem('lumina-theme', 'light');
                                setConfig({ ...config, _theme: 'light' }); // force re-render
                            }}
                        >
                            ☀️ Light
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-footer">
                <button className={`settings-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                    {saved ? '✓ Configurações Salvas' : '💾 Salvar Configurações'}
                </button>
            </div>
        </div>
    );
}
