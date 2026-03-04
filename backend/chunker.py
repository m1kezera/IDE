"""Lumina IDE — Module B: Smart Context Processor (Chunking).

Implements sliding-window code splitting so local 7B models
(Mistral / Llama) don't lose accuracy on long files.
"""

from __future__ import annotations

import tiktoken

# Use cl100k_base — same encoder used by GPT-4 / GPT-3.5
_ENCODING = tiktoken.get_encoding("cl100k_base")

DEFAULT_MAX_TOKENS = 1200
DEFAULT_OVERLAP = 150


def count_tokens(text: str) -> int:
    """Return the exact token count for *text*."""
    return len(_ENCODING.encode(text))


def chunk_code(
    text: str,
    max_tokens: int = DEFAULT_MAX_TOKENS,
    overlap: int = DEFAULT_OVERLAP,
) -> list[dict]:
    """Split *text* into overlapping token windows.

    Returns a list of dicts: ``[{"index": 0, "content": "...", "tokens": 800}, ...]``
    Files with ≤ *max_tokens* are returned as a single chunk.
    """
    tokens = _ENCODING.encode(text)
    total = len(tokens)

    if total <= max_tokens:
        return [{"index": 0, "content": text, "tokens": total}]

    chunks: list[dict] = []
    start = 0
    idx = 0

    while start < total:
        end = min(start + max_tokens, total)
        chunk_tokens = tokens[start:end]
        chunk_text = _ENCODING.decode(chunk_tokens)

        chunks.append({
            "index": idx,
            "content": chunk_text,
            "tokens": len(chunk_tokens),
        })

        # Advance the window, keeping *overlap* tokens from the previous chunk
        start += max_tokens - overlap
        idx += 1

    return chunks


def merge_results(chunks_output: list[dict]) -> dict:
    """Unify multiple chunked JSON responses into a single report.

    Each item in *chunks_output* is expected to have at least a
    ``"response"`` key (string) and optionally ``"prompt_tokens"``
    and ``"completion_tokens"`` integers.
    """
    merged_text_parts: list[str] = []
    total_prompt = 0
    total_completion = 0

    for chunk in chunks_output:
        merged_text_parts.append(chunk.get("response", ""))
        total_prompt += chunk.get("prompt_tokens", 0)
        total_completion += chunk.get("completion_tokens", 0)

    return {
        "response": "\n".join(merged_text_parts),
        "total_chunks": len(chunks_output),
        "prompt_tokens": total_prompt,
        "completion_tokens": total_completion,
        "total_tokens": total_prompt + total_completion,
    }
