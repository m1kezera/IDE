"""
Build the Lumina IDE backend into a standalone executable using PyInstaller.

Usage:
    cd backend
    .venv\\Scripts\\python ..\\scripts\\build_backend.py

Output: backend/dist_final/LuminaEngine/  (onedir bundle)
"""

import subprocess
import sys
import os
import time

BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
SPEC_FILE = os.path.join(BACKEND_DIR, "LuminaEngine.spec")

def build():
    """Build using LuminaEngine.spec (includes all hidden imports and data files)."""
    start = time.time()
    print("=" * 60)
    print("  LUMINA IDE — Backend Build (PyInstaller)")
    print("=" * 60)

    if not os.path.exists(SPEC_FILE):
        print(f"❌ Spec file not found: {SPEC_FILE}")
        sys.exit(1)

    print(f"\n  📋 Spec: {os.path.relpath(SPEC_FILE, BACKEND_DIR)}")
    print(f"  📁 CWD:  {BACKEND_DIR}")
    print(f"  🐍 Python: {sys.executable}")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        SPEC_FILE,
        "--noconfirm",
        "--distpath", os.path.join(BACKEND_DIR, "dist_final"),
        "--workpath", os.path.join(BACKEND_DIR, "build"),
    ]

    print(f"\n  🚀 Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd, cwd=BACKEND_DIR)

    elapsed = time.time() - start
    if result.returncode == 0:
        exe_path = os.path.join(BACKEND_DIR, "dist_final", "LuminaEngine", "LuminaEngine.exe")
        if os.path.exists(exe_path):
            size_mb = os.path.getsize(exe_path) / (1024 * 1024)
            print(f"\n  ✅ Build succeeded! ({elapsed:.0f}s)")
            print(f"  📦 Output: {exe_path} ({size_mb:.1f} MB)")
        else:
            print(f"\n  ⚠️ Build finished but exe not found at {exe_path}")
    else:
        print(f"\n  ❌ Build failed! (exit code: {result.returncode})")
        sys.exit(1)

if __name__ == "__main__":
    build()
