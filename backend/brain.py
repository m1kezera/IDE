import os
import sys
import logging
import time
from typing import List, Dict, Any, Optional

log = logging.getLogger("projecty.brain")

# ─── Heavy deps (may be unavailable in PyInstaller) ─────────────
_lancedb = None
_pd = None
_SentenceTransformer = None
_DEPS_OK = True

try:
    import lancedb as _lancedb
except ImportError as e:
    log.warning(f"⚠️ lancedb indisponível: {e}")
    _DEPS_OK = False

try:
    import pandas as _pd
except ImportError as e:
    log.warning(f"⚠️ pandas indisponível: {e}")
    _DEPS_OK = False

try:
    from sentence_transformers import SentenceTransformer as _SentenceTransformer
except ImportError as e:
    log.warning(f"⚠️ sentence_transformers indisponível: {e}")
    _DEPS_OK = False

try:
    from identity import get_hwid, generate_master_key
except ImportError as e:
    log.warning(f"⚠️ identity indisponível: {e}")
    get_hwid = lambda: "unknown"
    generate_master_key = lambda u, h: "unknown"
    _DEPS_OK = False

# Configurações do Cérebro
PROJECTY_DIR = os.path.join(os.path.expanduser("~"), ".projecty")
DB_PATH = os.path.join(PROJECTY_DIR, "brain_v1")
TABLE_NAME = "code_memory"

class ProjectYBrain:
    def __init__(self):
        self.db = None
        self.table = None
        self.model = None
        self._is_ready = True  # Always report ready; degrade gracefully
        self._identity_locked = True 
        self._index_cache = {} # Cache de hashes para evitar re-indexação redundante
        self.last_pulse_time = 0
        
        if not _DEPS_OK:
            log.warning("🧠 Brain em modo degradado (dependências faltando) — still reporting ready")
            return
        
        os.makedirs(DB_PATH, exist_ok=True)
        
        # Inicializa o modelo de embeddings (all-MiniLM-L6-v2 — bundled locally)
        log.info("🧠 Inicializando modelo de embeddings (all-MiniLM-L6-v2)...")
        try:
            # In PyInstaller frozen mode, model is bundled in _MEIPASS
            if getattr(sys, 'frozen', False):
                model_path = os.path.join(sys._MEIPASS, 'models', 'all-MiniLM-L6-v2')
            else:
                model_path = os.path.join(os.path.dirname(__file__), 'models', 'all-MiniLM-L6-v2')
            log.info(f"🧠 Loading model from: {model_path}")
            self.model = _SentenceTransformer(model_path)
            log.info("✅ Modelo de embeddings carregado.")
        except Exception as e:
            log.error(f"❌ Erro ao carregar modelo de embeddings: {e}")

        # Conecta ao LanceDB
        try:
            self.db = _lancedb.connect(DB_PATH)
            if TABLE_NAME not in self.db.table_names():
                pass
            else:
                self.table = self.db.open_table(TABLE_NAME)
            self._is_ready = True
            log.info(f"✅ Conectado ao LanceDB em {DB_PATH}")
        except Exception as e:
            log.error(f"❌ Erro ao conectar ao LanceDB: {e}")

    @property
    def is_ready(self):
        return self._is_ready

    def get_status(self):
        return {
            "is_ready": self.is_ready,
            "last_pulse": self.last_pulse_time,
            "cache_size": len(self._index_cache)
        }

    def verify_identity(self, user_name: str, hwid_hash_from_db: str):
        """Unlocks the brain only if identity matches hardware."""
        current_hwid = get_hwid()
        current_hash = generate_master_key(user_name, current_hwid)
        
        if current_hash == hwid_hash_from_db:
            self._identity_locked = False
            log.info(f"🛡️ Brain Unlocked for user: {user_name}")
            return True
        else:
            self._identity_locked = True
            log.error(f"⚠️ IDENTITY MISMATCH: Brain access BLOCKED for {user_name}")
            return False

    def _chunk_code(self, content: str, max_lines: int = 50) -> List[str]:
        """Fragmenta o código em blocos lógicos (simples por enquanto)."""
        lines = content.split('\n')
        chunks = []
        for i in range(0, len(lines), max_lines):
            chunk = '\n'.join(lines[i:i + max_lines])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    async def index_code(self, file_path: str, content: str, source_type: str = "code", tag: str = ""):
        """Indexa o conteúdo do arquivo/doc no banco de vetores."""
        if not self.is_ready:
            return
        
        # Guard: skip indexing if dependencies are missing (degraded mode)
        if self.model is None or self.db is None or _pd is None:
            return
        
        # Guard: skip if content is None/empty
        if not content:
            return

        try:
            import hashlib
            content_hash = hashlib.md5(content.encode()).hexdigest()
            
            # Smart Filtering: Skip if content hasn't changed
            if self._index_cache.get(file_path) == content_hash:
                # logger.debug(f"⏭️  Indexing skipped (no change): {file_path}")
                return
            
            log.info(f"🧠 Indexando ({source_type}) [Pulse]: {file_path}")
            chunks = self._chunk_code(content)
            
            if not chunks:
                return

            # Gera embeddings para cada pedaço
            embeddings = self.model.encode(chunks)
            
            data = []
            for i, chunk in enumerate(chunks):
                data.append({
                    "vector": embeddings[i].tolist(),
                    "text": chunk,
                    "file_path": file_path,
                    "chunk_id": i,
                    "source_type": source_type,
                    "tag": tag,
                    "timestamp": _pd.Timestamp.now().isoformat() if _pd else ""
                })

            df = _pd.DataFrame(data)
            
            if TABLE_NAME not in self.db.table_names():
                self.table = self.db.create_table(TABLE_NAME, data=df)
            else:
                # Remove entradas antigas do mesmo arquivo/doc para evitar duplicatas
                self.table.delete(f'file_path = "{file_path}"')
                self.table.add(data=df)
            
            # Update cache and pulse time
            self._index_cache[file_path] = content_hash
            self.last_pulse_time = time.time()
            
            log.info(f"✅ {len(chunks)} pedaços indexados para {file_path} [{source_type}]")
        except Exception as e:
            log.error(f"❌ Erro ao indexar {file_path}: {e}")

    async def search_context(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Busca os trechos de código mais parecidos com a query."""
        if not self.is_ready or self.table is None or self.model is None:
            return []

        try:
            query_vector = self.model.encode(query).tolist()
            
            # Busca vetorial
            results = self.table.search(query_vector).limit(limit).to_list()
            
            # Formata os resultados
            formatted = []
            for res in results:
                formatted.append({
                    "content": res["text"],
                    "file": res["file_path"],
                    "source_type": res.get("source_type", "code"),
                    "tag": res.get("tag", ""),
                    "score": res.get("_distance", 1.0)
                })
            return formatted
        except Exception as e:
            log.error(f"❌ Erro na busca do Brain: {e}")
            return []

    async def search_library(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search ONLY library documentation (source_type='documentation')."""
        if not self.is_ready or self.table is None or self.model is None:
            return []

        try:
            query_vector = self.model.encode(query).tolist()
            
            # Filtered vector search — library docs only
            results = (
                self.table.search(query_vector)
                .where("source_type = 'documentation'", prefilter=True)
                .limit(limit)
                .to_list()
            )
            
            formatted = []
            for res in results:
                formatted.append({
                    "content": res["text"],
                    "file": res["file_path"],
                    "tag": res.get("tag", ""),
                    "score": res.get("_distance", 1.0)
                })
            return formatted
        except Exception as e:
            log.error(f"❌ Erro na busca de biblioteca: {e}")
            return []

# Singleton
brain = ProjectYBrain()

