# 🌟 Lumina IDE — O Ambiente de Codificação Autônomo e Inteligente

O **Lumina IDE** é um ambiente de desenvolvimento avançado que combina a privacidade e o baixo custo de Modelos de Linguagem Locais (via Ollama) com o poder dos melhores modelos Cloud, tudo focado em **autonomia agentic**.

Diferente de assistentes convencionais que apenas "conversam", o Lumina IDE atua como um engenheiro autônomo dentro do seu workspace.

---

## ⚡ Funcionalidades Principais

- **🤖 IA Híbrida Inteligente:** Alterna facilmente entre inferência local 100% privada (Ollama) e provedores Cloud de alta performance.
- **📦 Templates Nativos:** Scaffolding ultrarrápido; o agente monta infraestruturas inteiras (React + Vite + Tailwind, etc.) em milissegundos.
- **⚙️ Terminal Autônomo Injetável:** O modelo envia comandos (`npm install`, `npm run dev`) diretamente para o Terminal Integrado.
- **🧬 Self-Healing (Auto-Correção):** Se a compilação falhar, a IDE captura os logs e corrige o código automaticamente.
- **📝 Contexto Enriquecido:** Adicione `.txt` customizados de "Prompts Instrucionais" ou foque o agente em arquivos específicos.
- **🔍 Descoberta Autônoma de Arquivos:** O agente pesquisa (`🔍 SEARCH:`) e lê (`📖 READ:`) arquivos do workspace automaticamente.
- **🔍 File Explorer Dinâmico & Busca In-File:** Experiência similar ao VS Code com `Ctrl+F` in-file integrada.
- **🚀 Autocomplete Preditivo:** Ghost Text com previsão via Ollama, aceite com `Tab`.

---

## 🛠️ Tecnologias e Dependências

### 🐍 Backend (Python / FastAPI)
Motor que intercepta comandos do LLM e gerencia o file system e WebSockets do terminal.
- **Linguagem:** Python 3.9+
- **Framework:** FastAPI / Uvicorn (REST & WebSockets)
- **Banco de Dados:** SQLite embutido (`pulsyce.db` — criado automaticamente no diretório do backend)
- **Dependências:** `fastapi`, `uvicorn`, `sqlmodel`, `requests`, `tiktoken`, `python-dotenv`, `pydantic-settings`

### ⚛️ Frontend (React / Vite)
Interface ultrarrápida inspirada na filosofia Catppuccin.
- **Framework:** React.js
- **Build Tool:** Vite (ES Modules)
- **Estilização:** CSS Vanilla (Dark & Light themes)
- **Fontes:** Inter + JetBrains Mono

### 🧠 LLM Engine
- **Local (Ollama):** Modelos como `mistral`, `llama3`
- **Cloud:** OpenAI, Anthropic, Groq, Google AI, xAI, etc. (detectados pela API key)

---

## 🚀 Guia Completo de Instalação e Execução

### 📋 1. Pré-requisitos
- [Python 3.9+](https://www.python.org/downloads/) (marque "Add Python to PATH" na instalação)
- [Node.js 18+](https://nodejs.org/)
- [Ollama](https://ollama.com/) (motor local LLaMA-based)
- [Git](https://git-scm.com/download/win) (para clonar o repositório)

### 📥 2. Clonar o Repositório
```bash
git clone https://github.com/m1kezera/IDE.git
cd IDE
```

### 🤖 3. Inicializando o Ollama
```bash
# Terminal 1 — Inicie o servidor
ollama serve

# Terminal 2 — Baixe um modelo (1x)
ollama pull mistral
```

### 🧠 4. Subindo o Backend Python
```bash
cd backend

# Crie e ative um ambiente virtual
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Suba a API na porta 8000
python -m uvicorn main:app --reload --port 8000
```
> Ao ler "✅ Backend pronto! http://127.0.0.1:8000", significa que tudo está operacional.

### 💻 5. Subindo o Frontend Vite
```bash
cd frontend

# Instalar pacotes NPM
npm install

# Subir o servidor de desenvolvimento
npm run dev
```

### 🌍 6. Abrir no Navegador
Acesse `http://localhost:5173`. A UI do **Lumina IDE** abrirá em tela cheia.

### 🖥️ 7. Versão Desktop (Electron)
Para rodar como aplicativo desktop:
```bash
# Na raiz do projeto
npm install
npm run electron:dev
```

---

## 📁 Estrutura do Projeto

```
pulsyce/
├── backend/              # API Python (FastAPI)
│   ├── main.py           # Entrypoint — startup & rotas
│   ├── router.py         # Endpoints: generate, config, chat, models
│   ├── agent.py          # Parser de blocos de arquivo & escrita
│   ├── workspace.py      # API de File System (browse, read, write)
│   ├── terminal.py       # WebSocket terminal & command injection
│   ├── telemetry.py      # Analytics de tokens & custos
│   ├── chunker.py        # Sliding window para modelos locais
│   ├── database.py       # SQLite engine & sessions
│   ├── models.py         # Modelos SQLModel (UsageLog, Chat, Config)
│   ├── config.py         # Settings via .env
│   ├── extensions.py     # API de extensões
│   └── requirements.txt  # Dependências Python
├── frontend/             # Interface React (Vite)
│   ├── src/
│   │   ├── App.jsx       # Componente principal
│   │   ├── main.jsx      # Entry point React
│   │   ├── style.css     # Design system completo
│   │   ├── components/   # ActivityBar, BottomPanel, FileEditor, etc.
│   │   └── services/     # api.js (API service layer)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── electron/             # Desktop app (Electron)
│   ├── main.js           # Processo principal
│   └── preload.js        # Bridge seguro
├── package.json          # Scripts Electron
└── .gitignore
```

---

## 🎓 Testando a IDE

### 1️⃣ Autocomplete In-Editor
1. Abra um arquivo `.js` no Explorer
2. Digite `function sumArray(arr) {` e pare
3. Ghost Text aparecerá após ~800ms — aperte **Tab** para aceitar

### 2️⃣ Workflow Autônomo
No chat do Agent, digite:
> *"Construa um site em React com navbar animada e landing page corporativa."*

O Lumina irá:
1. Usar `📦 TEMPLATE` para scaffolding instantâneo
2. Escrever componentes via `📄 FILE:`
3. Executar `⚙️ COMMAND: npm install` e `npm run dev`
4. Auto-corrigir erros se houver

### 3️⃣ Descoberta de Arquivos
> *"Me diga quais são os arquivos do meu projeto e o que tem dentro do index.html."*

O Lumina emitirá `🔍 SEARCH:` e `📖 READ:` automaticamente.

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+E` | Abrir Explorer |
| `Ctrl+`` ` `` | Toggle Terminal/Agent |
| `Ctrl+B` | Toggle Sidebar |
| `Ctrl+,` | Configurações |
| `Ctrl+S` | Salvar arquivo |
| `Ctrl+F` | Buscar no arquivo |
| `Ctrl+W` | Fechar aba |
| `Tab` | Aceitar autocomplete |

---

*(Lumina IDE — Local Intelligence, Global Performance)*
