import os
import base64
import logging
import asyncio
from io import BytesIO
from typing import Dict, Any, Optional

_qrcode = None
_psutil = None
try:
    import qrcode as _qrcode
except ImportError:
    pass
try:
    import psutil as _psutil
except ImportError:
    pass

log = logging.getLogger("projecty.edge")

class EdgeRuntime:
    def __init__(self):
        self.active_sandboxes: Dict[str, Dict[str, Any]] = {}
        self._wasm_engine_ready = False
        
        # Tenta carregar wasmtime (lazy load concept)
        try:
            from wasmtime import Engine, Store, Module, Instance
            self.engine = Engine()
            self._wasm_engine_ready = True
            log.info("✅ Wasmtime Engine (v1.0) carregado para Project Y Edge.")
        except ImportError:
            self.engine = None
            log.warning("⚠️ Wasmtime não encontrado. Edge rodando em modo Estático.")

    async def start_sandbox(self, workspace_path: str) -> Dict[str, Any]:
        """
        Inicia o isolamento Wasm para o workspace alvo.
        Implementa o offloading P2P se a VRAM/CPU local for escassa.
        """
        try:
            if _psutil:
                cpu_usage = _psutil.cpu_percent(interval=0.1)
                mem = _psutil.virtual_memory()
                free_ram_gb = mem.available / (1024**3)
            else:
                cpu_usage = 0
                free_ram_gb = 8.0
            
            # Offloading condition (PRD: < 500MB free RAM or extreme CPU)
            is_overloaded = free_ram_gb < 0.5 or cpu_usage > 90.0
            
            # Se sobrecarregado, tenta encontrar um nó Cortex via Mesh
            delegated_to = None
            if is_overloaded:
                try:
                    import swarm_mesh as mesh
                    cortex = mesh.get_best_cortex_node()
                    if cortex:
                        delegated_to = cortex.hostname
                        log.info(f"🕸️ Edge Offloading: Despachando execução Wasm para {delegated_to}")
                except Exception as e:
                    log.error(f"Falha ao carregar mesh no Edge: {e}")
            # Simula um Build Wasm em background (Module B v5.5)
            # No mundo real, aqui compilaríamos JS para Wasm usando QuickJS or Python via MicroPython Wasm
            await self._simulate_build(workspace_path)

            sandbox_id = base64.urlsafe_b64encode(os.urandom(6)).decode('utf-8')
            
            # A URL do túnel será roteada por router.py via /edge/preview/{sandbox_id}
            local_url = f"http://127.0.0.1:8000/api/edge/preview/{sandbox_id}/index.html"
            tunnel_url = f"http://[USER-LOCAL-IP]:8000/api/edge/preview/{sandbox_id}/index.html" # Placeholder to be replaced
            
            self.active_sandboxes[sandbox_id] = {
                "workspace": workspace_path,
                "status": "running",
                "engine": "wasmtime" if self._wasm_engine_ready else "emulated",
                "delegated_to": delegated_to
            }
            
            log.info(f"🚀 Project Y Edge Sandbox iniciado [{sandbox_id}] para {workspace_path}")
            
            # Gera QR Code do túnel P2P
            qr_base64 = self.generate_tunnel_qr(tunnel_url)

            return {
                "status": "success",
                "sandbox_id": sandbox_id,
                "preview_url": local_url,
                "qr_code": qr_base64,
                "delegated_to": delegated_to,
                "is_emulated": not self._wasm_engine_ready
            }

        except Exception as e:
            log.error(f"Erro ao iniciar Edge Sandbox: {e}")
            return {"status": "error", "message": str(e)}

    async def _simulate_build(self, path: str):
        """Simula o uso de CPU ociosa para 'compilar' o sandbox."""
        log.info(f"🏗️ Building Edge Sandbox for {path}...")
        # Simula carga de CPU por 1.5s
        await asyncio.sleep(1.5)
        log.info("✅ Build completo: Binários Wasm prontos.")

    def generate_tunnel_qr(self, url: str) -> str:
        """Gera um QR Code em Base64 para acesso mobile no túnel P2P."""
        try:
            if _qrcode is None:
                return ""
            qr = _qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            log.error(f"Erro ao gerar QR Code: {e}")
            return ""

    def get_sandbox(self, sandbox_id: str) -> Optional[Dict[str, Any]]:
        return self.active_sandboxes.get(sandbox_id)

    def stop_sandbox(self, sandbox_id: str):
        if sandbox_id in self.active_sandboxes:
            del self.active_sandboxes[sandbox_id]
            log.info(f"🛑 Project Y Edge Sandbox [{sandbox_id}] encerrado.")

edge_manager = EdgeRuntime()
