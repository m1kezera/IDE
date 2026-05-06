const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

const IS_PACKAGED = app.isPackaged;

// ─── Persistent File Logger ────────────────────────────────────────
// Writes all logs to %APPDATA%/lumina-ide/logs/electron.log
const LOG_DIR = path.join(app.getPath('userData'), 'logs');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
const LOG_FILE = path.join(LOG_DIR, 'electron.log');
// Clear on each boot (fresh log per session)
try { fs.writeFileSync(LOG_FILE, `--- LUMINA IDE ELECTRON LOG ---\nBoot: ${new Date().toISOString()}\nPackaged: ${IS_PACKAGED}\n\n`); } catch {}

function logToFile(level, ...args) {
    const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
    const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
    try { fs.appendFileSync(LOG_FILE, line); } catch {}
    if (level === 'ERROR') {
        console.error(...args);
    } else {
        console.log(...args);
    }
}

const log = {
    info: (...args) => logToFile('INFO', ...args),
    error: (...args) => logToFile('ERROR', ...args),
    warn: (...args) => logToFile('WARN', ...args),
};

// ─── Paths ──────────────────────────────────────────────────────────

function getBackendCommand() {
    if (IS_PACKAGED) {
        // [PRD v2.4.5] Protection against asar curse: Use app.asar.unpacked
        const exePath = path.join(process.resourcesPath, 'LuminaEngine', 'LuminaEngine.exe');
        const cwdPath = path.join(process.resourcesPath, 'LuminaEngine');
        
        // [PRD v2.4.5] Check for Workspace injection from CLI (e.g. Lumina.exe "C:\Path\To\Project")
        const workspaceFromArg = process.argv.filter(a => fs.existsSync(a) && fs.lstatSync(a).isDirectory())[0];
        
        return { 
            command: exePath, 
            args: [], 
            cwd: cwdPath,
            env: workspaceFromArg ? { LUMINA_WORKSPACE_PATH: workspaceFromArg } : {}
        };
    }
    // Development: use the venv Python
    const pythonExe = path.resolve(__dirname, '../backend/.venv/Scripts/python.exe');
    return {
        command: pythonExe,
        args: ['-m', 'uvicorn', 'main:app', '--port', '8001'],
        cwd: path.resolve(__dirname, '../backend'),
        env: {}
    };
}

function getFrontendPath() {
    // Both dev and packaged (asar) use relative path from electron/main.js
    return path.join(__dirname, '../frontend-ts/dist/index.html');
}

// ─── Backend Lifecycle ──────────────────────────────────────────────

function startBackend() {
    const { command, args, cwd, env } = getBackendCommand();

    log.info(`[Electron] Starting backend: ${command} ${args.join(' ')}`);
    log.info(`[Electron] CWD: ${cwd}`);

    backendProcess = spawn(command, args, {
        cwd,
        shell: false,
        windowsHide: true,
        env: { ...process.env, ...env, PYTHONIOENCODING: 'utf-8' },
    });

    backendProcess.stdout.on('data', (data) => {
        log.info(`[Backend]: ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
        log.error(`[Backend Error]: ${data.toString().trim()}`);
    });

    backendProcess.on('close', (code) => {
        log.info(`[Electron] Backend process exited with code ${code}`);
    });

    backendProcess.on('error', (err) => {
        log.error(`[Electron] Failed to start backend: ${err.message}`);
    });
}

function killBackend() {
    if (!backendProcess) return;
    try {
        // [PRD v2.4.5] Operation "Zombie Killer" (Strict Protocol)
        // Use taskkill /T /F to ensure ALL subprocesses (PTY, Mesh, etc) are killed
        if (process.platform === 'win32') {
            log.info(`[Electron] Executing Zombie Killer protocol for PID ${backendProcess.pid}...`);
            spawn('taskkill', ['/PID', backendProcess.pid.toString(), '/T', '/F'], { 
                stdio: 'ignore', 
                windowsHide: true,
                detached: true // Allow it to run independently
            }).unref();
            
            // Secondary fallback for the specifically named process
            spawn('taskkill', ['/IM', 'LuminaEngine.exe', '/F', '/T'], { stdio: 'ignore', windowsHide: true }).unref();
        } else {
            backendProcess.kill('SIGTERM');
        }
    } catch (e) {
        log.error('[Electron] Error executing Zombie Killer protocol:', e.message);
    }
    backendProcess = null;
}

// ─── Wait for Backend Ready ─────────────────────────────────────────

async function waitForBackend(maxRetries = 60, intervalMs = 1000) {
    const http = require('http');
    for (let i = 0; i < maxRetries; i++) {
        try {
            log.info(`[Electron] Handshake attempt ${i + 1}/${maxRetries} → http://127.0.0.1:8001/api/health`);
            await new Promise((resolve, reject) => {
                const req = http.get('http://127.0.0.1:8001/api/health', (res) => {
                    resolve(res.statusCode);
                });
                req.on('error', reject);
                req.setTimeout(800, () => { req.destroy(); reject(new Error('timeout')); });
            });
            log.info(`[Electron] ✅ Backend is ready (attempt ${i + 1})`);
            return true;
        } catch (err) {
            log.info(`[Electron] ⏳ Backend not ready (attempt ${i + 1}): ${err.message || 'unknown'}`);
            await new Promise(r => setTimeout(r, intervalMs));
        }
    }
    log.error('[Electron] ❌ Backend did not start in time after 60 attempts!');
    return false;
}

// ─── Window ─────────────────────────────────────────────────────────

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'Lumina IDE',
        frame: false,
        icon: IS_PACKAGED
            ? path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'icon.png')
            : path.join(__dirname, 'icon.png'),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: IS_PACKAGED ? false : true,
        },
    });

    // Frameless window — menu bar is not needed
    mainWindow.setMenuBarVisibility(false);

    // Allow window.open() from renderer to create real OS windows (for panel undock)
    mainWindow.webContents.setWindowOpenHandler(({ url, features }) => {
        return {
            action: 'allow',
            overrideBrowserWindowOptions: {
                frame: true,
                autoHideMenuBar: true,
                backgroundColor: '#0d0d15',
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: IS_PACKAGED ? false : true,
                }
            }
        };
    });

    // Load the built frontend
    const fPath = getFrontendPath();
    log.info(`[Electron] Loading Frontend from: ${fPath}`);
    mainWindow.loadFile(fPath).catch(err => {
        log.error(`[Electron] Failed to load index.html: ${err.message}`);
    });

    // Show window once content is painted (avoids white flash)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // DevTools in dev mode only
    if (!IS_PACKAGED) {
        mainWindow.webContents.openDevTools();
    }

    // Block DevTools in production, but allow all IDE shortcuts through
    // Also forward critical shortcuts via IPC to bypass Chromium swallowing
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // ONLY block DevTools shortcuts: Ctrl+Shift+I, Ctrl+Shift+J, F12
        const isDevToolsShortcut = (
            (input.control && input.shift && (input.key === 'I' || input.key === 'i')) ||
            (input.control && input.shift && (input.key === 'J' || input.key === 'j')) ||
            input.key === 'F12'
        );
        if (isDevToolsShortcut) {
            event.preventDefault();
            return;
        }

        // [FIX] Forward IDE shortcuts via IPC — Chromium may swallow Ctrl+Shift combos
        if (input.control && input.shift && input.type === 'keyDown') {
            const k = (input.key || '').toUpperCase();
            if (k === 'X') {
                mainWindow.webContents.send('shortcut', 'extensions');
            }
        }
        if (input.control && !input.shift && input.type === 'keyDown') {
            const k = (input.key || '').toUpperCase();
            if (k === 'B') {
                mainWindow.webContents.send('shortcut', 'toggle-sidebar');
            }
        }
    });
    // Force close if somehow opened
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });

    // Pipe renderer console to electron.log (all modes)
    mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
        const prefix = _level >= 2 ? '[Renderer WARN]' : '[Renderer]';
        log.info(`${prefix}: ${message}`);
        if (!IS_PACKAGED) {
            console.log(`${prefix}: ${message} (at ${sourceId}:${line})`);
        }
    });

    // Phase 2.1: Blackbox Telemetry — Explicit path: %APPDATA%\Roaming\LuminaIDE\
    try {
        const logDir = path.join(process.env.APPDATA || app.getPath('appData'), 'LuminaIDE');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logPath = path.join(logDir, 'frontend_crash.log');
        log.info(`[Electron] 📋 Crash log: ${logPath}`);
        fs.writeFileSync(logPath, `--- LUMINA IDE: BOOT INICIADO (${new Date().toISOString()}) ---\nLog path: ${logPath}\n`);
        
        mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
            try {
                // Filter out ResizeObserver spam (benign Chromium issue)
                if (message.includes('ResizeObserver')) return;
                const levelName = ['LOG', 'INFO', 'WARN', 'ERROR'][level] || 'LOG';
                // Strip CSS %c format specifiers for cleaner logs
                const clean = message.replace(/%c/g, '').replace(/color:[^;]+;?/g, '').replace(/font-weight:[^;]+;?/g, '').trim();
                fs.appendFileSync(logPath, `[${levelName}] ${clean}\n`);
            } catch (e) {}
        });
    } catch (e) {
        log.error('Failed to setup local filesystem crash logger', e);
    }
}

// ─── IPC Handlers ───────────────────────────────────────────────────

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// Native folder picker — opens the standard Windows Explorer dialog
const { dialog } = require('electron');
ipcMain.handle('dialog-select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecione a pasta do projeto',
        properties: ['openDirectory'],
    });
    if (result.canceled || !result.filePaths.length) return { path: null };
    return { path: result.filePaths[0] };
});

// Native image file picker — returns base64 data URL for Web Studio
ipcMain.handle('dialog-select-image', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecione uma imagem',
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp'] },
        ],
    });
    if (result.canceled || !result.filePaths.length) return { dataUrl: null, name: null };
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon', bmp: 'image/bmp' };
    const mime = mimeMap[ext] || 'image/png';
    const data = fs.readFileSync(filePath);
    const b64 = data.toString('base64');
    return { dataUrl: `data:${mime};base64,${b64}`, name: path.basename(filePath), path: filePath };
});

// Native video file picker — returns base64 data URL for Web Studio
ipcMain.handle('dialog-select-video', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select a video',
        properties: ['openFile'],
        filters: [
            { name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (result.canceled || !result.filePaths.length) return { dataUrl: null, name: null };
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg', mov: 'video/quicktime', avi: 'video/x-msvideo', mkv: 'video/x-matroska' };
    const mime = mimeMap[ext] || 'video/mp4';
    const data = fs.readFileSync(filePath);
    const b64 = data.toString('base64');
    return { dataUrl: `data:${mime};base64,${b64}`, name: path.basename(filePath), path: filePath };
});

// ─── App Lifecycle ──────────────────────────────────────────────────

app.whenReady().then(async () => {
    // [FIX] Set empty menu to prevent Electron default menu from stealing
    // keyboard shortcuts (Ctrl+Shift+E, Ctrl+N, etc.) before they reach renderer
    Menu.setApplicationMenu(null);

    startBackend();

    // Handshake de Inicialização (PRD v2.3.1.5)
    log.info('[Electron] Initializing Handshake Stabilization (3s delay)...');
    await new Promise(r => setTimeout(r, 3000)); // 3s delay for boot stabilization

    const ready = await waitForBackend(60, 1000); // 60 seconds total — packaged backend needs ~30s

    if (!ready) {
        log.error('[Electron] Backend Handshake FAILED. Terminal failure.');
    } else {
        // Diagnostic: check brain and motor status
        const http = require('http');
        try {
            const brainCheck = await new Promise((resolve) => {
                http.get('http://127.0.0.1:8001/api/brain/status', (res) => {
                    let body = '';
                    res.on('data', (d) => body += d);
                    res.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
                }).on('error', () => resolve(null));
            });
            log.info(`[Electron] 🧠 Brain diagnostic: ${JSON.stringify(brainCheck)}`);
        } catch (e) {
            log.error(`[Electron] Brain diagnostic failed: ${e.message}`);
        }
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, and ensure backend is killed
app.on('window-all-closed', () => {
    // [PRD v2.4.5] Essential lifecycle management
    killBackend();
    if (process.platform !== 'darwin') app.quit();
});

// [PRD v2.4.5] Extreme cleanup before OS kills the app
app.on('will-quit', () => {
    killBackend();
});

// Cleanup before quitting (redundancy for direct quit calls)
app.on('before-quit', () => {
    killBackend();
});
