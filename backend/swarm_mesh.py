import time
import socket
import logging
import asyncio
import hashlib
from typing import Dict, Any, Optional, List
from zeroconf import ServiceInfo, Zeroconf, ServiceBrowser, ServiceStateChange
from pydantic import BaseModel

import predictor

logger = logging.getLogger("projecty.mesh")

class MeshNode(BaseModel):
    ip: str
    port: int
    hostname: str
    nickname: str = ""              # v7.0: User's registered nickname (shield)
    vram_free_gb: float = 0.0
    ram_free_gb: float = 0.0
    cpu_usage_pct: float = 0.0
    is_cortex: bool = False
    last_seen: float = 0.0
    loaded_model: str = ""          # Currently loaded in VRAM
    installed_models: List[str] = [] # All locally installed models

# Global registry of discovered peers
discovered_nodes: Dict[str, MeshNode] = {}
_zc: Optional[Zeroconf] = None
_browser: Optional[ServiceBrowser] = None
_info: Optional[ServiceInfo] = None

SERVICE_TYPE = "_projecty-ide._tcp.local."
MESH_PORT = 8000 # Default, should ideally be dynamically injected

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def _get_all_local_ips() -> set:
    """Returns ALL local IP addresses (all interfaces) to prevent self-discovery."""
    ips = {"127.0.0.1"}
    try:
        hostname = socket.gethostname()
        for addr_info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ips.add(addr_info[4][0])
    except Exception:
        pass
    # Also include the main IP from the UDP trick
    ips.add(get_local_ip())
    return ips

def _pick_best_ip(addresses: list, local_ips: set) -> str:
    """Pick the announced IP that's most likely reachable from this machine.
    
    Strategy: prefer an IP that shares a subnet prefix with any of our local IPs.
    This handles VPN/virtual adapters announcing IPs on different subnets.
    """
    if len(addresses) == 1:
        return addresses[0]
    
    # Score each address by how closely it matches our local IPs
    best_ip = addresses[0]
    best_score = 0
    
    for addr in addresses:
        # Skip loopback
        if addr.startswith("127."):
            continue
        for local_ip in local_ips:
            if local_ip.startswith("127."):
                continue
            # Compare octets to find the longest prefix match
            addr_parts = addr.split(".")
            local_parts = local_ip.split(".")
            score = 0
            for a, b in zip(addr_parts, local_parts):
                if a == b:
                    score += 1
                else:
                    break
            if score > best_score:
                best_score = score
                best_ip = addr
    
    return best_ip

def on_service_state_change(zeroconf: Zeroconf, service_type: str, name: str, state_change: ServiceStateChange) -> None:
    if state_change is ServiceStateChange.Added:
        info = zeroconf.get_service_info(service_type, name)
        if info:
            addresses = [socket.inet_ntoa(a) for a in info.addresses]
            if not addresses:
                return
            
            # v7.0: Check ALL local IPs to prevent self-discovery
            local_ips = _get_all_local_ips()
            
            # Filter out any addresses that are our own
            remote_addresses = [a for a in addresses if a not in local_ips]
            if not remote_addresses:
                return  # All addresses are ours — this is self-discovery
            
            # v7.0: Pick the best IP — the one on the same subnet as us
            ip = _pick_best_ip(remote_addresses, local_ips)
            port = info.port
            
            logger.info(f"🕸️ Node announced {len(addresses)} IPs: {addresses} → selected {ip}")
                
            # v7.0: Deduplicate by IP — if same IP exists with different port,
            # update the existing entry instead of creating a duplicate
            existing_key = None
            for nid, node in discovered_nodes.items():
                if node.ip == ip:
                    existing_key = nid
                    break
            
            node_id = f"{ip}:{port}"
            
            if existing_key and existing_key != node_id:
                # Same IP but different port — remove old entry
                del discovered_nodes[existing_key]
                logger.info(f"🕸️ Dedup: replaced {existing_key} with {node_id}")
            
            discovered_nodes[node_id] = MeshNode(
                ip=ip, 
                port=port, 
                hostname=info.server,
                last_seen=time.time()
            )
            logger.info(f"🕸️ Swarm Node Joined: {node_id} ({info.server})")
            
    elif state_change is ServiceStateChange.Removed:
        # v7.0: Robust removal — try multiple matching strategies
        to_remove = []
        
        # Strategy 1: Try to get the actual IP from the service info
        try:
            info = zeroconf.get_service_info(service_type, name)
            if info and info.addresses:
                removed_ips = {socket.inet_ntoa(a) for a in info.addresses}
                for nid, node in discovered_nodes.items():
                    if node.ip in removed_ips:
                        to_remove.append(nid)
        except Exception:
            pass
        
        # Strategy 2: Match by hostname in the service name
        if not to_remove:
            for nid, node in discovered_nodes.items():
                # The service name format: ProjectYInstance-{ip-with-hyphens}.{type}
                ip_hyphen = node.ip.replace(".", "-")
                if ip_hyphen in name:
                    to_remove.append(nid)
                elif node.hostname and node.hostname.rstrip(".") in name:
                    to_remove.append(nid)
        
        for nid in set(to_remove):  # deduplicate
            if nid in discovered_nodes:
                del discovered_nodes[nid]
                logger.info(f"🕸️ Swarm Node Left: {nid}")

def _open_firewall_port(port: int):
    """(v7.0) Automatically opens the backend port in Windows Firewall for LAN mesh access."""
    import subprocess as sp
    import sys
    
    if sys.platform != 'win32':
        return
    
    rule_name = f"LuminaIDE-Mesh-{port}"
    try:
        # Check if rule already exists
        check = sp.run(
            ["netsh", "advfirewall", "firewall", "show", "rule", f"name={rule_name}"],
            capture_output=True, text=True, timeout=5
        )
        if check.returncode == 0 and rule_name in check.stdout:
            logger.info(f"🔥 Firewall rule '{rule_name}' already exists")
            return
        
        # Add inbound rule
        sp.run([
            "netsh", "advfirewall", "firewall", "add", "rule",
            f"name={rule_name}", "dir=in", "action=allow",
            f"protocol=TCP", f"localport={port}",
            "profile=private,domain",
            "description=Lumina IDE Mesh - allows LAN nodes to reach the backend API"
        ], capture_output=True, text=True, timeout=5)
        logger.info(f"🔥 Firewall rule '{rule_name}' added for port {port}")
    except Exception as e:
        logger.warning(f"⚠️ Could not add firewall rule (may need admin): {e}")

def _start_mesh_internal(port: int):
    global _zc, _browser, _info, MESH_PORT
    MESH_PORT = port
    try:
        # v7.0: Open firewall port before starting Zeroconf
        _open_firewall_port(port)
        
        from zeroconf import Zeroconf, ServiceInfo, ServiceBrowser
        _zc = Zeroconf()
        local_ip = get_local_ip()
        hostname = socket.gethostname() + ".local."
        
        # v7.0: Announce on ALL local IPs so nodes on different NICs can discover us
        all_ips = list(_get_all_local_ips() - {"127.0.0.1"})
        if not all_ips:
            all_ips = [local_ip]
        addresses = [socket.inet_aton(ip) for ip in all_ips]
        
        _info = ServiceInfo(
            SERVICE_TYPE,
            f"ProjectYInstance-{local_ip.replace('.', '-')}.{SERVICE_TYPE}",
            addresses=addresses,
            port=port,
            server=hostname,
            properties={"version": "7.0", "type": "agent"}
        )
        
        _zc.register_service(_info)
        _browser = ServiceBrowser(_zc, SERVICE_TYPE, handlers=[on_service_state_change])
        logger.info(f"🚀 Lumina Mesh (v7.0) Broadcast Active on {all_ips}:{port}")
    except Exception as e:
        import traceback
        logger.error(f"Failed to start Project Y Mesh:\n{traceback.format_exc()}")

def start_mesh(port: int = 8000):
    import threading
    t = threading.Thread(target=_start_mesh_internal, args=(port,), daemon=True)
    t.start()

def stop_mesh():
    global _zc, _browser, _info
    try:
        if _zc:
            if _info:
                _zc.unregister_service(_info)
                _info = None
            _zc.close()
            _zc = None
        if _browser:
            _browser.cancel()
            _browser = None
        logger.info("✅ Project Y Mesh (Zeroconf) cleaned up successfully.")
    except Exception as e:
        logger.error(f"Error stopping Project Y Mesh: {e}")

async def refresh_node_status():
    """Polls discovered nodes to update their VRAM, RAM, CPU, models and Cortex status.
    
    v7.0: Tries both port 8000 (dev) and 8001 (packaged) since we can't know
    which port the remote backend is running on.
    """
    import httpx
    async with httpx.AsyncClient(timeout=3.0) as client:
        for nid, node in list(discovered_nodes.items()):
            reached = False
            # Try the announced port first, then the other common port
            ports_to_try = [node.port]
            if node.port == 8000:
                ports_to_try.append(8001)
            elif node.port == 8001:
                ports_to_try.append(8000)
            
            for port in ports_to_try:
                try:
                    resp = await client.get(f"http://{node.ip}:{port}/api/mesh/status")
                    if resp.status_code == 200:
                        data = resp.json()
                        node.vram_free_gb = data.get("vram_free_gb", 0.0)
                        node.ram_free_gb = data.get("ram_free_gb", 0.0)
                        node.cpu_usage_pct = data.get("cpu_usage_pct", 0.0)
                        node.is_cortex = data.get("is_cortex", False)
                        node.loaded_model = data.get("loaded_model", "")
                        node.installed_models = data.get("installed_models", [])
                        node.nickname = data.get("nickname", "")
                        node.last_seen = time.time()
                        # Update port to the one that worked
                        if port != node.port:
                            node.port = port
                            logger.info(f"🕸️ Node {nid} responding on port {port} (updated)")
                        reached = True
                        break
                except Exception:
                    continue
            
            if not reached:
                logger.debug(f"🕸️ Node {nid} ({node.ip}) unreachable on ports {ports_to_try}")


def get_local_system_stats() -> dict:
    """Collects local RAM and CPU stats via psutil."""
    try:
        import psutil
        mem = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=0)  # non-blocking
        return {
            "ram_total_gb": round(mem.total / (1024**3), 2),
            "ram_free_gb": round(mem.available / (1024**3), 2),
            "ram_used_pct": round(mem.percent, 1),
            "cpu_usage_pct": round(cpu, 1),
        }
    except Exception:
        return {"ram_total_gb": 0, "ram_free_gb": 0, "ram_used_pct": 0, "cpu_usage_pct": 0}

async def start_mesh_gc():
    """(Swarm v7.0) Background task to refresh node data.
    
    v7.0: Nodes are NO LONGER evicted by timeout. Only Zeroconf's 
    ServiceStateChange.Removed can remove a node from the registry.
    This prevents nodes from disappearing when firewall blocks the status endpoint.
    """
    logger.info("🧹 Swarm Registry GC active (Interval: 10s, no time-based eviction)")
    while True:
        try:
            # Refresh VRAM/Cortex status of all discovered nodes
            await refresh_node_status()
        except Exception as e:
            logger.error(f"Mesh GC Error: {e}")
        
        await asyncio.sleep(10)


def compute_resource_limits() -> dict:
    """
    Hive v2.0 — Dynamic resource throttling.
    Only counts CORTEX nodes (with GPU). Light nodes don't affect limits.
    """
    cortex_count = sum(1 for n in discovered_nodes.values() if n.is_cortex)
    total_gpu_machines = cortex_count + 1  # include self (assumes self has GPU)
    total_all = len(discovered_nodes) + 1
    
    if total_gpu_machines <= 1:
        pct = 100
    elif total_gpu_machines <= 2:
        pct = 90
    elif total_gpu_machines <= 3:
        pct = 85
    elif total_gpu_machines <= 4:
        pct = 80
    elif total_gpu_machines <= 6:
        pct = 60
    elif total_gpu_machines <= 8:
        pct = 40
    elif total_gpu_machines <= 12:
        pct = 30
    else:
        pct = 20
    
    return {
        "connected_nodes": len(discovered_nodes),
        "cortex_nodes": cortex_count,
        "light_nodes": len(discovered_nodes) - cortex_count,
        "total_machines": total_all,
        "total_gpu_machines": total_gpu_machines,
        "max_vram_pct": pct,
        "max_ram_pct": pct,
        "max_cpu_pct": min(pct + 20, 100),
        "throttle_active": total_gpu_machines > 1,
    }

def get_best_cortex_node() -> Optional[MeshNode]:
    """Finds the most potent node in the swarm (highest VRAM > 4GB)."""
    best_node = None
    highest_vram = 0.0
    for node in discovered_nodes.values():
        if node.is_cortex and node.vram_free_gb > 4.0:
            if node.vram_free_gb > highest_vram:
                highest_vram = node.vram_free_gb
                best_node = node
    return best_node


# ─── Hive v2.0: Enforcement ─────────────────────────────────────────

def get_effective_context_limit() -> int:
    """
    Returns max context tokens this node should use based on resource limits.
    Lower limit = less local processing, more delegation.
    """
    limits = compute_resource_limits()
    pct = limits["max_vram_pct"]
    
    if pct >= 100:
        return 32000   # No limit (solo mode)
    elif pct >= 80:
        return 8000    # Generous but bounded
    elif pct >= 60:
        return 6000
    elif pct >= 40:
        return 3000
    elif pct >= 30:
        return 2000
    else:
        return 1500    # Minimal — mostly delegating


def should_delegate() -> bool:
    """
    Determines if this node should delegate work to peers.
    Returns True if:
      - There are available Cortex nodes AND
      - Local system is under pressure OR resource limits are active
    """
    limits = compute_resource_limits()
    
    # Solo mode — never delegate
    if not limits["throttle_active"]:
        return False
    
    # No peers available to delegate to
    available = [n for n in discovered_nodes.values() if n.is_cortex and n.vram_free_gb > 2.0]
    if not available:
        return False
    
    # Check local system pressure
    stats = get_local_system_stats()
    
    # Delegate if RAM is low or CPU is high
    if stats["ram_free_gb"] < 1.0 or stats["cpu_usage_pct"] > 85:
        return True
    
    # Delegate proactively if many machines (limits < 60%)
    if limits["max_vram_pct"] <= 60:
        return True
    
    return False


# ─── Hive v2.0: Round-Robin Balancing ────────────────────────────────

_round_robin_index: int = 0

def get_available_nodes() -> list:
    """Returns list of available Cortex nodes sorted by VRAM (descending)."""
    nodes = [n for n in discovered_nodes.values() 
             if n.is_cortex and n.vram_free_gb > 2.0]
    nodes.sort(key=lambda n: n.vram_free_gb, reverse=True)
    return nodes


def select_node_for_task(prompt_tokens: int = 0) -> Optional[MeshNode]:
    """
    Hive v2.0 — Intelligent node selection with weighted round-robin.
    
    - Large prompts (>4000 tokens) → node with most VRAM
    - Normal prompts → round-robin across available nodes
    - No available nodes → None (process locally)
    """
    global _round_robin_index
    
    available = get_available_nodes()
    if not available:
        return None
    
    # Large prompts go to the beefiest node
    if prompt_tokens > 4000:
        logger.info(f"🕸️ Large prompt ({prompt_tokens} tokens) → routing to strongest node: {available[0].ip}")
        return available[0]
    
    # Round-robin for normal prompts
    _round_robin_index = _round_robin_index % len(available)
    selected = available[_round_robin_index]
    _round_robin_index += 1
    
    logger.info(f"🕸️ Round-robin → selected node {selected.ip} (VRAM: {selected.vram_free_gb:.1f}GB)")
    return selected


# ─── Hive v2.0: Context Split ────────────────────────────────────────

def split_context_across_nodes(
    prompt: str, 
    context: str, 
    system_prompt: str
) -> list:
    """
    Splits context across available nodes for parallel processing.
    Each node gets: full prompt + full system_prompt + 1/N of context.
    
    Returns list of dicts: [{"node": MeshNode, "payload": {...}}, ...]
    Only activates when 3+ total machines and context > 4000 chars.
    """
    limits = compute_resource_limits()
    available = get_available_nodes()
    
    # Need at least 2 remote nodes (3 total machines) and substantial context
    if limits["total_machines"] < 3 or len(available) < 2 or len(context) < 4000:
        return []
    
    # Split context into chunks
    num_splits = min(len(available), 4)  # Max 4 splits
    chunk_size = len(context) // num_splits
    
    splits = []
    for i in range(num_splits):
        start = i * chunk_size
        end = start + chunk_size if i < num_splits - 1 else len(context)
        partial_context = context[start:end]
        
        splits.append({
            "node": available[i],
            "payload": {
                "task_id": f"split-{i}-{int(time.time())}",
                "compiled_context": system_prompt + "\n\n" + partial_context,
                "prompt": prompt,
                "model_tier": "high",
                "is_split": True,
                "split_index": i,
                "total_splits": num_splits,
            }
        })
    
    logger.info(f"🕸️ Context split into {num_splits} parts across {num_splits} nodes ({len(context)} chars total)")
    return splits


async def execute_split_and_merge(splits: list) -> dict:
    """
    Sends split context to multiple nodes in parallel and merges results.
    Uses asyncio.gather for concurrent execution.
    """
    import httpx
    
    async def send_to_node(split_info: dict) -> str:
        node = split_info["node"]
        payload = split_info["payload"]
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"http://{node.ip}:{node.port}/api/predict/next-steps",
                    json=payload
                )
                if resp.status_code == 200:
                    data = resp.json()
                    prediction = data.get("prediction", {})
                    return prediction.get("response", prediction.get("ghost_block", ""))
        except Exception as e:
            logger.error(f"Split task failed on {node.ip}: {e}")
        return ""
    
    # Execute all splits in parallel
    results = await asyncio.gather(*[send_to_node(s) for s in splits])
    
    # Merge: concatenate non-empty results
    merged_parts = [r for r in results if r]
    
    if not merged_parts:
        return {"status": "error", "message": "All split tasks failed"}
    
    # If only one response, use it directly; otherwise join
    merged_response = "\n\n".join(merged_parts) if len(merged_parts) > 1 else merged_parts[0]
    
    node_ips = [s["node"].ip for s in splits]
    logger.info(f"🕸️ Merged {len(merged_parts)}/{len(splits)} split results from {node_ips}")
    
    return {
        "status": "success",
        "prediction": {
            "response": merged_response,
            "solved_by_swarm": True,
            "split_merge": True,
            "nodes_used": node_ips,
        }
    }


async def proxy_prediction(node: MeshNode, payload: dict) -> dict:
    """Sends a prediction task to a Cortex node."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"http://{node.ip}:{node.port}/api/predict/next-steps",
                json=payload
            )
            if resp.status_code == 200:
                data = resp.json()
                if "prediction" in data:
                    if isinstance(data["prediction"], dict):
                        data["prediction"]["solved_by_swarm"] = True
                        data["prediction"]["cortex_node"] = f"{node.ip}"
                return data
    except Exception as e:
        logger.error(f"Proxy prediction failed: {e}")
    return {"status": "error", "message": "Swarm node failed to predict"}


# ─── Hive v2.0: LLM Response Cache ──────────────────────────────────

_llm_cache: Dict[str, dict] = {}  # hash → {"response": str, "timestamp": float}
_LLM_CACHE_MAX = 50
_LLM_CACHE_TTL = 1800  # 30 minutes


def _make_cache_key(prompt: str, model: str) -> str:
    """Creates a hash key from prompt + model for cache lookup."""
    raw = f"{model}:{prompt[:500]}"  # Only first 500 chars to keep hashes stable
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def cache_get(prompt: str, model: str) -> Optional[str]:
    """Returns cached response if available and not expired."""
    key = _make_cache_key(prompt, model)
    entry = _llm_cache.get(key)
    if entry and (time.time() - entry["timestamp"]) < _LLM_CACHE_TTL:
        logger.info(f"⚡ Cache HIT for key {key[:8]}...")
        return entry["response"]
    if entry:
        del _llm_cache[key]  # Expired
    return None


def cache_put(prompt: str, model: str, response: str) -> None:
    """Stores a response in the cache. Evicts oldest if full."""
    if len(response) < 10:
        return  # Don't cache empty/trivial responses
    
    key = _make_cache_key(prompt, model)
    
    # Evict oldest if full
    if len(_llm_cache) >= _LLM_CACHE_MAX:
        oldest_key = min(_llm_cache, key=lambda k: _llm_cache[k]["timestamp"])
        del _llm_cache[oldest_key]
    
    _llm_cache[key] = {"response": response, "timestamp": time.time()}
    logger.info(f"💾 Cached response for key {key[:8]}... ({len(_llm_cache)}/{_LLM_CACHE_MAX})")


def cache_stats() -> dict:
    """Returns cache statistics."""
    now = time.time()
    valid = sum(1 for e in _llm_cache.values() if (now - e["timestamp"]) < _LLM_CACHE_TTL)
    return {"entries": len(_llm_cache), "valid": valid, "max": _LLM_CACHE_MAX, "ttl_seconds": _LLM_CACHE_TTL}


# ─── Hive v2.0: Local Model Detection ───────────────────────────────

def get_local_models() -> dict:
    """Detects loaded and installed models from local Ollama."""
    result = {"loaded_model": "", "installed_models": []}
    try:
        import httpx, asyncio
        
        async def _fetch():
            from ollama_orchestrator import get_orchestrator
            orch = get_orchestrator()
            if not orch.is_running():
                return
            async with httpx.AsyncClient(timeout=3.0) as client:
                # Get installed models
                try:
                    resp = await client.get(f"{orch.base_url}/api/tags")
                    if resp.status_code == 200:
                        models = resp.json().get("models", [])
                        result["installed_models"] = [m.get("name", "") for m in models if m.get("name")]
                except Exception:
                    pass
                # Get currently loaded model (running)
                try:
                    resp = await client.get(f"{orch.base_url}/api/ps")
                    if resp.status_code == 200:
                        running = resp.json().get("models", [])
                        if running:
                            result["loaded_model"] = running[0].get("name", "")
                except Exception:
                    pass
        
        # Run async in sync context
        try:
            loop = asyncio.get_running_loop()
            # Already in async context, can't nest — return empty, will be filled by router
            return result
        except RuntimeError:
            asyncio.run(_fetch())
    except Exception as e:
        logger.warning(f"Model detection failed: {e}")
    return result
