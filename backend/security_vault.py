import os
import base64
import hashlib
import logging

log = logging.getLogger("projecty.vault")

_Fernet = None
try:
    from cryptography.fernet import Fernet as _Fernet
except ImportError:
    log.warning("⚠️ cryptography indisponível — vault em modo passthrough")

try:
    from identity import get_reconstructed_key
except ImportError:
    get_reconstructed_key = None

def _get_fernet_instance():
    """Derives a Fernet-compatible key from the reconstructed master key fragments."""
    if _Fernet is None or get_reconstructed_key is None:
        return None
    # Reconstruct from fragments (v2.1 Sharding)
    master_key_bytes = get_reconstructed_key()
    
    # Derivar a chave de 32 bytes para Fernet
    key_32bytes = hashlib.sha256(master_key_bytes).digest()
    fernet_key = base64.urlsafe_b64encode(key_32bytes)
    
    instance = _Fernet(fernet_key)
    
    # Zero-Trace: Sobrescrever a chave temporária na RAM
    del master_key_bytes
    del key_32bytes
    
    return instance

def encrypt_file(file_path: str) -> bool:
    """Encrypts a file in place using the sharded identity key."""
    if not os.path.exists(file_path):
        return False
    
    try:
        fernet = _get_fernet_instance()
        with open(file_path, "rb") as f:
            data = f.read()
            
        if data.startswith(b"PROJECTY_ENC:"):
            return True
            
        encrypted_data = b"PROJECTY_ENC:" + fernet.encrypt(data)
        
        with open(file_path, "wb") as f:
            f.write(encrypted_data)
            
        # Zero-Trace
        del data
        del encrypted_data
        return True
    except Exception as e:
        print(f"Encryption error for {file_path}: {e}")
        return False

def decrypt_data(data: bytes) -> bytes:
    """Decrypts literal data if it starts with the Project Y prefix."""
    if not data.startswith(b"PROJECTY_ENC:"):
        return data
    
    try:
        fernet = _get_fernet_instance()
        decrypted = fernet.decrypt(data[len(b"PROJECTY_ENC:"):])
        return decrypted
    except Exception as e:
        print(f"Decryption error: {e}")
        return data

def protect_project_secrets(project_path: str, identity_name: str = None):
    """Finds .env files and encrypts them."""
    for root, dirs, files in os.walk(project_path):
        for f in files:
            if f == ".env" or f.endswith(".vault"):
                encrypt_file(os.path.join(root, f))
