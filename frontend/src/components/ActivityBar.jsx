import React from 'react';

const ITEMS = [
    { id: 'explorer', icon: '📁', label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'ai', icon: '🤖', label: 'Agent', shortcut: 'Ctrl+Shift+A' },
    { id: 'telemetry', icon: '📊', label: 'Telemetria', shortcut: '' },
    { id: 'extensions', icon: '🧩', label: 'Extensões', shortcut: 'Ctrl+Shift+X' },
];

const BOTTOM_ITEMS = [
    { id: 'settings', icon: '⚙️', label: 'Configurações' },
];

export default function ActivityBar({ activePanel, onPanelChange }) {
    return (
        <div className="activity-bar">
            <div className="activity-bar-top">
                {ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                        onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                        title={`${item.label} (${item.shortcut})`}
                    >
                        <span className="activity-icon">{item.icon}</span>
                        {activePanel === item.id && <span className="activity-indicator" />}
                    </button>
                ))}
            </div>
            <div className="activity-bar-bottom">
                {BOTTOM_ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`activity-btn ${activePanel === item.id ? 'active' : ''}`}
                        onClick={() => onPanelChange(activePanel === item.id ? null : item.id)}
                        title={item.label}
                    >
                        <span className="activity-icon">{item.icon}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
