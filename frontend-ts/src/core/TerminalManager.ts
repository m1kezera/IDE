/**
 * Project Y — Terminal Manager (v5.0 — PTY Real)
 * Bidirectional xterm.js ↔ WebSocket ↔ pywinpty tunnel.
 * Sends resize payload on connect to wake the PowerShell prompt.
 * The terminal DOM node is NEVER destroyed.
 */

import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

const isElectron = window.location.protocol === 'file:';
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_HOST = isElectron ? '127.0.0.1:8001' : window.location.host;
const WS_ORIGIN = `${WS_PROTOCOL}//${WS_HOST}`;

export class TerminalManager {
  private term: Terminal;
  private fitAddon: FitAddon;
  private ws: WebSocket | null = null;
  public container: HTMLDivElement;
  public parentId: string;
  public portId: string;
  public shell: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 16000;
  private mounted = false;

  constructor(parentId: string, portId: string, shell: string = 'powershell.exe') {
    this.parentId = parentId;
    this.portId = portId;
    this.shell = shell;

    const parent = document.getElementById(parentId);
    if (!parent) throw new Error(`[TerminalManager] Parent #${parentId} not found in DOM`);

    this.container = document.createElement('div');
    this.container.id = `term-${portId}`;
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.display = 'none'; // Hidden by default
    parent.appendChild(this.container);

    this.term = new Terminal({
      theme: {
        background: 'transparent',
        foreground: '#d4d4d4',
        cursor: '#00f2fe',
        selectionBackground: '#264f7844',
        black: '#1e1e2e',
        red: '#f38ba8',
        green: '#a6e3a1',
        yellow: '#f9e2af',
        blue: '#89b4fa',
        magenta: '#cba6f7',
        cyan: '#94e2d5',
        white: '#cdd6f4',
      },
      fontFamily: "'JetBrains Mono', Consolas, monospace",
      fontSize: 13,
      cursorBlink: true,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
  }

  mount(): void {
    if (this.mounted) return;
    this.term.open(this.container);
    this.mounted = true;

    requestAnimationFrame(() => this.fitAddon.fit());

    // ResizeObserver: fit terminal AND send new dimensions to backend
    const ro = new ResizeObserver(() => {
      try {
        this.fitAddon.fit();
        this.sendResize();
      } catch { /* ignore */ }
    });
    ro.observe(this.container);

    // Bidirectional: user keystrokes → WebSocket → PTY
    this.term.onData((data: string) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(data);
      }
    });

    this.connect();
  }

  /** Send current terminal dimensions to the backend PTY */
  private sendResize(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const dims = this.fitAddon.proposeDimensions();
      if (dims) {
        this.ws.send(JSON.stringify({
          type: 'resize',
          cols: dims.cols,
          rows: dims.rows,
        }));
      }
    }
  }

  private connect(): void {
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
    }

    const wsUrl = `${WS_ORIGIN}/api/ws/terminal/${this.portId}?shell=${encodeURIComponent(this.shell)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      // Send initial resize to wake the PowerShell prompt
      requestAnimationFrame(() => {
        this.fitAddon.fit();
        this.sendResize();
      });
    };

    // Bidirectional: PTY output → xterm display
    this.ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        this.term.write(event.data);
      } else if (event.data instanceof Blob) {
        // Handle binary data from PTY
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            this.term.write(reader.result);
          }
        };
        reader.readAsText(event.data);
      }
    };

    this.ws.onclose = () => {
      this.term.writeln('\x1B[1;3;31m Terminal Disconnected — reconnecting...\x1B[0m');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose fires after onerror
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }

  show(): void {
    this.container.style.display = 'block';
    if (this.mounted) {
      this.term.focus();
      requestAnimationFrame(() => this.fitAddon.fit());
    }
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  dispose(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) { try { this.ws.close(); } catch { /* ignore */ } }
    this.term.dispose();
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
