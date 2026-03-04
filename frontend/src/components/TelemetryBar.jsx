import React, { useState, useEffect } from 'react';
import { fetchDashboard } from '../services/api';

export default function TelemetryBar({ mode, model }) {
    const [data, setData] = useState(null);
    const [ollamaStatus, setOllamaStatus] = useState('checking');

    useEffect(() => {
        const load = () => {
            fetchDashboard()
                .then(d => { setData(d); setOllamaStatus('connected'); })
                .catch(() => setOllamaStatus('disconnected'));
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const totalTokens = data?.total_tokens || 0;
    const costSaved = (totalTokens * 0.00001).toFixed(4); // rough estimate vs cloud

    return (
        <div className="telemetry-bar">
            <div className="telemetry-left">
                <img src="/Luminalogo.png" alt="Lumina" className="telemetry-logo lumina-icon" />
                <span className="telemetry-brand">Lumina IDE</span>
            </div>

            <div className="telemetry-center">
                {/* Ollama Status */}
                <div className={`telemetry-chip ${ollamaStatus}`}>
                    <span className={`status-dot ${ollamaStatus}`} />
                    <span className="chip-label">
                        {ollamaStatus === 'connected' ? 'Ollama' : ollamaStatus === 'checking' ? '...' : 'Offline'}
                    </span>
                    {model && <span className="chip-model">{model}</span>}
                </div>

                {/* Token Counter */}
                <div className="telemetry-chip tokens">
                    <span className="chip-icon">📊</span>
                    <span className="chip-label">{totalTokens.toLocaleString()}</span>
                    <span className="chip-unit">tokens</span>
                </div>

                {/* Cost Saved */}
                {totalTokens > 0 && (
                    <div className="telemetry-chip savings">
                        <span className="chip-icon">💰</span>
                        <span className="chip-label">${costSaved}</span>
                        <span className="chip-unit">economizados</span>
                    </div>
                )}

                {/* Mode */}
                <div className="telemetry-chip mode">
                    <span className="chip-icon">{mode === 'local' ? '⚡' : '☁️'}</span>
                    <span className="chip-label">{mode === 'local' ? 'Local' : 'Cloud'}</span>
                </div>
            </div>

            <div className="telemetry-right">
                <span className="telemetry-time">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
}
