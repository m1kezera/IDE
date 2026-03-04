import asyncio
import os
import subprocess
import threading
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect  # type: ignore[import]

router = APIRouter()

# Global registry of active terminal processes mapped by port identifier
# Example: {"cmd": process_obj, "node": process_obj}
ACTIVE_TERMINALS: Dict[str, subprocess.Popen] = {}
TERMINAL_HISTORY: Dict[str, str] = {}

def run_command_in_terminal(command: str, port: str = "cmd") -> bool:
    """Injects a command string into a specific active terminal's stdin."""
    process: Optional[subprocess.Popen] = ACTIVE_TERMINALS.get(port)
    if not process or process.poll() is not None:
        return False
    stdin = process.stdin  # type: ignore[union-attr]
    if stdin:
        if not command.endswith('\n'):
            command += '\n'
        try:
            stdin.write(command.encode('cp1252'))
            stdin.flush()
            return True
        except Exception:
            return False
    return False

@router.get("/terminal/logs/{port}")
def get_terminal_logs(port: str):
    """Returns the recent history buffer for a given terminal port."""
    return {"port": port, "logs": TERMINAL_HISTORY.get(port, "")}

@router.websocket("/ws/{port}")
async def terminal_endpoint(websocket: WebSocket, port: str):
    await websocket.accept()
    
    # We allow the user to define a "port" which we use as a terminal identifier or routing param.
    # In a real environment, you might start different services on different ports.
    # Here, we will just use bash/cmd.exe and echo the port context.
    try:
        process = subprocess.Popen(
            "cmd.exe",
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            cwd=os.getcwd(),
            bufsize=0,
        )
        
        # Register the terminal process globally
        ACTIVE_TERMINALS[port] = process
        TERMINAL_HISTORY[port] = ""
        
        # Inject an initial message simulating the port bind
        stdin = process.stdin
        if stdin:
            stdin.write(f"echo [Lumina IDE] Terminal bound to logical port {port}\n".encode('utf-8'))  # type: ignore[arg-type]
            stdin.flush()
        
        def read_output(pipe):
            try:
                # Read chunks of bytes to get partial lines and prompt characters
                while True:
                    data = pipe.read(1)
                    if not data:
                        break
                    
                    # Windows uses cp1252 or utf-8, ignore errors
                    text = data.decode('cp1252', errors='replace')
                    
                    # Accumulate history with a sliding window (~10,000 chars)
                    TERMINAL_HISTORY[port] += text
                    if len(TERMINAL_HISTORY[port]) > 10000:
                        TERMINAL_HISTORY[port] = TERMINAL_HISTORY[port][-10000:]  # type: ignore[misc]
                    
                    # Schedule sending to websocket
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_text(text), 
                        asyncio.get_running_loop()
                    )
            except Exception as e:
                pass

        # Start a thread to read stdout/stderr continuously
        reader_thread = threading.Thread(target=read_output, args=(process.stdout,), daemon=True)
        reader_thread.start()

        # Keep receiving inputs from the frontend
        while True:
            data = await websocket.receive_text()
            if process.poll() is not None:
                await websocket.send_text("\r\n[Process terminated]\r\n")
                break
                
            if process.stdin:
                stdin_pipe = process.stdin  # type: ignore[union-attr]
                # Add newline if missing, ensures command executes
                if not data.endswith('\n'):
                    data += '\n'
                stdin_pipe.write(data.encode('cp1252'))  # type: ignore[union-attr]
                stdin_pipe.flush()  # type: ignore[union-attr]

    except WebSocketDisconnect:
        if process.poll() is None:
            process.terminate()
    except Exception as e:
        if process and process.poll() is None:
            process.terminate()
