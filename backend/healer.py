import os
import ast
import subprocess
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("projecty.healer")

def check_python_syntax(code: str) -> Optional[Dict[str, Any]]:
    """Runs a fast ast.parse on Python code to catch syntax issues."""
    try:
        ast.parse(code)
        return None
    except SyntaxError as e:
        return {
            "type": "error",
            "lang": "python",
            "line": getattr(e, "lineno", 1),
            "col": getattr(e, "offset", 1),
            "msg": str(e.msg),
            "suggestion": f"# Falha detectada: {e.msg}\n# A inteligência sugere revisar esta linha."
        }
    except Exception as e:
        return None

def check_js_syntax(code: str) -> Optional[Dict[str, Any]]:
    """Basic structural JS/JSX check (unclosed braces, trailing imports).
    For a perfect check, we'd spawn `node` but for performance we do simple regex
    or shell out to a lightweight linter. Here we use an extreme fallback heuristic.
    """
    # Quick unclosed braces check
    open_b = code.count('{')
    close_b = code.count('}')
    if open_b > close_b:
        return {
            "type": "error",
            "lang": "javascript",
            "line": code[:code.rfind('{')].count('\n') + 1 if open_b > close_b else 1,
            "col": 1,
            "msg": f"Erro de Estrutura: {open_b} chaves abertas, mas apenas {close_b} fechadas.",
            "suggestion": "Verifique o fechamento da última função ou objeto."
        }
    elif close_b > open_b:
        return {
            "type": "error",
            "lang": "javascript",
            "line": code.count('\n'),
            "col": 1,
            "msg": f"Erro de Estrutura: chaves fechadas demais ({close_b} contra {open_b}).",
            "suggestion": "Remova a chave extra."
        }
    return None

def heal_file(file_path: str) -> Optional[Dict[str, Any]]:
    """Entry point from watcher. Reads the file and validates it."""
    if not os.path.exists(file_path):
        return None

    ext = file_path.split('.')[-1].lower()
    if ext not in ['py', 'js', 'jsx', 'ts', 'tsx']:
        return None

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception:
        return None

    if ext == 'py':
        return check_python_syntax(code)
    else:
        return check_js_syntax(code)
