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
- **🎨 Design Studio:** Editor visual Figma-like para prototipagem de interfaces, com export para HTML/PNG/PDF e geração de código framework-aware.
- **🌐 Lumina Canvas:** Canvas infinito estilo Obsidian para organização visual de notas, links e arquivos com suporte a conexões, cores e markdown.
- **@ Menções Inteligentes:** Sistema de menções que injeta contexto (código ativo, terminal, canvas, workspace) diretamente no prompt do agente.

---

## 🛠️ Tecnologias e Dependências

### 🐍 Backend (Python / FastAPI)
Motor que intercepta comandos do LLM e gerencia o file system e WebSockets do terminal.
- **Linguagem:** Python 3.9+
- **Framework:** FastAPI / Uvicorn (REST & WebSockets)
- **Banco de Dados:** SQLite embutido (`pulsyce.db` — criado automaticamente no diretório do backend)
- **Dependências:** `fastapi`, `uvicorn`, `sqlmodel`, `requests`, `tiktoken`, `python-dotenv`, `pydantic-settings`

### ⚛️ Frontend (TypeScript / Vite)
Interface ultrarrápida com design system Catppuccin e componentes modulares.
- **Linguagem:** TypeScript
- **Build Tool:** Vite (ES Modules)
- **Canvas:** React Flow (`@xyflow/react`) para o Lumina Canvas
- **Estilização:** CSS Vanilla (Dark & Light themes via ThemeEngine)
- **Fontes:** Inter + JetBrains Mono
- **Markdown:** `marked` para renderização em nodes do canvas

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
cd frontend-ts

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

### 📦 8. Gerar Instalador (.exe) para Distribuição

#### 8.1 Empacotar o Backend (PyInstaller)
```bash
cd backend
.venv\Scripts\activate
pip install pyinstaller
python ..\scripts\build_backend.py
```
> Isto gera `backend/dist/lumina-backend/` com o executável standalone.

#### 8.2 Compilar o Frontend
```bash
cd frontend-ts
npm run build
```

#### 8.3 Gerar o Instalador Electron
```bash
# Na raiz do projeto
npm install
npm run dist
```
> O instalador `.exe` será gerado na pasta `release/`.

#### 📝 Extensões
As extensões são armazenadas em `%APPDATA%\lumina-ide\extensions\`.
Cada extensão é uma pasta com um arquivo `extension.json`.

---

## 🎨 Design Studio

O **Lumina Design Studio** é um editor visual WYSIWYG integrado à IDE para prototipagem rápida de interfaces. Funciona como uma versão simplificada do Figma, diretamente dentro do Lumina.

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Canvas Infinito** | Pan & zoom com mouse wheel, Space+drag para mover |
| **Artboards** | Múltiplas páginas com presets (Desktop, Tablet, Mobile, Watch) |
| **50+ Componentes** | Seções hero, navbars, cards, formulários, tabelas, efeitos, etc. |
| **Drag & Drop** | Arraste componentes da palette para o artboard |
| **Props Panel** | Edite textos, cores, opacidade, animações de cada componente |
| **Code View** | Visualize o HTML gerado em tempo real |
| **Preview** | Preview device-aware que respeita resolução do artboard |
| **Export HTML** | Exporta o artboard como arquivo `.html` completo |
| **Export PNG** | Captura o artboard como imagem retina (2x) |
| **Export PDF** | Imprime via `window.print()` com fallback |
| **Framework Scanner** | Detecta Next.js, React, Vue, Svelte, HTML do workspace |
| **Project Components** | Lista componentes `.tsx/.jsx/.vue/.svelte` do projeto |
| **Insert to Editor** | Gera código framework-aware (JSX/Vue/Svelte) e copia pro clipboard |
| **Create Component** | Cria arquivo de componente no diretório correto do projeto |
| **Enviar ao Agent** | Envia o protótipo HTML para o agente adaptar ao projeto |

### Abrindo o Design Studio
- Clique no botão **"🎨 Design Studio"** na barra de telemetria (topo da IDE)
- Ou envie o atalho via PubSub: `designstudio:open`

### Arquitetura
```
frontend-ts/src/ui/
├── DesignStudioPanel.ts   # Lógica principal (toolbar, canvas, scanner)
├── design-studio.css      # Estilos e responsive breakpoints
└── ds-components.ts       # 50+ definições de componentes HTML
```

### Framework Detection
Ao abrir, o Design Studio escaneia o workspace:
1. Lê `package.json` → detecta `next`, `react`, `vue`, `svelte` nos `dependencies`
2. Verifica config files (`next.config.js`, `svelte.config.js`, etc.)
3. Escaneia componentes (`.tsx`, `.jsx`, `.vue`, `.svelte`) excluindo `node_modules`, tests, pages
4. Exibe badge do framework e lista de componentes na sidebar

### Code Generation
O botão **"Insert to Editor"** gera código conforme o framework:

| Framework | Output |
|-----------|--------|
| **Next.js / React** | `'use client'; export default function Name() { return (<div>...</div>); }` |
| **Vue** | `<template>...</template><script setup lang="ts">...</script>` |
| **Svelte** | `<script lang="ts">...</script><div>...</div>` |
| **HTML** | `<!DOCTYPE html>` completo com `<style>` e Google Fonts |

---

## 🌐 Lumina Canvas

O **Lumina Canvas** é um canvas infinito inspirado no Obsidian Canvas para organização visual de ideias, notas, links e arquivos com conexões entre nós.

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| **Nós de Texto** | Cards Markdown com renderização completa (headings, code, links, listas) |
| **Nós de Link** | Embed de URLs com iframe e barra de URL |
| **Nós de Imagem** | Upload de imagens ou paste do clipboard com fallback base64 |
| **Nós de Grupo** | Agrupamento visual com drag-handle no topo, resize livre |
| **Conexões** | Edges com setas entre nós, labels editáveis via duplo-clique |
| **6 Cores** | Palette Obsidian (vermelho, laranja, amarelo, verde, azul, roxo) |
| **Undo/Redo** | Histórico de 50 estados (Ctrl+Z / Ctrl+Y) |
| **Context Menu** | Botão direito → editar, duplicar, colorir, deletar |
| **Nudge** | Arrow keys para mover nós selecionados (Shift = 20px) |
| **Multi-Seleção** | Shift+Click para seleção múltipla, Ctrl+A para tudo |
| **Duplicar** | Ctrl+D duplica nós selecionados com edges |
| **Export JSON** | Exporta no formato `.canvas` compatível com Obsidian |
| **Export PNG** | Captura o canvas como imagem via `html-to-image` |
| **Fit View** | Ajuste automático ao viewport (seleção ou tudo) |
| **Auto-save** | Debounce de 400ms salva alterações automaticamente |

### Abrindo o Canvas
- Abra qualquer arquivo `.canvas` no File Explorer
- Ou crie um novo arquivo com extensão `.canvas` (JSON vazio `{}` é aceito)

### Formato JSON Canvas (Obsidian Spec 1.0)
```json
{
  "nodes": [
    {
      "id": "abc123",
      "type": "text",
      "x": 100, "y": 200,
      "width": 240, "height": 120,
      "color": "1",
      "text": "# Meu Nó\n\nTexto em **markdown**."
    },
    {
      "id": "def456",
      "type": "group",
      "x": 50, "y": 150,
      "width": 400, "height": 300,
      "label": "Meu Grupo"
    }
  ],
  "edges": [
    {
      "id": "edge1",
      "fromNode": "abc123",
      "fromSide": "bottom",
      "toNode": "def456",
      "toSide": "top",
      "label": "conecta a"
    }
  ]
}
```

### Arquitetura
```
frontend-ts/src/ui/canvas/
├── CanvasApp.tsx           # App principal React Flow (toolbar, shortcuts, context menu)
├── canvasAdapter.ts        # Conversor JSON Canvas ↔ React Flow
├── canvas-flow.css         # Estilos Obsidian-dark para nodes, edges, toolbar
├── CanvasEngine.ts         # Engine de renderização legado
├── CanvasInteraction.ts    # Interações do canvas legado
├── CanvasNodeElement.ts    # Elemento de node legado
├── CanvasRenderer.ts       # Renderer legado
└── nodes/                  # Componentes React personalizados
    ├── TextNode.tsx         # Nó Markdown com tinting por cor
    ├── LinkNode.tsx         # Nó iframe com barra de URL
    ├── FileNode.tsx         # Nó de referência a arquivo
    ├── ImageNode.tsx        # Nó de imagem
    └── GroupNode.tsx        # Grupo com drag-handle e resize
```

### Cores Obsidian
| Código | Cor | Hex |
|--------|-----|-----|
| `1` | Vermelho | `#fb4934` |
| `2` | Laranja | `#fe8019` |
| `3` | Amarelo | `#fabd2f` |
| `4` | Verde | `#b8bb26` |
| `5` | Azul | `#83a598` |
| `6` | Roxo | `#d3869b` |

---

## @ Menções — Sistema de Contexto do Agent

O sistema de **@menções** permite injetar contexto relevante diretamente no prompt enviado ao modelo de linguagem, sem precisar copiar/colar manualmente.

### Como Usar
1. **Digitar no chat:** Type `@` seguido do nome da menção (ex: `@code`, `@terminal`)
2. **Botão @:** Clique no botão **@** ao lado do input para ver todas as opções
3. **Navegação:** Use ↑↓ para navegar e Enter/Tab para selecionar
4. **Chips:** As menções ativas aparecem como chips acima do input
5. **Remover:** Clique no ✕ do chip para remover uma menção

### Menções Disponíveis

| Menção | Ícone | O que injeta |
|--------|-------|-------------|
| `@code` | 📄 | Conteúdo do arquivo aberto no editor (até 8000 chars) |
| `@problems` | ⚠️ | Erros e avisos do painel de Problems |
| `@canvas` | 🌐 | Dados do Lumina Canvas ativo (nodes, edges, JSON) |
| `@design` | 🎨 | HTML gerado pelo Design Studio |
| `@terminal` | 💻 | Output recente do terminal (últimos 3000 chars) |
| `@workspace` | 📁 | Info do workspace (nome, branch git) |

### Comportamento
- Múltiplas menções podem ser ativadas simultaneamente
- O botão **@** exibe um badge com a contagem de menções ativas
- Ao enviar a mensagem, o contexto é injetado automaticamente no prompt
- O chat exibe apenas o texto digitado (sem o contexto expandido)
- Após o envio, todas as menções são automaticamente limpas

---

## 📁 Estrutura do Projeto

```
pulsyce/
├── backend/                # API Python (FastAPI)
│   ├── main.py             # Entrypoint — startup & rotas
│   ├── router.py           # Endpoints: generate, config, chat, models
│   ├── agent.py            # Parser de blocos de arquivo & escrita
│   ├── workspace.py        # API de File System (browse, read, write)
│   ├── terminal.py         # WebSocket terminal & command injection
│   ├── telemetry.py        # Analytics de tokens & custos
│   ├── chunker.py          # Sliding window para modelos locais
│   ├── knowledge_base.json # Library — base de conhecimento do agent
│   ├── database.py         # SQLite engine & sessions
│   ├── models.py           # Modelos SQLModel (UsageLog, Chat, Config)
│   ├── config.py           # Settings via .env
│   ├── extensions.py       # API de extensões
│   └── requirements.txt    # Dependências Python
├── frontend-ts/            # Interface TypeScript (Vite)
│   ├── src/
│   │   ├── main.ts         # Entry point
│   │   ├── style.css       # Design system (Dark & Light themes)
│   │   ├── core/
│   │   │   └── PubSub.ts   # Event bus global
│   │   ├── api/
│   │   │   └── client.ts   # API service layer (fetch + WebSocket)
│   │   └── ui/
│   │       ├── AgentPanel.ts         # Chat AI com @menções e streaming
│   │       ├── DesignStudioPanel.ts  # Design Studio WYSIWYG
│   │       ├── design-studio.css     # Estilos do Design Studio
│   │       ├── ds-components.ts      # 50+ componentes HTML builtin
│   │       ├── PreviewPanel.ts       # Live Preview com hot reload
│   │       ├── Sidebar.ts            # File Explorer
│   │       ├── Telemetry.ts          # Barra superior de métricas
│   │       ├── ThemeEngine.ts        # Motor de temas (45+ temas)
│   │       ├── GitPanel.ts           # Painel Git integrado
│   │       ├── LibraryPanel.ts       # Knowledge base / Library
│   │       ├── MeshPanel.ts          # Mesh network de modelos AI
│   │       ├── MusicPanel.ts         # Player de música ambiente
│   │       ├── LLMPanel.ts           # Painel de configuração LLM
│   │       ├── SettingsPanel.ts      # Configurações gerais
│   │       ├── ProblemsPanel.ts      # Painel de erros/warnings
│   │       ├── ExtensionsPanel.ts    # Marketplace de extensões
│   │       ├── OnboardingGuide.ts    # Tutorial interativo
│   │       ├── InfinitePreview.ts    # Preview infinito
│   │       ├── Resizer.ts           # Resize de painéis
│   │       ├── Modals.ts            # Sistema de modais
│   │       ├── Draggable.ts         # Drag & drop utilitário
│   │       └── canvas/              # Lumina Canvas
│   │           ├── CanvasApp.tsx     # App React Flow
│   │           ├── canvasAdapter.ts  # JSON Canvas ↔ React Flow
│   │           ├── canvas-flow.css   # Estilos Obsidian
│   │           └── nodes/           # TextNode, LinkNode, GroupNode, etc.
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── electron/               # Desktop app (Electron)
│   ├── main.js             # Processo principal
│   └── preload.js          # Bridge seguro
├── scripts/                # Build & deploy scripts
├── docs/                   # Documentação
│   ├── guias/              # Guias de execução
│   └── patches/            # Histórico de código-fonte
├── package.json            # Scripts Electron
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

### 4️⃣ Design Studio
1. Clique em **"🎨 Design Studio"** na barra superior
2. Arraste componentes da palette para o artboard
3. Edite propriedades no painel direito
4. Use **Preview** para ver o resultado responsivo
5. Exporte como HTML, PNG ou PDF
6. Clique **"Insert to Editor"** para gerar código no framework do seu projeto

### 5️⃣ Lumina Canvas
1. Crie um arquivo `notas.canvas` no Explorer
2. Abra o arquivo — o canvas será renderizado automaticamente
3. Botão direito → **"Novo nó de texto"** para criar nós
4. Arraste handles (●) das laterais para criar conexões
5. Duplo-clique para editar texto (Markdown suportado)
6. Ctrl+D para duplicar, Delete para apagar

### 6️⃣ @Menções no Agent
1. No chat, digite `@code` para autcompletar
2. Selecione a menção — um chip azul aparece acima do input
3. Escreva sua pergunta e envie
4. O modelo recebe seu texto + o conteúdo do arquivo automaticamente

---

## ⌨️ Atalhos de Teclado

### IDE Geral
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

### Design Studio
| Atalho | Ação |
|--------|------|
| `Space + Drag` | Pan no canvas |
| `Scroll` | Zoom in/out |
| `Escape` | Fechar Design Studio |
| `Double-click artboard name` | Renomear |

### Lumina Canvas
| Atalho | Ação |
|--------|------|
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Refazer |
| `Ctrl+A` | Selecionar tudo |
| `Ctrl+D` | Duplicar selecionados |
| `Delete` / `Backspace` | Deletar selecionados |
| `Arrow Keys` | Mover nós (5px, Shift = 20px) |
| `Escape` | Deselecionar tudo |
| `Ctrl+V (imagem)` | Colar imagem do clipboard |
| `Shift+Click` | Multi-seleção |
| `Double-click` | Editar texto/label do nó |
| `Right-click` | Menu de contexto |

---

*(Lumina IDE — Local Intelligence, Global Performance)*
