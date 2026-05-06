# Lumina IDE v3.0: Era of Autonomous Collaboration & Sandbox Execution

## Visão Geral (Vision)
A Lumina IDE v3.0 representará o maior salto do ecossistema, evoluindo de uma IDE "orientada por IA" para uma verdadeira **Plataforma de Engenharia Autônoma**. O foco principal sairá da simples geração de código sob demanda para focar em **orquestração de múltiplos agentes operando em paralelo**, **execução isolada com autoteste**, e uma **Interface Congitiva Avançada**. O usuário deixa de ser apenas o motorista e passa a atuar como Diretor de Engenharia de uma equipe virtual corporativa.

---

## 1. Backend 3.0: O "Córtex" Orquestrador 🧠

O servidor backend deixará de lidar puramente com uma conexão de LLM linear e evoluirá para uma API complexa de gerenciamento de contêineres, bancos de dados vetoriais e enxames (swarms).

### 1.1. Execução Segura em Sandbox (Docker/WASM Integration)
- **Desafio atual:** O agente emite comandos no sistema operacional real do usuário (PowerShell), podendo causar quebras no ambiente base ao executar comandos perigosos ou lidar com dependências incorretas.
- **Inovação v3.0:** O Lumina terá capacidade nativa de empacotar projetos em Contêineres de Desenvolvimento Temporários (Docker) rodando debaixo dos panos.
- **Closed-Loop Testing:** Quando a IA escreve código, o backend fará a injeção em uma Sandbox transparente. Lá dentro, a própria IA executará comandos de build e teste (ex: `npm run test` ou `pytest`). O loop de iteração corrige falhas sintáticas na caixa preta silenciosamente, garantindo que a entrega final já venha "compilando" para o usuário. 

### 1.2. Orquestração Multi-Agente (Agent Swarm Architecture)
- **Desafio atual:** Um único modelo / identidade lida com toda tarefa – arquitetura, correção de bugs, e UI mapping.
- **Inovação v3.0:** O backend servirá como um roteador `WebSocket` para uma guilda de agentes especializados que colaboram.
  - **Lumina Architect:** Desenvolve o arquivo `LUMINA_PLAN.md` que serve de fundação arquitetural.
  - **Lumina Coder (Dev):** Lê o plano do arquiteto e realiza o trabalho duro nas sub-branchs da IDE.
  - **Lumina Reviewer (QA):** Um modelo focado em achar anti-patterns, vazamento de memória e chaves SSH não criptografadas escondidas no código.
  - Toda comunicação interna das LLMs gerará um gráfico rastreável na IDE.

### 1.3. Memória Vectorial Avançada (Enterprise RAG)
- **Desafio atual:** Fragmentação do `chunker.py` limitando o entendimento do pacote de software inteiro quando possui mais de 400 arquivos.
- **Inovação v3.0:** A Lumina hospedará ou rodará em background um banco vetorial local (como `ChromaDB` ou `Qdrant` via WASM local). Ao ser atulizada, a IDE varre e converte todo o AST dos projetos em vetores matemáticos persistentes. O contexto passará a ser inesgotável. Você poderá dizer: "Refatore esse componente usando a mesma métrica aplicada na pasta `/legacy-2019/`", e o agente entenderá o grafo em frações de segundo.

---

## 2. Frontend 3.0: Interface Cognitiva & Imersiva 🎨

A atual UI (que estabilizou lindamente na versão 1.3 com GSAP e resizers) atuará como esqueleto de fundação para novos níveis de visualização computacional.

### 2.1. Live Preview Nativo e Bi-Direcional (O "Canvas")
- Para o desenvolvimento em Node/React/Vue/HTML, implementaremos uma aba central "Preview" usando tecnologias integradas de WebView/BrowserWindow.
- **Hot-Reload de Autoria IA:** O Agente de UI ajustará o CSS enquanto o desenvolvedor humano assiste a tela sendo renderizada ao vivo no grid central - sem jamais perder tempo mudando o foco para o Chrome externo.

### 2.2. Visualizador Global "Node-Based" (O Blueprints)
- O atual \`PlanStepper\` de lista se desenvolverá em uma view interativa em Grafo/Nó (similar a Miro ou as Blueprints do Unreal Engine). 
- O fluxo de execução de toda arquitetura em que o Agente está trabalhando terá a árvore de vida apresentada de forma drag and drop. O desenvolvedor poderá pausar ramais inteiros de desenvolvimento arrastando o mouse e cortando visualmente um cabo com um alerta sonoro satisfatório.

### 2.3. HUD "Teia Sináptica" (Console de Raciocínio)
- Usando a flexibilidade dos resizers, painéis transparentes de overlay (GSAP + blur) poderão ser flutuados por cima do File Explorer demonstrando streams brutos do Chain Of Thought (CoD) avançado de modelos de ponta.
- Isso permitirá ver as engrenagens lógicas da IA enquanto ela atua calada, reduzindo a ansiedade de "O que esse robô está quebrando agora?".

### 2.4. Skill Framework & Marketplace Embutido
- Uma seção visual interativa dentro da IDE onde extensões (Plugins de Conhecimento) podem ser alugados ou baixados com um click.
- Deseja que a IA aprenda o seu formato proprietário de arquivos de folha de pagamento? Crie um "Skill Card" e instale com 1-click. Todo prompt engatilhado ativará automaticamente diretrizes de conduta atrelados a esses "Skill Cards" dinamicamente na UI global.

---

## Estratégia Técnica e de Deploy 🚀
1. **Linguagem Híbrida:** Analisar transição da empacotagem gráfica de **Electron** para **Tauri (Rust)** como base. O uso de memória do Webview com Rust fará o app cair de 400MB base de uso de RAM para singelos 80MB de footprint limpo, dando o triplo de liberdade pro modelo local do Ollama respirar na GPU.
2. **Pipelines RPC e Python Async:** Consolidar toda mensageria sobre Protobufs (gRPC) e rotas HTTP3 no backend Python em conformidade com o novo fluxo orquestrado de IA's sobrecarregadas, removendo latências de I/O em leitura de milhares de arquivos RAG em disco C:\ SSD / NVMe.
