import React, { useState, useEffect, useRef, useCallback } from 'react';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import TelemetryBar from './components/TelemetryBar';
import TabBar from './components/TabBar';
import BottomPanel from './components/BottomPanel';
import FileExplorer from './components/FileExplorer';
import FileEditor from './components/FileEditor';
import SettingsPanel from './components/SettingsPanel';
import ExtensionPanel from './components/ExtensionPanel';
import { fetchConfig, fetchDashboard, getFileTree, readFile } from './services/api';

function TelemetrySidebarContent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = () => {
            fetchDashboard()
                .then(d => { setData(d); setLoading(false); })
                .catch(() => setLoading(false));
        };
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <p className="panel-hint" style={{ fontSize: '11px' }}>Carregando telemetria...</p>;
    if (!data) return <p className="panel-hint" style={{ fontSize: '11px' }}>Não foi possível carregar a telemetria.</p>;

    const totalTokens = data.total_tokens || 0;
    const costSaved = (totalTokens * 0.00001).toFixed(4);

    return (
        <>
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Ollama</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● Conectado</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tokens Totais</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{totalTokens.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Economia estimada</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${costSaved}</span>
                </div>
            </div>
            {data.recent_calls && data.recent_calls.length > 0 && (
                <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>CHAMADAS RECENTES</span>
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {data.recent_calls.slice(0, 8).map((call, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 6px', background: 'var(--bg-overlay)', borderRadius: '3px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{call.model || 'local'}</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{call.tokens || 0} tok</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>📈 DISTRIBUIÇÃO</span>
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', height: '20px' }}>
                    <div style={{ flex: data.prompt_tokens || 1, background: 'var(--accent)', borderRadius: '3px', opacity: 0.5 }} title={`Prompt: ${data.prompt_tokens || 0}`} />
                    <div style={{ flex: data.completion_tokens || 1, background: 'var(--accent-green)', borderRadius: '3px', opacity: 0.5 }} title={`Completion: ${data.completion_tokens || 0}`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                    <span>Prompt</span>
                    <span>Completion</span>
                </div>
            </div>
        </>
    );
}

export default function App() {
    const [mode, setMode] = useState('local');
    const [model, setModel] = useState('');
    const [workspace, setWorkspace] = useState(null);
    const [tokenCount, setTokenCount] = useState(0);

    // Panels
    const [activePanel, setActivePanel] = useState('explorer');
    const [bottomVisible, setBottomVisible] = useState(true);

    // Tabs (multi-file)
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    // Agent context
    const [promptFiles, setPromptFiles] = useState([]);       // .txt prompt guides
    const [contextFiles, setContextFiles] = useState([]);     // context files attached by user

    // Telemetry sidebar
    const [telemetryData, setTelemetryData] = useState(null);

    // Refs
    const explorerRef = useRef(null);

    // Load config on mount
    useEffect(() => {
        fetchConfig()
            .then(cfg => {
                if (cfg.selected_model) setModel(cfg.selected_model);
            })
            .catch(() => { });
    }, []);

    // Track workspace from explorer
    useEffect(() => {
        const interval = setInterval(() => {
            const path = explorerRef.current?.getWorkspacePath?.();
            if (path && path !== workspace) setWorkspace(path);
        }, 2000);
        return () => clearInterval(interval);
    }, [workspace]);

    // ── Keyboard Shortcuts (VS Code-like) ──────────────────────────
    useEffect(() => {
        const handler = (e) => {
            // Ctrl+` → Toggle bottom panel (terminal/AI)
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setBottomVisible(v => !v);
            }
            // Ctrl+Shift+E → Explorer
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                setActivePanel(p => p === 'explorer' ? null : 'explorer');
            }
            // Ctrl+Shift+F → (removed, now Ctrl+F is in-file search handled by FileEditor)
            // Ctrl+Shift+X → Extensions
            if (e.ctrlKey && e.shiftKey && e.key === 'X') {
                e.preventDefault();
                setActivePanel(p => p === 'extensions' ? null : 'extensions');
            }
            // Ctrl+B → Toggle sidebar
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                setActivePanel(p => p ? null : 'explorer');
            }
            // Ctrl+, → Settings
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                handleOpenSettings();
            }
            // Ctrl+W → Close active tab
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                if (activeTab) handleCloseTab(activeTab);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [activeTab]);

    // Open Settings Tab
    const handleOpenSettings = useCallback(() => {
        const settingsPath = 'lumina://settings';
        const existing = openTabs.find(t => t.path === settingsPath);
        if (!existing) {
            setOpenTabs(prev => [...prev, { path: settingsPath, name: 'Configurações', ext: 'sys', is_special: true }]);
        }
        setActiveTab(settingsPath);
        setActivePanel(null); // Close sidebar for clean view
    }, [openTabs]);

    // Open file in tab
    const handleFileSelect = useCallback((fileData) => {
        const existing = openTabs.find(t => t.path === fileData.path);
        if (!existing) {
            setOpenTabs(prev => [...prev, { ...fileData, modified: false }]);
        }
        setActiveTab(fileData.path);
    }, [openTabs]);

    // Close tab
    const handleCloseTab = useCallback((path) => {
        setOpenTabs(prev => {
            const newTabs = prev.filter(t => t.path !== path);
            if (activeTab === path) {
                setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
            }
            return newTabs;
        });
    }, [activeTab]);

    // When AI creates files → refresh explorer
    const handleFilesCreated = useCallback((files) => {
        setTimeout(() => explorerRef.current?.refresh(), 500);
        setTokenCount(prev => prev + files.length);
    }, []);

    // Get the active file data
    const activeFileData = openTabs.find(t => t.path === activeTab) || null;

    return (
        <div className="ide-layout">
            {/* ─── Telemetry Bar (top) ────────────────────────── */}
            <TelemetryBar mode={mode} model={model} />

            {/* ─── Activity Bar (far left icons) ──────────────── */}
            <ActivityBar
                activePanel={activePanel}
                onPanelChange={(id) => {
                    if (id === 'settings') {
                        handleOpenSettings();
                    } else {
                        setActivePanel(id);
                    }
                }}
            />

            {/* ─── Side Panel ─────────────────────────────────── */}
            {activePanel && (
                <aside className="side-panel">
                    {activePanel === 'explorer' && (
                        <FileExplorer
                            ref={explorerRef}
                            onFileSelect={handleFileSelect}
                            activeFile={activeTab}
                        />
                    )}
                    {activePanel === 'ai' && (
                        <div className="panel-placeholder">
                            <div className="panel-header">AGENT — CONTEXTO & PROMPTS</div>
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                                {/* Custom Prompt Files */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>📝 PROMPTS INSTRUCIONAIS</span>
                                        <label style={{ cursor: 'pointer', fontSize: '16px', color: 'var(--accent)' }} title="Adicionar arquivo .txt">
                                            +
                                            <input type="file" accept=".txt" multiple style={{ display: 'none' }} onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                files.forEach(f => {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        setPromptFiles(prev => [...prev, { name: f.name, content: reader.result }]);
                                                    };
                                                    reader.readAsText(f);
                                                });
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>
                                    {promptFiles.length === 0 ? (
                                        <p className="panel-hint" style={{ fontSize: '11px' }}>Nenhum prompt carregado. Adicione arquivos .txt para guiar o modelo.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {promptFiles.map((pf, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '11px' }}>
                                                    <span style={{ color: 'var(--accent-green)' }}>📄</span>
                                                    <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pf.name}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{Math.round(pf.content.length / 1024)}KB</span>
                                                    <button onClick={() => setPromptFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Context Files (Read-only view in sidebar) */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>📎 ARQUIVOS DE CONTEXTO</span>
                                    </div>
                                    <p className="panel-hint" style={{ fontSize: '11px', marginBottom: '6px' }}>
                                        Adicione arquivos ou pastas de contexto pelos botões acima do chat.
                                    </p>
                                    {contextFiles.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {contextFiles.map((cf, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '11px' }}>
                                                    <span>{cf.is_dir ? '📂' : '📄'}</span>
                                                    <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cf.name}</span>
                                                    <button onClick={() => setContextFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {activePanel === 'telemetry' && (
                        <div className="panel-placeholder">
                            <div className="panel-header">TELEMETRIA</div>
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <TelemetrySidebarContent />
                            </div>
                        </div>
                    )}
                    {activePanel === 'extensions' && <ExtensionPanel />}
                </aside>
            )}

            {/* ─── Editor Area ─────────────────────────────────── */}
            <main className="editor-area">
                <TabBar
                    tabs={openTabs}
                    activeTab={activeTab}
                    onSelect={setActiveTab}
                    onClose={handleCloseTab}
                />

                <div className="editor-content">
                    {activeTab === 'lumina://settings' ? (
                        <SettingsPanel />
                    ) : activeFileData ? (
                        <FileEditor
                            file={activeFileData}
                            onClose={() => handleCloseTab(activeFileData.path)}
                            onSaved={() => {
                                setOpenTabs(prev => prev.map(t =>
                                    t.path === activeFileData.path ? { ...t, modified: false } : t
                                ));
                            }}
                        />
                    ) : (
                        <div className="welcome-screen">
                            <img src="/Luminalogo.png" alt="Lumina" className="welcome-logo-img lumina-icon" />
                            <h2 className="welcome-title">Lumina IDE</h2>
                            <p className="welcome-sub">Local Intelligence, Global Performance</p>
                            <div className="welcome-actions">
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+Shift+E</kbd>
                                    <span>Abrir Explorer</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+`</kbd>
                                    <span>Painel do Agent</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+B</kbd>
                                    <span>Toggle Sidebar</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+,</kbd>
                                    <span>Configurações</span>
                                </div>
                                <div className="welcome-shortcut">
                                    <kbd>Ctrl+W</kbd>
                                    <span>Fechar aba</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Bottom Panel (AI + Output) ────────────────── */}
                {bottomVisible && (
                    <BottomPanel
                        mode={mode}
                        promptFiles={promptFiles}
                        onFilesCreated={handleFilesCreated}
                        workspace={workspace}
                    />
                )}
            </main>

            {/* ─── Status Bar ──────────────────────────────────── */}
            <StatusBar
                mode={mode}
                model={model}
                workspace={workspace}
                tokenCount={tokenCount}
            />
        </div>
    );
}
