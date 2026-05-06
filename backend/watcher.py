import os
import asyncio
import logging
import time
import threading
from typing import Set, Optional, Dict
from concurrent.futures import ThreadPoolExecutor
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger("projecty.watcher")

class FileWatcherHandler(FileSystemEventHandler):
    def __init__(self, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop, callback):
        super().__init__()
        self.skip_dirs = skip_dirs
        self.loop = loop
        self.callback = callback
        self._debounce_timers: Dict[str, threading.Timer] = {}
        self._executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ProjectYPulse")
        self._last_pulse = 0
        self.last_latency = 0
        self.pulse_batch = set()
        self.pulse_lock = threading.Lock()
        self._shutdown_event = threading.Event()

    def shutdown(self):
        """Cleanly shuts down the thread pool and timers."""
        self._shutdown_event.set()
        for timer in self._debounce_timers.values():
            timer.cancel()
        
        # cancel_futures=True ensures pending tasks are dropped immediately (Python 3.9+)
        try:
            self._executor.shutdown(wait=False, cancel_futures=True)
        except TypeError:
            # Fallback for older Python versions
            self._executor.shutdown(wait=False)
            
        logger.info("Watcher Handler executor shutdown completed (forced).")

    def _should_ignore(self, path: str) -> bool:
        # Ignore system folders and hidden files
        if any(part.startswith('.') for part in os.path.normpath(path).split(os.sep)):
            return True
        parts = os.path.normpath(path).split(os.sep)
        for part in parts:
            if part in self.skip_dirs:
                return True
        return False

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
            
        with self.pulse_lock:
            self.pulse_batch.add(event.src_path)
            
            # Cancel existing timer
            if "pulse_timer" in self._debounce_timers:
                self._debounce_timers["pulse_timer"].cancel()
            
            # Schedule the "Pulse" (Batch of 1.5s)
            timer = threading.Timer(1.5, self._trigger_pulse)
            self._debounce_timers["pulse_timer"] = timer
            timer.start()

    def _trigger_pulse(self):
        """Processes the batch of modified files in the thread pool."""
        with self.pulse_lock:
            batch = list(self.pulse_batch)
            self.pulse_batch.clear()
            
        if not batch:
            return

        start_time = time.time()
        logger.info(f"⚡ Pulse Triggered: Processing {len(batch)} file(s)...")
        
        # Offload brain and healer processing to the executor
        for file_path in batch:
            self._executor.submit(self._process_file, file_path)
            
        self.last_latency = (time.time() - start_time) * 1000
        logger.info(f"✅ Pulse Completed in {self.last_latency:.2f}ms")

    def _process_file(self, file_path: str):
        """Individual file processing in a separate thread."""
        try:
            # We run the original callback (which usually updates Brain/Healer)
            # using run_coroutine_threadsafe to jump back to the main loop if needed
            asyncio.run_coroutine_threadsafe(self.callback(file_path), self.loop)
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")


class ProjectYWatcher:
    def __init__(self, callback):
        self.observer = None
        self.handler = None
        self.callback = callback
        self.current_path = None

    def start(self, path: str, skip_dirs: Set[str], loop: asyncio.AbstractEventLoop):
        if self.observer:
            self.stop()
            
        if not path or not os.path.isdir(path):
            return

        self.current_path = path
        self.handler = FileWatcherHandler(skip_dirs, loop, self.callback)
        self.observer = Observer()
        self.observer.schedule(self.handler, path, recursive=True)
        self.observer.start()
        logger.info(f"O Nervo Óptico foi ativado no diretório: {path}")

    def stop(self):
        if self.observer:
            self.observer.stop()
            self.observer.join(timeout=2)
            self.observer = None
            
        if self.handler:
            self.handler.shutdown()
            self.handler = None
            
        logger.info("O Nervo Óptico foi desativado.")
        self.current_path = None

watcher_instance = None

def get_watcher(callback=None) -> ProjectYWatcher:
    global watcher_instance
    if watcher_instance is None and callback is not None:
        watcher_instance = ProjectYWatcher(callback)
    return watcher_instance
