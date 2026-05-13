"""Project Y — Setup Manager for Ollama Onboarding."""

import os
import shutil
import asyncio
import httpx
import tempfile
import subprocess
import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

log = logging.getLogger("projecty.setup")
router = APIRouter(prefix="/api/setup", tags=["setup"])

class PullRequest(BaseModel):
    model: str

class MotorResponse(BaseModel):
    status: str # offline, starting, ready

def check_ollama_installed() -> bool:
    """Check if Ollama is accessible in the system PATH."""
    return shutil.which("ollama") is not None

def _download_and_install_ollama():
    """Background task to download and silently install Ollama on Windows."""
    try:
        url = "https://ollama.com/download/OllamaSetup.exe"
        installer_path = os.path.join(tempfile.gettempdir(), "OllamaSetup.exe")
        
        log.info(f"Downloading Ollama from {url}...")
        with httpx.Client(follow_redirects=True) as client:
            with client.stream("GET", url) as response:
                response.raise_for_status()
                with open(installer_path, "wb") as f:
                    for chunk in response.iter_bytes(chunk_size=8192):
                        f.write(chunk)
                        
        log.info("Downloaded successfully. Running silent install...")
        # /S for silent installation (NSIS) or equivalent for OllamaSetup if it supports it
        # Note: OllamaSetup.exe is an InnoSetup or squirrel installer, usually /S or /VERYSILENT /SUPPRESSMSGBOXES works.
        try:
            subprocess.run([installer_path, "/S"], check=True)
            log.info("Ollama silent install completed.")
        except subprocess.CalledProcessError as e:
            log.error(f"Failed to install Ollama silently: {e}")
    except Exception as e:
        log.error(f"Error during Ollama download/install: {e}")

@router.get("/status")
def get_setup_status():
    """Returns whether Ollama is installed and needs onboarding."""
    installed = check_ollama_installed()
    return {"installed": installed, "needs_onboarding": not installed}

@router.post("/install")
def trigger_install(background_tasks: BackgroundTasks):
    """Triggers the silent background installation of Ollama."""
    if check_ollama_installed():
        return {"status": "already_installed"}
    background_tasks.add_task(_download_and_install_ollama)
    return {"status": "install_started"}

# ─── Orchestrator Endpoints (v2.3) ──────────────────────────────────
@router.get("/motor/status", response_model=MotorResponse)
def get_motor_status():
    from ollama_orchestrator import get_orchestrator
    return MotorResponse(status=get_orchestrator().get_status_label())

@router.post("/motor/toggle")
def toggle_motor():
    from ollama_orchestrator import get_orchestrator
    orchestrator = get_orchestrator()
    if orchestrator.is_running():
        orchestrator.stop_motor()
        return {"status": "stopped"}
    else:
        orchestrator.start_motor()
        return {"status": "started"}

@router.get("/models/list")
async def list_all_models():
    """Lists installed models and available catalog models."""
    try:
        from ollama_orchestrator import get_orchestrator
        orchestrator = get_orchestrator()
        
        # 1. Fetch installed models from Ollama API
        installed = []
        if orchestrator.is_running():
            async with httpx.AsyncClient() as client:
                resp = await client.get(f"{orchestrator.base_url}/api/tags")
                if resp.status_code == 200:
                    installed = [m["name"] for m in resp.json().get("models", [])]
        
        # 2. Hardcoded recommendation catalog (simplified)
        catalog = [
            {"name": "mistral", "size": "4.1GB", "description": "High performance 7B model."},
            {"name": "llama3:8b", "size": "4.7GB", "description": "Meta's latest open powerhouse."},
            {"name": "codellama", "size": "3.8GB", "description": "Optimized for programming."},
            {"name": "phi3", "size": "2.3GB", "description": "Ultra-lightweight but capable."},
            {"name": "gemma:7b", "size": "5.0GB", "description": "Google's open model series."}
        ]
        
        return {
            "installed": installed,
            "catalog": catalog
        }
    except Exception as e:
        log.error(f"Error listing models: {e}")
        return {"installed": [], "catalog": []}

@router.delete("/models/{name}")
async def delete_model(name: str):
    """Removes an installed model."""
    from ollama_orchestrator import get_orchestrator
    orchestrator = get_orchestrator()
    if not orchestrator.is_running():
        raise HTTPException(status_code=503, detail="Ollama motor is offline")
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.request(
                "DELETE", 
                f"{orchestrator.base_url}/api/delete",
                json={"name": name}
            )
            if resp.status_code == 200:
                return {"status": "success"}
            else:
                return {"status": "error", "message": resp.text}
    except Exception as e:
        log.error(f"Error deleting model: {e}")
        return {"status": "error", "message": str(e)}

import json
from fastapi.responses import StreamingResponse

@router.post("/pull")
async def pull_model(body: PullRequest):
    """Pulls a model using 'ollama pull' and streams progress."""
    import asyncio
    
    async def stream_pull():
        # Requires Ollama to be running. Usually the service starts automatically.
        try:
            import subprocess
            process = await asyncio.create_subprocess_exec(
                "ollama", "pull", body.model,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace').strip()
                if text:
                    yield f"data: {json.dumps({'status': text})}\n\n"
                    
            await process.wait()
            yield f"data: {json.dumps({'done': True, 'status': 'Concluído'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_pull(), media_type="text/event-stream")
