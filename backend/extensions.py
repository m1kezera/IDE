"""Lumina IDE — Extensions API.

Handles loading, enabling, and disabling extensions from the workspace.
Extensions are standard folders with an `extension.json` manifest.
"""

import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/extensions", tags=["extensions"])

EXTENSIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lumina_extensions")

def _get_installed():
    """Scan the extensions directory for valid extension manifests."""
    if not os.path.exists(EXTENSIONS_DIR):
        os.makedirs(EXTENSIONS_DIR, exist_ok=True)
    
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
                            manifest["id"] = item # Folder name as ID
                            
                            # Defaults if missing
                            manifest.setdefault("name", item)
                            manifest.setdefault("version", "1.0.0")
                            manifest.setdefault("description", "Sem descrição.")
                            manifest.setdefault("author", "Desconhecido")
                            manifest.setdefault("enabled", True)
                            
                            extensions.append(manifest)
                    except json.JSONDecodeError:
                        pass # Skip invalid JSON
    except OSError:
        pass
        
    return extensions

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
