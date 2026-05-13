import asyncio
import os
import sys
import json
import traceback
import workspace as ws
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# ─── Frozen-mode winpty path fix ─────────────────────────────────────
# PyInstaller puts winpty binaries in _internal/winpty/ but the winpty
# module searches relative to the Python executable. We must tell it
# where to find winpty-agent.exe BEFORE importing the module.
if getattr(sys, 'frozen', False):
    _meipass = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    _winpty_dir = os.path.join(_meipass, 'winpty')
    if os.path.isdir(_winpty_dir):
        os.environ['WINPTYDIR'] = _winpty_dir
        # Also add to PATH so winpty-agent.exe can be found
        os.environ['PATH'] = _winpty_dir + os.pathsep + os.environ.get('PATH', '')
        print(f"[Terminal] Frozen mode: winpty path set to {_winpty_dir}")
    else:
        print(f"[Terminal] WARNING: winpty directory not found at {_winpty_dir}")

import winpty

router = APIRouter()

# Global registry of active terminal processes mapped by port identifier
ACTIVE_TERMINALS: Dict[str, winpty.PTY] = {}
TERMINAL_HISTORY: Dict[str, str] = {}

def run_command_in_terminal(command: str, port: str = "cmd") -> bool:
    """Injects a command string into a specific active terminal's stdin."""
    process = ACTIVE_TERMINALS.get(port)
    if not process:
        return False
    if not command.endswith('\n'):
        command += '\r\n'
    try:
        process.write(command)
        return True
    except Exception:
        return False


# ─── Dangerous command patterns (never execute automatically) ────
_BLOCKED_PATTERNS = [
    "format ", "format.com", "del /s", "del /q",
    "rmdir /s", "rd /s", "shutdown", "restart",
    "reg delete", "reg add", "regedit",
    "net user", "net localgroup",
    "taskkill /f /im explorer",
    "rm -rf /", "rm -rf ~", "rm -rf .", "rm -rf *", "mkfs.",
    ":(){:|:&};:",  # fork bomb
    "dd if=", "> /dev/sda",
    "chmod -R 777 /",
    # PowerShell destructive
    "remove-item -recurse -force c:", "remove-item -recurse -force /",
    # Pipe to shell (potential RCE)
    "curl |", "curl|", "wget |", "wget|",
]


def is_command_dangerous(command: str) -> Optional[str]:
    """Check if a command matches known dangerous patterns.
    Returns the matched pattern or None if safe."""
    cmd_lower = command.lower().strip()
    for pattern in _BLOCKED_PATTERNS:
        if pattern.lower() in cmd_lower:
            return pattern
    return None


def run_command_capture(command: str, cwd: str, timeout: int = 30) -> dict:
    """Execute a command via subprocess and capture stdout/stderr.

    Returns dict with:
        - status: 'ok' | 'error' | 'blocked' | 'timeout'
        - stdout: captured stdout (truncated to 4000 chars)
        - stderr: captured stderr (truncated to 2000 chars)
        - exit_code: process return code
        - command: the executed command
    """
    import subprocess as _sp

    # Safety check: block destructive commands
    danger = is_command_dangerous(command)
    if danger:
        return {
            "status": "blocked",
            "command": command,
            "stdout": "",
            "stderr": f"⛔ Comando bloqueado por segurança: contém '{danger}'",
            "exit_code": -1,
        }

    # Also inject into PTY for user visibility (if terminal is open)
    process = ACTIVE_TERMINALS.get("cmd")
    if process:
        try:
            cmd_with_newline = command if command.endswith('\n') else command + '\r\n'
            process.write(cmd_with_newline)
        except Exception:
            pass

    # Execute with subprocess for output capture
    try:
        result = _sp.run(
            command,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )

        stdout = result.stdout or ""
        stderr = result.stderr or ""

        # Truncate to prevent token overflow
        if len(stdout) > 4000:
            stdout = stdout[:4000] + f"\n... (truncado, {len(result.stdout)} chars total)"
        if len(stderr) > 2000:
            stderr = stderr[:2000] + f"\n... (truncado, {len(result.stderr)} chars total)"

        return {
            "status": "ok" if result.returncode == 0 else "error",
            "command": command,
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": result.returncode,
        }

    except _sp.TimeoutExpired:
        return {
            "status": "timeout",
            "command": command,
            "stdout": "",
            "stderr": f"⏱️ Comando excedeu o timeout de {timeout}s",
            "exit_code": -1,
        }
    except Exception as e:
        return {
            "status": "error",
            "command": command,
            "stdout": "",
            "stderr": str(e),
            "exit_code": -1,
        }

@router.get("/terminal/logs/{port}")
def get_terminal_logs(port: str):
    """Returns the recent history buffer for a given terminal port."""
    return {"port": port, "logs": TERMINAL_HISTORY.get(port, "")}

@router.websocket("/ws/terminal/{port}")
async def terminal_websocket(websocket: WebSocket, port: str, shell: str = "powershell.exe"):
    await websocket.accept()
    loop = asyncio.get_running_loop()

    try:
        # Load workspace configuration
        ws._load_workspace_from_db()
        
        # Determine active CWD (default to root if no workspace is active)
        active_cwd = "C:\\"
        if ws._workspace_path and os.path.exists(ws._workspace_path):
            active_cwd = ws._workspace_path
            
        print(f"[Terminal] Spawning {shell} in {active_cwd}")
        
        # Spawn Pseudo-Terminal (PTY) with retry logic
        # Some Windows configurations fail on first attempt with a semaphore error
        # (HRESULT 0x800700BB). Retrying usually succeeds.
        pty_process = None
        last_pty_error = None
        for pty_attempt in range(3):
            try:
                pty_process = winpty.PTY(80, 24)
                pty_process.spawn(shell, cwd=active_cwd)
                break  # Success
            except Exception as pty_err:
                last_pty_error = pty_err
                print(f"[Terminal] PTY spawn attempt {pty_attempt + 1}/3 failed: {pty_err}")
                if pty_attempt < 2:
                    await asyncio.sleep(0.5)  # Wait before retry
                    try:
                        del pty_process
                    except Exception:
                        pass
                    pty_process = None
        
        if pty_process is None:
            raise last_pty_error or RuntimeError("PTY spawn failed after 3 attempts")
        
        # Kickstart prompt rendering
        pty_process.write("\r\n")
        
        ACTIVE_TERMINALS[port] = pty_process
        TERMINAL_HISTORY[port] = ""
    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"[Terminal] FATAL: {err_msg}")
        # Log to file for packaged diagnostic
        try:
            if not os.path.exists("logs"): os.makedirs("logs")
            with open("logs/terminal_error.log", "a", encoding="utf-8") as f:
                f.write(f"--- {port} error ---\n{err_msg}\n")
        except: pass
        
        await websocket.send_text(f"Erro Crítico ao iniciar PTY no Windows: {str(e)}\r\n")
        if websocket.client_state.name != 'DISCONNECTED':
            await websocket.close()
        return

    async def read_from_pty():
        """Lê os bytes crus do PowerShell e envia para a tela do Project Y"""
        while True:
            try:
                # pywinpty read receives `blocking` as its ONLY positional argument.
                data = await loop.run_in_executor(None, pty_process.read, True)
                if not data:
                    break
                await websocket.send_text(data)
            except winpty.WinptyError:
                break  # Processo terminou
            except Exception as e:
                print(f"[Terminal] Erro de leitura: {e}")
                break

    # Roda a leitura em background sem travar o FastAPI
    reader_task = asyncio.create_task(read_from_pty())

    try:
        while True:
            client_data = await websocket.receive_text()
            
            # ─── INTERCEPTADOR DE COMANDOS DO FRONTEND ───
            is_command = False
            if client_data.startswith("{") and "type" in client_data:
                try:
                    req = json.loads(client_data)
                    # FIX v5.4: Verificação isalive() antes de set_size
                    if req.get("type") == "resize" and pty_process.isalive():
                        cols = req.get("cols", 80)
                        rows = req.get("rows", 24)
                        pty_process.set_size(cols, rows)
                        is_command = True
                except json.JSONDecodeError:
                    pass
            
            # FIX v5.4: Verificação isalive() antes de write
            if not is_command and pty_process.isalive():
                await loop.run_in_executor(None, pty_process.write, client_data)
                
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        if port in ACTIVE_TERMINALS:
            del ACTIVE_TERMINALS[port]
        try:
            del pty_process
        except Exception:
            pass