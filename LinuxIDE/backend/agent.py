"""Lumina IDE — Agentic File Operations.

Parses AI model responses for file blocks and writes them to the workspace.
Also provides Ollama 0.19+ tool calling support for structured agent actions.

File block format (legacy/fallback):
    📄 FILE: relative/path/to/file.ext
    ```lang
    content here
    ```

Tool calling format (Ollama 0.19+):
    LLM returns tool_calls → execute_tool_call() dispatches → result returned to LLM
"""

from __future__ import annotations

import os
import re
import json
import glob as glob_module
import logging
import difflib
from terminal import run_command_in_terminal, run_command_capture  # type: ignore[import]

log = logging.getLogger(__name__)

try:
    kb_path = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
    with open(kb_path, "r", encoding="utf-8") as f:
        KNOWLEDGE_BASE = json.dumps(json.load(f), indent=2)
except Exception:
    KNOWLEDGE_BASE = "{}"


# ═══════════════════════════════════════════════════════════════════════
# TOOL CALLING — Ollama 0.19+ structured agent actions
# ═══════════════════════════════════════════════════════════════════════

LUMINA_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "file_write",
            "description": (
                "Cria um novo arquivo ou sobrescreve um arquivo existente com conteúdo completo. "
                "Use para criar novos arquivos ou quando precisar reescrever um arquivo inteiro. "
                "REGRAS: "
                "1) O path deve ser RELATIVO à raiz do workspace (ex: 'src/app.py', NÃO '/home/user/projeto/src/app.py'). "
                "2) Sempre forneça o conteúdo COMPLETO do arquivo — nunca use placeholders como '// ... rest of code'. "
                "3) Para mudanças pequenas em arquivos existentes, prefira file_edit em vez de file_write. "
                "4) Se não tem certeza do conteúdo atual, use file_read primeiro."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Caminho relativo do arquivo (ex: src/app.py, index.html)"},
                    "content": {"type": "string", "description": "Conteúdo completo do arquivo a ser escrito"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "file_edit",
            "description": (
                "Edita um trecho específico de um arquivo existente sem reescrever tudo. "
                "Substitui old_string por new_string. Ideal para mudanças cirúrgicas. "
                "REGRAS: "
                "1) SEMPRE use file_read ANTES de editar para ver o conteúdo atual com line numbers. "
                "2) old_string deve ser EXATAMENTE igual ao texto no arquivo (incluindo indentação e espaços). "
                "3) old_string deve ser ÚNICO no arquivo. Se existir mais de 1 ocorrência, use replace_all=true ou forneça mais contexto. "
                "4) Para adicionar código no final do arquivo, use old_string com as últimas linhas e new_string com essas linhas + o novo código. "
                "5) Preserve a indentação original (tabs vs espaços)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Caminho relativo do arquivo a editar"},
                    "old_string": {"type": "string", "description": "Texto EXATO a ser substituído (incluindo indentação). Deve ser único no arquivo."},
                    "new_string": {"type": "string", "description": "Novo texto que substituirá o old_string"},
                    "replace_all": {"type": "boolean", "description": "Se true, substitui TODAS as ocorrências. Default: false (apenas primeira)."}
                },
                "required": ["path", "old_string", "new_string"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "file_delete",
            "description": "Deleta um arquivo ou diretório do workspace. Use com cuidado — operação irreversível.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Caminho relativo do arquivo ou diretório a deletar"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "file_read",
            "description": (
                "Lê o conteúdo de um arquivo do workspace com line numbers. "
                "SEMPRE use esta tool ANTES de file_edit para ver o conteúdo atual e copiar o old_string exato. "
                "O output inclui line numbers no formato '  N│ conteúdo' para facilitar referência. "
                "Arquivos grandes são truncados em 15K caracteres."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Caminho relativo do arquivo a ler"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_directory",
            "description": (
                "Lista o conteúdo de um diretório no workspace, mostrando arquivos e subdiretórios. "
                "Use para explorar a estrutura do projeto antes de criar ou editar arquivos. "
                "Retorna nomes, tipos (arquivo/diretório) e tamanhos. "
                "Para ver a raiz do workspace, use path='.'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Caminho relativo do diretório (ex: '.', 'src', 'src/components'). Default: '.'"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": (
                "Executa um comando no terminal e retorna stdout/stderr. "
                "Use para: instalar dependências (npm install, pip install), rodar testes (pytest, npm test), "
                "build (npm run build), git (git status, git diff), verificar erros, etc. "
                "O output é capturado e retornado para que você possa reagir a erros. "
                "REGRAS: "
                "1) Comandos destrutivos (rm -rf, format, shutdown) são bloqueados automaticamente. "
                "2) Timeout padrão: 30s. Máximo: 120s. "
                "3) O diretório de trabalho é a raiz do workspace."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "Comando a executar (ex: npm install, python main.py, git status)"},
                    "timeout": {"type": "integer", "description": "Timeout em segundos (default: 30, max: 120)"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_files",
            "description": (
                "Busca arquivos no workspace por nome ou por conteúdo (grep). "
                "Use type='filename' para buscar por nome de arquivo. "
                "Use type='content' para buscar texto dentro dos arquivos (como grep). "
                "Resultados de conteúdo incluem arquivo:linha: trecho para contexto. "
                "Ignora node_modules, __pycache__, .git e diretórios ocultos."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Texto ou padrão a buscar"},
                    "type": {"type": "string", "enum": ["filename", "content"], "description": "Buscar por nome ou conteúdo. Default: filename"}
                },
                "required": ["query"]
            }
        }
    }
]



def safe_path(workspace_path: str, rel_path: str) -> str:
    """Resolve and validate a path stays within the workspace. Raises ValueError if escape."""
    # Clean the relative path
    rel_path = rel_path.strip().strip('"').strip("'").replace("\\", "/").lstrip("/")
    while rel_path.startswith("../"):
        rel_path = rel_path[3:]

    # Strip workspace folder name if duplicated
    ws_folder = os.path.basename(os.path.normpath(workspace_path))
    if rel_path.startswith(ws_folder + "/"):
        rel_path = rel_path[len(ws_folder) + 1:]

    full_path = os.path.normpath(os.path.join(workspace_path, rel_path))
    if not full_path.startswith(os.path.normpath(workspace_path)):
        raise ValueError(f"Path escape blocked: {rel_path}")
    return full_path


def execute_tool_call(name: str, arguments: dict, workspace_path: str) -> dict:
    """Execute a tool call from the LLM and return structured result.
    
    This is the core dispatcher for Ollama 0.19+ tool calling.
    Each tool returns a dict with at minimum {status, action/error}.
    """
    log.info(f"🔧 [Tool Call] {name}({json.dumps(arguments, ensure_ascii=False)[:200]})")

    try:
        if name == "file_write":
            path = arguments["path"]
            content = arguments["content"]
            full_path = safe_path(workspace_path, path)
            existed = os.path.isfile(full_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            action = "modified" if existed else "created"
            size = len(content.encode("utf-8"))
            log.info(f"✅ [Tool] file_write: {path} ({action}, {size}B)")
            return {"status": "ok", "action": action, "path": path, "size": size}

        elif name == "file_edit":
            path = arguments["path"]
            old_string = arguments["old_string"]
            new_string = arguments["new_string"]
            replace_all = arguments.get("replace_all", False)
            full_path = safe_path(workspace_path, path)

            # Validate: no-op check (Claude Code pattern)
            if old_string == new_string:
                return {"status": "error", "message": "old_string e new_string são idênticos. Nenhuma alteração necessária."}

            if not os.path.isfile(full_path):
                # If old_string is empty, this means "create new file" (Claude pattern)
                if old_string == "":
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                        f.write(new_string)
                    size = len(new_string.encode("utf-8"))
                    log.info(f"✅ [Tool] file_edit: {path} (created via empty old_string, {size}B)")
                    return {"status": "ok", "action": "created", "path": path, "size": size}
                return {"status": "error", "message": f"Arquivo não encontrado: {path}. Use file_read ou list_directory para ver arquivos existentes."}

            content = open(full_path, "r", encoding="utf-8", errors="ignore").read()

            # Empty old_string on existing file = append (if file is empty, replace)
            if old_string == "":
                if content.strip() != "":
                    return {"status": "error", "message": f"old_string está vazio mas {path} já tem conteúdo. Use file_read para ver o conteúdo e forneça o old_string correto."}
                new_content = new_string
            else:
                count = content.count(old_string)
                if count == 0:
                    lines = content.splitlines()
                    snippet = "\n".join(f"  {i+1}│ {l}" for i, l in enumerate(lines[:20]))
                    return {"status": "error", "message": f"old_string não encontrado em {path}. Use file_read para ver o conteúdo atual. Primeiras 20 linhas:\n{snippet}"}
                if count > 1 and not replace_all:
                    return {"status": "error", "message": f"old_string encontrado {count} vezes em {path}. Use replace_all=true para substituir todas, ou forneça mais contexto para tornar old_string único."}
                if replace_all:
                    new_content = content.replace(old_string, new_string)
                else:
                    new_content = content.replace(old_string, new_string, 1)

            with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)

            old_lines = content.splitlines(keepends=True)
            new_lines = new_content.splitlines(keepends=True)
            diff = list(difflib.unified_diff(old_lines, new_lines, fromfile=f"antes/{path}", tofile=f"depois/{path}"))
            diff_str = "".join(diff[:80])

            replacements = count if (old_string and replace_all) else 1
            log.info(f"✅ [Tool] file_edit: {path} (edited, {replacements} replacement(s))")
            return {"status": "ok", "action": "edited", "path": path, "diff": diff_str, "replacements": replacements}

        elif name == "file_delete":
            import shutil
            path = arguments["path"]
            full_path = safe_path(workspace_path, path)
            if os.path.isfile(full_path):
                os.remove(full_path)
                log.info(f"✅ [Tool] file_delete: {path} (file removed)")
                return {"status": "ok", "action": "deleted", "path": path}
            elif os.path.isdir(full_path):
                shutil.rmtree(full_path)
                log.info(f"✅ [Tool] file_delete: {path} (directory removed)")
                return {"status": "ok", "action": "deleted", "path": path}
            else:
                return {"status": "error", "message": f"Não encontrado: {path}"}

        elif name == "file_read":
            path = arguments["path"]
            full_path = safe_path(workspace_path, path)
            if not os.path.isfile(full_path):
                return {"status": "error", "message": f"Arquivo não encontrado: {path}. Use list_directory ou search_files para encontrar arquivos."}
            raw = open(full_path, "r", encoding="utf-8", errors="ignore").read()
            lines = raw.splitlines()
            max_digits = len(str(len(lines)))
            numbered = "\n".join(f"{str(i+1).rjust(max_digits)}│ {line}" for i, line in enumerate(lines))
            if len(numbered) > 15000:
                numbered = numbered[:15000] + f"\n\n... (arquivo truncado, {len(lines)} linhas total)"
            log.info(f"✅ [Tool] file_read: {path} ({len(lines)} linhas)")
            return {"status": "ok", "path": path, "content": numbered, "lines": len(lines)}

        elif name == "list_directory":
            path = arguments.get("path", ".")
            full_path = safe_path(workspace_path, path)
            if not os.path.isdir(full_path):
                return {"status": "error", "message": f"Diretório não encontrado: {path}"}
            # Skip dirs consistent with search_files
            skip_dirs = {'.git', '__pycache__', '.venv', 'venv', 'node_modules', '.next', '.cache', '.idea', '.vs', '.vscode'}
            entries = []
            try:
                for entry in sorted(os.listdir(full_path)):
                    if entry.startswith('.') and entry not in {'.env', '.gitignore', '.editorconfig'}:
                        continue
                    if entry in skip_dirs:
                        continue
                    entry_path = os.path.join(full_path, entry)
                    if os.path.isdir(entry_path):
                        try:
                            children = len([e for e in os.listdir(entry_path) if not e.startswith('.')])
                        except PermissionError:
                            children = 0
                        entries.append(f"📁 {entry}/ ({children} items)")
                    else:
                        size = os.path.getsize(entry_path)
                        if size < 1024:
                            size_str = f"{size}B"
                        elif size < 1024 * 1024:
                            size_str = f"{size/1024:.1f}KB"
                        else:
                            size_str = f"{size/1024/1024:.1f}MB"
                        entries.append(f"📄 {entry} ({size_str})")
            except PermissionError:
                return {"status": "error", "message": f"Sem permissão para ler: {path}"}
            listing = "\n".join(entries) if entries else "(diretório vazio)"
            log.info(f"✅ [Tool] list_directory: {path} ({len(entries)} entries)")
            return {"status": "ok", "path": path, "listing": listing, "count": len(entries)}

        elif name == "bash":
            command = arguments["command"]
            timeout = min(int(arguments.get("timeout", 30)), 120)  # cap at 120s
            result = run_command_capture(command, cwd=workspace_path, timeout=timeout)
            log.info(f"✅ [Tool] bash: {command} → {result['status']} (exit={result.get('exit_code', '?')})")
            return result

        elif name == "search_files":
            query = arguments["query"]
            search_type = arguments.get("type", "filename")
            results = []
            
            if search_type == "filename":
                for root, dirs, files in os.walk(workspace_path):
                    # Skip hidden/node_modules
                    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules' and d != '__pycache__']
                    for fname in files:
                        if query.lower() in fname.lower():
                            rel = os.path.relpath(os.path.join(root, fname), workspace_path).replace("\\", "/")
                            results.append(rel)
                            if len(results) >= 20:
                                break
                    if len(results) >= 20:
                        break
            else:  # content search
                for root, dirs, files in os.walk(workspace_path):
                    dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules' and d != '__pycache__']
                    for fname in files:
                        if fname.endswith(('.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.md', '.txt', '.yaml', '.yml', '.toml', '.go', '.rs', '.rb', '.php', '.sh', '.env', '.cfg', '.ini', '.sql', '.vue', '.svelte')):
                            fp = os.path.join(root, fname)
                            try:
                                with open(fp, "r", encoding="utf-8", errors="ignore") as fh:
                                    for i, line in enumerate(fh, 1):
                                        if query.lower() in line.lower():
                                            rel = os.path.relpath(fp, workspace_path).replace("\\", "/")
                                            results.append(f"{rel}:{i}: {line.strip()[:100]}")
                                            if len(results) >= 30:
                                                break
                            except Exception:
                                pass
                    if len(results) >= 30:
                        break

            log.info(f"✅ [Tool] search_files: '{query}' ({len(results)} results)")
            return {"status": "ok", "query": query, "results": results}

        else:
            return {"status": "error", "message": f"Tool desconhecida: {name}"}

    except ValueError as ve:
        log.warning(f"⚠️ [Tool] Security block: {ve}")
        return {"status": "error", "message": str(ve)}
    except Exception as exc:
        log.error(f"❌ [Tool] {name} failed: {exc}")
        return {"status": "error", "message": f"Erro ao executar {name}: {exc}"}


# ═══ SYSTEM PROMPTS ═══
# Tools prompt: For models that support tool calling (Ollama 0.19+, Cloud APIs)
# Legacy prompt: For models that only output text (regex-parsed FILE: blocks)

SYSTEM_PROMPT_TOOLS = """You are Lumina, an expert AI coding agent embedded in the Lumina IDE.
ALWAYS respond in Portuguese (pt-BR).

═══ WORKFLOW ═══

Você tem acesso a tools para manipular arquivos no workspace do usuário.
Siga este workflow para cada tarefa:

1. **Entender**: Leia o pedido do usuário com atenção.
2. **Explorar**: Use `list_directory` e `file_read` para entender o projeto antes de agir.
3. **Agir**: Use `file_write`, `file_edit`, ou `bash` para fazer as mudanças.
4. **Verificar**: Se possível, use `bash` para rodar testes ou build.

═══ REGRAS ═══

1. AÇÃO DIRETA: Quando o usuário pedir para criar/modificar/deletar — use as tools imediatamente.
2. LEIA ANTES DE EDITAR: SEMPRE use file_read antes de file_edit para ver o conteúdo com line numbers.
3. PATHS RELATIVOS: Use paths relativos à raiz do workspace (ex: 'src/app.py', não paths absolutos).
4. CONTEÚDO COMPLETO: Em file_write, forneça o arquivo INTEIRO — nunca use '// ...' como placeholder.
5. EDITS CIRÚRGICOS: Para mudanças pequenas, prefira file_edit (old_string → new_string) em vez de reescrever o arquivo todo.
6. CONVERSA: Se o usuário só quer conversar, responda normalmente sem chamar tools.
7. Observe o estilo de código existente e mantenha consistência (indentação, convenções, linguagem).

═══ QUALIDADE ═══

- Clean Code: nomes descritivos, funções focadas, DRY.
- Tipagem quando suportado (TypeScript, Python type hints).
- Comente trechos complexos, mas não o óbvio.
- Use Markdown nas respostas textuais.
- Seja direto e conciso.
""" + (f"\n\n[KNOWLEDGE BASE]\n{KNOWLEDGE_BASE}" if KNOWLEDGE_BASE != "{}" else "")

# Legacy prompt for models without tool calling — teaches FILE:/DELETE: syntax
SYSTEM_PROMPT_LEGACY = """You are Lumina, an expert AI coding agent embedded in the Lumina IDE.
You CREATE, MODIFY, and DELETE files directly in the user's workspace.
ALWAYS respond in Portuguese (pt-BR).

═══ REGRAS ABSOLUTAS ═══

1. AÇÃO DIRETA: Quando o usuário pedir para criar, modificar ou deletar — FAÇA IMEDIATAMENTE.
2. USE A WORKSPACE TREE: SEMPRE consulte a WORKSPACE TREE (no final deste prompt) para nomes REAIS dos arquivos. NUNCA invente nomes.
3. PATHS RELATIVOS AO ROOT: Use paths relativos à raiz do workspace.
4. CONTEÚDO COMPLETO: Ao modificar um arquivo, output o conteúdo INTEIRO atualizado.
5. CONVERSAS NORMAIS: Se o usuário está apenas conversando — RESPONDA NORMALMENTE EM TEXTO. NÃO use FILE:, DELETE:, COMMAND: ou TEMPLATE:.

═══ SINTAXE DE AÇÕES ═══

Para criar ou sobrescrever um arquivo:
FILE: caminho/relativo/arquivo.ext
```linguagem
conteúdo completo aqui
```

Para deletar:
DELETE: caminho/relativo/arquivo.ext

Para rodar um comando:
COMMAND: npm install

═══ EXEMPLO ═══
User: "cria um arquivo teste.txt com hello world"
Assistant:
FILE: teste.txt
```text
hello world
```
✅ `teste.txt` criado.

═══ QUALIDADE ═══
- Clean Code, DRY, tipagem, comentários úteis.
- Use Markdown nas respostas. Seja direto.

[KNOWLEDGE BASE & CONTEXT]
""" + KNOWLEDGE_BASE

# Default — used when tool calling is active
SYSTEM_PROMPT = SYSTEM_PROMPT_TOOLS

# Stripped system prompt for pure conversation — NO file operations syntax
CHAT_ONLY_PROMPT = """You are Lumina, a friendly and knowledgeable AI coding assistant embedded in the Lumina IDE.
ALWAYS respond in Portuguese (pt-BR).

Você é um assistente especializado em programação e tecnologia. Suas áreas incluem:
- **Linguagens**: Python, JavaScript, TypeScript, HTML/CSS, Rust, Go, Java, C/C++
- **Frameworks**: React, Vue, Next.js, FastAPI, Django, Express
- **DevOps**: Git, Docker, CI/CD, Linux
- **Conceitos**: Arquitetura de software, design patterns, algoritmos, banco de dados

═══ REGRAS ═══
- Responda de forma clara, concisa e amigável.
- Use **Markdown** (headings, bold, code blocks com linguagem) para formatar respostas.
- Para código curto, use inline code (`exemplo`). Para blocos maiores, use code fences.
- Seja direto. Se a pergunta é simples, dê uma resposta curta.
- NÃO use FILE:, DELETE:, COMMAND: ou TEMPLATE:. Responda apenas em texto.
"""


def classify_intent(prompt: str, model: str, ollama_host: str, ollama_port: int) -> str:
    """Fast keyword-based intent classification (v8.1).
    
    100% local, no LLM calls. Catches obvious greetings (CHAT) and obvious
    code/file commands (ACTION). Default is ACTION so the LLM gets tools.
    
    Returns 'ACTION' (default) or 'CHAT' (pure greetings/small talk).
    """
    prompt_lower = prompt.lower().strip()
    
    # Only classify as CHAT for very obvious non-coding messages
    obvious_chat = [
        "oi", "olá", "ola", "hello", "hi", "hey", "obrigado", "valeu", 
        "como vai", "tudo bem", "bom dia", "boa tarde", "boa noite",
        "thanks", "thank you", "tchau", "bye", "ok", "beleza", "blz",
    ]
    if prompt_lower in obvious_chat or len(prompt_lower) < 4:
        log.info("[Guardrail] ⚡ Fast-path CHAT (obvious greeting)")
        return "CHAT"
    
    # Fast-path ACTION for obvious file/code commands
    obvious_action = [
        "crie", "cria", "criar", "faça", "faz", "rode", "rodar", "roda",
        "configure", "instale", "instala", "execute", "delete", "apague",
        "modifique", "altere", "atualize", "gere", "gerar",
        "create", "make", "build", "run", "install", "fix", "setup",
        "arquivo", "pasta", "file", "folder", "terminal", "comando",
    ]
    if any(kw in prompt_lower for kw in obvious_action):
        log.info("[Guardrail] ⚡ Fast-path ACTION (obvious command)")
        return "ACTION"
    
    # Default: ACTION — tools are always available, model decides what to use
    return "ACTION"


# Regex to extract file blocks from model output
_FILE_BLOCK_RE = re.compile(
    r'(?:📄)?\s*(?:FILE|ARQUIVO):\s*([^\n]+)\s*\n'
    r'(?:```[a-zA-Z0-9_\-\+]*\n)?'
    r'(.*?)'
    r'(?:\n```)'
    r'|'
    r'(?:📄)?\s*(?:FILE|ARQUIVO):\s*([^\n]+)\s*\n'
    r'(.*?)'
    r'(?=\n(?:📄|🗑️|📦|⚙️|🔍|📖|📝|FILE:|ARQUIVO:|DELETE:|APAGAR:|COMMAND:|COMANDO:)|$)',
    re.IGNORECASE | re.DOTALL
)

# Regex to extract DELETE operations
_DELETE_RE = re.compile(
    r'(?:🗑️|🗑)?\s*(?:DELETE|APAGAR):\s*([^\n🗑]+)',
    re.IGNORECASE
)

# Regex to extract TEMPLATE operations
_TEMPLATE_RE = re.compile(
    r'(?:📦)?\s*TEMPLATE:\s*([^\n]+)',
    re.IGNORECASE
)

# Regex to extract COMMAND operations
_COMMAND_RE = re.compile(
    r'(?:⚙️)?\s*(?:COMMAND|COMANDO):\s*([^\n]+)',
    re.IGNORECASE
)

# Regex to extract SEARCH operations
_SEARCH_RE = re.compile(
    r'(?:🔍)?\s*SEARCH:\s*([^\n]+)',
    re.IGNORECASE
)

# Regex to extract READ operations
_READ_RE = re.compile(
    r'(?:📖)?\s*READ:\s*([^\n]+)',
    re.IGNORECASE
)

def parse_file_blocks(text: str) -> list[dict]:
    """Extract file operations from model output.

    Returns list of {'path': str, 'content': str, 'op': 'write'|'delete'|'template'}
    """
    blocks = []

    # Parse TEMPLATE operations
    for match in _TEMPLATE_RE.finditer(text):
        name = match.group(1).strip()
        blocks.append({"path": f"Template: {name}", "content": name, "op": "template"})

    # Parse COMMAND operations
    for match in _COMMAND_RE.finditer(text):
        cmd = match.group(1).strip()
        blocks.append({"path": f"Command: {cmd}", "content": cmd, "op": "command"})

    # Parse SEARCH operations
    for match in _SEARCH_RE.finditer(text):
        query = match.group(1).strip()
        blocks.append({"path": f"Search: {query}", "content": query, "op": "search"})

    # Parse READ operations
    for match in _READ_RE.finditer(text):
        file_path = match.group(1).strip()
        blocks.append({"path": f"Read: {file_path}", "content": file_path, "op": "read"})

    # Parse DELETE operations
    for match in _DELETE_RE.finditer(text):
        path = match.group(1).strip().strip('"').strip("'").replace("\\", "/").lstrip("/")
        while path.startswith("../"):
            path = path.removeprefix("../")
        if path:
            blocks.append({"path": path, "content": "", "op": "delete"})

    # Parse FILE blocks (write operations) — PRIMARY regex
    for match in _FILE_BLOCK_RE.finditer(text):
        # The regex has two alternations — check which one matched
        path_raw = match.group(1) or match.group(3) or ""
        content_raw = match.group(2) or match.group(4) or ""
        path = path_raw.strip().strip('"').strip("'")
        path = path.replace("\\", "/").lstrip("/")
        while path.startswith("../"):
            path = path.removeprefix("../")
        # Strip any remaining action prefix that leaked into the path
        for prefix in ['📄 FILE:', '📄FILE:', 'FILE:', 'ARQUIVO:']:
            if path.upper().startswith(prefix.upper()):
                path = path[len(prefix):].strip()
        content = content_raw.strip()
        if content.endswith('```'):
            content = content[:-3].strip()
        if path:
            blocks.append({"path": path, "content": content, "op": "write"})

    # ── GOD MODE JSON TOOL CALL PARSING ──
    # Para modelos carregados via llama.cpp que respondem com blocos JSON formatados
    json_block_re = re.compile(r'```json\n(\{.*?\})\n```', re.DOTALL | re.IGNORECASE)
    for match in json_block_re.finditer(text):
        try:
            tool_data = json.loads(match.group(1))
            name = tool_data.get("name")
            args = tool_data.get("arguments", {})
            if name == "file_write":
                blocks.append({"path": args.get("path", "unknown"), "content": args.get("content", ""), "op": "write"})
            elif name == "file_delete":
                blocks.append({"path": args.get("path", "unknown"), "content": "", "op": "delete"})
            elif name == "bash":
                blocks.append({"path": f"Command: {args.get('command', '')}", "content": args.get('command', ''), "op": "command"})
            elif name == "file_read":
                blocks.append({"path": f"Read: {args.get('path', '')}", "content": args.get('path', ''), "op": "read"})
            elif name == "search_files":
                blocks.append({"path": f"Search: {args.get('query', '')}", "content": args.get('query', ''), "op": "search"})
        except json.JSONDecodeError:
            pass

    # ── FUZZY FALLBACK for 8B models that don't use FILE: syntax ──
    # Only runs if primary regex found no write blocks.
    # Catches patterns like:
    #   **Python (app.py)**\n```python\ncode\n```
    #   1. **app.py**\n```python\ncode\n```
    #   ### Criando `app.py`\n```python\ncode\n```
    #   `app.py`:\n```python\ncode\n```
    write_blocks = [b for b in blocks if b.get("op") == "write"]
    if not write_blocks:
        fuzzy_blocks = _parse_fuzzy_file_blocks(text)
        if fuzzy_blocks:
            log.info(f"🔍 [Fuzzy CRUD] Recovered {len(fuzzy_blocks)} file block(s) from 8B model output")
            blocks.extend(fuzzy_blocks)

    # Debug logging for CRUD operations
    if blocks:
        log.info(f"🔍 [Agent CRUD] Parsed {len(blocks)} block(s): {[{'op': b['op'], 'path': b['path']} for b in blocks]}")
    else:
        log.debug("[Agent CRUD] No file blocks found in LLM output")

    return blocks


# Common code file extensions for fuzzy matching
_CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss', '.less',
    '.json', '.yaml', '.yml', '.toml', '.xml', '.md', '.txt', '.sh', '.bash',
    '.bat', '.ps1', '.rb', '.go', '.rs', '.java', '.kt', '.swift', '.c', '.cpp',
    '.h', '.hpp', '.cs', '.php', '.lua', '.r', '.sql', '.env', '.cfg', '.ini',
    '.vue', '.svelte', '.astro', '.dockerfile', '.graphql', '.prisma',
}


def _parse_fuzzy_file_blocks(text: str) -> list[dict]:
    """Fuzzy fallback parser for 8B models that embed code in markdown patterns.
    
    Detects these common patterns from small models:
    1. **Python (app.py)**\n```python\ncode\n```
    2. 1. **app.py**\n```python\ncode\n```  
    3. ### Criando `app.py`\n```python\ncode\n```
    4. `app.py`:\n```python\ncode\n```
    5. **Crie um arquivo chamado `app.py`**\n```python\ncode\n```
    """
    blocks = []
    seen_paths = set()
    
    # Find all code fences with content
    fence_re = re.compile(
        r'```([a-zA-Z0-9_\-\+]*)\n(.*?)\n```',
        re.DOTALL
    )
    
    for match in fence_re.finditer(text):
        lang = match.group(1).strip().lower()
        content = match.group(2).strip()
        
        if not content or len(content) < 10:
            continue  # Skip tiny snippets (likely examples, not full files)
        
        # Look backwards from the code fence for a filename
        pre_text = text[:match.start()]
        # Get the last 300 chars before the fence
        context = pre_text[-300:] if len(pre_text) > 300 else pre_text
        
        filename = _extract_filename_from_context(context, lang)
        
        if filename and filename not in seen_paths:
            seen_paths.add(filename)
            blocks.append({"path": filename, "content": content, "op": "write"})
    
    return blocks


def _extract_filename_from_context(context: str, lang: str) -> str:
    """Extract a filename from the text immediately preceding a code fence.
    
    Looks for patterns like:
    - **app.py** or **Python (app.py)**
    - `app.py` or `app.py`:
    - FILE: app.py (already caught, but just in case)
    - 'arquivo chamado app.py'
    - Criando app.py / Crie app.py
    """
    # Split into lines and check last 5 lines
    lines = context.strip().split('\n')
    search_text = '\n'.join(lines[-5:]) if len(lines) > 5 else context
    
    # Pattern 1: Explicit filename with extension in backticks: `app.py`
    m = re.search(r'`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`', search_text)
    if m:
        candidate = m.group(1)
        ext = '.' + candidate.rsplit('.', 1)[-1] if '.' in candidate else ''
        if ext.lower() in _CODE_EXTENSIONS:
            return candidate
    
    # Pattern 2: Bold filename: **app.py** or **(app.py)**
    m = re.search(r'\*\*\(?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)\)?\*\*', search_text)
    if m:
        candidate = m.group(1)
        ext = '.' + candidate.rsplit('.', 1)[-1] if '.' in candidate else ''
        if ext.lower() in _CODE_EXTENSIONS:
            return candidate
    
    # Pattern 3: "chamado X" or "named X" pattern
    m = re.search(r'(?:chamado|named|arquivo|file)\s+`?([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`?', search_text, re.IGNORECASE)
    if m:
        candidate = m.group(1)
        ext = '.' + candidate.rsplit('.', 1)[-1] if '.' in candidate else ''
        if ext.lower() in _CODE_EXTENSIONS:
            return candidate
    
    # Pattern 4: Filename with extension anywhere in last 2 lines
    last_lines = '\n'.join(lines[-2:]) if len(lines) > 2 else search_text
    m = re.search(r'(?:^|\s|[(`*])([a-zA-Z0-9_\-]+(?:/[a-zA-Z0-9_\-]+)*\.[a-zA-Z0-9]{1,6})', last_lines)
    if m:
        candidate = m.group(1)
        ext = '.' + candidate.rsplit('.', 1)[-1] if '.' in candidate else ''
        if ext.lower() in _CODE_EXTENSIONS:
            return candidate
    
    # Pattern 5: Infer from language tag if no filename found
    lang_to_ext = {
        'python': 'main.py', 'py': 'main.py',
        'javascript': 'index.js', 'js': 'index.js',
        'typescript': 'index.ts', 'ts': 'index.ts',
        'html': 'index.html',
        'css': 'styles.css',
        'json': 'data.json',
        'bash': 'script.sh', 'sh': 'script.sh',
        'yaml': 'config.yaml', 'yml': 'config.yaml',
    }
    # Only use language inference if there's a clear action context
    # (don't create files from random code examples)
    
    return ""  # No filename found — don't create a file


def filter_blocks(blocks: list[dict], user_prompt: str, workspace_path: str = "") -> list[dict]:
    """Post-parse guardrail: remove hallucinated or unsolicited operations.
    
    Filters out:
    - ALL file operations when user didn't ask for any (intent detection)
    - Template operations the user didn't ask for
    - Write operations with empty content
    - Paths that don't make sense for the workspace
    """
    if not blocks:
        return blocks

    prompt_lower = user_prompt.lower()
    
    # ── Intent Detection: Does the user actually want file operations? ──
    # These keywords indicate the user is requesting file/code actions
    action_keywords = [
        # Portuguese — verbs
        "cri", "criar", "crie", "cria", "criei", "criaçã",
        "modific", "modifique", "altere", "alter", "atualize", "atualiz",
        "delet", "apag", "remov", "exclui",
        "escrev", "adicione", "adiciona", "coloque", "coloca",
        "implemente", "implement", "faça", "faz", "gere", "gerar",
        "instale", "instala", "install", "rode", "rodar", "roda", "execute", "execut",
        "configur", "configure", "config", "setup", "sete", "setar",
        "programa", "programe", "desenvolv", "codific", "codifique",
        "corrij", "corrija", "corrig", "fix", "consert", "conserte",
        "ajust", "ajuste", "melhore", "melhor", "otimiz", "refat", "refator",
        "teste", "testa", "testar", "test",
        "abra", "abrir", "salv", "salvar", "salve",
        "inicializ", "inicialize", "inici",
        "mude", "mudar", "troque", "trocar", "renome", "renomei",
        "copie", "copiar", "mova", "mover",
        "resolv", "resolva",
        # Portuguese — nouns
        "template", "scaffold", "projeto",
        "arquivo", "file", "pasta", "folder", "diretório",
        "código", "code", "função", "function", "class",
        "componente", "component", "página", "page",
        "script", "módulo", "module", "pacote", "package",
        "terminal", "comando", "command",
        # English
        "create", "make", "add", "write", "modify", "update", "edit",
        "delete", "remove", "build", "generate", "run",
        "configure", "fix", "refactor", "implement", "deploy",
        "compile", "debug", "scaffold", "init", "start",
    ]
    
    user_wants_action = any(kw in prompt_lower for kw in action_keywords)
    
    if not user_wants_action:
        # User just said "oi", "ola", "obrigado", etc — block ALL file operations
        log.info(f"[Guardrail] ⛔ Blocked ALL {len(blocks)} file operations — user prompt has no action intent: '{user_prompt[:60]}'")
        return []

    filtered = []

    for block in blocks:
        op = block.get("op", "")

        # Guardrail 1: Only allow templates if user explicitly asked for one
        if op == "template":
            template_keywords = ["template", "react", "vite", "projeto novo", "novo projeto", "scaffold"]
            if not any(kw in prompt_lower for kw in template_keywords):
                log.info(f"[Guardrail] Blocked unsolicited template: {block['content']}")
                continue

        # Guardrail 2: Skip writes with empty content
        if op == "write" and not block.get("content", "").strip():
            log.info(f"[Guardrail] Blocked empty write: {block['path']}")
            continue

        # Guardrail 3: Block commands unless user explicitly asked
        if op == "command":
            command_keywords = ["rode", "rodar", "run", "execute", "instale", "instala", "install", "npm", "pip", "comando"]
            if not any(kw in prompt_lower for kw in command_keywords):
                log.info(f"[Guardrail] Blocked unsolicited command: {block['content']}")
                continue

        # Guardrail 4: Block deletes unless user explicitly asked
        if op == "delete":
            delete_keywords = ["delet", "apag", "remov", "exclui", "delete", "remove", "limpa", "limpar"]
            if not any(kw in prompt_lower for kw in delete_keywords):
                log.info(f"[Guardrail] Blocked unsolicited delete: {block['path']}")
                continue

        filtered.append(block)

    if len(filtered) != len(blocks):
        log.info(f"[Guardrail] Filtered {len(blocks) - len(filtered)} hallucinated blocks, {len(filtered)} remaining")

    return filtered


def write_file_blocks(workspace_path: str, blocks: list[dict], override_protection: bool = False) -> list[dict]:
    """Write/delete/scaffold extracted file blocks in the workspace.

    Returns list of {'path': str, 'status': 'created'|'modified'|'deleted'|'error', 'size': int}
    """
    results = []
    for block in blocks:
        
        # Handle TEMPLATE
        if block.get("op") == "template":
            name = block["content"].lower()
            if name == "react-vite-tailwind":
                try:
                    _scaffold_react_vite_tailwind(workspace_path)
                    results.append({"path": "React+Vite+Tailwind Template", "status": "created", "size": 0})
                except Exception as exc:
                    results.append({"path": "Template Error", "status": "error", "error": str(exc)})
            else:
                results.append({"path": f"Template {name} not found", "status": "error", "error": "Unknown template"})
            continue

        # Handle COMMAND
        if block.get("op") == "command":
            cmd = block["content"]
            # To be safe, try to get port 'cmd', or fallback if we implement multiple ports later.
            success = run_command_in_terminal(cmd, port="cmd")
            if success:
                results.append({"path": f"> {cmd}", "status": "created", "size": 0})
            else:
                results.append({"path": f"Failed to run: {cmd}", "status": "error", "error": "Terminal unavailable"})
            continue

        # Skip SEARCH and READ (handled via frontend intercept, but if passed here, return as status)
        if block.get("op") in ("search", "read"):
            results.append({"path": block["path"], "status": "created", "size": 0})
            continue

        # Strip workspace root folder name from path if duplicated
        # e.g., if workspace is C:\pastateste and LLM outputs "pastateste/index.html",
        # strip to just "index.html" to avoid C:\pastateste\pastateste\index.html
        rel_path = block["path"]
        ws_folder = os.path.basename(os.path.normpath(workspace_path))
        if rel_path.startswith(ws_folder + "/") or rel_path.startswith(ws_folder + "\\"):
            rel_path = rel_path[len(ws_folder) + 1:]
            log.info(f"[CRUD] Stripped workspace prefix: {block['path']} -> {rel_path}")

        full_path = os.path.normpath(os.path.join(workspace_path, rel_path))

        # Security: ensure path stays within workspace
        if not full_path.startswith(os.path.normpath(workspace_path)):
            continue

        # Handle DELETE
        if block.get("op") == "delete":
            try:
                if os.path.isfile(full_path):
                    os.remove(full_path)
                    results.append({"path": block["path"], "status": "deleted", "size": 0})
                elif os.path.isdir(full_path):
                    import shutil
                    shutil.rmtree(full_path)
                    results.append({"path": block["path"], "status": "deleted", "size": 0})
                else:
                    results.append({"path": block["path"], "status": "not_found", "size": 0})
            except Exception as exc:
                results.append({"path": block["path"], "status": "error", "error": str(exc)})
            continue

        # Handle EDIT (file_edit from God Mode JSON blocks)
        if block.get("op") == "edit":
            old_string = block.get("old_string", "")
            new_string = block.get("new_string", "")
            if not os.path.isfile(full_path):
                if old_string == "":
                    # Create new file
                    os.makedirs(os.path.dirname(full_path), exist_ok=True)
                    with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                        f.write(new_string)
                    results.append({"path": block["path"], "status": "created", "size": len(new_string.encode("utf-8"))})
                else:
                    results.append({"path": block["path"], "status": "error", "error": "File not found for edit"})
                continue

            content = open(full_path, "r", encoding="utf-8", errors="ignore").read()
            if old_string == "":
                new_content = new_string
            else:
                count = content.count(old_string)
                if count == 0:
                    results.append({"path": block["path"], "status": "error", "error": "old_string not found"})
                    continue
                new_content = content.replace(old_string, new_string, 1)

            with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(new_content)
                
            import difflib
            old_lines = content.splitlines(keepends=True)
            new_lines = new_content.splitlines(keepends=True)
            diff_lines = list(difflib.unified_diff(old_lines, new_lines, fromfile=f"antes/{block['path']}", tofile=f"depois/{block['path']}", lineterm=""))
            diff_str = "\n".join(diff_lines[:80])
            
            results.append({"path": block["path"], "status": "modified", "size": len(new_string.encode("utf-8")), "diff": diff_str})
            continue

        # Handle WRITE (create/modify)
        existed = os.path.isfile(full_path)
        old_content = ""
        if existed:
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as fh:
                    old_content = fh.read()
            except Exception:
                old_content = ""
        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8", newline="\n") as f:
                f.write(block["content"])
            
            # Generate unified diff for modified files
            diff_str = ""
            if existed and old_content != block["content"]:
                import difflib
                old_lines = old_content.splitlines(keepends=True)
                new_lines = block["content"].splitlines(keepends=True)
                diff_lines = list(difflib.unified_diff(
                    old_lines, new_lines,
                    fromfile=f"antes/{block['path']}",
                    tofile=f"depois/{block['path']}",
                    lineterm=""
                ))
                # Limit diff to 80 lines to avoid bloating SSE
                if len(diff_lines) > 80:
                    diff_str = "\n".join(diff_lines[:80]) + f"\n... (+{len(diff_lines) - 80} linhas omitidas)"
                else:
                    diff_str = "\n".join(diff_lines)
            
            result_entry = {
                "path": block["path"],
                "status": "modified" if existed else "created",
                "size": len(block["content"].encode("utf-8")),
            }
            if diff_str:
                result_entry["diff"] = diff_str
            results.append(result_entry)
        except Exception as exc:
            results.append({
                "path": block["path"],
                "status": "error",
                "error": str(exc),
            })

    return results


def _scaffold_react_vite_tailwind(workspace_path: str):
    """Creates a basic React + Vite + Tailwind project instantly."""
    files = {
        "package.json": """{
  "name": "lumina-generated-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.300.0",
    "gsap": "^3.12.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}""",
        "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})""",
        "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
        "postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
        "index.html": """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lumina Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
        "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
        "src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}"""
    }

    for rel_path, content in files.items():
        full_path = os.path.join(workspace_path, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
