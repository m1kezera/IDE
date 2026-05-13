"""Project Y — Backend Entrypoint.

Run with:  uvicorn main:app --reload --port 8000
"""

import os
import logging
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Shield Hotfix: Windowed Mode Redirect ──────────────────────────
# Prevents AttributeError: 'NoneType' object has no attribute 'isatty'
if sys.stdout is None or sys.stderr is None:
    f = open(os.devnull, 'w')
    sys.stdout = f
    sys.stderr = f

# ─── Logging setup ──────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s → %(message)s"
LOG_DATEFMT = "%H:%M:%S"

logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    datefmt=LOG_DATEFMT,
    stream=sys.stdout,
)
log = logging.getLogger("projecty")

# ─── Persistent File Logging (survives windowed/frozen mode) ─────
try:
    from logging.handlers import RotatingFileHandler
    os.makedirs("logs", exist_ok=True)
    _fh = RotatingFileHandler(
        "logs/lumina.log", maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    _fh.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s → %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))
    _fh.setLevel(logging.DEBUG)
    logging.getLogger().addHandler(_fh)
    log.info("📝 File logging active → logs/lumina.log")
except Exception as _fh_err:
    log.warning(f"⚠️ Could not setup file logging: {_fh_err}")
 
# ─── Frozen Environment Path Fix ──────────────────────────────────
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))
    # If running from inside 'projecty-backend' subfolder, move up to where resources are
    if not os.path.exists(".env") and os.path.exists("../.env"):
        os.chdir("..")
    log.info(f"❄️  Frozen environment detected. CWD set to: {os.getcwd()}")

# [PRD v2.4.5] Workspace CWD Injection (Module A)
# Priority 1: Environment variable injected by Electron
injected_workspace = os.environ.get("LUMINA_WORKSPACE_PATH")
if injected_workspace and os.path.isdir(injected_workspace):
    try:
        os.chdir(injected_workspace)
        log.info(f"📁 Workspace Injection Active: {injected_workspace}")
    except Exception as e:
        log.error(f"❌ Failed to chdir to injected workspace: {e}")

# Ensure support directories exist (relative to CWD)
for folder in ["brain", "logs", "workspace"]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)
        log.info(f"📁 Created directory: {folder}")

try:
    from logger_utils import setup_sse_logger
    setup_sse_logger()
except Exception as e:
    log.error(f"Failed to setup SSE logger: {e}")

# ─── Import modules (with diagnostic logging) ──────────────────────
_import_ok = True

try:
    from database import init_db
    log.info("✅ database — importado com sucesso")
except Exception as e:
    log.error(f"❌ database — falha ao importar: {e}")
    _import_ok = False

try:
    from router import router as api_router
    log.info("✅ router — importado com sucesso")
except Exception as e:
    import traceback
    log.error(f"❌ router — falha ao importar: {e}")
    log.error(traceback.format_exc())
    # Blackbox: grava no disco para diagnóstico em builds empacotadas
    try:
        with open("import_errors.log", "a", encoding="utf-8") as f:
            f.write(f"[ROUTER IMPORT FAIL] {e}\n")
            f.write(traceback.format_exc() + "\n")
    except Exception:
        pass
    _import_ok = False

try:
    from workspace import router as workspace_router
    log.info("✅ workspace — importado com sucesso")
except Exception as e:
    log.error(f"❌ workspace — falha ao importar: {e}")
    _import_ok = False

try:
    from extensions import router as extensions_router
    log.info("✅ extensions — importado com sucesso")
except Exception as e:
    log.error(f"❌ extensions — falha ao importar: {e}")
    _import_ok = False

try:
    from terminal import router as terminal_router
    log.info("✅ terminal — importado com sucesso")
except Exception as e:
    log.error(f"❌ terminal — falha ao importar: {e}")
    _import_ok = False

try:
    from setup_manager import router as setup_router
    log.info("✅ setup_manager — importado com sucesso")
except Exception as e:
    log.error(f"❌ setup_manager — falha ao importar: {e}")
    _import_ok = False

try:
    import swarm_mesh as mesh
    log.info("✅ mesh — importado com sucesso")
except Exception as e:
    log.error(f"❌ mesh — falha ao importar: {e}")
    _import_ok = False

if _import_ok:
    log.info("🟢 Todos os módulos importados com sucesso!")
else:
    log.warning("🟡 Alguns módulos falharam — verifique os erros acima")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    import time as _time
    _boot_start = _time.monotonic()
    log.info("═══════════════════════════════════════════════")
    log.info("   🚀 Lumina IDE Backend — Iniciando...")
    log.info("═══════════════════════════════════════════════")

    # 1. Database
    try:
        init_db()
        log.info("✅ Banco de dados inicializado (tabelas criadas/verificadas)")
        
        # Identity Check & Brain Unlock (v1.16/v2.1)
        from database import get_session_direct
        from models import ProjectYIdentity
        from brain import brain
        from sqlmodel import select
        from security_vault import protect_project_secrets
        from identity import generate_master_key_fragments
        from sentinel import start_sentinel
        
        start_sentinel() # Start Active Defense (v2.1)
        
        with get_session_direct() as session:
            identity = session.exec(select(ProjectYIdentity).where(ProjectYIdentity.is_active == True)).first()
            if identity:
                # Comparison hash generated using salted fragments
                from identity import get_hwid
                current_hwid = get_hwid()
                comp_hash = generate_master_key_fragments(identity.user_name, current_hwid)
                if brain.verify_identity(identity.user_name, comp_hash):
                    log.info(f"🛡️ Project Y Identity Verified: {identity.user_name}")
                    # Automatic protection of .env in current working directory (dynamic)
                    current_workdir = os.getcwd().replace("\\", "/")
                    protect_project_secrets(current_workdir, identity.user_name)
                    log.info(f"🛡️ Project secrets protected in: {current_workdir}")
                else:
                    log.error("⚠️ HARDWARE MISMATCH: Security lockdown active.")
            else:
                log.warning("ℹ️ No identity registered. Brain unlocked in open mode (pending onboarding).")
                brain._identity_locked = False  # Allow Brain to function without identity
                
    except Exception as e:
        log.error(f"❌ Falha ao inicializar banco de dados ou identidade: {e}")

    # 2. Config check
    try:
        from config import get_settings
        settings = get_settings()
        log.info(f"✅ Configuração carregada — Ollama: {settings.ollama_host}:{settings.ollama_port}, Modelo: {settings.local_model}")
    except Exception as e:
        log.error(f"❌ Falha ao carregar configuração: {e}")

    # 3. Ollama Orchestrator (v2.3)
    try:
        from ollama_orchestrator import get_orchestrator
        orchestrator = get_orchestrator()
        log.info("🎮 Project Y Orchestrator: Verificando status do motor Ollama...")
        if orchestrator.start_motor():
            log.info("✅ Ollama motor ativo e pronto.")
        else:
            log.warning("⚠️  Falha ao iniciar o motor Ollama automaticamente.")
    except Exception as e:
        log.warning(f"⚠️  Erro no Orchestrator: {e}")

    # 4. Routes summary
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    log.info(f"✅ {len(routes)} rotas registradas")
    _boot_elapsed = _time.monotonic() - _boot_start
    log.info("═══════════════════════════════════════════════")
    log.info(f"   ✅ Lumina IDE Backend pronto! (boot: {_boot_elapsed:.1f}s)")
    log.info("═══════════════════════════════════════════════")

    # Start Project Y Swarm Mesh (Module A)
    try:
        import swarm_mesh as mesh
        mesh.start_mesh(port=getattr(app.state, 'port', 8000))
        # Swarm v5.0: Execute the strictly refactored Registry GC loop
        asyncio.create_task(mesh.start_mesh_gc())
    except Exception as e:
        log.error(f"❌ Falha ao iniciar Project Y Mesh: {e}")

    # ─── 5. Brain Language Knowledge Indexer ─────────────────────────
    # Pre-populate Brain with language syntax/patterns so autocomplete always has context
    async def _index_language_knowledge():
        """Background task: index language reference files into Brain."""
        try:
            from brain import brain
            if not brain.is_ready:
                log.warning("🧠 Brain not ready — skipping knowledge index")
                return

            knowledge_dir = os.path.join(os.path.dirname(__file__), "brain_knowledge")
            if not os.path.isdir(knowledge_dir):
                log.warning(f"🧠 Knowledge dir not found: {knowledge_dir}")
                return

            indexed = 0
            for fname in os.listdir(knowledge_dir):
                if not fname.endswith(".txt"):
                    continue
                fpath = os.path.join(knowledge_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if content.strip():
                        lang_name = os.path.splitext(fname)[0]
                        await brain.index_code(
                            f"lumina://knowledge/{lang_name}",
                            content,
                            source_type="knowledge",
                            tag=lang_name
                        )
                        indexed += 1
                except Exception as e:
                    log.warning(f"🧠 Failed to index {fname}: {e}")

            log.info(f"🧠 Brain Knowledge: {indexed} language references indexed")
        except Exception as e:
            log.error(f"❌ Brain knowledge index error: {e}")

    asyncio.create_task(_index_language_knowledge())

    yield

    log.info("🔴 Lumina IDE Backend — Encerrando...")
    try:
        from watcher import get_watcher
        w = get_watcher()
        if w:
            w.stop()
            log.info("✅ Watcher (Nervo Óptico) Encerrado")
        
        import swarm_mesh as mesh
        mesh.stop_mesh()
        log.info("✅ Mesh Encerrado")
        
        from ollama_orchestrator import get_orchestrator
        get_orchestrator().stop_motor()
        log.info("✅ Ollama motor encerrado e VRAM liberada.")
    except Exception as e:
        log.error(f"Erro ao desligar componentes: {e}")


app = FastAPI(
    title="Lumina IDE API",
    description="Intelligent Development Environment — Local Intelligence, Global Performance.",
    version="10.0.1",
    lifespan=lifespan,
)

# ─── CORS (allow the Vite dev server) ──────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register routes ───────────────────────────────────────────────
if 'api_router' in dir():
    app.include_router(api_router)
if 'workspace_router' in dir():
    app.include_router(workspace_router)
if 'extensions_router' in dir():
    app.include_router(extensions_router)
if 'terminal_router' in dir():
    app.include_router(terminal_router, prefix="/api")
if 'setup_router' in dir():
    app.include_router(setup_router)

# ─── Direct execution (PyInstaller .exe) ───────────────────────────
# In dev mode, uvicorn is invoked externally via `python -m uvicorn main:app`.
# In the packaged .exe, this file IS the entrypoint, so we must start uvicorn here.
def start_stable_server(start_port=8001, max_tries=10):
    import socket
    import uvicorn
    import logging
    from datetime import datetime

    # ─── Blackbox Logger: grava evidências físicas no disco ─────────
    def _blackbox(msg):
        try:
            with open("shield_status.log", "a", encoding="utf-8") as f:
                f.write(f"[{datetime.now().isoformat()}] {msg}\n")
        except Exception:
            pass  # Nunca pode crashar o motor

    _blackbox(f"🛡️ Motor iniciando. Buscando porta a partir de {start_port} (max {max_tries} tentativas)")
    _blackbox(f"   CWD: {os.getcwd()}")
    _blackbox(f"   Frozen: {getattr(sys, 'frozen', False)}")

    port = start_port
    while port < start_port + max_tries:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                _blackbox(f"✅ Porta {port} livre. Subindo Uvicorn...")
                # Store port so startup event (mesh) knows which port we're on
                app.state.port = port
                # OBRIGATÓRIO: log_config=None e access_log=False para matar o erro 'isatty'
                # v7.0: Bind to 0.0.0.0 so mesh nodes on the LAN can reach
                # /api/mesh/ping and /api/mesh/status (fixes BLOQUEADO issue)
                uvicorn.run(
                    app, 
                    host="0.0.0.0", 
                    port=port, 
                    log_config=None, 
                    access_log=False
                )
                _blackbox(f"🔴 Uvicorn encerrou na porta {port}.")
                return
            else:
                _blackbox(f"⚠️ Porta {port} ocupada. Tentando próxima...")
                port += 1

    _blackbox("❌ FALHA CRÍTICA: Nenhum porto disponível no range de segurança!")
    logging.error("❌ Falha crítica: Nenhum porto disponível no range de segurança.")

if __name__ == "__main__":
    # Dev mode starts at 8000 (Vite proxy expects this)
    # Packaged mode (.exe) starts at 8001 (Electron expects this)
    is_frozen = getattr(sys, 'frozen', False)
    start_stable_server(start_port=8001 if is_frozen else 8000)
