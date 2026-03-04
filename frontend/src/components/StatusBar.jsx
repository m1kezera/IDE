import React from 'react';

export default function StatusBar({ mode, model, workspace, tokenCount }) {
    return (
        <div className="status-bar">
            <div className="status-left">
                <span className="status-item clickable" title="Workspace">
                    📁 {workspace ? workspace.split(/[\\/]/).pop() : 'Sem pasta'}
                </span>
            </div>
            <div className="status-right">
                <span className="status-item">
                    {mode === 'local' ? '⚡' : '☁️'} {mode === 'local' ? 'Ollama' : 'Cloud'}
                </span>
                {model && (
                    <span className="status-item" title={`Modelo: ${model}`}>
                        🧠 {model}
                    </span>
                )}
                {tokenCount > 0 && (
                    <span className="status-item" title="Tokens processados nesta sessão">
                        📊 {tokenCount.toLocaleString()} tokens
                    </span>
                )}
                <span className="status-item brand">
                    Lumina IDE v1.0
                </span>
            </div>
        </div>
    );
}
