# Código Fonte Frontend Completo - Lumina IDE (v2.3)

> Este documento representa a versão 2.3 (Lumina Orchestrator), consolidando o Model Manager e controles de motor na StatusBar.

## Código Fonte Frontend Completo - Lumina IDE - v2.3

### `frontend/src/App.jsx`

```jsx
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
import SwarmPanel from './components/SwarmPanel';
import LivePreview from './components/LivePreview';
import OnboardingModal from './components/OnboardingModal';
import HealerOverlay from './components/HealerOverlay';
import LibraryPanel from './components/LibraryPanel';
import IdentityModal from './components/IdentityModal';
import SecurityAlert from './components/SecurityAlert';
import {
    checkHealth,
    fetchConfig,
    browseFolder,
    getWorkspace,
    fetchBrainStatus,
    checkIdentityStatus,
    fetchSentinelStatus,
    fetchMotorStatus
} from './services/api';
import { Panel, Group, Separator } from 'react-resizable-panels';

function TelemetrySidebarContent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = () => {
            fetchDashboard()
                .then(d => { setData(d); setLoading(false); })
                .catch(() => setLoading(false));

            fetchBrainStatus().then(b => {
                // If nested data is available in dashboard or separate fetch
                // We'll merge it or use separate state if passed from parent
            });
        };
        load();
        const id = setInterval(load, 10000);
        return () => clearInterval(id);
    }, []);

    if (loading) return <p className="panel-hint" style={{ fontSize: '11px' }}>Carregando telemetria...</p>;
    if (!data) return <p className="panel-hint" style={{ fontSize: '11px' }}>Não foi possível carregar a telemetria.</p>;

    const totalTokens = data.total_tokens || 0;
    const cloudCost = (totalTokens / 1000 * 0.015).toFixed(4); // Estimate $0.015/1k tokens
    const localCost = "0.0000";
    const savings = cloudCost;

    return (
        <>
            <div style={{ background: 'var(--bg-overlay)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status Motor API</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● Online</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)', marginTop: '4px', opacity: 0.8 }}> ECONOMICS DASHBOARD 💰</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Custo Nuvem Estimado</span>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 500 }}>${cloudCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Custo Local (Lumina)</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>${localCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '2px', paddingTop: '6px', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Economia Total</span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '12px' }}>${savings}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tokens Processados</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{totalTokens.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latência Nervo Óptico</span>
                    <span style={{ color: 'var(--lumina-blue)', fontWeight: 600 }}>{brainData?.analysis_latency_ms?.toFixed(2) || 0} ms</span>
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
    const [identity, setIdentity] = useState({ is_registered: false, user_name: '' });
    const [sentinelStatus, setSentinelStatus] = useState('active'); // active, panic
    const [panicReason, setPanicReason] = useState('');
    const [brainData, setBrainData] = useState({ is_ready: false, last_pulse: 0, analysis_latency_ms: 0 });
    const [bypassProtection, setBypassProtection] = useState(false);
    const [memoryStatus, setMemoryStatus] = useState('');
    const [motorStatus, setMotorStatus] = useState('offline'); // offline, starting, ready

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

    // Load config and identity on mount (One-time)
    useEffect(() => {
        fetchConfig()
            .then(cfg => {
                if (cfg.selected_model) setModel(cfg.selected_model);
            })
            .catch(() => { });

        // Check Lumina Shield Identity (v2.2.2: Isolated from polling)
        checkIdentityStatus().then(setIdentity);
    }, []);

    // Periodic Monitoring: Sentinel & Brain (v2.1/v2.2)
    useEffect(() => {
        const sentinelInterval = setInterval(() => {
            fetchSentinelStatus().then(data => {
                if (data.panic_triggered) {
                    setSentinelStatus('panic');
                    setPanicReason(data.reason);
                } else {
                    setSentinelStatus('active');
                }
            });
        }, 5000); // Increased interval for efficiency

        const brainInterval = setInterval(() => {
            fetchBrainStatus().then(setBrainData);
        }, 5000); // Increased interval for efficiency

        const motorInterval = setInterval(() => {
            fetchMotorStatus().then(data => setMotorStatus(data.status));
        }, 3000);

        return () => {
            clearInterval(sentinelInterval);
            clearInterval(brainInterval);
            clearInterval(motorInterval);
        };
    }, []);

    // Track workspace from explorer
    useEffect(() => {
        const interval = setInterval(() => {
            const path = explorerRef.current?.getWorkspacePath?.();
            if (path && path !== workspace) setWorkspace(path);
        }, 2000);
        return () => clearInterval(interval);
    }, [workspace]);

    // ─── Proactive Auto-Healing Watcher ─────────────────────────────
    const [healerError, setHealerError] = useState(null);

    useEffect(() => {
        if (!workspace) return;

        let ws;
        let reconnectTimeout;

        const connect = () => {
            ws = new WebSocket('ws://127.0.0.1:8000/api/ws/watcher');

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'ANALYSIS_RESULT') {
                        setHealerError(data.error);
                    } else if (data.event === 'file_modified') {
                        // Clear known error if a file is successfully modified (without errors)
                        // Or if the heal logic returns None
                        setHealerError(null);
                    }
                } catch (e) {
                    console.error("Healer Parsing Error:", e);
                }
            };

            ws.onclose = () => {
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
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

    // ─── Proactive UI: Predictive Cache (v4.0 Module C) ───────────
    const [activePrediction, setActivePrediction] = useState(null);
    const predictionTimer = useRef(null);

    const handleFileHover = useCallback((hoveredFilePath) => {
        // Debounce hover to prevent spamming the backend
        if (predictionTimer.current) clearTimeout(predictionTimer.current);

        predictionTimer.current = setTimeout(async () => {
            if (!workspace) return;
            try {
                // Fetch speculation for the hovered file silently in the background
                const result = await predictNextSteps(workspace, hoveredFilePath, null); // knowledge base can be appended in the future
                if (result.status === 'success' && result.prediction && result.prediction.ghost_block) {
                    setActivePrediction(result.prediction);
                } else {
                    setActivePrediction(null);
                }
            } catch (e) {
                // Ignore silent errors
            }
        }, 400); // 400ms hover needed to trigger
    }, [workspace]);

    // Clear prediction if the user selects a file (they crossed the threshold from speculation to action)
    const handleFileSelect = useCallback((fileData) => {
        const existing = openTabs.find(t => t.path === fileData.path);
        if (!existing) {
            setOpenTabs(prev => [...prev, { ...fileData, modified: false }]);
        }
        setActiveTab(fileData.path);
        setActivePrediction(null); // intention became reality, clear projection
    }, [openTabs]);

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

            {/* ─── Main Workspace Area (Resizable) ────────────── */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Group direction="horizontal" autoSaveId="lumina-layout-v1-h">
                    {activePanel && (
                        <>
                            <Panel defaultSize={20} minSize={15} maxSize={40} id="sidebar-panel">
                                <aside className="side-panel" style={{ width: '100%', height: '100%' }}>
                                    {activePanel === 'explorer' && (
                                        <FileExplorer
                                            ref={explorerRef}
                                            onFileSelect={handleFileSelect}
                                            onFileHover={handleFileHover}
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
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>📝 PROMPTS & PLANEJAMENTO</span>
                                                        <label style={{ cursor: 'pointer', fontSize: '16px', color: 'var(--accent)' }} title="Gerenciar Planejamento (Adicionar .md ou .txt)">
                                                            +
                                                            <input type="file" accept=".txt,.md" multiple style={{ display: 'none' }} onChange={(e) => {
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
                                                <TelemetrySidebarContent brainData={brainData} />
                                            </div>
                                        </div>
                                    )}
                                    {activePanel === 'swarm' && <SwarmPanel />}
                                    {activePanel === 'edge' && <LivePreview onClose={() => setActivePanel('explorer')} />}
                                    {activePanel === 'library' && <LibraryPanel />}
                                    {activePanel === 'extensions' && <ExtensionPanel />}
                                </aside>
                            </Panel>
                            <Separator className="resizer-h" style={{ width: '4px', cursor: 'col-resize', background: 'var(--border)' }} />
                        </>
                    )}

                    <Panel id="main-editor-panel">
                        <Group direction="vertical" autoSaveId="lumina-layout-v1-v">
                            <Panel id="editor-content-panel">
                                <main className="editor-area" style={{ width: '100%', height: '100%' }}>
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
                                                activePrediction={activePrediction}
                                                onClose={() => handleCloseTab(activeFileData.path)}
                                                onSaved={() => {
                                                    setOpenTabs(prev => prev.map(t =>
                                                        t.path === activeFileData.path ? { ...t, modified: false } : t
                                                    ));
                                                }}
                                            />
                                        ) : (
                                            <div className="welcome-screen">
                                                <div className="welcome-aura"></div>
                                                <h1 className="welcome-title neon-blue">Lumina IDE</h1>
                                                <p className="welcome-sub">Cockpit Intelligence • Future Processing</p>
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
                                </main>
                            </Panel>

                            {/* ─── Bottom Panel (AI + Output) ────────────────── */}
                            {bottomVisible && (
                                <>
                                    <Separator className="resizer-v" style={{ height: '4px', cursor: 'row-resize', background: 'var(--border)' }} />
                                    <Panel defaultSize={30} minSize={10} id="bottom-terminal-panel">
                                        <BottomPanel
                                            mode={mode}
                                            promptFiles={promptFiles}
                                            onFilesCreated={handleFilesCreated}
                                            workspace={workspace}
                                        />
                                    </Panel>
                                </>
                            )}
                        </Group>
                    </Panel>
                </Group>
            </div>

            {/* Dashboard and Main Layout */}
            {/* Security Alert Modal (v2.1) */}
            {sentinelStatus === 'panic' && (
                <SecurityAlert
                    reason={panicReason}
                    onDismiss={() => setSentinelStatus('active')}
                />
            )}

            {/* ─── Status Bar ──────────────────────────────────── */}
            <StatusBar
                mode={mode}
                model={activeFileData?.model || model}
                workspace={workspace}
                tokenCount={tokenCount}
                userName={identity.user_name}
                sentinelStatus={sentinelStatus}
                brainData={brainData}
                motorStatus={motorStatus}
                onMotorToggle={() => toggleMotor().then(data => fetchMotorStatus().then(s => setMotorStatus(s.status)))}
                bypassProtection={bypassProtection}
                memoryStatus={memoryStatus}
                onEdgeClick={() => setActivePanel('edge')}
            />

            {/* Auto-Healing Hologram / Intervention UI */}
            {healerError && (
                <HealerOverlay error={healerError} onClose={() => setHealerError(null)} />
            )}
            {!identity.is_registered && mode === 'local' && (
                <IdentityModal
                    onRegister={(name) => setIdentity({ is_registered: true, user_name: name })}
                />
            )}
            {mode === 'onboarding' && <OnboardingModal onComplete={() => setMode('local')} />}
        </div>
    );
}
```

### `frontend/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

// Restore saved theme before first paint
const savedTheme = localStorage.getItem('lumina-theme');
if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```

### `frontend/src/style.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* ═══════════════════════════════════════════════════════════════════
   Lumina IDE — Design System
   Catppuccin-inspired dark theme with neural neon accents
   ═══════════════════════════════════════════════════════════════════ */
:root {
  --lumina-blue: #00A3FF;
  --bg-dark: #0B0E14;

  --bg-base: var(--bg-dark);
  --bg-surface: #10141d;
  --bg-overlay: #151b26;
  --bg-mantle: #080a0f;
  --bg-crust: #05070a;
  --bg-hover: rgba(0, 163, 255, 0.06);
  --bg-active: rgba(0, 163, 255, 0.12);

  --border: rgba(255, 255, 255, 0.08);
  --border-active: var(--lumina-blue);

  --text: #e0e6f0;
  --text-secondary: #a0acba;
  --text-muted: #5b657a;
  --text-accent: var(--lumina-blue);

  --accent: var(--lumina-blue);
  --accent-secondary: #70c4ff;
  --accent-green: #33ffaa;
  --accent-red: #ff4d6d;
  --accent-yellow: #ffcc66;
  --accent-peach: #ffb088;
  --accent-mauve: #b088ff;

  --lumen-glow: 0 0 15px rgba(0, 163, 255, 0.4);
  --lumen-bg: rgba(0, 163, 255, 0.05);

  --radius: 8px;
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ═══════════════════════════════════════════════════════════════════
 /* ─── Lumina Edge (v5.5) ─── */
.live-preview-container {
  animation: fadeIn 0.3s ease-out;
}

.pulse-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-green);
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(166, 227, 161, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(166, 227, 161, 0.7);
  }

  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(166, 227, 161, 0);
  }

  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(166, 227, 161, 0);
  }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--bg-overlay);
  border-top: 3px solid var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-frame-wrapper iframe {
  background: #fff;
  cursor: default;
}

═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   Light Theme
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] {
  --bg-base: #eff1f5;
  --bg-surface: #e6e9ef;
  --bg-overlay: #dce0e8;
  --bg-mantle: #ccd0da;
  --bg-crust: #bcc0cc;
  --bg-hover: rgba(0, 0, 0, 0.04);
  --bg-active: rgba(30, 102, 245, 0.08);

  --border: rgba(0, 0, 0, 0.08);
  --border-active: rgba(30, 102, 245, 0.35);

  --text: #4c4f69;
  --text-secondary: #5c5f77;
  --text-muted: #9ca0b0;
  --text-accent: #1e66f5;

  --accent: #1e66f5;
  --accent-secondary: #7287fd;
  --accent-green: #40a02b;
  --accent-red: #d20f39;
  --accent-yellow: #df8e1d;
  --accent-peach: #fe640b;
  --accent-mauve: #8839ef;

  --lumen-glow: 0 0 12px rgba(30, 102, 245, 0.2);
  --lumen-bg: rgba(30, 102, 245, 0.04);
}

/* ═══════════════════════════════════════════════════════════════════
   Lumina Icon (Rounded Logo Cut)
   ═══════════════════════════════════════════════════════════════════ */
.lumina-icon {
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
}

.lumina-icon.sm {
  width: 20px;
  height: 20px;
}

.lumina-icon.md {
  width: 48px;
  height: 48px;
}

.lumina-icon.lg {
  width: 80px;
  height: 80px;
}

.lumina-icon.xl {
  width: 120px;
  height: 120px;
}

[data-theme='light'] .lumina-icon {
  border-color: rgba(30, 102, 245, 0.2);
  box-shadow: 0 0 20px rgba(30, 102, 245, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  background: var(--bg-base);
  color: var(--text);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* ═══════════════════════════════════════════════════════════════════
   IDE Layout Grid
   ═══════════════════════════════════════════════════════════════════ */
.ide-layout {
  display: grid;
  grid-template-columns: 48px auto 1fr;
  grid-template-rows: 36px 1fr 22px;
  grid-template-areas:
    "telemetry telemetry telemetry"
    "activity  side      editor"
    "status    status    status";
  height: 100vh;
  width: 100vw;
}

/* ═══════════════════════════════════════════════════════════════════
   Telemetry Bar (top)
   ═══════════════════════════════════════════════════════════════════ */
.telemetry-bar {
  grid-area: telemetry;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  -webkit-app-region: drag;
  /* For Electron drag */
}

.telemetry-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.telemetry-logo {
  width: 20px;
  height: 20px;
  border-radius: 20%;
  object-fit: cover;
}

.telemetry-brand {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--accent);
}

.telemetry-center {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.telemetry-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

.telemetry-chip .chip-icon {
  font-size: 12px;
}

.telemetry-chip .chip-label {
  font-weight: 500;
}

.telemetry-chip .chip-unit {
  color: var(--text-muted);
  font-size: 10px;
}

.telemetry-chip .chip-model {
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.connected {
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.status-dot.checking {
  background: var(--accent-yellow);
  animation: pulse 1s infinite;
}

.status-dot.disconnected {
  background: var(--accent-red);
}

.telemetry-chip.savings .chip-label {
  color: var(--accent-green);
}

.telemetry-chip.tokens .chip-label {
  color: var(--accent);
}

.telemetry-right {
  color: var(--text-muted);
  font-size: 11px;
}

/* ═══════════════════════════════════════════════════════════════════
   Activity Bar (far left)
   ═══════════════════════════════════════════════════════════════════ */
.activity-bar {
  grid-area: activity;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-overlay);
  border-right: 1px solid var(--border);
  padding: 4px 0;
}

.activity-bar-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.activity-bar-bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 4px;
}

.activity-btn {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  opacity: 0.6;
  transition: all var(--transition);
}

.activity-btn:hover {
  opacity: 1;
  background: var(--bg-hover);
  color: var(--text);
}

.activity-btn.active {
  opacity: 1;
  color: var(--lumina-blue);
  background: var(--bg-active);
}

.activity-icon-svg {
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.activity-btn:active .activity-icon-svg {
  transform: scale(0.9);
}

.activity-btn.active .activity-icon-svg {
  filter: drop-shadow(0 0 5px rgba(0, 163, 255, 0.5));
}

.activity-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--lumina-blue);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 8px rgba(0, 163, 255, 0.6);
}

/* ═══════════════════════════════════════════════════════════════════
   Side Panel
   ═══════════════════════════════════════════════════════════════════ */
.side-panel {
  grid-area: side;
  width: 260px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Side-panel content containers (Agent, Telemetry, etc.) */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  user-select: none;
  flex-shrink: 0;
}

.panel-hint {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.5;
  margin: 0;
}

/* ═══════════════════════════════════════════════════════════════════
   File Explorer
   ═══════════════════════════════════════════════════════════════════ */
.file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  user-select: none;
}

.explorer-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.explorer-actions {
  display: flex;
  gap: 2px;
}

.explorer-action {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0.5;
  transition: all var(--transition);
}

.explorer-action:hover {
  opacity: 1;
  background: var(--bg-hover);
}

.explorer-input-row {
  display: flex;
  gap: 4px;
  padding: 4px 8px 8px;
}

.explorer-input-row input {
  flex: 1;
  background: var(--bg-overlay);
  border: 1px solid var(--border-active);
  border-radius: var(--radius);
  padding: 4px 8px;
  color: var(--text);
  font-size: 11px;
  outline: none;
}

.explorer-input-row button {
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.explorer-workspace {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  background: var(--bg-hover);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.explorer-tree {
  flex: 1;
  overflow-y: auto;
  padding: 2px 0;
}

.explorer-loading,
.explorer-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.explorer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
}

.empty-icon {
  font-size: 28px;
  opacity: 0.3;
}

.btn-primary {
  padding: 6px 16px;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  filter: brightness(1.1);
}

.btn-ghost {
  padding: 5px 14px;
  background: none;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 11px;
  cursor: pointer;
}

.btn-ghost:hover {
  background: var(--bg-hover);
}

/* Tree */
.tree-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  transition: background var(--transition);
}

.tree-label:hover {
  background: var(--bg-hover);
}

.tree-label.active {
  background: var(--bg-active);
  color: var(--text-accent);
}

.tree-arrow {
  font-size: 9px;
  width: 12px;
  text-align: center;
  color: var(--text-muted);
}

.tree-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tree-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══════════════════════════════════════════════════════════════════
   Editor Area
   ═══════════════════════════════════════════════════════════════════ */
.editor-area {
  grid-area: editor;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-base);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  min-height: 35px;
}

.tab-list {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-list::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 35px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-muted);
  white-space: nowrap;
  transition: all var(--transition);
  position: relative;
}

.tab:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.tab.active {
  background: var(--bg-base);
  color: var(--text);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
}

.tab-icon {
  font-size: 13px;
}

.tab-label {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-dot {
  color: var(--accent-yellow);
  font-size: 9px;
}

.tab-close-btn {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  opacity: 0;
  transition: all var(--transition);
}

.tab:hover .tab-close-btn {
  opacity: 1;
}

.tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
}

/* Editor content */
.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ═══════════════════════════════════════════════════════════════════
   File Editor
   ═══════════════════════════════════════════════════════════════════ */
.file-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-base);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  min-height: 30px;
}

.editor-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-filename {
  font-weight: 500;
  color: var(--text);
}

.editor-modified-dot {
  color: var(--accent-yellow);
  font-size: 10px;
}

.editor-lang {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.editor-info {
  font-size: 11px;
  color: var(--text-muted);
}

.editor-save-btn {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.5;
  padding: 2px;
}

.editor-save-btn:hover:not(:disabled) {
  opacity: 1;
}

.editor-save-btn:disabled {
  opacity: 0.2;
  cursor: default;
}

/* Autocomplete Toggle */
.autocomplete-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-muted);
  transition: all var(--transition);
}

.autocomplete-toggle.on {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.autocomplete-toggle .toggle-icon {
  font-size: 12px;
}

.autocomplete-toggle .toggle-label {
  font-weight: 500;
}

.toggle-switch {
  width: 20px;
  height: 10px;
  border-radius: 5px;
  background: var(--text-muted);
  position: relative;
  transition: background var(--transition);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  transition: transform var(--transition);
}

.toggle-switch.on {
  background: var(--accent-green);
}

.toggle-switch.on::after {
  transform: translateX(10px);
}

.save-indicator {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
}

.save-indicator.saved {
  color: var(--accent-green);
}

.save-indicator.saving {
  color: var(--accent-yellow);
}

.save-indicator.error {
  color: var(--accent-red);
}

/* Code Area */
.code-area {
  flex: 1;
  display: flex;
  overflow: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 20px;
}

.line-numbers {
  padding: 8px 12px 8px 16px;
  text-align: right;
  color: var(--text-muted);
  user-select: none;
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  min-width: 48px;
}

.line-num {
  height: 20px;
  line-height: 20px;
  transition: all var(--transition);
}

/* Lúmen Glow — AI-generated lines */
.line-num.lumen-glow {
  color: var(--accent);
  text-shadow: var(--lumen-glow);
  background: var(--lumen-bg);
}

.code-textarea {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
  tab-size: 4;
  white-space: pre;
  overflow-wrap: normal;
  overflow-x: auto;
}

/* Code Editor Wrapper (for ghost text positioning) */
.code-editor-wrapper {
  flex: 1;
  position: relative;
  overflow: auto;
}

.code-editor-wrapper .code-textarea {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* ═══════════════════════════════════════════════════════════════════
   Find-in-File Bar
   ═══════════════════════════════════════════════════════════════════ */
.find-bar {
  padding: 6px 12px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
}

.find-bar-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-active);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 100%;
}

.find-icon {
  font-size: 13px;
  opacity: 0.6;
}

.find-input {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  outline: none;
  min-width: 120px;
}

.find-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.find-count {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  min-width: 60px;
  text-align: center;
}

.find-nav-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 3px;
  font-size: 10px;
  transition: all var(--transition);
}

.find-nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.find-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.find-close-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
  font-size: 12px;
  transition: all var(--transition);
}

.find-close-btn:hover {
  background: rgba(243, 139, 168, 0.15);
  color: var(--accent-red);
}

/* Find match highlight on line numbers */
.line-num.find-highlight-line {
  background: rgba(249, 226, 175, 0.08);
  color: var(--accent-yellow);
}

/* ═══════════════════════════════════════════════════════════════════
   Ghost Text (Autocomplete)
   ═══════════════════════════════════════════════════════════════════ */
.ghost-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-text {
  color: rgba(0, 163, 255, 0.3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 20px;
  white-space: pre;
}

.ghost-hint {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 163, 255, 0.1);
  color: rgba(0, 163, 255, 0.7);
  font-family: 'Inter', sans-serif;
  border: 1px solid rgba(0, 163, 255, 0.2);
}

.ghost-loading {
  font-size: 11px;
  animation: pulse 1s infinite;
}

/* ═══════════════════════════════════════════════════════════════════
   Welcome Screen
   ═══════════════════════════════════════════════════════════════════ */
.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, rgba(0, 163, 255, 0.03) 0%, transparent 70%);
}

.welcome-aura {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 163, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  animation: aura-pulse 8s ease-in-out infinite;
}

@keyframes aura-pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.neon-blue {
  color: var(--lumina-blue);
  text-shadow: 0 0 10px rgba(0, 163, 255, 0.5), 0 0 20px rgba(0, 163, 255, 0.3);
  font-weight: 700;
  letter-spacing: 2px;
  z-index: 1;
}

.welcome-title {
  font-size: 48px;
  margin: 0;
  text-transform: uppercase;
}

.welcome-sub {
  font-size: 14px;
  color: var(--text-secondary);
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-top: -10px;
  z-index: 1;
  opacity: 0.6;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1;
  margin-top: 40px;
}

.welcome-shortcut {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.welcome-shortcut kbd {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  min-width: 100px;
  text-align: center;
}

/* Terminal Tabs */
.tab-close-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0.5;
  transition: all var(--transition);
}

.tab-close-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.tab-add-btn {
  font-size: 16px;
  padding: 0 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
}

.tab-add-btn:hover {
  color: var(--text);
  background: var(--bg-hover);
}

/* ═══════════════════════════════════════════════════════════════════
   Bottom Panel (Agent + Terminal + Output)
   ═══════════════════════════════════════════════════════════════════ */
.bottom-panel {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
  min-height: 180px;
  max-height: 50vh;
  height: 260px;
}

.bottom-tabs {
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--border);
  min-height: 35px;
  overflow-x: auto;
  scrollbar-width: none;
}

.bottom-tabs::-webkit-scrollbar {
  display: none;
}

.bottom-tab {
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: background var(--transition), color var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.bottom-tab:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.bottom-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent);
  background: var(--bg-active);
}

.streaming-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-green);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Sentinel Active Defense (v2.1)
   ═══════════════════════════════════════════════════════════════════ */
.security-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: rgba(15, 5, 5, 0.9);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
}

.security-alert-overlay.visible {
  opacity: 1;
  pointer-events: all;
}

.security-alert-modal {
  width: 500px;
  background: #0f0505;
  border: 1px solid #ff3e3e;
  border-radius: var(--radius);
  padding: 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(255, 62, 62, 0.3);
  perspective: 1000px;
}

.alert-header {
  text-align: center;
  margin-bottom: 30px;
}

.alert-header h2 {
  color: #ff3e3e;
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  letter-spacing: 4px;
  margin: 10px 0;
  text-shadow: 0 0 10px rgba(255, 62, 62, 0.5);
}

.alert-badge {
  display: inline-block;
  background: #ff3e3e;
  color: #000;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 10px;
  border-radius: 2px;
  letter-spacing: 1px;
}

.alert-terminal {
  background: #000;
  border: 1px solid #331111;
  border-radius: 4px;
  margin-bottom: 20px;
}

.terminal-header {
  background: #1a0a0a;
  padding: 6px 12px;
  font-size: 10px;
  color: #884444;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #331111;
}

.terminal-body {
  padding: 15px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: #ff3e3e;
  line-height: 1.6;
}

.reason-text {
  color: #fff;
  background: rgba(255, 62, 62, 0.2);
  padding: 2px 4px;
}

.alert-notice {
  text-align: center;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
  margin-bottom: 30px;
}

.alert-footer {
  display: flex;
  gap: 15px;
}

.panic-btn {
  flex: 1;
  background: #ff3e3e;
  color: #fff;
  border: none;
  padding: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.dismiss-btn {
  flex: 1;
  background: transparent;
  border: 1px solid #331111;
  color: #555;
  padding: 12px;
  font-family: inherit;
  cursor: pointer;
}

.glitch-line {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(255, 62, 62, 0.5);
  animation: glitch-scan 4s infinite;
}

@keyframes glitch-scan {
  0% {
    transform: translateY(-200px);
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    transform: translateY(200px);
    opacity: 0;
  }
}

.pulse-alert {
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {

  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 5px #ff3e3e);
  }

  50% {
    transform: scale(1.1);
    filter: drop-shadow(0 0 20px #ff3e3e);
  }
}

.shield-indicator {
  transition: color 0.3s, filter 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shield-active {
  color: var(--lumina-blue) !important;
  filter: drop-shadow(0 0 5px rgba(0, 163, 255, 0.5));
}

.shield-panic {
  color: #ff3e3e !important;
  filter: drop-shadow(0 0 8px #ff3e3e);
  animation: blink-red 0.5s infinite;
}

@keyframes blink-red {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.bottom-tabs-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.bottom-action {
  padding: 2px 8px;
  font-size: 11px;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 3px;
}

.bottom-action:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.bottom-action.stop {
  color: var(--accent-red);
}

.bottom-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--text);
  background: var(--bg-overlay);
}

.bottom-output.terminal {
  background: #0d0d15;
  color: #a6e3a1;
  font-family: 'JetBrains Mono', monospace;
}

.bottom-output.terminal pre {
  margin: 0;
  font-family: inherit;
  font-size: inherit;
}

.bottom-output.streaming {
  border-left: 2px solid var(--accent);
}

.bottom-welcome {
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
}

.cursor-blink {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--accent);
  margin-left: 1px;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* File ops */
.file-ops-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 5px 10px;
  border-top: 1px solid var(--border);
}

.file-op-chip {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
}

.file-op-chip.created {
  background: rgba(166, 227, 161, 0.08);
  color: var(--accent-green);
}

.file-op-chip.modified {
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
}

.file-op-chip.error {
  background: rgba(243, 139, 168, 0.08);
  color: var(--accent-red);
}

.bottom-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--accent-red);
  border-top: 1px solid rgba(243, 139, 168, 0.15);
  background: rgba(243, 139, 168, 0.03);
}

.bottom-error button {
  background: none;
  border: none;
  color: var(--accent-red);
  cursor: pointer;
  font-size: 14px;
}

/* Prompt */
.bottom-prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-overlay) 0%, rgba(17, 17, 27, 0.95) 100%);
}

.bottom-prompt-input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
}

.prompt-mode {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  padding-bottom: 4px;
  white-space: nowrap;
}

.prompt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
}

.prompt-textarea {
  flex: 1;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 7px 12px;
  color: var(--text);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  resize: none;
  outline: none;
  max-height: 100px;
  transition: border-color var(--transition);
}

.prompt-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgba(137, 180, 250, 0.15);
}

.prompt-textarea::placeholder {
  color: var(--text-muted);
}

.prompt-send {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: var(--bg-overlay);
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
}

.prompt-send:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.3);
}

.prompt-send:disabled {
  opacity: 0.25;
  cursor: default;
}

.prompt-send.stop {
  background: var(--accent-red);
}

/* ═══════════════════════════════════════════════════════════════════
   Status Bar
   ═══════════════════════════════════════════════════════════════════ */
.status-bar {
  grid-area: status;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: linear-gradient(90deg, #1a1a2e 0%, #313244 50%, #1a1a2e 100%);
  color: var(--text-secondary);
  font-size: 11px;
  border-top: 1px solid rgba(137, 180, 250, 0.08);
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item.brand {
  opacity: 0.5;
}

/* ═══════════════════════════════════════════════════════════════════
   Settings Panel
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   Settings Panel (Lumina UX)
   ═══════════════════════════════════════════════════════════════════ */
.settings-view {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.settings-logo {
  width: 64px;
  height: 64px;
  border-radius: 20%;
  overflow: hidden;
  object-fit: cover;
  border: 1px solid rgba(137, 180, 250, 0.2);
  box-shadow: 0 0 20px rgba(137, 180, 250, 0.15);
  filter: drop-shadow(0 0 16px rgba(137, 180, 250, 0.4));
}

.settings-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px 0;
  letter-spacing: 0.5px;
}

.settings-header p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.settings-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(137, 180, 250, 0.03);
  flex-shrink: 0;
  transition: box-shadow var(--transition), border-color var(--transition);
}

.settings-card:hover {
  border-color: rgba(137, 180, 250, 0.12);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(137, 180, 250, 0.06);
}

.settings-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border);
}

.settings-card-header h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-card-body {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-row-flex {
  display: flex;
  gap: 24px;
}

.setting-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-field label {
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-input {
  width: 100%;
  padding: 14px 18px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 16px;
  outline: none;
  font-family: 'JetBrains Mono', monospace;
  transition: all var(--transition);
}

.settings-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.15);
  background: var(--bg-hover);
}

.settings-refresh-btn {
  background: var(--bg-base);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 14px;
  border-radius: var(--radius);
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-refresh-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text);
}

.settings-refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.settings-alert {
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  margin-bottom: 8px;
}

.settings-alert.error {
  background: rgba(243, 139, 168, 0.1);
  color: var(--accent-red);
  border: 1px solid rgba(243, 139, 168, 0.2);
}

.settings-alert.info {
  background: rgba(137, 180, 250, 0.1);
  color: var(--accent);
  border: 1px solid rgba(137, 180, 250, 0.2);
}

.settings-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-badge.success {
  background: rgba(166, 227, 161, 0.15);
  color: var(--accent-green);
}

.settings-badge.neon {
  background: rgba(137, 180, 250, 0.15);
  color: var(--accent);
  box-shadow: 0 0 8px rgba(137, 180, 250, 0.2);
}

.provider-detected {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.settings-save-btn {
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.settings-save-btn:hover {
  filter: brightness(1.15);
  box-shadow: 0 0 16px rgba(137, 180, 250, 0.3);
}

.settings-save-btn.saved {
  background: var(--accent-green);
  box-shadow: 0 0 16px rgba(166, 227, 161, 0.3);
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.model-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--transition);
}

.model-card:hover {
  border-color: var(--border-active);
  background: var(--bg-hover);
}

.model-card.selected {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.05);
  box-shadow: 0 0 0 1px var(--accent);
}

.model-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.model-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.model-active-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--bg-base);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.model-card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-tag {
  font-size: 11px;
  padding: 3px 8px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
}

.model-tag.size {
  margin-left: auto;
  color: var(--accent-yellow);
  border-color: rgba(249, 226, 175, 0.2);
}

/* Panel placeholder */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 12px;
  gap: 8px;
  padding: 16px;
}

.panel-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 11px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  background: var(--bg-overlay);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  font-size: 12px;
  outline: none;
  margin: 0 12px;
  width: calc(100% - 24px);
}

.search-input:focus {
  border-color: var(--accent);
}

/* Dashboard — hidden (telemetry bar replaces it) */
.dashboard-bar {
  display: none;
}

/* ═══════════════════════════════════════════════════════════════════
   Theme Toggle Buttons
   ═══════════════════════════════════════════════════════════════════ */
.settings-theme-btn {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.settings-theme-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-active);
}

.settings-theme-btn.active {
  border-color: var(--accent);
  background: rgba(137, 180, 250, 0.08);
  color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(137, 180, 250, 0.1);
}

/* ═══════════════════════════════════════════════════════════════════
   Predictive Cache Ghost Blocks (Module C)
   ═══════════════════════════════════════════════════════════════════ */
.ghost-block-overlay {
  position: absolute;
  top: 8px;
  left: 60px;
  right: 20px;
  opacity: 0.25;
  pointer-events: none;
  z-index: 5;
  transition: opacity 0.3s ease;
}

.ghost-block-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 20px;
  color: var(--text-secondary);
  background: transparent;
  margin: 0;
  padding: 0;
  white-space: pre;
}

.ghost-block-hint {
  margin-top: 12px;
  padding: 6px 12px;
  background: var(--bg-hover);
  border: 1px dashed var(--accent);
  color: var(--accent);
  font-size: 11px;
  border-radius: 4px;
  display: inline-block;
  backdrop-filter: blur(10px);
}

/* ═══════════════════════════════════════════════════════════════════
   Light Theme — Component Overrides
   ═══════════════════════════════════════════════════════════════════ */
[data-theme='light'] .status-bar {
  background: linear-gradient(90deg, #ccd0da 0%, #bcc0cc 50%, #ccd0da 100%);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-output.terminal {
  background: #e6e9ef;
  color: #40a02b;
}

[data-theme='light'] .telemetry-bar {
  background: linear-gradient(135deg, #dce0e8 0%, #ccd0da 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .activity-bar {
  background: #dce0e8;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme='light'] .bottom-prompt {
  background: linear-gradient(180deg, #e6e9ef 0%, #dce0e8 100%);
}

[data-theme='light'] .settings-theme-btn.active {
  background: rgba(30, 102, 245, 0.08);
  color: var(--accent);
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 0 12px rgba(30, 102, 245, 0.1);
}

[data-theme='light'] .ghost-text {
  color: rgba(30, 102, 245, 0.3);
}

[data-theme='light'] .ghost-hint {
  background: rgba(30, 102, 245, 0.08);
  color: rgba(30, 102, 245, 0.5);
  border-color: rgba(30, 102, 245, 0.12);
}

/* ─── Lumina Library (v6.5) ───────────────────────────────────────── */
.library-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background: var(--bg-primary);
  color: var(--text);
}

.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-zone.active {
  border-color: var(--accent);
  background: var(--bg-overlay);
}

.upload-zone.uploading {
  opacity: 0.7;
  pointer-events: none;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.upload-btn {
  background: var(--accent);
  color: white;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.library-list h3 {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: var(--bg-overlay);
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition: border 0.2s;
}

.doc-item:hover {
  border-color: var(--border);
}

.doc-icon {
  font-size: 18px;
}

.doc-info {
  flex: 1;
  overflow: hidden;
}

.doc-name {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  font-size: 10px;
  color: var(--text-muted);
}

/* ═══════════════════════════════════════════════════════════════════
   Identity & Security (v1.16)
   ═══════════════════════════════════════════════════════════════════ */
.identity-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(8, 10, 15, 0.95);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-modal {
  width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--lumina-blue);
  border-radius: var(--radius);
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: modal-slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.identity-header {
  text-align: center;
  margin-bottom: 30px;
}

.shield-icon {
  font-size: 48px;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(0, 163, 255, 0.4));
}

.identity-header h2 {
  color: var(--lumina-blue);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

.identity-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 5px;
}

.identity-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.identity-body p {
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.identity-input {
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
  text-align: center;
}

.identity-input:focus {
  border-color: var(--lumina-blue);
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.1);
}

.identity-btn {
  background: var(--lumina-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.identity-btn:hover:not(:disabled) {
  background: #008fdf;
  transform: translateY(-2px);
}

.identity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.identity-notice {
  font-size: 10px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.4;
  opacity: 0.6;
}

/* Scanning Animation */
.identity-body.scan {
  height: 150px;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--lumina-blue);
  box-shadow: 0 0 15px var(--lumina-blue);
  animation: scanner-move 2s linear infinite;
  z-index: 2;
}

@keyframes scanner-move {
  0% {
    top: 0;
  }

  100% {
    top: 100%;
  }
}

.scan-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 2;
  z-index: 1;
}

.glow-text {
  color: var(--lumina-blue);
  animation: text-pulse 1.5s infinite;
}

@keyframes text-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
```

### `frontend/src/components/ActivityBar.jsx`

```jsx
import React from 'react';
import {
    Files,
    Bot,
    BarChart2,
    Share2,
    Zap,
    Library,
    Puzzle,
    Settings
} from 'lucide-react';

const ITEMS = [
    { id: 'explorer', icon: Files, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'ai', icon: Bot, label: 'Agent', shortcut: 'Ctrl+Shift+A' },
    { id: 'telemetry', icon: BarChart2, label: 'Telemetria', shortcut: '' },
    { id: 'swarm', icon: Share2, label: 'Lumina Mesh', shortcut: '' },
    { id: 'edge', icon: Zap, label: 'Edge Preview', shortcut: 'Ctrl+Shift+L' },
    { id: 'library', icon: Library, label: 'Library', shortcut: 'Ctrl+Shift+B' },
    { id: 'extensions', icon: Puzzle, label: 'Extensões', shortcut: 'Ctrl+Shift+X' },
];

const BOTTOM_ITEMS = [
    { id: 'settings', icon: Settings, label: 'Configurações' },
];

export default function ActivityBar({ activePanel, onPanelChange }) {
    return (
        <div className="activity-bar">
            <div className="activity-bar-top">
                {ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                            onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                            title={`${item.label} (${item.shortcut})`}
                        >
                            <Icon size={20} className="activity-icon-svg" />
                            {activePanel === item.id && <span className="activity-indicator" />}
                        </button>
                    );
                })}
            </div>
            <div className="activity-bar-bottom">
                {BOTTOM_ITEMS.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                            onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                            title={item.label}
                        >
                            <Icon size={20} className="activity-icon-svg" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
```

### `frontend/src/components/BottomPanel.jsx`

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { streamGenerate, getFileTree, readFile } from '../services/api';
import PlanStepper from './PlanStepper';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


// Simple UUID generator for Terminal instances
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function BottomPanel({ mode, onFilesCreated, promptFiles = [] }) {
    // ─── AI State ───────────────────────────────────────────
    const [prompt, setPrompt] = useState('');
    const [output, setOutput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [fileOps, setFileOps] = useState([]);
    const [pendingConfirmation, setPendingConfirmation] = useState(null);
    const [viewingDiff, setViewingDiff] = useState(false);
    const [lastProcessedError, setLastProcessedError] = useState('');
    const [activeModelData, setActiveModelData] = useState(null);

    // AI Refs
    const outputRef = useRef(null);
    const cancelRef = useRef(null);
    const promptRef = useRef(null);
    const isUserScrolledUp = useRef(false);

    useEffect(() => {
        if (outputRef.current && !isUserScrolledUp.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const handleOutputScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 10;
    };

    // ─── Terminal State ─────────────────────────────────────
    // Support multiple terminals
    const [terminals, setTerminals] = useState([{ id: 'term-1', name: 'Terminal 1', port: '' }]);
    // Use active tab for routing: 'ai', 'output', or 'term-<id>'
    const [activeTab, setActiveTab] = useState('term-1');

    // ─── System Logs SSE ────────────────────────────────────
    const [systemLogs, setSystemLogs] = useState([]);
    const logsEndRef = useRef(null);

    useEffect(() => {
        const url = 'http://127.0.0.1:8000/api/system/logs';
        const sse = new EventSource(url);
        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setSystemLogs(prev => [...prev.slice(-300), data]);
                // Very simple auto-scroll mechanism
                setTimeout(() => {
                    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 100);
            } catch (e) { }
        };
        return () => {
            sse.close();
        };
    }, []);

    // Rename/Config Modal State
    const [renamingTerm, setRenamingTerm] = useState(null); // id of terminal being renamed
    const [renameInput, setRenameInput] = useState('');
    const [configuringPort, setConfiguringPort] = useState(false); // boolean indicating we show port config

    // Ref to hold WebSocket instances persistently without causing re-renders
    const wsInstances = useRef({});
    const terminalContainerRefs = useRef({});
    const xtermInstances = useRef({});
    const fitAddons = useRef({});

    // Fit xterm when resizing tab or window
    useEffect(() => {
        const fit = () => {
            if (activeTab.startsWith('term-') && fitAddons.current[activeTab]) {
                fitAddons.current[activeTab].fit();
            }
        };
        fit();
        window.addEventListener('resize', fit);
        return () => window.removeEventListener('resize', fit);
    }, [activeTab, terminals]);


    // ─── AI Effects ─────────────────────────────────────────
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    useEffect(() => {
        if (!process.env.TEST_MODE) {
            import('../services/api').then(api => {
                api.fetchModels?.().then(data => {
                    const m = data?.models?.find(x => x.name === window.localStorage.getItem('lumina_model') || x.name.includes('llama3') || x.name === 'mistral');
                    if (m) setActiveModelData(m);
                }).catch(() => { });
            });
        }
    }, []);

    // ─── Terminal Logic ─────────────────────────────────────
    const initWebSocket = (termId) => {
        if (wsInstances.current[termId]) return;

        const tObj = terminals.find(t => t.id === termId);
        const portParam = tObj && tObj.port ? tObj.port.trim() : termId;
        const wsUrl = `ws://127.0.0.1:8000/api/ws/${portParam}`;
        const ws = new WebSocket(wsUrl);
        wsInstances.current[termId] = ws;

        const term = new Terminal({
            theme: { background: 'transparent', foreground: '#d4d4d4', cursor: '#00f2fe' },
            fontFamily: 'Consolas, monospace',
            fontSize: 13,
            cursorBlink: true,
            convertEol: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        xtermInstances.current[termId] = term;
        fitAddons.current[termId] = fitAddon;

        // Find container div for this terminal
        const el = terminalContainerRefs.current[termId];
        if (el && el.childElementCount === 0) {
            term.open(el);
            setTimeout(() => fitAddon.fit(), 50);
        }

        term.onData(data => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        ws.onopen = () => term.writeln('--- Lumina Terminal Connected ---');
        ws.onmessage = (event) => term.write(event.data);
        ws.onclose = () => term.writeln('\x1B[1;3;31m Terminal Disconnected\x1B[0m');
        ws.onerror = () => term.writeln('\x1B[1;3;31m Error connecting to Terminal\x1B[0m');
    };



    // Connect WS when switched
    useEffect(() => {
        if (activeTab.startsWith('term-')) {
            initWebSocket(activeTab);
        }
    }, [activeTab]);

    const handleAddTerminal = () => {
        const id = 'term-' + generateId();
        const num = terminals.length + 1;
        setTerminals(prev => [...prev, { id, name: `Terminal ${num}` }]);
        setActiveTab(id);
    };

    const handleCloseTerminal = (e, id) => {
        e.stopPropagation();
        if (wsInstances.current[id]) {
            wsInstances.current[id].close();
            delete wsInstances.current[id];
        }
        setTerminals(prev => {
            const newTerms = prev.filter(t => t.id !== id);
            if (activeTab === id) {
                // Switch to previous term or fallback
                setActiveTab(newTerms.length > 0 ? newTerms[newTerms.length - 1].id : 'ai');
            }
            return newTerms;
        });
    };

    const handleStartRename = (id, currentName) => {
        setRenamingTerm(id);
        setRenameInput(currentName);
    };

    const handleConfirmRename = () => {
        if (renamingTerm && renameInput.trim()) {
            setTerminals(prev => prev.map(t => t.id === renamingTerm ? { ...t, name: renameInput.trim() } : t));
        }
        setRenamingTerm(null);
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') handleConfirmRename();
        if (e.key === 'Escape') setRenamingTerm(null);
    };



    // ─── Auto-Correction Logic ──────────────────────────────
    // Note: Auto-correction relies on stdout hooks on the backend or xterm capturing logic.
    // Simplifying for xterm pipeline.
    const handleSilentCorrection = (msg) => {
        if (streaming) return;
        setFileOps([]);
        setStreaming(true);
        setActiveTab('ai'); // Focus back to Agent

        const sep = output ? '\n\n' : '';
        // Give a clear UI indication that the agent is self-healing
        const header = `${sep}▶ [Auto-Correction Triggered]\nLumina detected a terminal error and is fixing it...\n\n◀ Lumina:\n`;
        const baseOutput = output + header;
        setOutput(baseOutput);

        let accumulated = '';
        cancelRef.current?.();

        let enrichedPrompt = '';
        if (promptFiles.length > 0) {
            enrichedPrompt += '═══ CUSTOM INSTRUCTIONS ═══\n';
            promptFiles.forEach(pf => { enrichedPrompt += `--- ${pf.name} ---\n${pf.content}\n\n`; });
        }
        enrichedPrompt += msg;

        const cancel = streamGenerate(
            { prompt: enrichedPrompt, mode },
            {
                onToken: (token) => {
                    accumulated += token;
                    setOutput(baseOutput + accumulated);
                },
                onFiles: (files) => {
                    setFileOps(files);
                    onFilesCreated?.(files);
                    const summary = files.map(f => {
                        let icon = f.status === 'created' ? '✅' : f.status === 'deleted' ? '🗑️' : f.status === 'error' ? '❌' : '📝';
                        if (f.path.includes('Template')) icon = '📦';
                        if (f.path.startsWith('>')) icon = '⚙️';
                        return `  ${icon} ${f.path.replace('> ', '')} (${f.status})`;
                    }).join('\n');
                    accumulated += '\n\n───── Auto-Correction Applied ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onPendingConfirmation: (id, blocks) => {
                    setPendingConfirmation({ id, blocks });
                    let summary = blocks.map(b => `  ⏳ ${b.file}`).join('\n');
                    accumulated += '\n\n───── Aguardando Aprovação (Modo Manual) ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onDone: () => setStreaming(false),
                onError: (err) => { setError(err.message); setStreaming(false); },
            }
        );
        cancelRef.current = cancel;
    };

    useEffect(() => {
        if (streaming) return;

        // Monitor only the active terminal for immediate feedback
        const activeTerm = terminals.find(t => t.id === activeTab);
        if (!activeTerm || !activeTerm.output) return;

        // Strip ANSI codes
        const plainText = activeTerm.output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

        // Look at the last 2000 chars to avoid re-triggering on old scrolled errors
        const recentTokens = plainText.slice(-2000);

        // Regex for common build/runtime errors
        const errorMatch = recentTokens.match(/(?:ERR!|Error:|Failed to compile)([\s\S]{10,350})/);

        if (errorMatch) {
            const errorSnippet = errorMatch[0].trim();
            // Ignore if we already processed this exact snippet recently
            if (errorSnippet !== lastProcessedError && errorSnippet.length > 15) {
                setLastProcessedError(errorSnippet);
                const msg = `O seu último comando gerou o seguinte erro no terminal:\n\n\`\`\`\n${errorSnippet}\n\`\`\`\n\nPor favor, analise as mensagens de erro, corrija o código imediatamente usando os blocos 📄 FILE: (ou comandos ⚙️ COMMAND: se precisar) e me diga o que você corrigiu.`;
                handleSilentCorrection(msg);
            }
        }
    }, [terminals, activeTab, streaming, lastProcessedError, promptFiles, mode, output]);

    // ─── AI Logic ───────────────────────────────────────────
    const handleAISubmit = () => {
        if (!prompt.trim() || streaming) return;
        const currentPrompt = prompt;
        setPrompt('');
        setError(null);
        setFileOps([]);
        setStreaming(true);
        setActiveTab('ai');

        const sep = output ? '\n\n' : '';
        const header = `${sep}▶ Você:\n${currentPrompt}\n\n◀ Lumina:\n`;
        const baseOutput = output + header;
        setOutput(baseOutput);

        // ─── Build enriched prompt with context ─────────
        let enrichedPrompt = '';

        // Prepend custom instructional prompts
        if (promptFiles.length > 0) {
            enrichedPrompt += '═══ CUSTOM INSTRUCTIONS ═══\n';
            promptFiles.forEach(pf => {
                enrichedPrompt += `--- ${pf.name} ---\n${pf.content}\n\n`;
            });
        }

        enrichedPrompt += currentPrompt;

        let accumulated = '';
        cancelRef.current?.();

        const cancel = streamGenerate(
            { prompt: enrichedPrompt, mode },
            {
                onToken: (token) => {
                    accumulated += token;
                    setOutput(baseOutput + accumulated);
                },
                onFiles: async (files) => {
                    setFileOps(files);
                    onFilesCreated?.(files);

                    let interceptPrompt = '';

                    for (const f of files) {
                        if (f.path.startsWith('Search: ')) {
                            const query = f.path.replace('Search: ', '').trim();
                            try {
                                const tree = await getFileTree();
                                interceptPrompt += `\n[Search Results for '${query}']: \n` + JSON.stringify(tree, null, 2).slice(0, 1500) + '\n';
                            } catch (e) {
                                interceptPrompt += `\n[Search Error]: ${e.message}\n`;
                            }
                        } else if (f.path.startsWith('Read: ')) {
                            const readPath = f.path.replace('Read: ', '').trim();
                            try {
                                const data = await readFile(readPath);
                                interceptPrompt += `\n[File Content for '${readPath}']: \n${data.content || 'Binary/Empty'}\n`;
                            } catch (e) {
                                interceptPrompt += `\n[Read Error for '${readPath}']: ${e.message}\n`;
                            }
                        }
                    }

                    const summary = files.map(f => {
                        let icon = f.status === 'created' ? '✅' : f.status === 'deleted' ? '🗑️' : f.status === 'error' ? '❌' : '📝';
                        if (f.path.includes('Template')) icon = '📦';
                        if (f.path.startsWith('>')) icon = '⚙️';
                        if (f.path.startsWith('Search: ')) icon = '🔍';
                        if (f.path.startsWith('Read: ')) icon = '📖';
                        return `  ${icon} ${f.path.replace('> ', '').replace('Search: ', '').replace('Read: ', '')} (${f.status})`;
                    }).join('\n');
                    accumulated += '\n\n───── Arquivos & Comandos ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);

                    if (interceptPrompt) {
                        const nextMsg = `Você executou comandos de descoberta de arquivos. Aqui estão os resultados do sistema:\n${interceptPrompt}\nAGORA CONTINUE SUA TAREFA BASEADO NESTES DADOS:`;
                        setTimeout(() => handleSilentCorrection(nextMsg), 500);
                    }
                },
                onPendingConfirmation: (id, blocks) => {
                    setPendingConfirmation({ id, blocks });
                    let summary = blocks.map(b => `  ⏳ ${b.file}`).join('\n');
                    accumulated += '\n\n───── Aguardando Aprovação (Modo Manual) ─────\n' + summary + '\n';
                    setOutput(baseOutput + accumulated);
                },
                onDone: () => setStreaming(false),
                onError: (err) => { setError(err.message); setStreaming(false); },
            }
        );
        cancelRef.current = cancel;
    };

    const handleAIKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISubmit(); }
    };

    const activeTermObj = terminals.find(t => t.id === activeTab);

    // Toggle Port configuration UI
    const togglePortConfig = () => {
        setConfiguringPort(!configuringPort);
    };

    return (
        <div className="bottom-panel">
            {/* Panel tabs */}
            <div className="bottom-tabs">
                <button
                    className={`bottom-tab ${activeTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ai')}
                >
                    🤖 Agent
                    {streaming && <span className="streaming-dot" />}
                </button>
                <button
                    className={`bottom-tab ${activeTab === 'output' ? 'active' : ''}`}
                    onClick={() => setActiveTab('output')}
                >
                    📋 Output
                </button>

                {/* Dynamically render terminal tabs */}
                <div style={{ display: 'flex', borderLeft: '1px solid var(--border)', marginLeft: '4px', paddingLeft: '4px' }}>
                    {terminals.map(term => (
                        <div
                            key={term.id}
                            className={`bottom-tab ${activeTab === term.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(term.id)}
                            onDoubleClick={() => handleStartRename(term.id, term.name)}
                            title="Dê dois cliques para renomear"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            {renamingTerm === term.id ? (
                                <input
                                    autoFocus
                                    value={renameInput}
                                    onChange={(e) => setRenameInput(e.target.value)}
                                    onBlur={handleConfirmRename}
                                    onKeyDown={handleRenameKeyDown}
                                    style={{
                                        background: 'transparent', border: '1px solid var(--accent)',
                                        color: 'var(--text)', outline: 'none', width: '80px',
                                        fontSize: '11px', padding: '2px 4px'
                                    }}
                                />
                            ) : (
                                <>$_ {term.name}</>
                            )}
                            <span
                                className="tab-close-icon"
                                onClick={(e) => handleCloseTerminal(e, term.id)}
                            >
                                x
                            </span>
                        </div>
                    ))}
                    <button className="bottom-action tab-add-btn" onClick={handleAddTerminal} title="Novo Terminal">
                        +
                    </button>
                </div>

                <div className="bottom-tabs-actions">
                    {activeTab === 'ai' && output && (
                        <button className="bottom-action" onClick={() => { setOutput(''); setFileOps([]); }} title="Limpar">
                            🗑️
                        </button>
                    )}
                    {activeTab === 'ai' && streaming && (
                        <button className="bottom-action stop" onClick={() => { cancelRef.current?.(); setStreaming(false); }}>
                            ■ Parar
                        </button>
                    )}
                    {activeTab.startsWith('term-') && (
                        <>
                            <button className="bottom-action" onClick={togglePortConfig} title="Configurar Porta">
                                🔌 {activeTermObj?.port ? `Porta: ${activeTermObj.port}` : 'Porta'}
                            </button>
                            <button className="bottom-action" onClick={() => xtermInstances.current[activeTab]?.clear()} title="Limpar Terminal">
                                🗑️
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* AI Port Config Toolbar for Active Terminal */}
            {configuringPort && activeTab.startsWith('term-') && activeTermObj && (
                <div style={{ padding: '8px 14px', background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Configuração de Porta para {activeTermObj.name}:</span>
                    <input
                        className="settings-input"
                        style={{ width: '120px', padding: '4px 8px', fontSize: '11px', height: '24px' }}
                        placeholder="Ex: 8080"
                        value={activeTermObj.port}
                        onChange={(e) => setTerminals(prev => prev.map(t => t.id === activeTermObj.id ? { ...t, port: e.target.value } : t))}
                    />
                    <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={togglePortConfig}>Salvar</button>
                </div>
            )}

            {/* Output area for AI */}
            {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                        <PlanStepper />
                    </div>
                    <div ref={outputRef} onScroll={handleOutputScroll} className={`bottom-output ${streaming ? 'streaming' : ''}`} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {output ? (
                            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '1.6' }}>
                                {output.split('\n').map((line, i) => {
                                    if (line.includes('Fonte: ')) {
                                        const [text, source] = line.split('Fonte: ');
                                        return (
                                            <div key={i}>
                                                {text}
                                                <span
                                                    style={{
                                                        background: 'rgba(0, 163, 255, 0.1)',
                                                        color: 'var(--lumina-blue)',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        border: '1px solid rgba(0, 163, 255, 0.2)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        marginTop: '8px'
                                                    }}
                                                >
                                                    <Library size={10} /> Fonte: {source}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return <div key={i}>{line}</div>;
                                })}
                                {streaming && <span className="cursor-blink" />}
                            </div>
                        ) : (
                            <div className="bottom-welcome">
                                <span>🛰️ Lumina Agent — Digite um prompt abaixo. Abra uma pasta no Explorer para criar arquivos.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Output areas for Terminals (xterm) */}
            {terminals.map(term => (
                <div
                    key={term.id}
                    className="bottom-output terminal"
                    style={{ display: activeTab === term.id ? 'block' : 'none', padding: '10px', height: '100%', boxSizing: 'border-box' }}
                    ref={(el) => {
                        terminalContainerRefs.current[term.id] = el;
                        // Mount immediately if we render it the first time and term exists
                        if (el && el.childElementCount === 0 && xtermInstances.current[term.id]) {
                            xtermInstances.current[term.id].open(el);
                            setTimeout(() => fitAddons.current[term.id]?.fit(), 50);
                        }
                    }}
                />
            ))}

            {activeTab === 'output' && (
                <div className="bottom-output" style={{ color: 'var(--text-muted)', padding: '16px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>📡 Hub de Logs e Output do Sistema</div>
                    {systemLogs.length === 0 && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>Aguardando logs... (Nenhuma atividade recente)</div>}
                    {systemLogs.map((log, i) => {
                        let color = 'var(--text-muted)';
                        if (log.level === 'ERROR') color = '#ff003c';
                        else if (log.level === 'WARNING') color = '#fbbf24';
                        else if (log.level === 'INFO') color = '#00f2fe';
                        return (
                            <div key={i} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                                <span style={{ opacity: 0.5 }}>[{new Date().toLocaleTimeString()}]</span>
                                <span style={{ color, minWidth: '50px' }}>{log.level}</span>
                                <span style={{ opacity: 0.7 }}>[{log.source}]</span>
                                <span style={{ color: 'var(--text)' }}>{log.message}</span>
                            </div>
                        );
                    })}
                    <div ref={logsEndRef} />
                </div>
            )}

            {/* AI File ops */}
            {activeTab === 'ai' && fileOps.length > 0 && (
                <div className="file-ops-inline">
                    {fileOps.map((f, i) => (
                        <span key={i} className={`file-op-chip ${f.status}`}>
                            {f.status === 'created' ? '✅' : '📝'} {f.path}
                        </span>
                    ))}
                </div>
            )}

            {/* AI Error */}
            {activeTab === 'ai' && error && (
                <div className="bottom-error">
                    ⚠️ {error}
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Pending Confirmation UI */}
            {activeTab === 'ai' && pendingConfirmation && (
                <div style={{ padding: '8px 12px', background: 'var(--bg-overlay)', borderTop: '1px solid var(--accent-red)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                            <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>⚠️ Mudanças Pendentes:</span> O Agente quer modificar {pendingConfirmation.blocks.length} arquivo(s).
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-secondary" onClick={() => setViewingDiff(!viewingDiff)}>
                                {viewingDiff ? 'Ocultar Diff' : 'Visualizar Diff'}
                            </button>
                            <button className="btn-secondary" onClick={() => { setPendingConfirmation(null); setViewingDiff(false); }}>Recusar</button>
                            <button className="btn-primary" onClick={async () => {
                                import('../services/api').then(m => {
                                    m.confirmChanges(pendingConfirmation.id).then(res => {
                                        setFileOps(res.files);
                                        onFilesCreated?.(res.files);
                                        setPendingConfirmation(null);
                                        setViewingDiff(false);
                                        setOutput(prev => prev + '\n\n✅ Mudanças Aprovadas e Aplicadas!\n');
                                    }).catch(err => setError(err.message));
                                });
                            }}>Aprovar Mudanças</button>
                        </div>
                    </div>
                    {viewingDiff && (
                        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '80%', maxHeight: '80%', overflowY: 'auto', background: 'var(--bg-editor)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                                    <h3 style={{ margin: 0 }}>Visualizador de Diff (Auditoria)</h3>
                                    <button className="btn-secondary" onClick={() => setViewingDiff(false)}>Fechar (✕)</button>
                                </div>
                                {pendingConfirmation.blocks.map((b, i) => (
                                    <div key={i} style={{ marginBottom: '24px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>📄 {b.file}</div>
                                        <SyntaxHighlighter language={b.file.split('.').pop()} style={vscDarkPlus} customStyle={{ margin: 0, fontSize: '12px', borderRadius: '8px', padding: '16px' }}>
                                            {b.content.slice(0, 1500)}
                                            {b.content.length > 1500 ? '\n... [conteúdo truncado para visualização] ...' : ''}
                                        </SyntaxHighlighter>
                                    </div>
                                ))}
                                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                                    <button className="btn-primary" onClick={async () => {
                                        import('../services/api').then(m => {
                                            m.confirmChanges(pendingConfirmation.id).then(res => {
                                                setFileOps(res.files);
                                                onFilesCreated?.(res.files);
                                                setPendingConfirmation(null);
                                                setViewingDiff(false);
                                                setOutput(prev => prev + '\n\n✅ Mudanças Aprovadas e Aplicadas!\n');
                                            }).catch(err => setError(err.message));
                                        });
                                    }}>Aprovar Mudanças Rapidamente</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Prompt bar / Terminal Input */}
            <div className="bottom-prompt">
                {activeTab === 'ai' ? (
                    <>
                        <div className="bottom-prompt-input-row" style={{ position: 'relative' }}>
                            <div className="prompt-mode" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="prompt-dot" />
                                {mode === 'local' ? 'Ollama' : 'Cloud'}
                                {activeModelData && activeModelData.details && (
                                    <span style={{
                                        fontSize: '9px',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        background: parseFloat(activeModelData.details.parameter_size || 0) >= 30 ? 'linear-gradient(45deg, #cba6f7, #89b4fa)' : parseFloat(activeModelData.details.parameter_size || 0) >= 8 ? 'linear-gradient(45deg, #a6e3a1, #94e2d5)' : 'linear-gradient(45deg, #585b70, #7f849c)',
                                        color: '#11111b',
                                        fontWeight: 'bold',
                                        letterSpacing: '0.8px',
                                        boxShadow: parseFloat(activeModelData.details.parameter_size || 0) >= 30 ? '0 0 8px rgba(203, 166, 247, 0.4)' : parseFloat(activeModelData.details.parameter_size || 0) >= 8 ? '0 0 8px rgba(166, 227, 161, 0.4)' : 'none'
                                    }} title={`Parâmetros: ${activeModelData.details.parameter_size || 'N/A'}`}>
                                        {parseFloat(activeModelData.details.parameter_size || 0) >= 30 ? 'ELITE' : parseFloat(activeModelData.details.parameter_size || 0) >= 8 ? 'PRO' : 'ECO'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                ref={promptRef}
                                className="prompt-textarea"
                                placeholder="Peça ao Lumina IDE... (Enter envia, Shift+Enter nova linha)"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={handleAIKeyDown}
                                rows={1}
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                }}
                            />
                            <button
                                className={`prompt-send ${streaming ? 'stop' : ''}`}
                                onClick={streaming ? () => { cancelRef.current?.(); setStreaming(false); } : handleAISubmit}
                                disabled={!streaming && !prompt.trim()}
                            >
                                {streaming ? '■' : '↑'}
                            </button>
                        </div>
                    </>
                ) : activeTermObj ? (
                    <div style={{ padding: '8px', color: 'var(--text-muted)' }}>O Terminal Interativo está em foco. Digite os comandos diretamente na janela acima.</div>
                ) : (
                    <div style={{ padding: '8px', color: 'var(--text-muted)' }}>Output tab selecionada.</div>
                )}
            </div>
        </div>
    );
}
```

### `frontend/src/components/ExtensionPanel.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { fetchExtensions, fetchExtensionsPath, toggleExtension } from '../services/api';

export default function ExtensionPanel() {
    const [extensions, setExtensions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [extPath, setExtPath] = useState('');

    const loadExtensions = async () => {
        setLoading(true);
        try {
            const [data, pathData] = await Promise.all([
                fetchExtensions(),
                fetchExtensionsPath(),
            ]);
            setExtensions(data.extensions || []);
            setExtPath(pathData.path || '');
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
                            <code style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>{extPath || '...'}</code>
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
```

### `frontend/src/components/FileEditor.jsx`

```jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { writeFile, fetchAutocomplete } from '../services/api';

export default function FileEditor({ file, onClose, onSaved }) {
    const [content, setContent] = useState(file.content);
    const [modified, setModified] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [autocomplete, setAutocomplete] = useState(true);
    const [lumenLines, setLumenLines] = useState(new Set());
    const [ghostText, setGhostText] = useState('');
    const [ghostPos, setGhostPos] = useState({ line: 0, col: 0 });
    const [loadingGhost, setLoadingGhost] = useState(false);
    const [usedBrain, setUsedBrain] = useState(false);

    // Find-in-file state
    const [findOpen, setFindOpen] = useState(false);
    const [findQuery, setFindQuery] = useState('');
    const [matches, setMatches] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);

    const textareaRef = useRef(null);
    const lineNumRef = useRef(null);
    const findInputRef = useRef(null);
    const autocompleteTimer = useRef(null);
    const abortRef = useRef(null);

    // Sync content when file changes
    useEffect(() => {
        setContent(file.content);
        setModified(false);
        setSaveStatus('');
        setLumenLines(new Set());
        setGhostText('');
        setFindOpen(false);
        setFindQuery('');
    }, [file.path]);

    // Sync scroll between line numbers and textarea
    const handleScroll = () => {
        if (lineNumRef.current && textareaRef.current) {
            lineNumRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // ─── Autocomplete Logic ─────────────────────────────────────────
    const requestAutocomplete = useCallback(async () => {
        if (!autocomplete || !textareaRef.current) return;

        const ta = textareaRef.current;
        const cursorPos = ta.selectionStart;
        const lines = content.substring(0, cursorPos).split('\n');
        const cursorLine = lines.length - 1;
        const cursorCol = lines[lines.length - 1].length;

        // Don't autocomplete on empty lines or very short context
        if (cursorCol < 2 && cursorLine < 2) return;

        const fileName = file.path.split(/[\\/]/).pop();

        setLoadingGhost(true);
        try {
            const data = await fetchAutocomplete({
                code: content,
                cursorLine,
                cursorCol,
                filename: fileName,
                mode: 'local',
            });
            const suggestion = data.suggestion;
            if (suggestion && suggestion.trim()) {
                setGhostText(suggestion);
                setGhostPos({ line: cursorLine, col: cursorCol });
                setUsedBrain(!!data.used_brain);
            } else {
                setGhostText('');
                setUsedBrain(false);
            }
        } catch {
            setGhostText('');
        } finally {
            setLoadingGhost(false);
        }
    }, [content, autocomplete, file.path]);

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        if (!modified) setModified(true);
        setGhostText(''); // Clear ghost on any change

        // Debounce autocomplete request
        if (autocompleteTimer.current) clearTimeout(autocompleteTimer.current);
        if (autocomplete) {
            autocompleteTimer.current = setTimeout(() => {
                requestAutocomplete();
            }, 800);
        }
    };

    const acceptGhost = () => {
        if (!ghostText || !textareaRef.current) return false;

        const ta = textareaRef.current;
        const cursorPos = ta.selectionStart;
        const newContent = content.substring(0, cursorPos) + ghostText + content.substring(cursorPos);
        setContent(newContent);
        setModified(true);
        setGhostText('');

        // Move cursor to end of inserted text
        requestAnimationFrame(() => {
            const newPos = cursorPos + ghostText.length;
            ta.selectionStart = ta.selectionEnd = newPos;
        });

        return true;
    };

    const handleSave = useCallback(async () => {
        setSaveStatus('saving');
        try {
            await writeFile(file.path, content);
            setModified(false);
            setSaveStatus('saved');
            onSaved?.();
            setTimeout(() => setSaveStatus(''), 2000);
        } catch {
            setSaveStatus('error');
        }
    }, [content, file.path, onSaved]);

    // ─── Find-in-File Logic ─────────────────────────────────────────
    useEffect(() => {
        if (!findQuery || !findOpen) {
            setMatches([]);
            setCurrentMatch(0);
            return;
        }
        const q = findQuery.toLowerCase();
        const found = [];
        const lines = content.split('\n');
        lines.forEach((line, lineIdx) => {
            let col = 0;
            const lower = line.toLowerCase();
            while (col < lower.length) {
                const idx = lower.indexOf(q, col);
                if (idx === -1) break;
                found.push({ line: lineIdx, col: idx, length: q.length });
                col = idx + 1;
            }
        });
        setMatches(found);
        setCurrentMatch(found.length > 0 ? 0 : -1);
    }, [findQuery, content, findOpen]);

    const goToMatch = useCallback((index) => {
        if (matches.length === 0 || !textareaRef.current) return;
        const m = matches[index];
        if (!m) return;
        const lines = content.split('\n');
        let pos = 0;
        for (let i = 0; i < m.line; i++) pos += lines[i].length + 1;
        pos += m.col;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos + m.length);
        setCurrentMatch(index);
    }, [matches, content]);

    const findNext = useCallback(() => {
        if (matches.length === 0) return;
        const next = (currentMatch + 1) % matches.length;
        goToMatch(next);
    }, [currentMatch, matches, goToMatch]);

    const findPrev = useCallback(() => {
        if (matches.length === 0) return;
        const prev = (currentMatch - 1 + matches.length) % matches.length;
        goToMatch(prev);
    }, [currentMatch, matches, goToMatch]);

    // ─── Keyboard Shortcuts ─────────────────────────────────────────
    const handleKeyDown = (e) => {
        // Ctrl+S save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
            return;
        }
        // Ctrl+F find
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            setFindOpen(true);
            setTimeout(() => findInputRef.current?.focus(), 50);
            return;
        }
        // Escape close find
        if (e.key === 'Escape' && findOpen) {
            setFindOpen(false);
            setFindQuery('');
            textareaRef.current?.focus();
            return;
        }
        // Tab — accept ghost or indent
        if (e.key === 'Tab') {
            if (ghostText) {
                e.preventDefault();
                acceptGhost();
                return;
            }
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newContent = content.substring(0, start) + '    ' + content.substring(end);
            setContent(newContent);
            setModified(true);
            requestAnimationFrame(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 4;
            });
        }
    };

    // Global Ctrl+F handler
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setFindOpen(true);
                setTimeout(() => findInputRef.current?.focus(), 50);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const lines = content.split('\n');
    const lineCount = lines.length;
    const fileName = file.path.split(/[\\/]/).pop();
    const ext = '.' + fileName.split('.').pop();

    const langMap = {
        '.py': 'Python', '.js': 'JavaScript', '.jsx': 'JSX', '.ts': 'TypeScript',
        '.tsx': 'TSX', '.html': 'HTML', '.css': 'CSS', '.json': 'JSON',
        '.md': 'Markdown', '.sql': 'SQL', '.yaml': 'YAML', '.yml': 'YAML',
    };

    return (
        <div className="file-editor">
            <div className="editor-toolbar">
                <div className="editor-toolbar-left">
                    <span className="editor-filename">{fileName}</span>
                    {modified && <span className="editor-modified-dot">●</span>}
                    <span className="editor-lang">{langMap[ext] || ext}</span>
                </div>
                <div className="editor-toolbar-right">
                    {/* Autocomplete toggle */}
                    <button
                        className={`autocomplete-toggle ${autocomplete ? 'on' : 'off'}`}
                        onClick={() => setAutocomplete(!autocomplete)}
                        title={autocomplete ? 'Autocomplete ON' : 'Autocomplete OFF'}
                    >
                        <span className="toggle-icon">🧠</span>
                        <span className="toggle-label">Agent</span>
                        <span className={`toggle-switch ${autocomplete ? 'on' : ''}`} />
                    </button>

                    {/* Ghost loading indicator */}
                    {loadingGhost && <span className="ghost-loading">⏳</span>}

                    {/* Brain Memory Indicator (v6.0) */}
                    {usedBrain && (
                        <span className="brain-memory-indicator" title="Lumina está usando Memória Persistente (Brain v6.0) para esta sugestão">
                            💡
                        </span>
                    )}

                    {saveStatus && (
                        <span className={`save-indicator ${saveStatus}`}>
                            {saveStatus === 'saving' ? '💾 Salvando...' :
                                saveStatus === 'saved' ? '✅ Salvo' :
                                    '❌ Erro'}
                        </span>
                    )}

                    <span className="editor-info">{lineCount} linhas</span>
                    <button className="editor-save-btn" onClick={handleSave} disabled={!modified}>
                        💾
                    </button>
                </div>
            </div>

            {/* ─── Find Bar ──────────────────────────────────────── */}
            {findOpen && (
                <div className="find-bar">
                    <div className="find-bar-inner">
                        <span className="find-icon">🔍</span>
                        <input
                            ref={findInputRef}
                            className="find-input"
                            value={findQuery}
                            onChange={(e) => setFindQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); findPrev(); }
                                else if (e.key === 'Enter') { e.preventDefault(); findNext(); }
                                else if (e.key === 'Escape') { setFindOpen(false); setFindQuery(''); textareaRef.current?.focus(); }
                            }}
                            placeholder="Buscar no arquivo..."
                            autoFocus
                        />
                        <span className="find-count">
                            {matches.length > 0
                                ? `${currentMatch + 1} / ${matches.length}`
                                : findQuery ? 'Sem resultados' : ''}
                        </span>
                        <button className="find-nav-btn" onClick={findPrev} disabled={matches.length === 0} title="Anterior (Shift+Enter)">▲</button>
                        <button className="find-nav-btn" onClick={findNext} disabled={matches.length === 0} title="Próximo (Enter)">▼</button>
                        <button className="find-close-btn" onClick={() => { setFindOpen(false); setFindQuery(''); textareaRef.current?.focus(); }}>✕</button>
                    </div>
                </div>
            )}

            <div className="code-area">
                <div className="line-numbers" ref={lineNumRef}>
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div
                            key={i}
                            className={`line-num ${lumenLines.has(i) ? 'lumen-glow' : ''} ${matches.some(m => m.line === i) ? 'find-highlight-line' : ''}`}
                        >
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="code-editor-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="code-textarea"
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        onScroll={handleScroll}
                        spellCheck={false}
                        wrap="off"
                    />
                    {/* Ghost text overlay */}
                    {ghostText && (
                        <div className="ghost-overlay" style={{
                            top: `${ghostPos.line * 20 + 8}px`,
                            left: `${ghostPos.col * 7.8 + 16}px`,
                        }}>
                            <span className="ghost-text">{ghostText}</span>
                            <span className="ghost-hint">Tab ↹</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### `frontend/src/components/FileExplorer.jsx`

```jsx
import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getWorkspace, openFolder, browseFolder, getFileTree, readFile } from '../services/api';

const FILE_ICONS = {
    '.py': '🐍', '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.yaml': '⚙️', '.yml': '⚙️', '.env': '🔒', '.sql': '🗃️', '.sh': '🖥️',
    '.go': '🔵', '.rs': '🦀', '.java': '☕', '.c': '🔧', '.cpp': '🔧',
};

function TreeItem({ node, depth = 0, onFileClick, onFileHover, activeFile }) {
    const [expanded, setExpanded] = useState(depth < 1);

    if (node.type === 'dir') {
        return (
            <div className="tree-node">
                <div
                    className="tree-label dir"
                    style={{ paddingLeft: depth * 16 + 8 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    <span className="tree-arrow">{expanded ? '▾' : '▸'}</span>
                    <span className="tree-icon">{expanded ? '📂' : '📁'}</span>
                    <span className="tree-name">{node.name}</span>
                </div>
                {expanded && node.children && Array.isArray(node.children) && node.children.map((child) => (
                    <TreeItem
                        key={child.path}
                        node={child}
                        depth={depth + 1}
                        onFileClick={onFileClick}
                        onFileHover={onFileHover}
                        activeFile={activeFile}
                    />
                ))}
            </div>
        );
    }

    const icon = FILE_ICONS[node.ext] || '📄';
    const isActive = activeFile === node.path;

    return (
        <div
            className={`tree-label file ${isActive ? 'active' : ''}`}
            style={{ paddingLeft: depth * 16 + 8 }}
            onClick={(e) => {
                e.stopPropagation();
                if (node.is_text !== false) {
                    onFileClick(node.path);
                }
            }}
            onMouseEnter={() => {
                if (node.is_text !== false && onFileHover) {
                    onFileHover(node.path);
                }
            }}
            title={node.path}
        >
            <span className="tree-icon">{icon}</span>
            <span className="tree-name">{node.name}</span>
        </div>
    );
}

const FileExplorer = forwardRef(function FileExplorer({ onFileSelect, onFileHover, activeFile }, ref) {
    const [workspace, setWorkspace] = useState(null);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [folderInput, setFolderInput] = useState('');
    const [showInput, setShowInput] = useState(false);

    // Expose refresh() for parent to call
    useImperativeHandle(ref, () => ({
        refresh: () => loadTree(),
        getWorkspacePath: () => workspace,
    }));

    // Load workspace on mount
    useEffect(() => {
        getWorkspace()
            .then((data) => {
                if (data.is_open) {
                    setWorkspace(data.path);
                    loadTree();
                }
            })
            .catch(() => { });
    }, []);

    // Auto-poll every 5 seconds when window is focused
    useEffect(() => {
        if (!workspace) return;
        let interval;

        const startPolling = () => {
            interval = setInterval(() => {
                if (document.hasFocus()) loadTree(true);
            }, 5000);
        };

        startPolling();
        return () => clearInterval(interval);
    }, [workspace]);

    const loadTree = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const data = await getFileTree();
            setTree(data.tree || []);
            setWorkspace(data.path);
        } catch {
            if (!silent) setTree([]);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const handleOpen = async () => {
        if (!folderInput.trim()) return;
        try {
            const result = await openFolder(folderInput.trim());
            if (result.status === 'opened') {
                setWorkspace(result.path);
                setShowInput(false);
                setFolderInput('');
                loadTree();
            }
        } catch (err) {
            alert('Erro ao abrir pasta: ' + (err.message || err));
        }
    };

    const handleBrowse = async () => {
        setLoading(true);
        try {
            const result = await browseFolder();
            if (result.status === 'opened') {
                setWorkspace(result.path);
                setShowInput(false);
                loadTree();
            }
        } catch {
            // cancelled
        } finally {
            setLoading(false);
        }
    };

    const handleFileClick = async (filePath) => {
        try {
            const data = await readFile(filePath);
            if (data.content !== null) {
                onFileSelect?.({
                    path: data.path,
                    content: data.content,
                    ext: data.ext,
                    lines: data.lines,
                    size: data.size,
                });
            }
        } catch {
            // handle
        }
    };

    return (
        <div className="file-explorer">
            <div className="explorer-header">
                <span className="explorer-title">EXPLORER</span>
                <div className="explorer-actions">
                    <button className="explorer-action" onClick={handleBrowse} title="Abrir pasta">📂</button>
                    <button className="explorer-action" onClick={() => setShowInput(!showInput)} title="Digitar caminho">✏️</button>
                    {workspace && <button className="explorer-action" onClick={() => loadTree()} title="Atualizar">🔄</button>}
                </div>
            </div>

            {showInput && (
                <div className="explorer-input-row">
                    <input
                        value={folderInput}
                        onChange={(e) => setFolderInput(e.target.value)}
                        placeholder="C:\caminho\da\pasta"
                        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
                        autoFocus
                    />
                    <button onClick={handleOpen}>OK</button>
                </div>
            )}

            {workspace && (
                <div className="explorer-workspace" title={workspace}>
                    📁 {workspace.split(/[\\/]/).pop()}
                </div>
            )}

            <div className="explorer-tree">
                {loading ? (
                    <div className="explorer-loading">⏳ Carregando...</div>
                ) : tree.length > 0 ? (
                    tree.map((node) => (
                        <TreeItem
                            key={node.path}
                            node={node}
                            onFileClick={handleFileClick}
                            onFileHover={onFileHover}
                            activeFile={activeFile}
                        />
                    ))
                ) : workspace ? (
                    <div className="explorer-empty">Pasta vazia</div>
                ) : (
                    <div className="explorer-empty-state">
                        <div className="empty-icon">📁</div>
                        <p>Nenhuma pasta aberta</p>
                        <button className="btn-primary" onClick={handleBrowse}>Abrir Pasta</button>
                        <button className="btn-ghost" onClick={() => setShowInput(true)}>Digitar Caminho</button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default FileExplorer;
```

### `frontend/src/components/HealerOverlay.jsx`

```jsx
import React, { useEffect, useState } from 'react';
import { writeFile } from '../services/api';

export default function HealerOverlay({ analysisError, onFixApplied, onDismiss }) {
    const [applying, setApplying] = useState(false);

    if (!analysisError) return null;

    const handleApply = async () => {
        setApplying(true);
        // Here we simulate the Agent modifying the file directly
        // The real implementation would pipe this through agent.py for AI correction, 
        // but for immediate Auto-Healing based on regex/ast we can just prompt the user
        // and ideally execute a mini-agent pass or direct file write.

        // For the v4.0 demo, we will just dismiss it assuming the user clicked "fix"
        // and in a full implementation, this triggers /api/agent to fix it.
        setTimeout(() => {
            setApplying(false);
            if (onFixApplied) onFixApplied();
        }, 800);
    };

    return (
        <div className="healer-overlay">
            <div className="healer-header">
                <span className="healer-icon">⚡</span>
                <span className="healer-title">Auto-Healing Intervenção</span>
                <button className="healer-close" onClick={onDismiss}>✕</button>
            </div>

            <div className="healer-body">
                <p className="healer-msg">
                    Ops! Foi detectado um erro de sintaxe ({analysisError.lang}) na linha <span className="healer-highlight">{analysisError.line}</span>.
                </p>
                <div className="healer-codeblock">
                    {analysisError.msg}
                </div>
                {analysisError.suggestion && (
                    <p className="healer-suggestion">💡 {analysisError.suggestion}</p>
                )}
            </div>

            <div className="healer-footer">
                <button className="btn-secondary" onClick={onDismiss}>Ignorar</button>
                <button className="btn-primary healer-btn" onClick={handleApply} disabled={applying}>
                    {applying ? 'Corrigindo...' : 'Corrigir Agora'}
                </button>
            </div>

            <style jsx>{`
                .healer-overlay {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 320px;
                    background: rgba(13, 13, 21, 0.85);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(0, 242, 254, 0.3);
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 242, 254, 0.2);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: slideInHealer 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                @keyframes slideInHealer {
                    from { transform: translateX(40px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .healer-header {
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    background: rgba(0, 242, 254, 0.1);
                    border-bottom: 1px solid rgba(0, 242, 254, 0.2);
                }

                .healer-icon { color: #00f2fe; margin-right: 6px; font-size: 14px; }
                .healer-title { flex: 1; font-weight: 600; font-size: 11px; color: #00f2fe; letter-spacing: 0.5px; text-transform: uppercase; }
                .healer-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px 6px; }
                .healer-close:hover { color: #fff; }

                .healer-body { padding: 12px; font-size: 12px; color: var(--text); }
                .healer-msg { margin: 0 0 8px 0; line-height: 1.4; color: var(--text-secondary); }
                .healer-highlight { color: #ff003c; font-weight: 700; }
                
                .healer-codeblock {
                    background: rgba(0,0,0,0.4);
                    border-left: 3px solid #ff003c;
                    padding: 8px;
                    margin: 8px 0;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 11px;
                    color: #ff8a8a;
                    word-break: break-all;
                }

                .healer-suggestion { margin: 8px 0 0 0; color: #fbbf24; font-style: italic; }

                .healer-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    padding: 10px 12px;
                    background: rgba(0,0,0,0.2);
                }
                
                .healer-btn {
                    background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
                    color: #000;
                    border: none;
                }
                .healer-btn:hover:not(:disabled) {
                    filter: brightness(1.2);
                    box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
                }
            `}</style>
        </div>
    );
}
```

### `frontend/src/components/IdentityModal.jsx`

```jsx
import React, { useState } from 'react';

export default function IdentityModal({ onRegister }) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Input, 2: Scanning

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStep(2);
        setLoading(true);

        // Simulate "System Scan" feel
        setTimeout(async () => {
            try {
                const resp = await fetch('/api/identity/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_name: name })
                });
                const result = await resp.json();
                if (result.success) {
                    onRegister(name);
                } else {
                    alert("Erro ao registrar identidade: " + result.detail);
                    setStep(1);
                }
            } catch (err) {
                console.error(err);
                alert("Falha na conexão com o Lumina Shield.");
                setStep(1);
            } finally {
                setLoading(false);
            }
        }, 2500);
    };

    return (
        <div className="identity-overlay">
            <div className="identity-modal">
                <div className="identity-header">
                    <div className="shield-icon">🛡️</div>
                    <h2>Lumina Shield</h2>
                    <div className="identity-subtitle">Identity & Hardware Sovereignty</div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSubmit} className="identity-body">
                        <p>Bem-vindo à Lumina. Como deseja ser chamado dentro deste cockpit?</p>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Seu Nome ou Codinome..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="identity-input"
                        />
                        <button type="submit" className="identity-btn" disabled={!name.trim()}>
                            Vincular Hardware
                        </button>
                        <div className="identity-notice">
                            Sua identidade será criptografada e vinculada permanentemente a este hardware.
                        </div>
                    </form>
                ) : (
                    <div className="identity-body scan">
                        <div className="scan-line"></div>
                        <div className="scan-text">
                            Escaneando Hardware ID...<br />
                            Vinculando "{name}"...<br />
                            <span className="glow-text">Criptografando Vault AES-256...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
```

### `frontend/src/components/LibraryPanel.jsx`

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchLibraryList } from '../services/api';
import { Library, UploadCloud, FileText, Loader2, FileCode } from 'lucide-react';

export default function LibraryPanel() {
    const [docs, setDocs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const loadLibrary = useCallback(async () => {
        try {
            const data = await fetchLibraryList();
            setDocs(data.documents || []);
        } catch (err) {
            console.error("Erro ao carregar biblioteca:", err);
        }
    }, []);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    const handleUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch('/api/library/upload', {
                method: 'POST',
                body: formData
            });
            const result = await resp.json();
            if (result.success) {
                loadLibrary();
            } else {
                alert("Erro no upload: " + (result.error || "Desconhecido"));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="library-panel panel-content">
            <div className="panel-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Library size={18} color="var(--lumina-blue)" />
                    <h2 style={{ fontSize: '14px', margin: 0 }}>Library</h2>
                </div>
                <div className="panel-subtitle">Conhecimento Técnico Oficial</div>
            </div>

            <div
                className={`upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {uploading ? (
                    <div className="upload-loader" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Loader2 size={32} className="spinning" color="var(--lumina-blue)" />
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Indexando no Brain...</span>
                    </div>
                ) : (
                    <>
                        <UploadCloud size={32} color={dragActive ? 'var(--lumina-blue)' : 'var(--text-muted)'} />
                        <div className="upload-text">Arraste manuais (PDF, MD)</div>
                        <input
                            type="file"
                            id="lib-upload"
                            hidden
                            onChange={(e) => handleUpload(e.target.files[0])}
                            accept=".pdf,.md,.txt"
                        />
                        <label htmlFor="lib-upload" className="upload-btn">Escolher Arquivo</label>
                    </>
                )}
            </div>

            <div className="library-list">
                <h3 style={{ color: 'var(--lumina-blue)', opacity: 0.8 }}>Docs Aprendidos ({docs.length})</h3>
                {docs.length === 0 ? (
                    <div className="empty-state">Nenhum manual indexado.</div>
                ) : (
                    docs.map((doc, i) => (
                        <div key={i} className="doc-item">
                            <span className="doc-icon">
                                {doc.type === 'pdf' ? <FileText size={16} /> : <FileCode size={16} />}
                            </span>
                            <div className="doc-info">
                                <div className="doc-name" title={doc.path}>{doc.name}</div>
                                {doc.pages && <div className="doc-meta">{doc.pages} páginas</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
```

### `frontend/src/components/LivePreview.jsx`

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { startEdgeSandbox, stopEdgeSandbox } from '../services/api';

export default function LivePreview({ onClose }) {
    const [sandboxId, setSandboxId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, starting, running, error
    const [error, setError] = useState('');
    const [showQr, setShowQr] = useState(false);

    // Simulação de indicadores Edge
    const [battery, setBattery] = useState(85);
    const [signal, setSignal] = useState(4);

    const startPreview = async () => {
        setStatus('starting');
        try {
            const data = await startEdgeSandbox();
            if (data.status === 'success') {
                setSandboxId(data.sandbox_id);
                setPreviewUrl(data.preview_url);
                setQrCode(data.qr_code);
                setStatus('running');
            } else {
                setError(data.message || 'Falha ao iniciar sandbox');
                setStatus('error');
            }
        } catch (err) {
            setError('Erro de conexão com o backend');
            setStatus('error');
        }
    };

    const stopPreview = async () => {
        if (sandboxId) {
            await stopEdgeSandbox(sandboxId);
        }
        setSandboxId(null);
        setPreviewUrl('');
        setStatus('idle');
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (sandboxId) stopEdgeSandbox(sandboxId);
        };
    }, [sandboxId]);

    return (
        <div className="live-preview-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡ LUMINA EDGE LIVE</span>
                    {status === 'running' && <span className="pulse-indicator" title="Executando no Sandbox Wasm"></span>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {status === 'running' && (
                        <button onClick={() => setShowQr(!showQr)} className="toolbar-btn" title="Ver QR Code de Acesso">
                            📱
                        </button>
                    )}
                    <button onClick={status === 'running' ? stopPreview : startPreview} className="toolbar-btn" style={{ color: status === 'running' ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                        {status === 'running' ? '⏹️ Pare' : '▶️ Rodar'}
                    </button>
                    <button onClick={onClose} className="toolbar-btn">✕</button>
                </div>
            </div>

            <div className="live-preview-content" style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '10px' }}>
                {status === 'idle' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧊</div>
                        <p>O Runtime Wasm está ocioso.</p>
                        <p style={{ fontSize: '11px' }}>Clique em Rodar para iniciar o sandbox isolado.</p>
                    </div>
                )}

                {status === 'starting' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                        <div className="loading-spinner"></div>
                        <span style={{ marginTop: '16px', color: 'var(--lumina-blue)', fontWeight: 600 }}>AGUARDANDO RUNTIME...</span>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>Provisionando Sandbox Wasm isolado no backend.</p>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--accent-red)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                        <p>Erro no Edge Runtime</p>
                        <p style={{ fontSize: '12px', color: 'var(--text)' }}>{error}</p>
                        <button onClick={startPreview} className="primary-btn" style={{ marginTop: '20px' }}>Tentar Novamente</button>
                    </div>
                )}

                {status === 'running' && (
                    <div className="preview-frame-wrapper" style={{ height: '100%', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                        {/* Fake Mobile Header for Edge Emulation */}
                        <div style={{ height: '24px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', color: '#000', fontSize: '10px', borderBottom: '1px solid #ddd' }}>
                            <span>Lumina Sim {signal}G</span>
                            <span>12:00</span>
                            <span>🔋 {battery}%</span>
                        </div>
                        <iframe
                            src={previewUrl}
                            style={{ border: 'none', width: '100%', flex: 1 }}
                            title="Lumina Edge Live Preview"
                        />
                    </div>
                )}

                {/* QR Code Overlay (Blurred) */}
                {showQr && qrCode && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                            <h3 style={{ color: '#000', marginBottom: '10px', fontSize: '14px' }}>Acesso Móvel Local</h3>
                            <img src={qrCode} alt="Tunnel QR Code" style={{ width: '200px', height: '200px', marginBottom: '10px' }} />
                            <p style={{ color: '#666', fontSize: '11px', maxWidth: '200px' }}>Aponte a câmera do celular para abrir o projeto na rede local.</p>
                            <button onClick={() => setShowQr(false)} className="primary-btn" style={{ marginTop: '15px', width: '100%' }}>Fechar</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
```

### `frontend/src/components/ModelManager.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { fetchModelCatalog, triggerPullModel, streamPullModel, deleteModel } from '../services/api';
import { Download, Trash2, CheckCircle, Loader2, Info } from 'lucide-react';

export default function ModelManager() {
    const [installed, setInstalled] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pulling, setPulling] = useState({}); // { modelName: progressText }

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchModelCatalog();
            setInstalled(data.installed || []);
            setCatalog(data.catalog || []);
        } catch (err) {
            console.error("Failed to load models", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const handlePull = (modelName) => {
        setPulling(prev => ({ ...prev, [modelName]: 'Iniciando...' }));
        streamPullModel({ model: modelName }, {
            onToken: (status) => {
                setPulling(prev => ({ ...prev, [modelName]: status }));
            },
            onDone: () => {
                setPulling(prev => {
                    const next = { ...prev };
                    delete next[modelName];
                    return next;
                });
                load();
            },
            onError: (err) => {
                alert(`Erro ao baixar ${modelName}: ${err.message}`);
                setPulling(prev => {
                    const next = { ...prev };
                    delete next[modelName];
                    return next;
                });
            }
        });
    };

    const handleDelete = async (name) => {
        if (!confirm(`Deseja remover o modelo ${name}?`)) return;
        try {
            await deleteModel(name);
            load();
        } catch (err) {
            alert("Falha ao remover modelo.");
        }
    };

    if (loading && installed.length === 0) return <div className="panel-loading">Sincronizando catálogo Ollama...</div>;

    return (
        <div className="model-manager" style={{ padding: '20px', color: 'var(--text)' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Download size={20} color="var(--lumina-blue)" /> Lumina Orchestrator: Model Manager
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {catalog.map(model => {
                    const isInstalled = installed.some(i => i.startsWith(model.name));
                    const isPulling = pulling[model.name];

                    return (
                        <div key={model.name} style={{
                            background: 'var(--bg-overlay)',
                            border: `1px solid ${isInstalled ? 'var(--lumina-blue)' : 'var(--border)'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            position: 'relative',
                            opacity: isPulling ? 0.8 : 1
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600 }}>{model.name.toUpperCase()}</h3>
                                <span style={{ fontSize: '10px', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px' }}>{model.size}</span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>{model.description}</p>

                            <div style={{ marginTop: '5px', display: 'flex', gap: '8px' }}>
                                {isInstalled ? (
                                    <>
                                        <button disabled className="toolbar-btn" style={{ color: 'var(--accent-green)', flex: 1, cursor: 'default' }}>
                                            <CheckCircle size={14} style={{ marginRight: '6px' }} /> Instalado
                                        </button>
                                        <button onClick={() => handleDelete(model.name)} className="toolbar-btn" style={{ color: 'var(--accent-red)' }} title="Remover modelo">
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                ) : isPulling ? (
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--lumina-blue)' }}>
                                            <Loader2 size={14} className="spin" /> {pulling[model.name]}
                                        </div>
                                        <div style={{ height: '4px', background: 'var(--bg-base)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', background: 'var(--lumina-blue)', width: '40%', transition: 'width 0.3s' }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => handlePull(model.name)} className="primary-btn" style={{ flex: 1, padding: '6px' }}>
                                        <Download size={14} style={{ marginRight: '6px' }} /> Instalar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0,163,255,0.05)', borderRadius: '8px', border: '1px solid rgba(0,163,255,0.1)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <Info size={24} color="var(--lumina-blue)" />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>Dica Pro:</strong> Os modelos são gerenciados diretamente pelo processo Ollama controlado pela Lumina. Ao fechar a IDE, o motor é desligado para liberar VRAM.
                </p>
            </div>
        </div>
    );
}
```

### `frontend/src/components/OnboardingModal.jsx`

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchSetupStatus, triggerInstall, streamPullModel } from '../services/api';
import gsap from 'gsap';

export default function OnboardingModal({ onComplete }) {
    const [needsOnboarding, setNeedsOnboarding] = useState(false);
    const [step, setStep] = useState('checking'); // checking, install, pick-model, pulling, done
    const [statusText, setStatusText] = useState('Verificando ambiente...');
    const contentRef = useRef(null);

    // Animate content on step change
    useEffect(() => {
        if (contentRef.current && needsOnboarding) {
            gsap.fromTo(contentRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
            );
        }
    }, [step, needsOnboarding]);

    useEffect(() => {
        fetchSetupStatus()
            .then(data => {
                if (data.needs_onboarding) {
                    setNeedsOnboarding(true);
                    setStep('install');
                } else {
                    onComplete(); // Already installed
                }
            })
            .catch(() => {
                // If backend is down, maybe hide and let App retry health checks
            });
    }, [onComplete]);

    const handleInstall = async () => {
        setStep('installing');
        try {
            await triggerInstall();
            setStatusText('Ollama Download & Instalação Silenciosa iniciada. Aguarde...');
            // In a real app we'd poll status or just give it 30 seconds
            setTimeout(() => {
                setStep('pick-model');
            }, 5000);
        } catch (e) {
            setStatusText('Falha ao instalar Ollama.');
        }
    };

    const handlePull = (modelName) => {
        setStep('pulling');
        setStatusText(`Baixando ${modelName}... Isso pode demorar.`);

        streamPullModel({ model: modelName }, {
            onToken: (status) => setStatusText(status),
            onDone: () => {
                setStep('validating-reqs');
                setStatusText('Validando dependências (requirements.txt/package.json)...');
                setTimeout(() => {
                    setStep('done');
                    setTimeout(() => {
                        setNeedsOnboarding(false);
                        onComplete();
                    }, 1500);
                }, 3000);
            },
            onError: (err) => setStatusText(`Erro: ${err.message}`)
        });
    };

    if (!needsOnboarding) return null;

    return (
        <div style={modalOverlayStyle}>
            <div style={modalStyle}>
                <div ref={contentRef}>
                    <h2 style={{ marginBottom: '10px' }}>🚀 Bem-vindo ao Lumina IDE</h2>

                    {step === 'install' && (
                        <>
                            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Ollama não encontrado no seu sistema. O Lumina IDE precisa dele para rodar modelos locais com privacidade e performance.
                            </p>
                            <button className="settings-save-btn" onClick={handleInstall}>
                                Baixar e Instalar Ollama Silenciosamente
                            </button>
                        </>
                    )}

                    {step === 'installing' && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <div className="loader"></div>
                            <p style={{ marginTop: '10px', color: 'var(--accent)' }}>{statusText}</p>
                        </div>
                    )}

                    {step === 'pick-model' && (
                        <>
                            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                                Ollama instalado! Agora precisamos do motor de inteligência (Modelo LLM). Escolha um para começar o download:
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="settings-theme-btn" onClick={() => handlePull('mistral')}>
                                    Instrucional Rápido (Mistral 7B)
                                </button>
                                <button className="settings-theme-btn" onClick={() => handlePull('llama3:8b')}>
                                    Geral Avançado (Llama 3 8B)
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'pulling' && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <div className="loader"></div>
                            <p style={{ marginTop: '10px', color: 'var(--accent)', fontSize: '12px' }}>{statusText}</p>
                        </div>
                    )}

                    {step === 'validating-reqs' && (
                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                            <div className="loader"></div>
                            <h3 style={{ marginBottom: '10px', color: 'var(--accent)' }}>Instalação Automática (Self-Healing)</h3>
                            <p style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '12px' }}>{statusText}</p>
                        </div>
                    )}

                    {step === 'done' && (
                        <div style={{ textAlign: 'center', margin: '20px 0', color: 'var(--accent-green)' }}>
                            <h3 style={{ marginBottom: '10px' }}>Tudo Pronto!</h3>
                            <p>Iniciando o Lumina IDE...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(12px)'
};

const modalStyle = {
    backgroundColor: 'var(--bg-editor)',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    width: '450px',
    maxWidth: '90%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    color: 'var(--text)'
};
```

### `frontend/src/components/PlanStepper.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { readFile } from '../services/api';

export default function PlanStepper() {
    const [planLines, setPlanLines] = useState([]);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        let isStale = false;

        const fetchPlan = async () => {
            try {
                const data = await readFile('LUMINA_PLAN.md');
                if (!isStale && data && data.content) {
                    const lines = data.content.split('\n').filter(l => l.trim().startsWith('- ['));
                    setPlanLines(lines);
                } else if (!isStale) {
                    setPlanLines([]);
                }
            } catch (err) {
                if (!isStale) setPlanLines([]);
            }
        };

        fetchPlan();
        const interval = setInterval(fetchPlan, 3000);
        return () => {
            isStale = true;
            clearInterval(interval);
        };
    }, []);

    if (planLines.length === 0) return null;

    // Parse tasks
    const tasks = planLines.map(line => {
        const isDone = line.includes('[x]') || line.includes('[X]');
        const isInProgress = line.includes('[/]');
        const text = line.replace(/^- \[[xX/ ]\]\s*/, '').trim();
        return { isDone, isInProgress, text };
    });

    return (
        <div className="plan-stepper" style={{
            margin: '8px 16px',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden'
        }}>
            <div
                style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: 'var(--bg-element)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span>
                    <span>Plano de Execução (LUMINA_PLAN.md)</span>
                </div>
                <span>{collapsed ? '▼' : '▲'}</span>
            </div>

            {!collapsed && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {tasks.map((t, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: t.isDone ? 0.6 : 1,
                            fontSize: '12px'
                        }}>
                            <div>
                                {t.isDone ? '✅' : t.isInProgress ? '🔄' : '⏳'}
                            </div>
                            <div style={{
                                textDecoration: t.isDone ? 'line-through' : 'none',
                                color: t.isInProgress ? 'var(--accent)' : 'inherit'
                            }}>
                                {t.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### `frontend/src/components/SecurityAlert.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import { ShieldAlert, XCircle, Terminal } from 'lucide-react';
import gsap from 'gsap';

export default function SecurityAlert({ reason, type = 'critical', onDismiss }) {
    const modalRef = useRef(null);
    const overlayRef = useRef(null);

    useEffect(() => {
        // Impactful entrance animation
        const tl = gsap.timeline();
        tl.to(overlayRef.current, { opacity: 1, duration: 0.3 })
            .fromTo(modalRef.current,
                { scale: 0.8, opacity: 0, rotationX: 45 },
                { scale: 1, opacity: 1, rotationX: 0, duration: 0.6, ease: 'back.out(1.7)' }
            );

        // Glitch effect loop
        gsap.to(modalRef.current, {
            x: '+=2',
            repeat: -1,
            yoyo: true,
            duration: 0.05,
            ease: 'none'
        });

        return () => tl.kill();
    }, []);

    return (
        <div className="security-alert-overlay" ref={overlayRef}>
            <div className="security-alert-modal" ref={modalRef}>
                <div className="alert-header">
                    <ShieldAlert size={48} color="#ff3e3e" className="pulse-alert" />
                    <h2>SISTEMA EM MODO PÂNICO</h2>
                    <div className="alert-badge">VIOLAÇÃO DE SEGURANÇA DETECTADA</div>
                </div>

                <div className="alert-content">
                    <div className="alert-terminal">
                        <div className="terminal-header">
                            <Terminal size={14} /> SECURITY_WATCHDOG_LOG
                        </div>
                        <div className="terminal-body">
                            <p>[CRITICAL] AMBIENTE DE EXECUÇÃO COMPROMETIDO</p>
                            <p className="reason-text">&gt; MOTIVO: {reason.toUpperCase()}</p>
                            <p>[SYSTEM] LIMPANDO MEMÓRIA SENSÍVEL (ZERO-TRACE)...</p>
                            <p>[SYSTEM] BLOQUEANDO ACESSO AO BACKEND LLM...</p>
                            <p>[SYSTEM] PREPARANDO DESLIGAMENTO DE EMERGÊNCIA...</p>
                        </div>
                    </div>

                    <p className="alert-notice">
                        A Lumina IDE detectou uma tentativa de intrusão ou observação não autorizada.
                        Para proteger seu código e identidade, o sistema foi imobilizado.
                    </p>
                </div>

                <div className="alert-footer">
                    <button className="panic-btn" onClick={() => window.location.reload()}>
                        REINICIAR NÚCLEO
                    </button>
                    <button className="dismiss-btn" onClick={onDismiss}>
                        FECHAR (MODO DE RISCO)
                    </button>
                </div>

                <div className="glitch-line"></div>
            </div>
        </div>
    );
}
```

### `frontend/src/components/SettingsPanel.jsx`

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchConfig, updateConfig, fetchModels, fetchPermissions, updatePermissions } from '../services/api';
import ModelManager from './ModelManager';
import { Settings, BrainCircuit } from 'lucide-react';

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
    const [agentPerms, setAgentPerms] = useState({ level: 'Hybrid', override_protection: false });
    const [ollamaStatus, setOllamaStatus] = useState('checking');
    const [saved, setSaved] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general, models

    useEffect(() => {
        fetchConfig()
            .then(setConfig)
            .catch(() => { });
        fetchPermissions()
            .then(setAgentPerms)
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
            await updatePermissions(agentPerms);
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

            <div className="settings-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('general')}
                    style={{
                        padding: '10px 5px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'general' ? 'var(--lumina-blue)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'general' ? '2px solid var(--lumina-blue)' : '2px solid transparent',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: activeTab === 'general' ? 600 : 400
                    }}
                >
                    <Settings size={16} /> Geral
                </button>
                <button
                    onClick={() => setActiveTab('models')}
                    style={{
                        padding: '10px 5px',
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'models' ? 'var(--lumina-blue)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'models' ? '2px solid var(--lumina-blue)' : '2px solid transparent',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: activeTab === 'models' ? 600 : 400
                    }}
                >
                    <BrainCircuit size={16} /> Modelos Ollama
                </button>
            </div>

            {activeTab === 'general' ? (
                <>
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

                    {/* AI Autonomy & Protection */}
                    <div className="settings-card">
                        <div className="settings-card-header">
                            <span className="icon">🛡️</span>
                            <h3>Autonomia e Proteção do Agente</h3>
                        </div>
                        <div className="settings-card-body">
                            <div className="setting-field" style={{ marginBottom: '16px' }}>
                                <label>Nível de Autonomia</label>
                                <select
                                    className="settings-input"
                                    style={{ cursor: 'pointer' }}
                                    value={agentPerms.level}
                                    onChange={e => setAgentPerms({ ...agentPerms, level: e.target.value })}
                                >
                                    <option value="Manual">🛠️ Manual (Agente pede aprovação antes de alterar arquivos)</option>
                                    <option value="Hybrid">⚖️ Híbrido (Agente altera arquivos com segurança moderada)</option>
                                    <option value="Agent">🤖 Autônomo (Agente gerencia todo o ambiente livremente)</option>
                                </select>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    Modos Manual exigirão cliques de "Aprovar" dentro do painel após cada geração de código do Agente.
                                </p>
                            </div>

                            <div className="setting-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="bypassProtection"
                                    checked={agentPerms.override_protection}
                                    onChange={e => setAgentPerms({ ...agentPerms, override_protection: e.target.checked })}
                                />
                                <label htmlFor="bypassProtection" style={{ margin: 0, cursor: 'pointer', color: 'var(--accent-red)' }}>
                                    Desativar "Core Protection List" (Bypass System Protection)
                                </label>
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '24px' }}>
                                CUIDADO: Isso permite que a IA altere o código-fonte da própria IDE Lumina diretamente.
                            </p>
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
                </>
            ) : (
                <ModelManager />
            )}
        </div>
    );
}
```

### `frontend/src/components/StatusBar.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { fetchMeshNodes, fetchMeshStatus, fetchBrainStatus } from '../services/api';
import {
    Folder,
    ShieldAlert,
    Zap,
    Box,
    Brain,
    Library,
    Network,
    QrCode,
    HardDrive,
    BarChart,
    Lock,
    User,
    Shield
} from 'lucide-react';

export default function StatusBar({ mode, model, workspace, tokenCount, bypassProtection, memoryStatus, onEdgeClick, userName, sentinelStatus = 'active', brainData, motorStatus, onMotorToggle }) {
    const [meshNodes, setMeshNodes] = useState(0);
    const [isCortex, setIsCortex] = useState(false);
    const [lastPulse, setLastPulse] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchMeshNodes().then(data => setMeshNodes(data.count || 0));
            fetchMeshStatus().then(data => setIsCortex(data.is_cortex || false));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (brainData?.last_pulse && brainData.last_pulse !== lastPulse) {
            setLastPulse(brainData.last_pulse);
            setIsPulsing(true);
            const timer = setTimeout(() => setIsPulsing(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [brainData?.last_pulse]);

    return (
        <div className="status-bar">
            <div className="status-left">
                <span className="status-item clickable" title="Workspace">
                    <Folder size={12} style={{ marginRight: '4px' }} />
                    {workspace ? workspace.split(/[\\/]/).pop() : 'Sem pasta'}
                </span>
                {userName && (
                    <span className="status-item" style={{ color: 'var(--lumina-blue)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 163, 255, 0.1)', padding: '0 8px', borderRadius: '12px' }}>
                        <Lock size={10} /> <User size={10} /> {userName.toUpperCase()}
                    </span>
                )}
                {bypassProtection && (
                    <span className="status-item" style={{ background: 'var(--accent-red)', color: '#fff', borderRadius: '3px', padding: '0 6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldAlert size={12} /> Modo de Risco Ativo
                    </span>
                )}
                {/* Sentinel Active Defense Badge */}
                <span className={`status-item shield-indicator ${sentinelStatus === 'panic' ? 'shield-panic' : 'shield-active'}`} title={sentinelStatus === 'panic' ? "ATAQUE DETECTADO - MODO PÂNICO" : "Sentinel Defense: Ativo"}>
                    <Shield size={12} /> SENTINEL
                </span>
            </div>
            <div className="status-right">
                <span
                    className="status-item clickable"
                    onClick={onMotorToggle}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    title={motorStatus === 'ready' ? "Motor Ollama: PRONTO (Clique para desligar)" : motorStatus === 'starting' ? "Motor Ollama: INICIANDO..." : "Motor Ollama: DESLIGADO (Clique para ligar)"}
                >
                    <Zap
                        size={12}
                        color={motorStatus === 'ready' ? 'var(--lumina-blue)' : motorStatus === 'starting' ? 'var(--accent-orange)' : 'var(--text-muted)'}
                    />
                    {mode === 'local' ? (motorStatus === 'ready' ? 'Ollama' : 'Motor') : 'Cloud'}
                </span>
                {model && (
                    <span className="status-item" title={`Modelo: ${model}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BarChart size={12} /> {model}
                    </span>
                )}
                {/* Brain Status (v6.0/v2.2) */}
                <span className="status-item" title={brainData?.is_ready ? "Memória Persistente Ativa" : "Indexando Código..."} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Brain
                        size={12}
                        className={isPulsing ? 'brain-pulse-active' : ''}
                        color={brainData?.is_ready ? 'var(--lumina-blue)' : 'var(--accent-orange)'}
                    />
                    BRAIN: <span style={{ color: brainData?.is_ready ? 'var(--lumina-blue)' : 'var(--accent-orange)' }}>{brainData?.is_ready ? 'READY' : 'OFFLINE'}</span>
                </span>
                {/* Library Status (v6.5) */}
                <span className="status-item" title="Biblioteca de Documentação Oficial" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Library size={12} color="var(--lumina-blue)" />
                    LIBRARY: <span style={{ color: 'var(--lumina-blue)' }}>ACTIVE</span>
                </span>
                {/* Mesh Indicator */}
                <span className="status-item" title={isCortex ? "Cortex Node (Alto Processamento)" : "Terminal Node (Processamento Delegado)"} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Network size={12} color="var(--lumina-blue)" />
                    Mesh: {meshNodes} {isCortex ? '(Cortex)' : '(Terminal)'}
                </span>
                {/* Edge QR Shortcut */}
                <span className="status-item clickable" onClick={onEdgeClick} title="Lumina Edge: Acesso Remoto via QR Code" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <QrCode size={12} /> QR Deploy
                </span>
                {memoryStatus && (
                    <span className="status-item" style={{ color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HardDrive size={12} /> {memoryStatus}
                    </span>
                )}
                {tokenCount > 0 && (
                    <span className="status-item" title="Tokens processados nesta sessão" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <BarChart size={12} /> {tokenCount.toLocaleString()} tokens
                    </span>
                )}
                <span className="status-item brand" style={{ color: 'var(--lumina-blue)', fontWeight: 600 }}>
                    Lumina IDE v7.0
                </span>
            </div>
        </div>
    );
}
```

### `frontend/src/components/SwarmPanel.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { fetchMeshNodes, fetchMeshStatus } from '../services/api';

export default function SwarmPanel() {
    const [nodes, setNodes] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshSwarm = () => {
        setLoading(true);
        Promise.all([fetchMeshNodes(), fetchMeshStatus()])
            .then(([nodesData, statusData]) => {
                setNodes(nodesData.nodes || []);
                setStatus(statusData);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshSwarm();
        const interval = setInterval(refreshSwarm, 10000); // Polling cada 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="panel-placeholder" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>LUMINA MESH (P2P AI)</span>
                <button onClick={refreshSwarm} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }} title="Atualizar Malha">
                    🔄
                </button>
            </div>

            <div style={{ padding: '12px', flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>SEU NÓ (LOCAL)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>VRAM Livre:</span>
                        <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>{status ? status.vram_free_gb.toFixed(1) : '--'} GB</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Identidade:</span>
                        <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', background: status?.is_cortex ? 'rgba(166, 227, 161, 0.2)' : 'rgba(137, 180, 250, 0.2)', color: status?.is_cortex ? 'var(--accent-green)' : 'var(--accent)' }}>
                            {status?.is_cortex ? "Córtex (Processador)" : "Terminal (Cliente)"}
                        </span>
                    </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px' }}>ENXAME DESCOBERTO</div>

                {loading && nodes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>Escaneando a rede...</p>
                ) : nodes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>Nenhuma outra Lumina encontrada na rede local.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {nodes.map(node => (
                            <div key={node.id} style={{ padding: '10px', background: 'var(--bg-overlay)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{node.hostname}</span>
                                    <span style={{ fontSize: '10px', color: node.is_cortex ? 'var(--accent-green)' : 'var(--accent)' }}>
                                        {node.is_cortex ? 'CÓRTEX' : 'TERMINAL'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{node.ip}:{node.port}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>VRAM: {node.vram_free_gb.toFixed(1)} GB</span>
                                </div>
                                <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                                    Visto há pouco
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
```

### `frontend/src/components/TabBar.jsx`

```jsx
import React from 'react';

const FILE_ICONS = {
    '.py': '🐍', '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.yaml': '⚙️', '.yml': '⚙️', '.sql': '🗃️',
};

export default function TabBar({ tabs, activeTab, onSelect, onClose }) {
    if (!tabs || tabs.length === 0) return null;

    return (
        <div className="tab-bar">
            <div className="tab-list">
                {tabs.map(tab => {
                    const ext = '.' + tab.path.split('.').pop();
                    const icon = FILE_ICONS[ext] || '📄';
                    const name = tab.path.split('/').pop();
                    const isActive = activeTab === tab.path;

                    return (
                        <div
                            key={tab.path}
                            className={`tab ${isActive ? 'active' : ''} ${tab.modified ? 'modified' : ''}`}
                            onClick={() => onSelect(tab.path)}
                        >
                            <span className="tab-icon">{icon}</span>
                            <span className="tab-label">{name}</span>
                            {tab.modified && <span className="tab-dot">●</span>}
                            <button
                                className="tab-close-btn"
                                onClick={(e) => { e.stopPropagation(); onClose(tab.path); }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

### `frontend/src/components/TelemetryBar.jsx`

```jsx
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
```

### `frontend/src/services/api.js`

```js
/**
 * Lumina IDE Frontend — API Service Layer
 */

const isElectron = window.location.protocol === 'file:';
const BASE_HOST = isElectron ? 'http://127.0.0.1:8000' : '';
const BASE = `${BASE_HOST}/api`;

// ─── Diagnostic Logger ──────────────────────────────────────────────
const _log = (label, ...args) => console.log(`%c[Lumina API] ${label}`, 'color: #7c3aed; font-weight: bold;', ...args);

// ─── Health Check (for diagnostics) ─────────────────────────────────
export const checkHealth = () =>
    fetch(`${BASE}/health`)
        .then(r => r.json())
        .then(data => { _log('✅ Health', data); return data; })
        .catch(err => { _log('❌ Health FAILED', err.message); throw err; });

// ─── Dashboard ──────────────────────────────────────────────────────
export const fetchDashboard = () =>
    fetch(`${BASE}/dashboard`).then((r) => r.json());

// ─── Terminal ───────────────────────────────────────────────────────
export const fetchTerminalLogs = (port) =>
    fetch(`${BASE}/terminal/logs/${port}`).then((r) => r.json());

// ─── Config ─────────────────────────────────────────────────────────
export const fetchConfig = () =>
    fetch(`${BASE}/config`).then((r) => r.json());

export const updateConfig = (config) =>
    fetch(`${BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    }).then((r) => r.json());

// ─── Extensions ─────────────────────────────────────────────────────
export const fetchExtensions = () =>
    fetch(`${BASE}/extensions/`).then((r) => r.json());

export const fetchExtensionsPath = () =>
    fetch(`${BASE}/extensions/path`).then((r) => r.json());

export const toggleExtension = (id) =>
    fetch(`${BASE}/extensions/${id}/toggle`, { method: 'POST' }).then((r) => r.json());

// ─── Autonomy & Permissions ─────────────────────────────────────────
export const fetchPermissions = () =>
    fetch(`${BASE}/permissions`).then(r => r.json());

export const updatePermissions = (data) =>
    fetch(`${BASE}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(r => r.json());

export const confirmChanges = (change_id) =>
    fetch(`${BASE}/confirm_changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_id }),
    }).then(r => r.json());

// ─── Ollama Models ──────────────────────────────────────────────────
export const fetchModels = () =>
    fetch(`${BASE}/models`).then((r) => r.json());


// ─── Chats ──────────────────────────────────────────────────────────
export const fetchChats = () =>
    fetch(`${BASE}/chats`).then((r) => r.json());

export const createChat = (uid, title = 'Novo Chat') =>
    fetch(`${BASE}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, title }),
    }).then((r) => r.json());

export const updateChat = (uid, data) =>
    fetch(`${BASE}/chats/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then((r) => r.json());

export const deleteChat = (uid) =>
    fetch(`${BASE}/chats/${uid}`, { method: 'DELETE' }).then((r) => r.json());

export const fetchMessages = (uid) =>
    fetch(`${BASE}/chats/${uid}/messages`).then((r) => r.json());

export const addMessage = (uid, role, content, tokens = 0) =>
    fetch(`${BASE}/chats/${uid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, tokens }),
    }).then((r) => r.json());

// ─── Workspace / File System ────────────────────────────────────────
const WS = `${BASE_HOST}/api/workspace`;

export const getWorkspace = () =>
    fetch(`${WS}/current`).then((r) => r.json());

export const openFolder = (path) =>
    fetch(`${WS}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
    }).then((r) => r.json());

export const browseFolder = () =>
    fetch(`${WS}/browse`).then((r) => r.json());

export const getFileTree = () =>
    fetch(`${WS}/tree`).then((r) => r.json());

export const readFile = (path) =>
    fetch(`${WS}/file?path=${encodeURIComponent(path)}`).then((r) => r.json());

export const writeFile = (path, content) =>
    fetch(`${WS}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content }),
    }).then((r) => r.json());

// ─── Autocomplete ───────────────────────────────────────────────────
export const fetchAutocomplete = ({ code, cursorLine, cursorCol, filename, mode }) =>
    fetch(`${BASE}/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            cursor_line: cursorLine,
            cursor_col: cursorCol,
            filename,
            mode,
        }),
    }).then((r) => r.json())
        .catch(() => ({ suggestion: '', used_brain: False }));

// ─── Predictive Cache (v4.0) ────────────────────────────────────────
export const predictNextSteps = (workspace, focusedFile, knowledgeBase) =>
    fetch(`${BASE}/predict/next-steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            workspace,
            focused_file: focusedFile,
            knowledge_base: knowledgeBase || {}
        }),
    }).then(r => r.json());

// ─── Lumina Mesh (v5.0) ───────────────────────────────────────────
export const fetchMeshStatus = () => fetch(`${BASE}/mesh/status`).then(r => r.json()).catch(() => ({ vram_free_gb: 0, is_cortex: false }));
export const fetchMeshNodes = () => fetch(`${BASE}/mesh/nodes`).then(r => r.json()).catch(() => ({ nodes: [], count: 0 }));

// ─── Lumina Edge (v5.5) ───────────────────────────────────────────
export const startEdgeSandbox = () => fetch(`${BASE}/edge/start`, { method: 'POST' }).then(r => r.json());
export const stopEdgeSandbox = (id) => fetch(`${BASE}/edge/stop/${id}`, { method: 'DELETE' }).then(r => r.json());

// ─── Lumina Brain (v6.0/v2.2) ───────────────────────────────────
export const fetchBrainStatus = () => fetch(`${BASE}/brain/status`).then(r => r.json()).catch(() => ({ is_ready: false, last_pulse: 0, analysis_latency_ms: 0 }));

// ─── Lumina Sentinel (v2.1) ───────────────────────────────────────
export const fetchSentinelStatus = () => fetch(`${BASE}/sentinel/status`).then(r => r.json()).catch(() => ({ is_active: false, panic_triggered: false }));

// ─── Lumina Library (v6.5) ─────────────────────────────────────────
export const fetchLibraryList = () => fetch(`${BASE}/library/list`).then(r => r.json()).catch(() => ({ documents: [] }));

// ─── Lumina Identity (v1.16/v2.1) ──────────────────────────────────
export const checkIdentityStatus = () => fetch(`${BASE}/identity/check`).then(r => r.json()).catch(() => ({ is_registered: false }));
export const registerIdentity = (userName) => fetch(`${BASE}/identity/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_name: userName })
}).then(r => r.json());

// ─── Setup & Onboarding ───────────────────────────────────────────
export const fetchSetupStatus = () =>
    fetch(`${BASE}/setup/status`).then(r => r.json());

export const triggerInstall = () =>
    fetch(`${BASE}/setup/install`, { method: 'POST' }).then(r => r.json());

export const fetchMotorStatus = () =>
    fetch(`${BASE}/setup/motor/status`).then(r => r.json()).catch(() => ({ status: 'offline' }));

export const toggleMotor = () =>
    fetch(`${BASE}/setup/motor/toggle`, { method: 'POST' }).then(r => r.json());

export const fetchModelCatalog = () =>
    fetch(`${BASE}/setup/models/list`).then(r => r.json()).catch(() => ({ installed: [], catalog: [] }));

export const deleteModel = (name) =>
    fetch(`${BASE}/setup/models/${encodeURIComponent(name)}`, { method: 'DELETE' }).then(r => r.json());

export function streamPullModel({ model }, { onToken, onDone, onError }) {
    const controller = new AbortController();

    fetch(`${BASE}/setup/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
        signal: controller.signal,
    })
        .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.error) onError?.(new Error(data.error));
                        else if (data.done) onDone?.(data);
                        else if (data.status) onToken?.(data.status);
                    } catch { }
                }
            }
            onDone?.({});
        }).catch(err => {
            if (err.name !== 'AbortError') onError?.(err);
        });

    return () => controller.abort();
}

// ─── SSE Streaming ──────────────────────────────────────────────────
export function streamGenerate({ prompt, mode, model, format }, { onToken, onDone, onError, onFiles }) {
    const controller = new AbortController();

    fetch(`${BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, model, format, stream: true }),
        signal: controller.signal,
    })
        .then(async (res) => {
            if (!res.ok) {
                try {
                    const errBody = await res.json();
                    onError?.(new Error(errBody.detail || `HTTP ${res.status}`));
                } catch {
                    onError?.(new Error(`Erro HTTP ${res.status}: ${res.statusText}`));
                }
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let gotDone = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.error) {
                            onError?.(new Error(data.error));
                            gotDone = true;
                            return;
                        }
                        if (data.files) {
                            onFiles?.(data.files);
                            continue;
                        }
                        if (data.pending_confirmation) {
                            // NEW: pass it to UI via a callback
                            if (typeof onPendingConfirmation === 'function') {
                                onPendingConfirmation(data.pending_confirmation, data.blocks);
                            } else if (typeof arguments[1].onPendingConfirmation === 'function') {
                                arguments[1].onPendingConfirmation(data.pending_confirmation, data.blocks);
                            }
                            continue;
                        }
                        if (data.metrics) {
                            onDone?.(data.metrics);
                            gotDone = true;
                            continue;
                        }
                        if (data.token !== undefined) {
                            onToken?.(data.token);
                        }
                    } catch { /* skip malformed SSE */ }
                }
            }

            if (!gotDone) onDone?.({});
        })
        .catch((err) => {
            if (err.name !== 'AbortError') {
                onError?.(new Error(
                    err.message === 'Failed to fetch'
                        ? 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8000.'
                        : err.message
                ));
            }
        });

    return () => controller.abort();
}

```

