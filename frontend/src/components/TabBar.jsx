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
