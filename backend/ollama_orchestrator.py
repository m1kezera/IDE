import subprocess
import time
import os
import requests
import logging
import psutil
from typing import Optional

logger = logging.getLogger("projecty.orchestrator")

class OllamaOrchestrator:
    def __init__(self, host: str = "127.0.0.1", port: int = 11434):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"
        self._process: Optional[subprocess.Popen] = None

    def is_running(self) -> bool:
        """Checks if Ollama is responding on the target port."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=2)
            return resp.ok
        except requests.ConnectionError:
            return False
        except Exception as e:
            logger.debug(f"Ollama status check error: {e}")
            return False

    def start_motor(self, network_mode: bool = False):
        """Starts 'ollama serve' if not already running.
        
        Args:
            network_mode: If True, binds to 0.0.0.0 (accepts network connections for Hive).
                         If False, binds to 127.0.0.1 (local only, default).
        """
        if self.is_running():
            logger.info("✅ Ollama motor already running.")
            return True

        bind_host = "0.0.0.0" if network_mode else "127.0.0.1"
        self._network_mode = network_mode
        logger.info(f"🟡 Starting Ollama motor (ollama serve) — bind: {bind_host}")
        try:
            startup_info = None
            if os.name == 'nt':
                startup_info = subprocess.STARTUPINFO()
                startup_info.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                
            env = os.environ.copy()
            env["OLLAMA_HOST"] = bind_host

            self._process = subprocess.Popen(
                ["ollama", "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                startupinfo=startup_info,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0,
                env=env
            )
            
            # Wait for motor to warm up
            retries = 10
            while retries > 0:
                if self.is_running():
                    logger.info(f"🔵 Ollama motor is READY (network={network_mode}).")
                    return True
                time.sleep(1)
                retries -= 1
            
            logger.error("❌ Ollama motor failed to start within timeout.")
            return False
        except Exception as e:
            logger.error(f"❌ Error launching Ollama: {e}")
            return False

    def restart_for_network(self, network_mode: bool):
        """Restarts Ollama with network mode on or off (for Hive toggle).
        
        When Hive is enabled:  network_mode=True  → 0.0.0.0 (accepts LAN connections)
        When Hive is disabled: network_mode=False → 127.0.0.1 (local only)
        """
        current = getattr(self, '_network_mode', False)
        if current == network_mode and self.is_running():
            logger.info(f"ℹ️ Ollama already in {'network' if network_mode else 'local'} mode.")
            return True
        
        logger.info(f"🔄 Restarting Ollama for {'network (0.0.0.0)' if network_mode else 'local (127.0.0.1)'} mode...")
        self.stop_motor()
        time.sleep(1)
        return self.start_motor(network_mode=network_mode)

    def stop_motor(self):
        """Stops the Ollama process and releases resources."""
        logger.info("🔴 Stopping Ollama motor...")
        
        # 1. Try to terminate the process we started
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None
            logger.info("✅ Ollama process terminated.")
            return True

        # 2. Aggressive cleanup using psutil for ANY orphaned ollama processes
        found = False
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if proc.info['name'] and 'ollama' in proc.info['name'].lower():
                    logger.info(f"🔪 Found orphaned Ollama (PID {proc.info['pid']}). Killing...")
                    proc.kill()
                    found = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
        
        if found:
            logger.info("✅ All Ollama instances cleared.")
        else:
            logger.info("ℹ️ No Ollama processes found to stop.")
        
        return True

    def get_status_label(self) -> str:
        """Returns visual status for the frontend (offline, starting, ready)."""
        if self.is_running():
            return "ready"
        if self._process and self._process.poll() is None:
            return "starting"
        return "offline"

# Global singleton
_orchestrator = OllamaOrchestrator()

def get_orchestrator() -> OllamaOrchestrator:
    return _orchestrator
