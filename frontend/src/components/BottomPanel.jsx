import React, { useState, useRef, useEffect } from 'react';
import { streamGenerate, getFileTree, readFile } from '../services/api';

// Simple UUID generator for Terminal instances
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function BottomPanel({ mode, onFilesCreated, promptFiles = [] }) {
    // ─── AI State ───────────────────────────────────────────
    const [prompt, setPrompt] = useState('');
    const [output, setOutput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [fileOps, setFileOps] = useState([]);
    const [lastProcessedError, setLastProcessedError] = useState('');

    // AI Refs
    const outputRef = useRef(null);
    const cancelRef = useRef(null);
    const promptRef = useRef(null);

    // ─── Terminal State ─────────────────────────────────────
    // Support multiple terminals
    const [terminals, setTerminals] = useState([{ id: 'term-1', name: 'Terminal 1', output: '', input: '', ws: null, port: '' }]);
    // Use active tab for routing: 'ai', 'output', or 'term-<id>'
    const [activeTab, setActiveTab] = useState('term-1');

    // Rename/Config Modal State
    const [renamingTerm, setRenamingTerm] = useState(null); // id of terminal being renamed
    const [renameInput, setRenameInput] = useState('');
    const [configuringPort, setConfiguringPort] = useState(false); // boolean indicating we show port config

    // Ref to hold WebSocket instances persistently without causing re-renders
    const wsInstances = useRef({});
    const terminalOutputRefs = useRef({});

    // ─── AI Effects ─────────────────────────────────────────
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    // ─── Terminal Logic ─────────────────────────────────────
    const initWebSocket = (termId) => {
        if (wsInstances.current[termId]) return;

        // Find terminal definition to extract custom port, or fallback to 'cmd'
        const tObj = terminals.find(t => t.id === termId);
        const portParam = tObj && tObj.port ? tObj.port.trim() : 'cmd';

        const host = window.location.hostname;
        const wsUrl = `ws://${host}:8000/api/ws/${portParam}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Lumina Terminal Conectado]\r\n' } : t
            ));
        };

        ws.onmessage = (event) => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + event.data } : t
            ));
        };

        ws.onclose = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Terminal Desconectado]\r\n' } : t
            ));
            delete wsInstances.current[termId];
        };

        ws.onerror = () => {
            setTerminals(prev => prev.map(t =>
                t.id === termId ? { ...t, output: t.output + '\r\n[Erro na Conexão do Terminal]\r\n' } : t
            ));
        };

        wsInstances.current[termId] = ws;
    };

    // Auto-scroll active terminal
    useEffect(() => {
        if (activeTab.startsWith('term-')) {
            const ref = terminalOutputRefs.current[activeTab];
            if (ref) ref.scrollTop = ref.scrollHeight;
        }
    }, [terminals, activeTab]);

    // Connect WS when switched
    useEffect(() => {
        if (activeTab.startsWith('term-')) {
            initWebSocket(activeTab);
        }
    }, [activeTab]);

    const handleAddTerminal = () => {
        const id = 'term-' + generateId();
        const num = terminals.length + 1;
        setTerminals(prev => [...prev, { id, name: `Terminal ${num}`, output: '', input: '', ws: null }]);
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

    const handleTermSubmit = (id) => {
        const term = terminals.find(t => t.id === id);
        if (!term || !term.input.trim() || !wsInstances.current[id]) return;

        wsInstances.current[id].send(term.input + '\n');
        setTerminals(prev => prev.map(t => t.id === id ? { ...t, input: '' } : t));
    };

    const handleTermKeyDown = (e, id) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTermSubmit(id);
        }
    };

    // ─── Auto-Correction Logic ──────────────────────────────
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
                            <button className="bottom-action" onClick={() => setTerminals(prev => prev.map(t => t.id === activeTab ? { ...t, output: '' } : t))} title="Limpar Terminal">
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
                <div ref={outputRef} className={`bottom-output ${streaming ? 'streaming' : ''}`}>
                    {output ? (
                        <>
                            {output}
                            {streaming && <span className="cursor-blink" />}
                        </>
                    ) : (
                        <div className="bottom-welcome">
                            <span>🛰️ Lumina Agent — Digite um prompt abaixo. Abra uma pasta no Explorer para criar arquivos.</span>
                        </div>
                    )}
                </div>
            )}

            {/* Output areas for Terminals */}
            {terminals.map(term => (
                <div
                    key={term.id}
                    className="bottom-output terminal"
                    ref={el => terminalOutputRefs.current[term.id] = el}
                    style={{ display: activeTab === term.id ? 'block' : 'none', overflowY: 'auto' }}
                >
                    <pre className="terminal-content">{term.output}</pre>
                </div>
            ))}

            {activeTab === 'output' && (
                <div className="bottom-output" style={{ color: 'var(--text-muted)', padding: '16px' }}>
                    Esta aba exibe os logs e console de debugging do sistema.
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

            {/* Prompt bar / Terminal Input */}
            <div className="bottom-prompt">
                {activeTab === 'ai' ? (
                    <>

                        <div className="bottom-prompt-input-row">
                            <div className="prompt-mode">
                                <span className="prompt-dot" />
                                {mode === 'local' ? 'Ollama' : 'Cloud'}
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
                    <>
                        <div className="prompt-mode" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => handleStartRename(activeTermObj.id, activeTermObj.name)} title="Clique para renomear">
                            <span className="prompt-dot" style={{ background: 'var(--accent)' }} />
                            {activeTermObj.name}
                        </div>
                        <input
                            className="prompt-textarea terminal-input"
                            placeholder={`Comando no ${activeTermObj.name} (ex: npm run dev) ...`}
                            value={activeTermObj.input}
                            onChange={(e) => setTerminals(prev => prev.map(t => t.id === activeTermObj.id ? { ...t, input: e.target.value } : t))}
                            onKeyDown={(e) => handleTermKeyDown(e, activeTermObj.id)}
                            style={{ height: '36px', overflow: 'hidden' }}
                        />
                        <button
                            className="prompt-send"
                            onClick={() => handleTermSubmit(activeTermObj.id)}
                            disabled={!activeTermObj.input.trim()}
                        >
                            ↵
                        </button>
                    </>
                ) : (
                    <div style={{ padding: '8px', color: 'var(--text-muted)' }}>Output tab selecionada.</div>
                )}
            </div>
        </div>
    );
}
