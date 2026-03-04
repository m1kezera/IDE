import React, { useState, useEffect } from 'react';
import { fetchExtensions, toggleExtension } from '../services/api';

export default function ExtensionPanel() {
    const [extensions, setExtensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadExtensions = async () => {
        setLoading(true);
        try {
            const data = await fetchExtensions();
            setExtensions(data.extensions || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Erro ao carregar extensões');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadExtensions();
    }, []);

    const handleToggle = async (id, currentState) => {
        try {
            // Optimistic update
            setExtensions(prev => prev.map(ext =>
                ext.id === id ? { ...ext, enabled: !currentState } : ext
            ));

            const result = await toggleExtension(id);

            // Revert if API state doesn't match
            if (result.enabled === currentState) {
                setExtensions(prev => prev.map(ext =>
                    ext.id === id ? { ...ext, enabled: currentState } : ext
                ));
            }
        } catch (err) {
            alert('Falha ao alterar extensão: ' + err.message);
            // Revert optimistic update
            setExtensions(prev => prev.map(ext =>
                ext.id === id ? { ...ext, enabled: currentState } : ext
            ));
        }
    };

    return (
        <div className="panel-placeholder">
            <div className="panel-header">EXTENSÕES</div>

            <div className="extensions-menu">
                <p className="panel-hint" style={{ padding: '0 12px 12px' }}>
                    🧩 Adicione funcionalidades à Lumina IDE via extensões locais.
                </p>

                {loading ? (
                    <div className="extensions-loading">⏳ Carregando...</div>
                ) : error ? (
                    <div className="extensions-error">❌ {error}</div>
                ) : extensions.length === 0 ? (
                    <div className="extensions-empty">
                        <p>Nenhuma extensão instalada.</p>
                        <span className="panel-hint" style={{ display: 'block', marginTop: '8px', fontSize: '10px' }}>
                            Coloque pastas com <code style={{ background: 'var(--bg-overlay)', padding: '2px 4px', borderRadius: '3px' }}>extension.json</code> em <br />
                            <code style={{ color: 'var(--accent)' }}>/backend/lumina_extensions/</code>
                        </span>
                    </div>
                ) : (
                    <div className="extensions-list">
                        {extensions.map(ext => (
                            <div key={ext.id} className={`extension-card ${ext.enabled ? '' : 'disabled'}`}>
                                <div className="extension-header">
                                    <h3 className="extension-name">{ext.name}</h3>
                                    <span className="extension-version">v{ext.version}</span>
                                </div>

                                <p className="extension-desc">{ext.description}</p>

                                <div className="extension-footer">
                                    <span className="extension-author">Por: {ext.author}</span>

                                    <button
                                        className={`btn-ghost ${ext.enabled ? 'active' : ''}`}
                                        onClick={() => handleToggle(ext.id, ext.enabled)}
                                        style={{
                                            color: ext.enabled ? 'var(--accent-red)' : 'var(--accent-green)',
                                            borderColor: ext.enabled ? 'rgba(243,139,168,0.3)' : 'rgba(166,227,161,0.3)',
                                            padding: '2px 8px', fontSize: '10px'
                                        }}
                                    >
                                        {ext.enabled ? 'Desabilitar' : 'Habilitar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
