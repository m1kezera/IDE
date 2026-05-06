"""Project Y — Extensions API.

Handles loading, enabling, and disabling extensions from the workspace.
Extensions are standard folders with an `extension.json` manifest.

In packaged builds, extensions live in %APPDATA%/projecty-ide/extensions/
so that users can install/remove extensions freely.  During development,
set PROJECTY_EXTENSIONS_DIR to override the path.
"""

import os
import json
import sys
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/extensions", tags=["extensions"])


def _resolve_extensions_dir() -> str:
    """Return the extensions directory, creating it if needed.

    Priority:
      1. PROJECTY_EXTENSIONS_DIR env-var (dev override)
      2. Project Root / extensions  (Portable for Electron)
    """
    env_override = os.environ.get("PROJECTY_EXTENSIONS_DIR")
    if env_override:
        target = env_override
    else:
        # Resolve from the backend directory up one level to the project root
        target = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "extensions"))

    os.makedirs(target, exist_ok=True)
    return target

EXTENSIONS_DIR = _resolve_extensions_dir()


def _get_installed():
    """Scan the extensions directory for valid extension manifests."""
    extensions = []
    try:
        for item in os.listdir(EXTENSIONS_DIR):
            ext_path = os.path.join(EXTENSIONS_DIR, item)
            if os.path.isdir(ext_path):
                manifest_path = os.path.join(ext_path, "extension.json")
                if os.path.isfile(manifest_path):
                    try:
                        with open(manifest_path, "r", encoding="utf-8") as f:
                            manifest = json.load(f)
                            manifest["id"] = item  # Folder name as ID

                            # Defaults if missing
                            manifest.setdefault("name", item)
                            manifest.setdefault("version", "1.0.0")
                            manifest.setdefault("description", "Sem descrição.")
                            manifest.setdefault("author", "Desconhecido")
                            manifest.setdefault("enabled", True)

                            extensions.append(manifest)
                    except json.JSONDecodeError:
                        pass  # Skip invalid JSON
    except OSError:
        pass

    return extensions


@router.get("/path")
async def get_extensions_path():
    """Return the resolved extensions directory so the UI can display it."""
    return {"path": EXTENSIONS_DIR}


@router.get("/")
async def list_extensions():
    return {"extensions": _get_installed()}


@router.post("/{extension_id}/toggle")
async def toggle_extension(extension_id: str):
    ext_path = os.path.join(EXTENSIONS_DIR, extension_id)
    manifest_path = os.path.join(ext_path, "extension.json")

    if not os.path.exists(manifest_path):
        raise HTTPException(status_code=404, detail="Extensão não encontrada.")

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        # Toggle state
        current_state = manifest.get("enabled", True)
        manifest["enabled"] = not current_state

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=4)

        return {"status": "success", "enabled": manifest["enabled"]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao alterar extensão: {exc}")
