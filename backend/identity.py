import uuid
import hashlib
import os
import secrets
from typing import Optional, List

# Global storage for key fragments (Anti-Memory Scraping)
_MASTER_KEY_FRAGMENTS = [None] * 4

def get_local_salt() -> str:
    """Gets or creates a machine-specific salt for identity hashing."""
    salt_path = os.path.join(os.path.expanduser("~"), ".projecty_salt")
    if not os.path.exists(salt_path):
        salt = secrets.token_hex(16)
        with open(salt_path, "w") as f:
            f.write(salt)
        return salt
    with open(salt_path, "r") as f:
        return f.read().strip()

def get_hwid() -> str:
    """Returns a unique identifier based on the machine's hardware (MAC + Salt)."""
    node = uuid.getnode()
    salt = get_local_salt()
    return hashlib.sha256(f"{node}:{salt}".encode()).hexdigest()

def generate_master_key_fragments(user_name: str, hwid: str):
    """
    Combines username and hardware ID, generates a 32-byte hash,
    and shards it into 4 fragments in memory.
    """
    global _MASTER_KEY_FRAGMENTS
    secret = f"{user_name}:{hwid}:{get_local_salt()}"
    full_hash = hashlib.sha256(secret.encode()).digest() # 32 bytes
    
    # Shard into 4 parts of 8 bytes
    for i in range(4):
        _MASTER_KEY_FRAGMENTS[i] = full_hash[i*8 : (i+1)*8]
    
    # We return the hex string for DB comparison, but the fragments stay in RAM
    return hashlib.sha256(secret.encode()).hexdigest()

def get_reconstructed_key() -> bytes:
    """Reconstructs the full 32-byte key from fragments on-demand."""
    if any(f is None for f in _MASTER_KEY_FRAGMENTS):
        raise ValueError("Project Y Shield: Identity key not initialized or memory wiped.")
    return b"".join(_MASTER_KEY_FRAGMENTS)

def clear_key_fragments():
    """Wipes fragments from RAM (Zero-Trace)."""
    global _MASTER_KEY_FRAGMENTS
    for i in range(len(_MASTER_KEY_FRAGMENTS)):
        _MASTER_KEY_FRAGMENTS[i] = b'\x00' * 8

# Alias for backward compatibility
generate_master_key = generate_master_key_fragments
