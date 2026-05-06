# Código Fonte e Dependências — Electron & Projeto (v2.5.0)

### `electron\main.js`
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

const IS_PACKAGED = app.isPackaged;

// ─── Paths ──────────────────────────────────────────────────────────

function getBackendCommand() {
    if (IS_PACKAGED) {
        // In production, the backend exe lives inside resources/backend/projecty-backend
        const exePath = path.join(process.resourcesPath, 'backend', 'projecty-backend', 'projecty-backend.exe');
        // Ensure CWD is where the .env and folders (logs/brain) are expected
        const cwdPath = path.join(process.resourcesPath, 'backend');
        return { command: exePath, args: [], cwd: cwdPath };
    }
    // Development: use the venv Python
    const pythonExe = path.resolve(__dirname, '../backend/.venv/Scripts/python.exe');
    return {
        command: pythonExe,
        args: ['-m', 'uvicorn', 'main:app', '--port', '8001'],
        cwd: path.resolve(__dirname, '../backend'),
    };
}

function getFrontendPath() {
    // Both dev and packaged (asar) use relative path from electron/main.js
    return path.join(__dirname, '../frontend/dist/index.html');
}

// ─── Backend Lifecycle ──────────────────────────────────────────────

function startBackend() {
    const { command, args, cwd } = getBackendCommand();

    console.log(`[Electron] Starting backend: ${command} ${args.join(' ')}`);
    console.log(`[Electron] CWD: ${cwd}`);

    backendProcess = spawn(command, args, {
        cwd,
        shell: false,
        windowsHide: true,
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend]: ${data.toString()}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error]: ${data.toString()}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`[Electron] Backend process exited with code ${code}`);
    });

    backendProcess.on('error', (err) => {
        console.error(`[Electron] Failed to start backend: ${err.message}`);
    });
}

function killBackend() {
    if (!backendProcess) return;
    try {
        // On Windows, child_process.kill() only kills the main process.
        // Use taskkill /T to kill the process tree.
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', backendProcess.pid.toString(), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
            // Secondary fallback for the specifically named process
            spawn('taskkill', ['/IM', 'projecty-backend.exe', '/F', '/T'], { stdio: 'ignore', windowsHide: true });
        } else {
            backendProcess.kill('SIGTERM');
        }
    } catch (e) {
        console.error('[Electron] Error killing backend:', e.message);
    }
    backendProcess = null;
}

// ─── Wait for Backend Ready ─────────────────────────────────────────

async function waitForBackend(maxRetries = 60, intervalMs = 1000) {
    const http = require('http');
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`[Electron] Handshake tentativa ${i + 1}/${maxRetries} → http://127.0.0.1:8001/api/health`);
            await new Promise((resolve, reject) => {
                const req = http.get('http://127.0.0.1:8001/api/health', (res) => {
                    resolve(res.statusCode);
                });
                req.on('error', reject);
                req.setTimeout(800, () => { req.destroy(); reject(new Error('timeout')); });
            });
            console.log(`[Electron] ✅ Backend is ready (attempt ${i + 1})`);
            return true;
        } catch (err) {
            console.log(`[Electron] ⏳ Backend not ready (attempt ${i + 1}): ${err.message || 'unknown'}`);
            await new Promise(r => setTimeout(r, intervalMs));
        }
    }
    console.error('[Electron] ❌ Backend did not start in time after 60 attempts!');
    return false;
}

// ─── Window ─────────────────────────────────────────────────────────

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'Project Y',
        icon: IS_PACKAGED
            ? path.join(process.resourcesPath, 'logo.png') // Use PNG fallback
            : path.join(__dirname, '../frontend/public/icon.ico'),
        show: false, // Show after content is ready
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Remove menu bar for full IDE immersion
    mainWindow.setMenuBarVisibility(false);

    // Load the built frontend
    const fPath = getFrontendPath();
    console.log(`[Electron] Loading Frontend from: ${fPath}`);
    mainWindow.loadFile(fPath).catch(err => {
        console.error(`[Electron] Failed to load index.html: ${err.message}`);
    });

    // Show window once content is painted (avoids white flash)
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // DevTools only in development — block completely in production
    if (!IS_PACKAGED) {
        mainWindow.webContents.openDevTools();
    } else {
        // Block Ctrl+Shift+I, F12, Ctrl+Shift+J in production
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (
                (input.control && input.shift && (input.key === 'I' || input.key === 'i' || input.key === 'J' || input.key === 'j')) ||
                input.key === 'F12'
            ) {
                event.preventDefault();
            }
        });
        // Force close if somehow opened
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    // Pipe renderer console to terminal (dev only)
    if (!IS_PACKAGED) {
        mainWindow.webContents.on('console-message', (_event, _level, message, line, sourceId) => {
            console.log(`[Renderer]: ${message} (at ${sourceId}:${line})`);
        });
    }
}

// ─── App Lifecycle ──────────────────────────────────────────────────

app.whenReady().then(async () => {
    startBackend();

    // Handshake de Inicialização (PRD v2.3.1.5)
    console.log('[Electron] Initializing Handshake Stabilization (3s delay)...');
    await new Promise(r => setTimeout(r, 3000)); // 3s delay for boot stabilization

    const ready = await waitForBackend(30, 500); // 15 seconds total

    if (!ready) {
        console.error('[Electron] Backend Handshake FAILED. Terminal failure.');
        // In production, we might show a dialog here, but for now we follow the "Launch anyway" fallback
    }

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, and ensure backend is killed
app.on('window-all-closed', () => {
    killBackend();
    if (process.platform !== 'darwin') app.quit();
});

// Cleanup before quitting
app.on('before-quit', () => {
    killBackend();
});

```

### `electron-builder.yml`
```yaml
appId: com.projecty.ide
productName: Project Y
copyright: "Copyright © 2026 m1kezera"

directories:
  output: "release"

files:
  - electron/**/*
  - frontend/dist/**/*
  - "!node_modules/**/*"

extraResources:
  - from: "backend/dist/projecty-backend"
    to: "backend/projecty-backend"
    filter:
      - "**/*"
  - from: "backend/knowledge_base.json"
    to: "backend/knowledge_base.json"
  - from: "backend/.env"
    to: "backend/.env"

win:
  target:
    - target: nsis
      arch:
        - x64
  requestedExecutionLevel: requireAdministrator

nsis:
  artifactName: "ProjectYSetup_v2.4.5.exe"
  uninstallDisplayName: "Project Y v2.4.5"
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "Project Y"

```

### `package.json`
```json
{
    "name": "project-y",
    "version": "2.4.5",
    "description": "Project Y — Local Intelligence, Global Performance",
    "main": "electron/main.js",
    "scripts": {
        "start": "electron .",
        "electron:dev": "electron .",
        "pack": "electron-builder --dir",
        "dist": "electron-builder",
        "build:frontend": "cd frontend && npm run build",
        "build:backend": "python scripts/build_backend.py",
        "build:all": ".\\build_release.bat"
    },
    "author": "m1kezera",
    "license": "ISC",
    "devDependencies": {
        "electron": "^33.0.0",
        "electron-builder": "^25.1.8"
    }
}
```

### `frontend\package.json`
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
    "@xterm/addon-fit": "^0.11.0",
    "@xterm/addon-web-links": "^0.12.0",
    "gsap": "^3.14.2",
    "lucide-react": "^0.577.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-resizable-panels": "^4.7.1",
    "react-syntax-highlighter": "^16.1.1",
    "xterm": "^5.3.0"
  }
}

```

### `backend\requirements.txt`
```txt
fastapi
uvicorn
sqlmodel
requests
tiktoken
python-dotenv
pydantic-settings
websockets
cryptography

```

