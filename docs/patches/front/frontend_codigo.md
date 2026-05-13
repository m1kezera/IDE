# Código fonte: frontend

## Arquivo: `.gitignore`

```text
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

## Arquivo: `index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/Luminalogo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lumina IDE</title>
  <meta name="description"
    content="Lumina IDE — Local Intelligence, Global Performance. Ambiente de codificação híbrido com IA local." />
</head>

<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>

</html>
```

## Arquivo: `package.json`

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node -e \"const fs=require('fs');const p='dist/index.html';fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace(/ crossorigin/g,''))\"",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.4",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}
```

## Arquivo: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "allowJs": true
  },
  "include": ["src"]
}
```

## Arquivo: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
```

## Arquivo: `public\lumina-logo.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#89B4FA" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#89B4FA" stop-opacity="0"/>
    </radialGradient>
    <filter id="neon">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Background glow -->
  <circle cx="60" cy="60" r="50" fill="url(#glow)"/>
  <!-- Hexagonal neural node structure -->
  <g filter="url(#neon)" stroke="#89B4FA" stroke-width="1.5" stroke-linecap="round">
    <!-- Outer hexagon -->
    <polygon points="60,18 96,38 96,78 60,98 24,78 24,38" fill="none" opacity="0.4"/>
    <!-- Inner hexagon -->
    <polygon points="60,34 78,44 78,72 60,82 42,72 42,44" fill="none" opacity="0.6"/>
    <!-- Center node (lúmen) -->
    <circle cx="60" cy="60" r="8" fill="#89B4FA" opacity="0.9"/>
    <circle cx="60" cy="60" r="4" fill="#CDD6F4"/>
    <!-- Neural connections: center to inner vertices -->
    <line x1="60" y1="60" x2="60" y2="34"/>
    <line x1="60" y1="60" x2="78" y2="44"/>
    <line x1="60" y1="60" x2="78" y2="72"/>
    <line x1="60" y1="60" x2="60" y2="82"/>
    <line x1="60" y1="60" x2="42" y2="72"/>
    <line x1="60" y1="60" x2="42" y2="44"/>
    <!-- Inner to outer connections (partial, creating neural web) -->
    <line x1="60" y1="34" x2="60" y2="18" opacity="0.5"/>
    <line x1="78" y1="44" x2="96" y2="38" opacity="0.5"/>
    <line x1="78" y1="72" x2="96" y2="78" opacity="0.5"/>
    <line x1="60" y1="82" x2="60" y2="98" opacity="0.5"/>
    <line x1="42" y1="72" x2="24" y2="78" opacity="0.5"/>
    <line x1="42" y1="44" x2="24" y2="38" opacity="0.5"/>
    <!-- Small nodes at inner vertices -->
    <circle cx="60" cy="34" r="3" fill="#89B4FA" opacity="0.7"/>
    <circle cx="78" cy="44" r="3" fill="#89B4FA" opacity="0.7"/>
    <circle cx="78" cy="72" r="3" fill="#89B4FA" opacity="0.7"/>
    <circle cx="60" cy="82" r="3" fill="#89B4FA" opacity="0.7"/>
    <circle cx="42" cy="72" r="3" fill="#89B4FA" opacity="0.7"/>
    <circle cx="42" cy="44" r="3" fill="#89B4FA" opacity="0.7"/>
    <!-- Tiny nodes at outer vertices -->
    <circle cx="60" cy="18" r="2" fill="#89B4FA" opacity="0.4"/>
    <circle cx="96" cy="38" r="2" fill="#89B4FA" opacity="0.4"/>
    <circle cx="96" cy="78" r="2" fill="#89B4FA" opacity="0.4"/>
    <circle cx="60" cy="98" r="2" fill="#89B4FA" opacity="0.4"/>
    <circle cx="24" cy="78" r="2" fill="#89B4FA" opacity="0.4"/>
    <circle cx="24" cy="38" r="2" fill="#89B4FA" opacity="0.4"/>
  </g>
</svg>
```

## Arquivo: `public\vite.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="31.88" height="32" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 257"><defs><linearGradient id="IconifyId1813088fe1fbc01fb466" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stop-color="#41D1FF"></stop><stop offset="100%" stop-color="#BD34FE"></stop></linearGradient><linearGradient id="IconifyId1813088fe1fbc01fb467" x1="43.376%" x2="50.316%" y1="2.242%" y2="89.03%"><stop offset="0%" stop-color="#FFEA83"></stop><stop offset="8.333%" stop-color="#FFDD35"></stop><stop offset="100%" stop-color="#FFA800"></stop></linearGradient></defs><path fill="url(#IconifyId1813088fe1fbc01fb466)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.537 6.537 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"></path><path fill="url(#IconifyId1813088fe1fbc01fb467)" d="M185.432.063L96.44 17.501a3.268 3.268 0 0 0-2.634 3.014l-5.474 92.456a3.268 3.268 0 0 0 3.997 3.378l24.777-5.718c2.318-.535 4.413 1.507 3.936 3.838l-7.361 36.047c-.495 2.426 1.782 4.5 4.151 3.78l15.304-4.649c2.372-.72 4.652 1.36 4.15 3.788l-11.698 56.621c-.732 3.542 3.979 5.473 5.943 2.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505 4.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z"></path></svg>
```

## Arquivo: `src\main.jsx`

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

## Arquivo: `src\components\FileEditor.jsx`

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
```

