import os
import time
import json
import psutil
import subprocess
import httpx
from typing import List, Dict, Optional

from textual.app import App, ComposeResult
from textual.screen import Screen
from textual.containers import Container, Horizontal, Vertical, VerticalScroll, Grid
from textual.widgets import Header, Footer, Static, Input, Log, Markdown, Select, TextArea, Label, Rule, Button
from textual.worker import Worker, get_current_worker
from textual import work
from textual.message import Message
from textual.reactive import reactive

BACKEND_URL = "http://localhost:8001"
LUMINA_DIR = "/home/m1kezera/LuminaIDE/LinuxIDE"

class SystemRadar(Static):
    """A widget to display system usage (CPU, RAM, GPU) in real-time."""
    
    cpu_usage = reactive(0.0)
    ram_usage = reactive(0.0)
    gpu_stats = reactive("GPU: N/A")

    def on_mount(self) -> None:
        self.update_stats()
        self.set_interval(1.5, self.update_stats)

    def update_stats(self) -> None:
        self.cpu_usage = psutil.cpu_percent()
        mem = psutil.virtual_memory()
        self.ram_usage = mem.percent
        
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total", "--format=csv,noheader,nounits"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if result.returncode == 0:
                stats = result.stdout.strip().split(', ')
                if len(stats) >= 3:
                    gpu_util, mem_used, mem_total = stats[0], stats[1], stats[2]
                    self.gpu_stats = f"RTX 3060: {gpu_util}% Util | VRAM: {mem_used}/{mem_total} MB"
        except Exception:
            pass

    def watch_cpu_usage(self, cpu_usage: float) -> None:
        self.render_radar()
        
    def watch_ram_usage(self, ram_usage: float) -> None:
        self.render_radar()
        
    def watch_gpu_stats(self, gpu_stats: str) -> None:
        self.render_radar()

    def render_radar(self) -> None:
        content = f"💻 CPU: [bold cyan]{self.cpu_usage:05.1f}%[/bold cyan]  |  🧠 RAM: [bold magenta]{self.ram_usage:05.1f}%[/bold magenta]  |  🎮 {self.gpu_stats}"
        self.update(content)


class ChatMessage(Static):
    """A widget for a single chat message."""
    def __init__(self, role: str, content: str, **kwargs):
        super().__init__(**kwargs)
        self.role = role
        self.content = content
        self.md_widget = Markdown(content)
        if self.role == "User":
            self.add_class("user-message")
        else:
            self.add_class("lumina-message")

    def compose(self) -> ComposeResult:
        yield Label(f"[{'bold #58a6ff' if self.role == 'User' else 'bold #ff7b72'}]{self.role}[/]", classes="message-role")
        yield self.md_widget

    def append_content(self, text: str):
        self.content += text
        self.md_widget.update(self.content)


class ToolEvent(Message):
    """Emitted when a tool is called or returns."""
    def __init__(self, action: str, details: str):
        self.action = action
        self.details = details
        super().__init__()


class LoadingScreen(Screen):
    """Screen that mounts first to boot Docker and wait for API health."""
    
    status_text = reactive("Starting God Mode Engine...")
    
    def compose(self) -> ComposeResult:
        with Vertical(id="loading-container"):
            yield Label("✦ LUMINA ✦", id="loading-title")
            yield Label("", id="loading-status")

    def watch_status_text(self, status_text: str) -> None:
        self.query_one("#loading-status", Label).update(status_text)

    def on_mount(self) -> None:
        self.boot_backend()

    @work(exclusive=True, thread=True)
    def boot_backend(self) -> None:
        try:
            self.status_text = "[bold yellow]Wake up, God Mode... (docker compose up)[/]"
            subprocess.run(["docker", "compose", "up", "-d", "backend"], cwd=LUMINA_DIR, check=False)
            
            # Wait for API to respond (up to 180 seconds for fresh build)
            max_retries = 180
            for i in range(max_retries):
                self.status_text = f"[bold cyan]Connecting to GPU Engine... (Attempt {i+1}/{max_retries})[/]"
                try:
                    with httpx.Client(timeout=2.0) as client:
                        r = client.get(BACKEND_URL)
                        if r.status_code in (200, 404):
                            self.status_text = "[bold green]System Online! Switching to Matrix...[/]"
                            time.sleep(0.5)
                            self.app.call_from_thread(self.app.switch_screen, "main")
                            return
                except httpx.RequestError:
                    pass
                time.sleep(1)
                
            self.status_text = "[bold red]ERROR: Timeout waiting for backend. Exiting.[/]"
            time.sleep(2)
            self.app.call_from_thread(self.app.exit)
        
        except Exception as e:
            self.status_text = f"[bold red]FATAL ERROR: {e}[/]"
            time.sleep(3)
            self.app.call_from_thread(self.app.exit)


class MainScreen(Screen):
    """The main IDE dashboard."""

    BINDINGS = [
        ("ctrl+c", "quit", "Quit"),
        ("ctrl+l", "clear_chat", "Clear Chat"),
        ("ctrl+j", "submit_prompt", "Submit"),
    ]

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        
        with Horizontal():
            # Sidebar: Model Selection, Workspace, Actions + Tool Logs
            with Vertical(id="sidebar"):
                
                # Model Selection
                yield Label("[bold white]1. Engine[/]")
                import glob
                model_paths = glob.glob(os.path.join(LUMINA_DIR, "models", "*.gguf"))
                models = [(os.path.basename(m), os.path.basename(m)) for m in model_paths]
                if not models:
                    models = [("Nenhum modelo (.gguf) encontrado", "")]
                
                default_val = ""
                for m_label, m_val in models:
                    if "qwen" in m_val.lower():
                        default_val = m_val
                        break
                if not default_val and models:
                    default_val = models[0][1]
                    
                yield Select(models, id="model-select", value=default_val)
                
                # Workspace Selection
                yield Label("\n[bold white]2. Workspace[/]")
                yield Input(value="/home/m1kezera/ideias", id="workspace-input")
                
                # Control Buttons
                yield Label("\n[bold white]3. Controls[/]")
                with Grid(id="button-grid"):
                    yield Button("Disconnect", id="btn-disconnect", variant="default")
                    yield Button("Stop Engine", id="btn-stop", variant="warning")
                    yield Button("Destroy Engine", id="btn-destroy", variant="error")
                
                # Task Radar
                yield Label("\n[bold white]4. Task Radar[/]")
                yield Log(id="tool-log", highlight=True)
            
            # Main Area: Radar + Chat + Input
            with Vertical():
                yield SystemRadar(id="radar-panel")
                yield VerticalScroll(id="chat-container")
                
                with Container(id="input-container"):
                    yield Input(placeholder="Type your prompt... (Press Enter to break line, Ctrl+J to submit)", id="prompt-input")
        
        yield Footer()

    def on_mount(self) -> None:
        self.app.current_model = self.query_one("#model-select", Select).value
        # Sync the initial workspace with the backend
        initial_ws = self.query_one("#workspace-input", Input).value
        self.sync_workspace(initial_ws)
        self.query_one("#prompt-input").focus()
        
    def on_select_changed(self, event: Select.Changed) -> None:
        if event.select.id == "model-select":
            self.app.current_model = str(event.value)

    def on_input_submitted(self, event: Input.Submitted) -> None:
        if event.input.id == "prompt-input":
            self.action_submit_prompt()
        elif event.input.id == "workspace-input":
            new_ws = event.input.value.strip()
            self.sync_workspace(new_ws)

    @work(exclusive=True, thread=True)
    def sync_workspace(self, path: str) -> None:
        """Sends the chosen workspace to the backend."""
        try:
            with httpx.Client() as client:
                resp = client.post(f"{BACKEND_URL}/api/workspace/open", json={"path": path})
                if resp.status_code == 200:
                    self.post_message(ToolEvent("[bold green]Workspace Set[/]", f"Active folder: {path}"))
                else:
                    self.post_message(ToolEvent("[bold red]Workspace Error[/]", f"Failed to set {path}"))
        except Exception as e:
            self.post_message(ToolEvent("[bold red]Workspace Error[/]", str(e)))

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn-disconnect":
            self.app.exit()
        elif event.button.id == "btn-stop":
            self.shutdown_backend("stop")
        elif event.button.id == "btn-destroy":
            self.shutdown_backend("down")

    @work(exclusive=True, thread=True)
    def shutdown_backend(self, action: str) -> None:
        """Executes docker compose stop/down then exits."""
        try:
            if action == "stop":
                subprocess.run(["docker", "compose", "stop", "backend"], cwd=LUMINA_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif action == "down":
                subprocess.run(["docker", "compose", "down"], cwd=LUMINA_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        finally:
            self.app.call_from_thread(self.app.exit)

    def action_clear_chat(self) -> None:
        self.query_one("#chat-container").remove_children()
        self.app.history.clear()
        self.query_one("#tool-log").clear()

    def action_submit_prompt(self) -> None:
        input_widget = self.query_one("#prompt-input", Input)
        prompt = input_widget.value.strip()
        
        if not prompt:
            return
            
        input_widget.value = ""
        
        chat_container = self.query_one("#chat-container")
        chat_container.mount(ChatMessage("User", prompt))
        chat_container.scroll_end(animate=False)
        
        self.app.active_message = ChatMessage("Lumina", "*Carregando modelo na VRAM da GPU (pode levar uns 40s na primeira vez)...*\n\n")
        chat_container.mount(self.app.active_message)
        chat_container.scroll_end(animate=False)
        
        self.stream_response(prompt)

    @work(exclusive=True, thread=True)
    def stream_response(self, prompt: str) -> None:
        worker = get_current_worker()
        
        payload = {
            "prompt": prompt,
            "model": self.app.current_model,
            "stream": True,
            "history": self.app.history
        }
        
        accumulated = ""
        
        try:
            with httpx.Client(timeout=None) as client:
                with client.stream("POST", f"{BACKEND_URL}/api/generate", json=payload) as response:
                    for line in response.iter_lines():
                        if worker.is_cancelled:
                            break
                        if line.startswith("data: "):
                            if line[6:].strip() == "[DONE]":
                                break
                            
                            try:
                                data = json.loads(line[6:])
                            except:
                                continue
                            
                            if "error" in data:
                                self.post_message(ToolEvent("[bold red]Error[/]", data["error"]))
                                break
                                
                            if "content" in data:
                                chunk = data["content"]
                                accumulated += chunk
                                self.app.call_from_thread(self.app.active_message.append_content, chunk)
                                self.app.call_from_thread(self.query_one("#chat-container").scroll_end, animate=False)
                                
                            elif "token" in data and "content" not in data:
                                chunk = data["token"]
                                accumulated += chunk
                                self.app.call_from_thread(self.app.active_message.append_content, chunk)
                                self.app.call_from_thread(self.query_one("#chat-container").scroll_end, animate=False)
                            
                            if "tool_call" in data:
                                tc = data["tool_call"]
                                name = tc.get("name", "unknown")
                                self.post_message(ToolEvent(f"[bold yellow]🔧 Called {name}[/]", str(tc.get("arguments", {}))))
                                
                            if "tool_result" in data:
                                tr = data["tool_result"].get("result", {})
                                status = tr.get("status", "unknown")
                                color = "green" if status == "ok" else "red"
                                self.post_message(ToolEvent(f"[bold {color}]✓ Result[/]", str(tr)))
                                
        except Exception as e:
            self.post_message(ToolEvent("[bold red]Stream Error[/]", str(e)))
        
        self.app.history.append({"role": "user", "content": prompt})
        self.app.history.append({"role": "assistant", "content": accumulated})

    def on_tool_event(self, event: ToolEvent) -> None:
        log_widget = self.query_one("#tool-log", Log)
        log_widget.write_line(f"{event.action}\n[dim]{event.details}[/dim]\n")


class LuminaIDE(App):
    """The God Mode Terminal IDE Application."""
    
    CSS = """
    Screen {
        background: #0d1117;
    }
    
    /* LOADING SCREEN STYLES */
    #loading-container {
        align: center middle;
    }
    #loading-title {
        color: #ff7b72;
        text-style: bold;
        text-align: center;
        margin-bottom: 2;
    }
    #loading-status {
        color: #58a6ff;
        text-align: center;
    }
    
    /* MAIN SCREEN STYLES */
    #sidebar {
        width: 42;
        dock: left;
        border-right: solid #30363d;
        background: #161b22;
        padding: 1;
    }
    
    #radar-panel {
        height: 3;
        border: solid #30363d;
        content-align: center middle;
        background: #0d1117;
        margin-bottom: 1;
        color: #c9d1d9;
    }
    
    #chat-container {
        width: 1fr;
        height: 1fr;
        padding: 0;
        background: #0d1117;
    }
    
    #input-container {
        height: auto;
        max-height: 15;
        border-top: solid #30363d;
        dock: bottom;
        background: #161b22;
        padding: 1;
    }
    
    Input {
        border: none;
        background: #0d1117;
        color: #c9d1d9;
    }
    
    Input:focus {
        border: none;
    }
    
    #tool-log {
        height: 1fr;
        border: round #30363d;
        background: #0d1117;
        color: #8b949e;
        margin-top: 1;
    }
    
    ChatMessage {
        padding: 1 2;
        width: 100%;
        border-bottom: solid #30363d;
    }
    
    .user-message {
        background: #161b22;
    }
    
    .lumina-message {
        background: #0d1117;
    }
    
    .message-role {
        margin-bottom: 1;
    }
    
    Select {
        width: 100%;
        margin-top: 1;
    }
    
    #button-grid {
        grid-size: 3;
        grid-columns: 1fr;
        grid-gutter: 1;
        height: auto;
        margin-top: 1;
    }
    
    Button {
        width: 100%;
        height: 3;
        min-width: 0;
    }
    """

    def __init__(self):
        super().__init__()
        self.history = []
        self.current_model = ""
        self.active_message: Optional[ChatMessage] = None

    def on_mount(self) -> None:
        self.install_screen(LoadingScreen(), name="loading")
        self.install_screen(MainScreen(), name="main")
        self.push_screen("loading")


def main():
    app = LuminaIDE()
    app.run()

if __name__ == "__main__":
    main()
