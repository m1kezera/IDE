"""
Lumina IDE v5.0 — Master Build Pipeline
Steps:
  1. Fix assets (branding alignment)
  2. Build frontend (Vite)
  3. Build backend (PyInstaller → LuminaEngine.exe)
  4. Copy dist_final
  5. Package with electron-builder
"""

import subprocess
import sys
import os
import shutil
import time

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend-ts")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

def run_step(name, cmd, cwd):
    print(f"\n🚀 [Build Step] {name}")
    print(f"   Command: {' '.join(cmd)}")
    print(f"   CWD: {cwd}")
    start = time.time()
    try:
        subprocess.run(cmd, cwd=cwd, check=True, shell=True)
        elapsed = time.time() - start
        print(f"   ✅ {name} done ({elapsed:.1f}s)")
    except subprocess.CalledProcessError as e:
        print(f"   ❌ {name} failed: {e}")
        sys.exit(1)

def main():
    total_start = time.time()
    print("=" * 60)
    print("  LUMINA IDE v9.0 — BUILD PIPELINE")
    print("=" * 60)

    # 0. Cleanup
    print("\n🧹 [0/5] Cleanup Phase...")
    paths_to_clean = [
        os.path.join(FRONTEND_DIR, "dist"),
        os.path.join(BACKEND_DIR, "build"),
        os.path.join(BACKEND_DIR, "dist"),
        os.path.join(ROOT_DIR, "release"),
    ]
    for p in paths_to_clean:
        if os.path.exists(p):
            print(f"   Removing {os.path.relpath(p, ROOT_DIR)}...")
            shutil.rmtree(p, ignore_errors=True)

    # 1. Fix Assets (branding)
    fix_assets = os.path.join(ROOT_DIR, "scripts", "fix-assets.js")
    if os.path.exists(fix_assets):
        run_step("[1/5] Identity Fix (Asset Alignment)", ["node", fix_assets], ROOT_DIR)
    else:
        print("   ⏭ fix-assets.js not found, skipping...")

    # 2. Frontend Build
    run_step("[2/5] Frontend Build (Vite)", ["npm", "run", "build"], FRONTEND_DIR)

    # 3. Backend Build (PyInstaller)
    spec_file = os.path.join(BACKEND_DIR, "LuminaEngine.spec")
    python_exe = os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe")
    run_step(
        "[3/5] Backend Build (PyInstaller)",
        [python_exe, "-m", "PyInstaller", spec_file, "--noconfirm",
         "--distpath", os.path.join(BACKEND_DIR, "dist_final"),
         "--workpath", os.path.join(BACKEND_DIR, "build")],
        BACKEND_DIR
    )

    # 4. Verify dist_final
    engine_exe = os.path.join(BACKEND_DIR, "dist_final", "LuminaEngine", "LuminaEngine.exe")
    if os.path.exists(engine_exe):
        size_mb = os.path.getsize(engine_exe) / (1024 * 1024)
        print(f"\n   ✅ LuminaEngine.exe exists ({size_mb:.1f} MB)")
    else:
        print(f"\n   ❌ LuminaEngine.exe NOT FOUND at {engine_exe}")
        sys.exit(1)

    # 5. Electron Packaging
    run_step("[5/5] Electron Packaging (electron-builder)", ["npx", "electron-builder", "--win"], ROOT_DIR)

    total = time.time() - total_start
    print("\n" + "=" * 60)
    print(f"  ✨ BUILD COMPLETO! ({total:.0f}s)")
    print(f"  Installer: {os.path.join(ROOT_DIR, 'release')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
