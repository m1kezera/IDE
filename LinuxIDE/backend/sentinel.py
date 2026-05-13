import os
import sys
import time
import ctypes
import logging
import psutil
import threading
from typing import List

log = logging.getLogger("projecty.sentinel")

# Ferramentas Proibidas (Blacklist)
SUSPICIOUS_PROCESSES = [
    "x64dbg.exe", "ida64.exe", "idat64.exe", "wireshark.exe", 
    "http-toolkit.exe", "fiddler.exe", "processhacker.exe", 
    "ghidra.exe", "ollydbg.exe", "cheatengine.exe"
]

_sentinel_running = False
PANIC_TRIGGERED = False
LAST_REASON = ""
_scan_count = 0
_threats_blocked = 0
_threat_log: list = []
_start_time = 0.0
_last_scan_time = 0.0

def is_debugger_present() -> bool:
    """Verifica se um debugger está anexado usando a API do Windows."""
    if sys.platform == 'win32':
        return ctypes.windll.kernel32.IsDebuggerPresent() != 0
    return False

def check_suspicious_processes() -> List[str]:
    """Procura por processos de análise na lista negra."""
    detected = []
    for proc in psutil.process_iter(['name']):
        try:
            name = proc.info['name'].lower()
            if any(s.lower() in name for s in SUSPICIOUS_PROCESSES):
                detected.append(name)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return detected

def panic_mode(reason: str):
    """Encerrar a aplicação imediatamente e limpar a memória."""
    global PANIC_TRIGGERED, LAST_REASON, _threats_blocked, _threat_log
    if PANIC_TRIGGERED: return
    
    PANIC_TRIGGERED = True
    LAST_REASON = reason
    _threats_blocked += 1
    _threat_log.append({"reason": reason, "time": time.time()})
    log.critical(f"🚨 PANIC MODE TRIGGERED: {reason}")
    
    # 1. Limpeza de variáveis sensíveis
    from identity import clear_key_fragments
    clear_key_fragments()
    
    log.info("🧹 Memory wiped. UI Alert issued. Waiting 5s before termination...")
    
    # Damos 5 segundos para o Frontend exibir o alerta antes de matar o processo
    def delayed_exit():
        time.sleep(5)
        log.info("🔴 Terminating processes...")
        os._exit(1)
        
    threading.Thread(target=delayed_exit, daemon=True).start()

def sentinel_loop():
    """Loop de monitoramento ativo."""
    global _sentinel_running, _scan_count, _last_scan_time
    while _sentinel_running:
        _scan_count += 1
        _last_scan_time = time.time()
        
        # 1. Check Debugger
        if is_debugger_present():
            panic_mode("Debugger attached detected via WinAPI")
        
        # 2. Check Blacklisted Tools
        detected_tools = check_suspicious_processes()
        if detected_tools:
            panic_mode(f"Prohibited analysis tools detected: {', '.join(detected_tools)}")
        
        time.sleep(2)

def start_sentinel():
    """Inicia o cão de guarda em uma thread separada."""
    global _sentinel_running, _start_time
    if not _sentinel_running:
        _sentinel_running = True
        _start_time = time.time()
        
        # Set High Priority for the defensive process (Windows specific)
        if sys.platform == 'win32':
            try:
                p = psutil.Process(os.getpid())
                p.nice(psutil.HIGH_PRIORITY_CLASS)
                log.info("🚀 Sentinel priority elevated to HIGH_PRIORITY_CLASS")
            except Exception as e:
                log.warning(f"Failed to elevate sentinel priority: {e}")

        thread = threading.Thread(target=sentinel_loop, daemon=True, name="ProjectYSentinel")
        thread.start()
        log.info("🛡️ Project Y Sentinel Active Defense—STARTED")

def stop_sentinel():
    """Para o monitoramento."""
    global _sentinel_running
    _sentinel_running = False
    log.info("🛡️ Project Y Sentinel—STOPPED")

def get_shield_report() -> dict:
    """Returns shield telemetry for the frontend."""
    uptime = time.time() - _start_time if _start_time > 0 else 0
    return {
        "is_active": _sentinel_running,
        "scans_performed": _scan_count,
        "threats_blocked": _threats_blocked,
        "uptime_seconds": round(uptime, 1),
        "last_scan_time": _last_scan_time,
        "panic_triggered": PANIC_TRIGGERED,
        "last_reason": LAST_REASON,
        "threat_log": _threat_log[-10:],
        "blacklist_size": len(SUSPICIOUS_PROCESSES),
        "blacklist": list(SUSPICIOUS_PROCESSES),
    }

def get_blacklist() -> list:
    """Returns the current blacklist."""
    return list(SUSPICIOUS_PROCESSES)

def add_to_blacklist(name: str) -> bool:
    """Adds a process/file name to the blacklist."""
    name = name.strip().lower()
    if not name:
        return False
    if not name.endswith('.exe'):
        name += '.exe'
    if name not in [s.lower() for s in SUSPICIOUS_PROCESSES]:
        SUSPICIOUS_PROCESSES.append(name)
        log.info(f"🛡️ Blacklist: added '{name}'")
        return True
    return False

def remove_from_blacklist(name: str) -> bool:
    """Removes a process/file name from the blacklist."""
    name = name.strip().lower()
    for i, proc in enumerate(SUSPICIOUS_PROCESSES):
        if proc.lower() == name:
            SUSPICIOUS_PROCESSES.pop(i)
            log.info(f"🛡️ Blacklist: removed '{name}'")
            return True
    return False
