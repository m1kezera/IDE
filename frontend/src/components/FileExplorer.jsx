import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { getWorkspace, openFolder, browseFolder, getFileTree, readFile } from '../services/api';

const FILE_ICONS = {
    '.py': '🐍', '.js': '🟨', '.jsx': '⚛️', '.ts': '🔷', '.tsx': '⚛️',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝', '.txt': '📄',
    '.yaml': '⚙️', '.yml': '⚙️', '.env': '🔒', '.sql': '🗃️', '.sh': '🖥️',
    '.go': '🔵', '.rs': '🦀', '.java': '☕', '.c': '🔧', '.cpp': '🔧',
};

function TreeItem({ node, depth = 0, onFileClick, activeFile }) {
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
            title={node.path}
        >
            <span className="tree-icon">{icon}</span>
            <span className="tree-name">{node.name}</span>
        </div>
    );
}

const FileExplorer = forwardRef(function FileExplorer({ onFileSelect, activeFile }, ref) {
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
