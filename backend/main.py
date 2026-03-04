"""Lumina IDE — Backend Entrypoint.

Run with:  uvicorn main:app --reload --port 8000
"""

import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ─── Logging setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s → %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger("lumina")

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
    log.error(f"❌ router — falha ao importar: {e}")
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

if _import_ok:
    log.info("🟢 Todos os módulos importados com sucesso!")
else:
    log.warning("🟡 Alguns módulos falharam — verifique os erros acima")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    log.info("═══════════════════════════════════════════════")
    log.info("   🚀 Lumina IDE Backend — Iniciando...")
    log.info("═══════════════════════════════════════════════")

    # 1. Database
    try:
        init_db()
        log.info("✅ Banco de dados inicializado (tabelas criadas/verificadas)")
    except Exception as e:
        log.error(f"❌ Falha ao inicializar banco de dados: {e}")

    # 2. Config check
    try:
        from config import get_settings
        settings = get_settings()
        log.info(f"✅ Configuração carregada — Ollama: {settings.ollama_host}:{settings.ollama_port}, Modelo: {settings.local_model}")
    except Exception as e:
        log.error(f"❌ Falha ao carregar configuração: {e}")

    # 3. Ollama connectivity check
    try:
        import requests
        resp = requests.get(f"http://{settings.ollama_host}:{settings.ollama_port}/api/tags", timeout=5)
        if resp.ok:
            models = [m["name"] for m in resp.json().get("models", [])]
            log.info(f"✅ Ollama conectado — {len(models)} modelo(s): {', '.join(models[:5])}")
        else:
            log.warning(f"⚠️  Ollama respondeu com status {resp.status_code}")
    except requests.ConnectionError:
        log.warning("⚠️  Ollama não está rodando (conexão recusada) — o Agent não funcionará até iniciar o Ollama")
    except Exception as e:
        log.warning(f"⚠️  Não foi possível verificar Ollama: {e}")

    # 4. Routes summary
    routes = [r.path for r in app.routes if hasattr(r, 'path')]
    log.info(f"✅ {len(routes)} rotas registradas")
    log.info("═══════════════════════════════════════════════")
    log.info("   ✅ Backend pronto! http://127.0.0.1:8000")
    log.info("═══════════════════════════════════════════════")

    yield

    log.info("🔴 Lumina IDE Backend — Encerrando...")


app = FastAPI(
    title="Lumina IDE API",
    description="Hybrid Coding Environment — Local Intelligence, Global Performance.",
    version="1.0.0",
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
