/**
 * Lumina IDE — Theme Engine (v1.0)
 * Custom color picker + Icon packs.
 * Injects into existing Settings panel.
 */

import { PubSub } from '../core/PubSub';
import { t, getLang, setLang, LANGUAGES } from '../core/i18n';

// ─── Default Colors ─────────────────────────────────────────────────
const DEFAULTS: Record<string, string> = {
  '--bg-dark':       '#0B0E14',
  '--text':          '#e0e6f0',
  '--accent':        '#00A3FF',
  '--accent-green':  '#33ffaa',
  '--accent-red':    '#ff4d6d',
  '--accent-yellow': '#ffcc66',
};

const COLOR_LABELS: Record<string, string> = {
  '--bg-dark':       '🎨 Fundo',
  '--text':          '📝 Texto',
  '--accent':        '🔵 Destaque',
  '--accent-green':  '🟢 Verde',
  '--accent-red':    '🔴 Vermelho',
  '--accent-yellow': '🟡 Amarelo',
};

// ─── Presets ─────────────────────────────────────────────────────────
interface Preset { name: string; emoji: string; colors: Record<string, string>; }

const PRESETS: Preset[] = [
  {
    name: 'Rosa Suave', emoji: '🌸',
    colors: { '--bg-dark': '#1a0f18', '--text': '#f5e6f0', '--accent': '#ff8fbf', '--accent-green': '#a8e6a3', '--accent-red': '#ff6b8a', '--accent-yellow': '#ffd699' }
  },
  {
    name: 'Crimson', emoji: '🔴',
    colors: { '--bg-dark': '#140a0a', '--text': '#f0d0d0', '--accent': '#ff3333', '--accent-green': '#77dd77', '--accent-red': '#ff1744', '--accent-yellow': '#ffab40' }
  },
  {
    name: 'Abyss', emoji: '🖤',
    colors: { '--bg-dark': '#050505', '--text': '#b0b0b0', '--accent': '#555555', '--accent-green': '#448844', '--accent-red': '#884444', '--accent-yellow': '#888844' }
  },
  {
    name: 'Ocean', emoji: '🌊',
    colors: { '--bg-dark': '#0a1628', '--text': '#c8dff0', '--accent': '#00d4ff', '--accent-green': '#00ffa3', '--accent-red': '#ff5577', '--accent-yellow': '#ffe066' }
  },
  {
    name: 'Monokai', emoji: '🟡',
    colors: { '--bg-dark': '#272822', '--text': '#f8f8f2', '--accent': '#a6e22e', '--accent-green': '#a6e22e', '--accent-red': '#f92672', '--accent-yellow': '#e6db74' }
  },
  {
    name: 'Dracula', emoji: '🧛',
    colors: { '--bg-dark': '#282a36', '--text': '#f8f8f2', '--accent': '#bd93f9', '--accent-green': '#50fa7b', '--accent-red': '#ff5555', '--accent-yellow': '#f1fa8c' }
  },
  {
    name: 'Lavender', emoji: '💜',
    colors: { '--bg-dark': '#15101f', '--text': '#e8e0f0', '--accent': '#c792ea', '--accent-green': '#a5d6a7', '--accent-red': '#f48fb1', '--accent-yellow': '#ffe082' }
  },
  {
    name: 'Forest', emoji: '🌲',
    colors: { '--bg-dark': '#0a140a', '--text': '#d0e8d0', '--accent': '#66bb6a', '--accent-green': '#69f0ae', '--accent-red': '#ef5350', '--accent-yellow': '#ffd54f' }
  },
  {
    name: 'Sunset', emoji: '🌅',
    colors: { '--bg-dark': '#1a0e0a', '--text': '#f0e0d0', '--accent': '#ff6b35', '--accent-green': '#7bc67e', '--accent-red': '#e63946', '--accent-yellow': '#fca311' }
  },
  {
    name: 'Cyberpunk', emoji: '⚡',
    colors: { '--bg-dark': '#0a0014', '--text': '#e0d0ff', '--accent': '#ff00ff', '--accent-green': '#00ff41', '--accent-red': '#ff003c', '--accent-yellow': '#ffff00' }
  },
  {
    name: 'Mint', emoji: '🍃',
    colors: { '--bg-dark': '#0a1410', '--text': '#d0f0e0', '--accent': '#00e5a0', '--accent-green': '#00ff88', '--accent-red': '#ff6b6b', '--accent-yellow': '#ffe44d' }
  },
  {
    name: 'Solarized', emoji: '☀️',
    colors: { '--bg-dark': '#002b36', '--text': '#839496', '--accent': '#268bd2', '--accent-green': '#859900', '--accent-red': '#dc322f', '--accent-yellow': '#b58900' }
  },
  {
    name: 'Nord', emoji: '❄️',
    colors: { '--bg-dark': '#2e3440', '--text': '#d8dee9', '--accent': '#88c0d0', '--accent-green': '#a3be8c', '--accent-red': '#bf616a', '--accent-yellow': '#ebcb8b' }
  },
  {
    name: 'Tokyo Night', emoji: '🗼',
    colors: { '--bg-dark': '#1a1b26', '--text': '#c0caf5', '--accent': '#7aa2f7', '--accent-green': '#9ece6a', '--accent-red': '#f7768e', '--accent-yellow': '#e0af68' }
  },
  {
    name: 'Neon Electric', emoji: '💎',
    colors: { '--bg-dark': '#050510', '--text': '#e0e8ff', '--accent': '#00e5ff', '--accent-green': '#39ff14', '--accent-red': '#ff073a', '--accent-yellow': '#ffe302' }
  },
  {
    name: 'Synthwave', emoji: '🌆',
    colors: { '--bg-dark': '#0d0221', '--text': '#e0c0f0', '--accent': '#ff0080', '--accent-green': '#00ff9f', '--accent-red': '#ff2975', '--accent-yellow': '#ffd319' }
  },
  {
    name: 'Hacker', emoji: '💀',
    colors: { '--bg-dark': '#000000', '--text': '#00ff41', '--accent': '#00ff41', '--accent-green': '#00ff41', '--accent-red': '#ff0000', '--accent-yellow': '#00cc33' }
  },
];

// ─── Icon Packs ─────────────────────────────────────────────────────
interface IconPack {
  name: string;
  preview: string;
  icons: Record<string, string>;
  fileIcons: Record<string, string>;
}

const ICON_PACKS: IconPack[] = [
  {
    name: 'Padrão', preview: '📁📄🔀🎵',
    icons: { explorer: '📁', file: '📄', folder: '📁', folderOpen: '📂', git: '🔀', music: '🎵', telemetry: '📊', colmeia: '🐝', llm: '🧠', extensions: '🧩', library: '📚', settings: '⚙️', search: '🔍', terminal: '💻', preview: '👁️' },
    fileIcons: { ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️', py: '🐍', css: '🎨', scss: '🎨', html: '🌐', json: '📋', md: '📝', txt: '📄', yaml: '⚙️', yml: '⚙️', toml: '⚙️', sh: '🐚', bat: '🪟', ps1: '🪟', rs: '🦀', go: '🐹', java: '☕', c: '🔧', cpp: '🔧', h: '📎', rb: '💎', php: '🐘', swift: '🦅', kt: '🟣', lua: '🌙', r: '📈', sql: '🗃️', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔒', env: '🔐', gitignore: '👁️', svg: '🖼️', png: '🖼️', jpg: '🖼️', gif: '🖼️', mp3: '🎵', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📰', csv: '📊' }
  },
  {
    name: 'Kawaii', preview: '🌸🎀✨🌙',
    icons: { explorer: '🌸', file: '🎀', folder: '🍰', folderOpen: '🧁', git: '🦋', music: '🌙', telemetry: '✨', colmeia: '🕊️', llm: '💖', extensions: '🍬', library: '💕', settings: '🔮', search: '🔍', terminal: '🌟', preview: '👀' },
    fileIcons: { ts: '💙', tsx: '💜', js: '🌻', jsx: '🌺', py: '🐾', css: '🎀', scss: '🎀', html: '🌷', json: '🍡', md: '📖', txt: '💌', yaml: '🍥', yml: '🍥', toml: '🍥', sh: '🐚', bat: '🏠', ps1: '🏠', rs: '🦊', go: '🐰', java: '🍵', c: '🔧', cpp: '🔧', h: '🌸', rb: '💎', php: '🐘', swift: '🦢', kt: '💜', lua: '🌙', r: '📊', sql: '🎁', vue: '💚', svelte: '🧡', docker: '🐋', lock: '🔒', env: '🎀', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎵', mp4: '🎬', pdf: '📕', zip: '🎁', xml: '📋', csv: '📊' }
  },
  {
    name: 'Minimal', preview: '▸ ◆ ○ ●',
    icons: { explorer: '▸', file: '◇', folder: '▸', folderOpen: '▾', git: '⎇', music: '♪', telemetry: '◈', colmeia: '⊞', llm: '◉', extensions: '◆', library: '≡', settings: '●', search: '○', terminal: '▪', preview: '◎' },
    fileIcons: { ts: '◆', tsx: '◈', js: '▣', jsx: '◈', py: '◉', css: '◐', scss: '◐', html: '◑', json: '◇', md: '▤', txt: '▭', yaml: '◌', yml: '◌', toml: '◌', sh: '▰', bat: '▰', ps1: '▰', rs: '◆', go: '◇', java: '◈', c: '▪', cpp: '▪', h: '▫', rb: '◆', php: '◉', swift: '◈', kt: '◆', lua: '◉', r: '◈', sql: '▤', vue: '◆', svelte: '◈', docker: '◉', lock: '●', env: '●', gitignore: '○', svg: '◎', png: '◎', jpg: '◎', gif: '◎', mp3: '♪', mp4: '▶', pdf: '▣', zip: '◼', xml: '◇', csv: '▤' }
  },
  {
    name: 'Neon', preview: '⚡💎🔥✧',
    icons: { explorer: '⚡', file: '💎', folder: '📦', folderOpen: '🔓', git: '🔥', music: '🎧', telemetry: '💫', colmeia: '⚛️', llm: '🤖', extensions: '🔌', library: '📖', settings: '🛠️', search: '🔎', terminal: '⌨️', preview: '🖥️' },
    fileIcons: { ts: '💠', tsx: '⚛️', js: '⚡', jsx: '⚛️', py: '🐍', css: '🎆', scss: '🎆', html: '🌐', json: '💎', md: '📘', txt: '📜', yaml: '🔩', yml: '🔩', toml: '🔩', sh: '💻', bat: '💻', ps1: '💻', rs: '🔥', go: '🐹', java: '☕', c: '⚙️', cpp: '⚙️', h: '📌', rb: '💎', php: '🔮', swift: '⚡', kt: '💜', lua: '🌙', r: '📊', sql: '🗄️', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔐', env: '🔑', gitignore: '👁️', svg: '🖼️', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎧', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📰', csv: '📊' }
  },
  {
    name: 'Nature', preview: '🌿🌻🍄🐝',
    icons: { explorer: '🌿', file: '🍃', folder: '🌳', folderOpen: '🌻', git: '🐝', music: '🐦', telemetry: '🌈', colmeia: '🐝', llm: '🦊', extensions: '🍄', library: '📗', settings: '🌰', search: '🔍', terminal: '🐚', preview: '🦉' },
    fileIcons: { ts: '🫐', tsx: '🌸', js: '🌻', jsx: '🌸', py: '🐍', css: '🌺', scss: '🌺', html: '🌿', json: '🍃', md: '🍀', txt: '🌾', yaml: '🌰', yml: '🌰', toml: '🌰', sh: '🐚', bat: '🪵', ps1: '🪵', rs: '🦀', go: '🐹', java: '☕', c: '🌲', cpp: '🌲', h: '🍂', rb: '💎', php: '🐘', swift: '🦅', kt: '🍇', lua: '🌙', r: '🍁', sql: '💧', vue: '🍀', svelte: '🌶️', docker: '🐋', lock: '🌰', env: '🌱', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '🦋', mp3: '🐦', mp4: '🎬', pdf: '📕', zip: '🎁', xml: '🌿', csv: '📊' }
  },
  {
    name: 'Retro', preview: '░ █ ■ ►',
    icons: { explorer: '█', file: '░', folder: '▓', folderOpen: '▒', git: '↻', music: '♫', telemetry: '▲', colmeia: '※', llm: '▼', extensions: '■', library: '▐', settings: '►', search: '◄', terminal: '▬', preview: '□' },
    fileIcons: { ts: '▓', tsx: '▓', js: '▒', jsx: '▒', py: '█', css: '░', scss: '░', html: '■', json: '□', md: '▤', txt: '░', yaml: '▪', yml: '▪', toml: '▪', sh: '▬', bat: '▬', ps1: '▬', rs: '▓', go: '▒', java: '█', c: '▪', cpp: '▪', h: '▫', rb: '▓', php: '▒', swift: '▓', kt: '▒', lua: '░', r: '▓', sql: '▤', vue: '▓', svelte: '▒', docker: '█', lock: '■', env: '■', gitignore: '□', svg: '▒', png: '░', jpg: '░', gif: '░', mp3: '♫', mp4: '►', pdf: '▓', zip: '█', xml: '□', csv: '▤' }
  },
  {
    name: 'Hacker', preview: '⟩ ⟨ λ Ω',
    icons: { explorer: '⟩', file: 'λ', folder: '⟨', folderOpen: '⟪', git: 'Δ', music: '~', telemetry: 'Ω', colmeia: '⌘', llm: 'Ψ', extensions: '⟐', library: '∞', settings: '⌥', search: '⊕', terminal: '⟩_', preview: '⊡' },
    fileIcons: { ts: 'τ', tsx: 'ρ', js: 'ζ', jsx: 'ρ', py: 'π', css: 'σ', scss: 'σ', html: 'η', json: 'δ', md: 'μ', txt: 'α', yaml: 'ψ', yml: 'ψ', toml: 'ψ', sh: 'β', bat: 'β', ps1: 'β', rs: 'Ω', go: 'γ', java: 'ξ', c: 'κ', cpp: 'κ', h: 'φ', rb: 'ρ', php: 'π', swift: 'σ', kt: 'κ', lua: 'λ', r: 'ρ', sql: 'θ', vue: 'ν', svelte: 'σ', docker: 'δ', lock: '⊗', env: '⊛', gitignore: '⊘', svg: 'ε', png: 'ε', jpg: 'ε', gif: 'ε', mp3: '~', mp4: '▶', pdf: 'π', zip: 'ζ', xml: 'χ', csv: 'κ' }
  },
  {
    name: 'Space', preview: '🚀🌍🛸⭐',
    icons: { explorer: '🚀', file: '⭐', folder: '🌍', folderOpen: '🌕', git: '🛸', music: '📡', telemetry: '🔭', colmeia: '🪐', llm: '🛸', extensions: '🛰️', library: '🌌', settings: '☄️', search: '🔭', terminal: '👾', preview: '🌠' },
    fileIcons: { ts: '🌌', tsx: '🔮', js: '⭐', jsx: '🔮', py: '🐍', css: '🪐', scss: '🪐', html: '🌍', json: '🌑', md: '📡', txt: '🌟', yaml: '☄️', yml: '☄️', toml: '☄️', sh: '👾', bat: '👾', ps1: '👾', rs: '🔥', go: '🛸', java: '☕', c: '⚙️', cpp: '⚙️', h: '🌙', rb: '💎', php: '🪐', swift: '⚡', kt: '🌌', lua: '🌙', r: '📊', sql: '🌑', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔐', env: '🔑', gitignore: '👁️', svg: '🖼️', png: '📸', jpg: '📸', gif: '✨', mp3: '📡', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📰', csv: '📊' }
  },
  {
    name: 'Steampunk', preview: '⚙️🔧🗝️🧭',
    icons: { explorer: '🗝️', file: '📜', folder: '🧳', folderOpen: '📦', git: '⚙️', music: '🎺', telemetry: '🧭', colmeia: '⚗️', llm: '🔮', extensions: '🔧', library: '📕', settings: '🔩', search: '🔍', terminal: '⌨️', preview: '🔮' },
    fileIcons: { ts: '⚙️', tsx: '🔩', js: '🗝️', jsx: '🔩', py: '⚗️', css: '🖌️', scss: '🖌️', html: '📜', json: '🧭', md: '📋', txt: '📃', yaml: '🔧', yml: '🔧', toml: '🔧', sh: '🔨', bat: '🔨', ps1: '🔨', rs: '⚙️', go: '🗝️', java: '☕', c: '🔩', cpp: '🔩', h: '📎', rb: '💎', php: '⚗️', swift: '⚡', kt: '⚙️', lua: '🌙', r: '📊', sql: '🗄️', vue: '💚', svelte: '🔶', docker: '📦', lock: '🔒', env: '🗝️', gitignore: '👁️', svg: '🖼️', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎺', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📰', csv: '📊' }
  },
  {
    name: 'Candy', preview: '🍭🍩🧁🎂',
    icons: { explorer: '🍭', file: '🍬', folder: '🍩', folderOpen: '🎂', git: '🧁', music: '🎶', telemetry: '🍫', colmeia: '🍯', llm: '🧁', extensions: '🍪', library: '🍰', settings: '🎀', search: '🔍', terminal: '🍦', preview: '🎪' },
    fileIcons: { ts: '🫐', tsx: '🍇', js: '🍋', jsx: '🍇', py: '🍏', css: '🍬', scss: '🍬', html: '🍊', json: '🍡', md: '🍫', txt: '🍪', yaml: '🍥', yml: '🍥', toml: '🍥', sh: '🍩', bat: '🍩', ps1: '🍩', rs: '🍎', go: '🍉', java: '☕', c: '🍒', cpp: '🍒', h: '🍰', rb: '💎', php: '🍑', swift: '🍌', kt: '🍇', lua: '🌙', r: '📊', sql: '🍯', vue: '🍀', svelte: '🍊', docker: '🐳', lock: '🔒', env: '🎀', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎶', mp4: '🎬', pdf: '📕', zip: '🎁', xml: '📋', csv: '📊' }
  },
  {
    name: 'Ocean', preview: '🐠🐚🦈🪸',
    icons: { explorer: '🐠', file: '🐚', folder: '🪸', folderOpen: '🌊', git: '🦈', music: '🐬', telemetry: '🧭', colmeia: '🐙', llm: '🐋', extensions: '⚓', library: '📘', settings: '🪝', search: '🔍', terminal: '🦞', preview: '🌅' },
    fileIcons: { ts: '🐟', tsx: '🐡', js: '⭐', jsx: '🐡', py: '🐍', css: '🐚', scss: '🐚', html: '🌊', json: '🧊', md: '🗺️', txt: '📜', yaml: '⚓', yml: '⚓', toml: '⚓', sh: '🦞', bat: '🦞', ps1: '🦞', rs: '🦀', go: '🐬', java: '☕', c: '🪝', cpp: '🪝', h: '🐚', rb: '💎', php: '🐙', swift: '🦈', kt: '🐟', lua: '🌙', r: '📊', sql: '💧', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔒', env: '🏝️', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '🌊', mp3: '🐬', mp4: '🎬', pdf: '📕', zip: '📦', xml: '🗺️', csv: '📊' }
  },
  {
    name: 'Gothic', preview: '🦇🏚️⚰️🕯️',
    icons: { explorer: '🦇', file: '📜', folder: '⚰️', folderOpen: '🏚️', git: '🩸', music: '🎻', telemetry: '🕯️', colmeia: '🕸️', llm: '💀', extensions: '⚗️', library: '📓', settings: '🔮', search: '👁️', terminal: '⛓️', preview: '🪞' },
    fileIcons: { ts: '🗡️', tsx: '⚔️', js: '🕯️', jsx: '⚔️', py: '🐍', css: '🩸', scss: '🩸', html: '📜', json: '🔮', md: '📓', txt: '📜', yaml: '⛓️', yml: '⛓️', toml: '⛓️', sh: '🪦', bat: '🪦', ps1: '🪦', rs: '🗡️', go: '🦇', java: '☕', c: '⚙️', cpp: '⚙️', h: '🕸️', rb: '💎', php: '💀', swift: '⚡', kt: '🗡️', lua: '🌑', r: '📊', sql: '⚰️', vue: '💚', svelte: '🔥', docker: '🐳', lock: '🔒', env: '🕯️', gitignore: '👁️', svg: '🖼️', png: '🖼️', jpg: '📸', gif: '🦇', mp3: '🎻', mp4: '🎬', pdf: '📕', zip: '⚰️', xml: '📜', csv: '📊' }
  },
  {
    name: 'Pixel', preview: '👾🕹️🎮💾',
    icons: { explorer: '🕹️', file: '💾', folder: '📂', folderOpen: '📁', git: '🔄', music: '🎵', telemetry: '📟', colmeia: '🐝', llm: '🤖', extensions: '🧩', library: '💿', settings: '⚙️', search: '🔍', terminal: '👾', preview: '🖥️' },
    fileIcons: { ts: '🔵', tsx: '🟣', js: '🟡', jsx: '🟣', py: '🟢', css: '🔴', scss: '🔴', html: '🟠', json: '⬜', md: '📝', txt: '⬜', yaml: '⚙️', yml: '⚙️', toml: '⚙️', sh: '🟫', bat: '🟫', ps1: '🟫', rs: '🟤', go: '🔵', java: '☕', c: '⬛', cpp: '⬛', h: '⬜', rb: '🟥', php: '🟪', swift: '🟧', kt: '🟣', lua: '🌙', r: '📊', sql: '💿', vue: '🟩', svelte: '🟧', docker: '🐳', lock: '🔒', env: '🟨', gitignore: '👁️', svg: '🎨', png: '🖼️', jpg: '📸', gif: '🕹️', mp3: '🎵', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📋', csv: '📊' }
  },
  {
    name: 'Japanese', preview: '⛩️🎌🗾🎎',
    icons: { explorer: '⛩️', file: '📄', folder: '🗂️', folderOpen: '📂', git: '🔄', music: '🎌', telemetry: '🗾', colmeia: '🐝', llm: '🧠', extensions: '🎎', library: '📖', settings: '☯️', search: '🔍', terminal: '💻', preview: '🏯' },
    fileIcons: { ts: '🔷', tsx: '🔮', js: '🌟', jsx: '🔮', py: '🐲', css: '🎋', scss: '🎋', html: '🏯', json: '🎐', md: '📖', txt: '📃', yaml: '☯️', yml: '☯️', toml: '☯️', sh: '⚔️', bat: '⚔️', ps1: '⚔️', rs: '🗡️', go: '🎏', java: '🍵', c: '⚙️', cpp: '⚙️', h: '🎐', rb: '💎', php: '🐉', swift: '🦅', kt: '🔮', lua: '🌙', r: '📊', sql: '🏮', vue: '🎋', svelte: '🔶', docker: '🐳', lock: '🔒', env: '🎌', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎌', mp4: '🎬', pdf: '📕', zip: '🎁', xml: '📜', csv: '📊' }
  },
  {
    name: 'Scientific', preview: '🔬🧪🧬🔭',
    icons: { explorer: '🔬', file: '🧪', folder: '📁', folderOpen: '📂', git: '🔄', music: '📻', telemetry: '📡', colmeia: '🧬', llm: '🧠', extensions: '⚗️', library: '📚', settings: '🔧', search: '🔍', terminal: '💻', preview: '🔭' },
    fileIcons: { ts: '🧫', tsx: '⚛️', js: '⚡', jsx: '⚛️', py: '🧪', css: '🌡️', scss: '🌡️', html: '🧬', json: '🔬', md: '📝', txt: '📄', yaml: '⚙️', yml: '⚙️', toml: '⚙️', sh: '💻', bat: '💻', ps1: '💻', rs: '⚙️', go: '🧪', java: '☕', c: '🔩', cpp: '🔩', h: '📎', rb: '💎', php: '🧫', swift: '⚡', kt: '🧫', lua: '🌙', r: '📊', sql: '🗄️', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔒', env: '🧫', gitignore: '🙈', svg: '📐', png: '🖼️', jpg: '📸', gif: '✨', mp3: '📻', mp4: '🎬', pdf: '📕', zip: '📦', xml: '📋', csv: '📊' }
  },
  {
    name: 'Zodiac', preview: '♈♎✨🌙',
    icons: { explorer: '🌟', file: '✨', folder: '🌙', folderOpen: '🌕', git: '♊', music: '♎', telemetry: '🔮', colmeia: '♏', llm: '♒', extensions: '♐', library: '📖', settings: '☯️', search: '🔍', terminal: '♑', preview: '🔭' },
    fileIcons: { ts: '♒', tsx: '♓', js: '♌', jsx: '♓', py: '♏', css: '♎', scss: '♎', html: '♈', json: '♊', md: '📖', txt: '✨', yaml: '♑', yml: '♑', toml: '♑', sh: '♐', bat: '♐', ps1: '♐', rs: '♈', go: '♊', java: '☕', c: '♉', cpp: '♉', h: '♋', rb: '💎', php: '♍', swift: '⚡', kt: '♒', lua: '🌙', r: '📊', sql: '♑', vue: '♎', svelte: '♌', docker: '🐳', lock: '🔒', env: '🌙', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '✨', mp3: '♎', mp4: '🎬', pdf: '📕', zip: '📦', xml: '♊', csv: '📊' }
  },
  {
    name: 'Cyberpunk', preview: '🤖⚡🔋💽',
    icons: { explorer: '💽', file: '💿', folder: '🗃️', folderOpen: '📡', git: '🔄', music: '🎛️', telemetry: '📊', colmeia: '🤖', llm: '🧠', extensions: '🔌', library: '💽', settings: '🛠️', search: '🔍', terminal: '⌨️', preview: '📺' },
    fileIcons: { ts: '💠', tsx: '🔮', js: '⚡', jsx: '🔮', py: '🐍', css: '🎛️', scss: '🎛️', html: '📡', json: '💿', md: '📝', txt: '📄', yaml: '🔧', yml: '🔧', toml: '🔧', sh: '⌨️', bat: '⌨️', ps1: '⌨️', rs: '⚙️', go: '🔋', java: '☕', c: '🔩', cpp: '🔩', h: '📎', rb: '💎', php: '🔌', swift: '⚡', kt: '💠', lua: '🌙', r: '📊', sql: '💾', vue: '💚', svelte: '🔶', docker: '🐳', lock: '🔐', env: '🔑', gitignore: '👁️', svg: '🖼️', png: '🖼️', jpg: '📸', gif: '✨', mp3: '🎛️', mp4: '📺', pdf: '📕', zip: '📦', xml: '📡', csv: '📊' }
  },
  {
    name: 'Garden', preview: '🌻🌹🌵🍓',
    icons: { explorer: '🌻', file: '🌹', folder: '🌵', folderOpen: '🌺', git: '🍄', music: '🐦', telemetry: '🌈', colmeia: '🐝', llm: '🦋', extensions: '🌱', library: '📗', settings: '🌰', search: '🔍', terminal: '🪴', preview: '🌅' },
    fileIcons: { ts: '🌻', tsx: '🌸', js: '🌼', jsx: '🌸', py: '🐛', css: '🌹', scss: '🌹', html: '🌺', json: '🌱', md: '🍀', txt: '🌾', yaml: '🌰', yml: '🌰', toml: '🌰', sh: '🪴', bat: '🪴', ps1: '🪴', rs: '🌵', go: '🪻', java: '☕', c: '🥀', cpp: '🥀', h: '🌿', rb: '💐', php: '🍆', swift: '🦅', kt: '🪻', lua: '🌙', r: '📊', sql: '💧', vue: '🍀', svelte: '🌶️', docker: '🐳', lock: '🔒', env: '🌱', gitignore: '🙈', svg: '🎨', png: '🖼️', jpg: '📸', gif: '🦋', mp3: '🐦', mp4: '🎬', pdf: '📕', zip: '🎁', xml: '🌿', csv: '📊' }
  },
];

let currentPack = 0;
let savedColors: Record<string, string> = {};
let retro8bit = localStorage.getItem('lumina_retro_8bit') === 'true';

// ─── Init ───────────────────────────────────────────────────────────
export function initThemeEngine(): void {
  // Load saved colors
  try {
    const saved = localStorage.getItem('lumina_theme_colors');
    if (saved) {
      savedColors = JSON.parse(saved);
      applyColors(savedColors);
    }
  } catch (err) { console.warn('[Theme] Failed to load saved theme colors:', err); }

  // Load saved icon pack
  const packIdx = parseInt(localStorage.getItem('lumina_icon_pack') || '0');
  currentPack = isNaN(packIdx) ? 0 : Math.min(packIdx, ICON_PACKS.length - 1);
  applyIconPack(currentPack);

  // Apply effects if saved
  apply8bit(retro8bit);

  // Inject theme section when settings panel toggles
  PubSub.on('panel:toggle', (id) => {
    if (id === 'settings') setTimeout(injectThemeSection, 100);
  });
  // Re-render when language changes
  PubSub.on('lang:changed', () => setTimeout(injectThemeSection, 100));
  // Also inject on first load
  setTimeout(injectThemeSection, 500);
}

// ─── Apply Colors (live via CSS vars) ───────────────────────────────
function applyColors(colors: Record<string, string>): void {
  const root = document.documentElement;
  for (const [key, val] of Object.entries(colors)) {
    root.style.setProperty(key, val);
    if (key === '--bg-dark') {
      root.style.setProperty('--bg-base', val);
      root.style.setProperty('--bg-surface', adj(val, 15));
      root.style.setProperty('--bg-overlay', adj(val, 25));
      root.style.setProperty('--bg-mantle', adj(val, -5));
      root.style.setProperty('--bg-crust', adj(val, -10));
    }
    if (key === '--accent') {
      root.style.setProperty('--projecty-blue', val);
      root.style.setProperty('--text-accent', val);
      root.style.setProperty('--border-active', val);
      root.style.setProperty('--accent-secondary', adj(val, 30));
      root.style.setProperty('--bg-hover', rgba(val, 0.06));
      root.style.setProperty('--bg-active', rgba(val, 0.12));
      root.style.setProperty('--lumen-glow', '0 0 15px ' + rgba(val, 0.4));
      root.style.setProperty('--lumen-bg', rgba(val, 0.05));
    }
    if (key === '--text') {
      root.style.setProperty('--text-secondary', adj(val, -25));
      root.style.setProperty('--text-muted', adj(val, -50));
    }
  }
}

function resetColors(): void {
  const root = document.documentElement;
  const all = [...Object.keys(DEFAULTS),
    '--bg-base','--bg-surface','--bg-overlay','--bg-mantle','--bg-crust',
    '--projecty-blue','--text-accent','--border-active','--accent-secondary',
    '--bg-hover','--bg-active','--lumen-glow','--lumen-bg','--text-secondary','--text-muted'];
  for (const key of all) root.style.removeProperty(key);
  savedColors = {};
  localStorage.removeItem('lumina_theme_colors');
  injectThemeSection();
}

// ─── Visual Effects (mutually exclusive) ────────────────────────────
function clearAllEffects(): void {
  retro8bit = false;
  localStorage.setItem('lumina_retro_8bit', 'false');
  document.body.classList.remove('retro-8bit');
}

function apply8bit(on: boolean): void {
  if (on) clearAllEffects();
  retro8bit = on;
  localStorage.setItem('lumina_retro_8bit', String(on));
  if (on) document.body.classList.add('retro-8bit');
  else document.body.classList.remove('retro-8bit');
}

// ─── Apply Icon Pack ────────────────────────────────────────────────
function applyIconPack(idx: number): void {
  currentPack = idx;
  localStorage.setItem('lumina_icon_pack', String(idx));
  const pack = ICON_PACKS[idx];

  const mapping: Record<string, string> = {
    explorer: 'explorer', telemetry: 'telemetry', colmeia: 'swarm',
    llm: 'llm', extensions: 'extensions', library: 'library',
    git: 'git', music: 'music', settings: 'settings'
  };
  for (const [iconKey, panelId] of Object.entries(mapping)) {
    const btn = document.querySelector('.activity-btn[data-panel="' + panelId + '"]');
    if (btn && pack.icons[iconKey]) btn.textContent = pack.icons[iconKey];
  }

  PubSub.emit('theme:icons-changed', pack.icons);
}

export function getIcon(name: string): string {
  return ICON_PACKS[currentPack]?.icons[name] || ICON_PACKS[0].icons[name] || '';
}

export function getFileExtIcon(filename: string): string {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  // Special names
  const nameL = filename.toLowerCase();
  if (nameL === 'dockerfile' || nameL.startsWith('dockerfile.')) return ICON_PACKS[currentPack]?.fileIcons['docker'] || '🐳';
  if (nameL === '.gitignore') return ICON_PACKS[currentPack]?.fileIcons['gitignore'] || '👁️';
  if (nameL === '.env' || nameL.startsWith('.env.')) return ICON_PACKS[currentPack]?.fileIcons['env'] || '🔐';
  if (nameL.endsWith('.lock') || nameL === 'package-lock.json' || nameL === 'yarn.lock') return ICON_PACKS[currentPack]?.fileIcons['lock'] || '🔒';
  
  const pack = ICON_PACKS[currentPack] || ICON_PACKS[0];
  return pack.fileIcons[ext] || pack.icons['file'] || '📄';
}

// ─── Inject Theme Section Into Settings Panel ───────────────────────
function injectThemeSection(): void {
  const wrapper = document.querySelector('#projecty-panel-settings .settings-content-wrapper');
  if (!wrapper) return;

  // Remove old theme section if exists
  const old = document.getElementById('theme-engine-section');
  if (old) old.remove();

  // Build color pickers HTML
  const colorRows = Object.entries(DEFAULTS).map(([key, def]) => {
    const current = savedColors[key] || getComputed(key) || def;
    const hex = toHex(current);
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">'
      + '<input type="color" data-var="' + key + '" value="' + hex + '" style="width:26px;height:26px;border:none;border-radius:4px;cursor:pointer;background:none;padding:0;" />'
      + '<span style="flex:1;font-size:10px;color:var(--text);">' + (COLOR_LABELS[key] || key) + '</span>'
      + '<input type="text" data-hex="' + key + '" value="' + hex + '" style="width:62px;padding:2px 4px;background:var(--bg-overlay);border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:9px;font-family:monospace;text-align:center;outline:none;" />'
      + '</div>';
  }).join('');

  const presetsHtml = PRESETS.map((pr, i) =>
    '<button class="te-preset" data-pi="' + i + '" style="padding:3px 7px;border:none;border-radius:4px;background:var(--bg-overlay);color:var(--text);cursor:pointer;font-size:9px;border:1px solid var(--border);transition:all 0.2s;">'
    + pr.emoji + ' ' + pr.name + '</button>'
  ).join('');

  const packHtml = ICON_PACKS.map((pk, i) =>
    '<button class="te-pack" data-pack="' + i + '" style="display:flex;align-items:center;gap:6px;width:100%;padding:5px 8px;border:none;border-radius:4px;cursor:pointer;font-size:10px;margin-bottom:3px;'
    + 'background:' + (i === currentPack ? 'rgba(255,255,255,0.07)' : 'transparent') + ';'
    + 'border:1px solid ' + (i === currentPack ? 'var(--accent)' : 'var(--border)') + ';'
    + 'color:var(--text);transition:all 0.2s;">'
    + '<span style="font-size:12px;min-width:44px;">' + pk.preview + '</span>'
    + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + pk.name + '</span>'
    + (i === currentPack ? '<span style="color:var(--accent);font-size:10px;font-weight:bold;">✓</span>' : '')
    + '</button>'
  ).join('');

  // Create section
  const section = document.createElement('div');
  section.id = 'theme-engine-section';
  section.innerHTML =
    // Color theme card
    '<div class="settings-card" style="border-left:3px solid var(--accent-yellow);">'
    + '<div class="settings-card-header"><h3>🎨 ' + t('settings.color_theme') + '</h3></div>'
    + '<div class="settings-card-body">'
    + colorRows
    + '<div style="display:flex;gap:4px;margin-top:8px;margin-bottom:6px;flex-wrap:wrap;">' + presetsHtml + '</div>'
    + '<button id="te-reset" style="width:100%;padding:4px;border:none;border-radius:3px;background:rgba(255,77,109,0.08);color:#ff4d6d;cursor:pointer;font-size:9px;">↺ ' + t('settings.reset_colors') + '</button>'
    + '</div></div>'

    // Icon pack card
    + '<div class="settings-card" style="border-left:3px solid var(--accent-mauve, #b088ff);">'
    + '<div class="settings-card-header"><h3>✨ ' + t('settings.icon_packs') + '</h3></div>'
    + '<div class="settings-card-body">'
    + packHtml
    + '</div></div>'

    + '<style>'
    + '.te-preset:hover{border-color:var(--accent)!important;transform:scale(1.03)}'
    + '.te-pack:hover{background:rgba(255,255,255,0.04)!important}'
    + '</style>'

    // Visual effects card
    + '<div class="settings-card" style="border-left:3px solid var(--accent-peach, #ffb088);">'
    + '<div class="settings-card-header"><h3>🕹️ ' + t('settings.visual_effects') + '</h3></div>'
    + '<div class="settings-card-body" style="display:flex;flex-direction:column;gap:6px;">'

    // 8-bit Retro
    + '<button id="te-8bit" style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 10px;border:none;border-radius:4px;cursor:pointer;font-size:10px;'
    + 'background:' + (retro8bit ? 'var(--accent)' : 'var(--bg-overlay)') + ';'
    + 'color:' + (retro8bit ? '#000' : 'var(--text)') + ';'
    + 'border:1px solid ' + (retro8bit ? 'var(--accent)' : 'var(--border)') + ';'
    + 'font-weight:' + (retro8bit ? 'bold' : 'normal') + ';transition:all 0.2s;">'
    + '<span style="font-size:14px;">👾</span>'
    + '<span style="flex:1;text-align:left;">' + t('settings.8bit_retro') + '</span>'
    + '<span>' + (retro8bit ? '✓ ON' : 'OFF') + '</span>'
    + '</button>'
    + '<p style="font-size:8px;color:var(--text-muted);margin:0 0 0 26px;">Scanlines CRT, pixel glitch, VHS color shift</p>'

    + '</div></div>'

    // Language selector card
    + '<div class="settings-card" style="border-left:3px solid var(--accent-green);">'
    + '<div class="settings-card-header"><h3>🌐 Idioma / Language</h3></div>'
    + '<div class="settings-card-body" style="display:flex;gap:4px;flex-wrap:wrap;">'
    + LANGUAGES.map(l =>
      '<button class="te-lang" data-lang="' + l.code + '" style="padding:4px 8px;border:none;border-radius:4px;cursor:pointer;font-size:10px;transition:all 0.2s;'
      + 'background:' + (l.code === getLang() ? 'var(--accent)' : 'var(--bg-overlay)') + ';'
      + 'color:' + (l.code === getLang() ? '#000' : 'var(--text)') + ';'
      + 'border:1px solid ' + (l.code === getLang() ? 'var(--accent)' : 'var(--border)') + ';'
      + 'font-weight:' + (l.code === getLang() ? 'bold' : 'normal') + ';">'
      + l.flag + ' ' + l.name + '</button>'
    ).join('')
    + '</div></div>';

  // Insert before the Save button
  const saveBtn = wrapper.querySelector('.settings-save-btn');
  if (saveBtn) {
    wrapper.insertBefore(section, saveBtn);
  } else {
    wrapper.appendChild(section);
  }

  // ─── Wire Events ──────
  section.querySelectorAll('input[type="color"]').forEach(input => {
    (input as HTMLInputElement).addEventListener('input', (e) => {
      const key = (e.target as HTMLElement).dataset.var || '';
      const val = (e.target as HTMLInputElement).value;
      savedColors[key] = val;
      applyColors(savedColors);
      localStorage.setItem('lumina_theme_colors', JSON.stringify(savedColors));
      const hexField = section.querySelector('input[data-hex="' + key + '"]') as HTMLInputElement;
      if (hexField) hexField.value = val;
    });
  });

  section.querySelectorAll('input[data-hex]').forEach(input => {
    (input as HTMLInputElement).addEventListener('change', (e) => {
      const key = (e.target as HTMLElement).dataset.hex || '';
      let val = (e.target as HTMLInputElement).value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        savedColors[key] = val;
        applyColors(savedColors);
        localStorage.setItem('lumina_theme_colors', JSON.stringify(savedColors));
        const picker = section.querySelector('input[data-var="' + key + '"]') as HTMLInputElement;
        if (picker) picker.value = val;
      }
    });
  });

  section.querySelectorAll('.te-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.pi || '0');
      savedColors = { ...PRESETS[idx].colors };
      applyColors(savedColors);
      localStorage.setItem('lumina_theme_colors', JSON.stringify(savedColors));
      injectThemeSection();
    });
  });

  section.querySelector('#te-reset')?.addEventListener('click', () => resetColors());

  section.querySelectorAll('.te-pack').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt((btn as HTMLElement).dataset.pack || '0');
      applyIconPack(idx);
      injectThemeSection();
    });
  });

  // Effect toggles
  section.querySelector('#te-8bit')?.addEventListener('click', () => {
    apply8bit(!retro8bit);
    injectThemeSection();
  });

  // Language selector
  section.querySelectorAll('.te-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = (btn as HTMLElement).dataset.lang || 'pt-BR';
      setLang(code);
      injectThemeSection();
    });
  });
}

// ─── Color Helpers ──────────────────────────────────────────────────
function adj(hex: string, amount: number): string {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return '#' + hex;
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function rgba(hex: string, alpha: number): string {
  hex = hex.replace('#', '');
  if (hex.length !== 6) return 'rgba(0,0,0,' + alpha + ')';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

function toHex(color: string): string {
  if (color.startsWith('#') && color.length === 7) return color;
  if (color.startsWith('#') && color.length === 4) {
    return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  const m = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  return '#000000';
}

function getComputed(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
