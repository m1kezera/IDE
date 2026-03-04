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
            const suggestion = await fetchAutocomplete({
                code: content,
                cursorLine,
                cursorCol,
                filename: fileName,
                mode: 'local',
            });
            if (suggestion && suggestion.trim()) {
                setGhostText(suggestion);
                setGhostPos({ line: cursorLine, col: cursorCol });
            } else {
                setGhostText('');
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
