# Packaging Guide

> How Lumina IDE is built and packaged into a Windows installer

---

## Overview

The release pipeline converts the project into a single `Lumina-IDE-Setup-{version}.exe` installer:

```
Source Code
    │
    ├── 1. PyInstaller ──► backend/dist_final/LuminaEngine/LuminaEngine.exe
    │                      (self-contained Python runtime + all deps)
    │
    ├── 2. Vite Build ───► frontend-ts/dist/
    │                      (bundled HTML/CSS/JS)
    │
    └── 3. electron-builder ──► release/Lumina-IDE-Setup-{version}.exe
                                (NSIS installer with everything embedded)
```

---

## Step-by-Step

### 1. Backend: PyInstaller Bundle

The Python backend is compiled into a standalone `.exe` so end users don't need Python installed.

```bash
cd backend
pip install pyinstaller

pyinstaller --name LuminaEngine \
    --distpath dist_final \
    --add-data ".env;." \
    --add-data "knowledge_base.json;." \
    --hidden-import=tiktoken_ext.openai_public \
    --hidden-import=tiktoken_ext \
    --collect-all tiktoken_ext \
    main.py
```

**Output**: `backend/dist_final/LuminaEngine/LuminaEngine.exe`

Key notes:
- The `.spec` file (`LuminaEngine.spec`) stores the full PyInstaller config
- `tiktoken` requires special `--collect-all` handling for its BPE data files
- The `.env` file is bundled but can be overridden at runtime
- Output directory is `dist_final/LuminaEngine/` (~350 MB with all Python deps)

### 2. Frontend: Vite Build

```bash
cd frontend-ts
npm install
npm run build    # runs: tsc && vite build
```

**Output**: `frontend-ts/dist/index.html` + JS/CSS assets

The build produces 3 main chunks:
- `index-*.js` — Main IDE application (~800 KB gzip: ~200 KB)
- `client-*.js` — API client (~180 KB)
- `CanvasApp-*.js` — Design Studio React app (~210 KB)

### 3. Electron: Package with electron-builder

```bash
# From project root
npm run dist    # runs: electron-builder
```

**Output**: `release/Lumina-IDE-Setup-{version}.exe`

---

## electron-builder Configuration

**File**: `electron-builder.yml`

```yaml
appId: com.lumina.ide
productName: Lumina IDE

directories:
  output: "release"

files:
  - electron/**/*              # main.js, preload.js, icons
  - frontend-ts/dist/**/*      # Built frontend
  - "!node_modules/**/*"       # Excluded (Electron bundles its own)

asarUnpack:
  - "electron/**/*"            # Unpacked for icon access

extraResources:
  - from: "backend/dist_final/LuminaEngine"
    to: "LuminaEngine"         # Backend .exe + runtime
  - from: "backend/knowledge_base.json"
    to: "backend/knowledge_base.json"
  - from: "backend/.env"
    to: "backend/.env"

win:
  icon: "electron/icon.png"
  target: nsis
  requestedExecutionLevel: requireAdministrator

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  include: "installer.nsh"     # Custom NSIS scripts
```

### What goes where in the installed app:

```
C:\Program Files\Lumina IDE\
├── Lumina IDE.exe              # Electron main executable
├── resources/
│   ├── app.asar                # Frontend + Electron code (packed)
│   ├── app.asar.unpacked/
│   │   └── electron/           # Icons, main.js (unpacked for access)
│   ├── LuminaEngine/           # Backend standalone exe + Python runtime
│   │   ├── LuminaEngine.exe
│   │   └── _internal/          # Python stdlib, site-packages, etc.
│   └── backend/
│       ├── .env
│       └── knowledge_base.json
```

---

## Automated Pipeline

The `build_release.bat` script runs the full pipeline:

```batch
@echo off
echo Lumina IDE — Master Release Pipeline
python scripts\build_pipeline.py
```

This calls `scripts/build_pipeline.py` which orchestrates:
1. Clean previous builds
2. Run PyInstaller for backend
3. Run Vite build for frontend
4. Run electron-builder for final installer

---

## Runtime Architecture (Packaged)

When the installed `Lumina IDE.exe` launches:

```
1. Electron starts (main.js)
2. Spawns LuminaEngine.exe as child process
   └── FastAPI server starts on port 8001
3. Waits for backend health check (up to 60 retries × 1s)
4. Loads frontend-ts/dist/index.html into BrowserWindow
5. Frontend connects to http://127.0.0.1:8001/api/
```

On close:
```
1. "Zombie Killer" protocol kills backend + all subprocesses
   └── taskkill /PID {pid} /T /F
   └── taskkill /IM LuminaEngine.exe /F /T  (fallback)
2. Electron quits
```

---

## Data Persistence

User data survives app updates because it's stored outside the installation directory:

| Data | Location |
|------|----------|
| SQLite database | `%APPDATA%/projecty-ide/pulsyce.db` |
| Cloud API config | `%APPDATA%/projecty-ide/cloud_config.json` |
| Electron logs | `%APPDATA%/lumina-ide/logs/electron.log` |
| Frontend crash log | `%APPDATA%/Roaming/LuminaIDE/frontend_crash.log` |

---

## Troubleshooting Builds

| Issue | Solution |
|-------|----------|
| `tiktoken` import errors | Add `--collect-all tiktoken_ext` to PyInstaller |
| Backend doesn't start in packaged build | Check `electron.log` in `%APPDATA%/lumina-ide/logs/` |
| Frontend shows blank page | Verify `frontend-ts/dist/index.html` exists |
| NSIS installer fails | Run `electron-builder --dir` first to test without installer |
| Backend zombie process | Check Task Manager for orphan `LuminaEngine.exe` |
