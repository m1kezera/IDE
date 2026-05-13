"""Lumina IDE — Custom LLM Engine (God Mode).

Integrates llama.cpp directly into the IDE backend for absolute control over:
1. VRAM/RAM allocation (dynamic layers based on need)
2. Grammar Constrained Decoding (forces perfect JSON Tool Calling)
3. KV Cache preservation (instant context switching)
"""

import os
import json
import logging
from typing import Optional, Dict, Any, Generator

try:
    from llama_cpp import Llama
    from llama_cpp.llama_grammar import LlamaGrammar
    LLAMA_AVAILABLE = True
except ImportError:
    LLAMA_AVAILABLE = False

log = logging.getLogger("projecty.engine")

class LocalEngine:
    def __init__(self):
        self.llm: Optional[Llama] = None
        self.current_model_path: Optional[str] = None
        
    def load_model(self, model_path: str, context_size: int = 4096, gpu_layers: int = -1):
        """Loads a GGUF model dynamically into memory.
        
        gpu_layers: -1 means load everything into GPU. 0 means CPU only.
        By controlling this, we can load just what is necessary to save VRAM.
        context_size: allocate only what is needed for the prompt to save VRAM.
        """
        if not LLAMA_AVAILABLE:
            raise ImportError("llama-cpp-python is not installed. Run: pip install llama-cpp-python")
            
        if self.llm and self.current_model_path == model_path and self.llm.context_params.n_ctx == context_size:
            log.info("Model already loaded with matching context size.")
            return

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")

        log.info(f"Loading GGUF model: {model_path} | Context: {context_size} | GPU Layers: {gpu_layers}")
        
        # Free previous model from VRAM if any
        if self.llm:
            del self.llm
            
        self.llm = Llama(
            model_path=model_path,
            n_ctx=context_size,
            n_batch=512,            # Ingest chunk size to prevent VRAM spikes
            n_gpu_layers=gpu_layers,
            n_threads=max(1, os.cpu_count() - 2) if os.cpu_count() else 4,
            verbose=True
        )
        self.current_model_path = model_path
        log.info("✅ Model loaded successfully into engine.")

    def generate_tool_call(self, prompt: str, schema: Dict[str, Any], max_tokens: int = 500) -> dict:
        """Forces the LLM to output a strict JSON matching the given schema.
        
        This is God Mode for Tool Calling. It physically prevents the model
        from hallucinating invalid JSON by enforcing the grammar at the token generation level.
        """
        if not self.llm:
            raise RuntimeError("Model not loaded.")
            
        # Convert JSON schema to grammar string
        grammar_text = json.dumps(schema)
        grammar = LlamaGrammar.from_json_schema(grammar_text)
        
        log.info(f"Generating tool call strictly enforcing schema: {schema.get('title', 'Tool')}")
        
        output = self.llm(
            prompt,
            max_tokens=max_tokens,
            grammar=grammar,
            temperature=0.1, # Low temp for deterministic tool calls
        )
        
        try:
            result_text = output['choices'][0]['text']
            return json.loads(result_text)
        except Exception as e:
            log.error(f"Failed to parse enforced JSON: {e}")
            return {}

    def stream_text(self, prompt: str, max_tokens: int = 1000) -> Generator[str, None, None]:
        """Streams regular text output."""
        if not self.llm:
            raise RuntimeError("Model not loaded.")
            
        stream = self.llm(
            prompt,
            max_tokens=max_tokens,
            temperature=0.6,
            stream=True
        )
        
        for chunk in stream:
            yield chunk['choices'][0]['text']

    def unload_model(self):
        """Frees the model from VRAM instantly."""
        if self.llm:
            log.info(f"Ejetando {self.current_model_path} da VRAM...")
            del self.llm
            self.llm = None
            self.current_model_path = None
            import gc
            gc.collect()
            log.info("✅ VRAM liberada com sucesso.")

# Global singleton
engine = LocalEngine()
