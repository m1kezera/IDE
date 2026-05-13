# Lumina God Mode (LGM) - Engine Architecture Plan

Este documento detalha o planejamento, recursos e refinamentos contínuos para o **Lumina God Mode (LGM)**, nosso motor e gerenciador nativo de LLMs projetado para superar soluções engessadas como Ollama e LM Studio, garantindo controle de baixo nível, máxima eficiência de memória e orquestração inteligente de contexto.

---

## 1. Core Philosophy (Filosofia do Motor)
O LGM é construído sob a premissa de **Arquitetura Baseada em Restrições (Constraint-Based Architecture)**:
- Velocidade não é sinônimo de Qualidade.
- A memória em disco (SSD via `mmap`) é a verdadeira biblioteca; RAM e VRAM são apenas mesas de trabalho.
- O motor deve ser agnóstico ao tamanho do modelo, permitindo que hardwares limitados (ex: 12GB VRAM) rodem modelos de classe empresarial (70B+) com perda zero de qualidade, trocando apenas tempo de geração por excelência arquitetural.

---

## 2. Componentes da Arquitetura Atual

### 2.1 Ingestão de Contexto e Otimização de VRAM
- **`n_batch` (Chunking de Avaliação):** O prompt é processado em blocos (ex: 512 tokens) para evitar picos massivos de alocação temporária de VRAM durante o carregamento de grandes documentos.
- **Flash Attention:** Implementado nativamente para reduzir o tamanho matemático do KV Cache pela metade.
- **KV Cache Quantization:** O estado de memória do modelo é mantido em formato quantizado `q8_0` (K e V), economizando VRAM e dobrando a janela de contexto teórica.

### 2.2 Gerenciamento de Memória (Offloading)
- **Layer-by-Layer Paging:** Delegação via `mmap` nativo do Llama.cpp. Modelos que não cabem na RAM/VRAM são lidos do SSD sob demanda.
- **Dynamic GPU Layers:** Ajuste de `n_gpu_layers` para carregar o modelo parcialmente na GPU, distribuindo o processamento entre os CUDA Cores (VRAM) e os threads do processador (RAM).

### 2.3 Context Shifting (Sliding Window)
- **Prevenção de OOM:** Em vez de crachar o motor quando o limite do `n_ctx` é atingido, o LGM preserva o System Prompt (Regras) e o Histórico Recente, cortando o "meio" do contexto de forma cirúrgica, permitindo chats e processamentos infinitos.

---

## 3. RoadMap Definitivo (A Trindade do Motor LGM)

### Fase 1: Unified Mega-Model (O Cérebro 32B/70B)
- A visão central do LGM é rodar **um único modelo massivo** (focando no "Sweet Spot" de 32B para PCs medianos ou 70B para entusiastas) para toda a carga de trabalho.
- **Amplificação por RAG:** A inteligência inerente do 32B será escalada artificialmente injetando as `Skills` (regras puras) e a `Library` (documentação), fazendo um modelo rápido performar como um gigante.
- **Extreme Layer Streaming:** O modelo reside no SSD/HD, usando RAM e VRAM puramente como janelas de cache.
- **Monitoramento em Tempo Real (O Gerenciador de Tarefas do LGM):** O motor não fará apenas uma checagem matemática inicial. Ele terá um loop de telemetria contínua (via `psutil`/`pynvml`) observando o consumo de RAM e VRAM em tempo real (como um Task Manager). Isso facilita ajustes precisos de `n_gpu_layers` e previne gargalos se outras aplicações do usuário consumirem memória simultaneamente.

### Fase 2: Gramática Forçada e Mista (O Agente Purista de Software)
- O LGM é projetado para ser **estritamente um Engenheiro de Software Local**. Ele não terá distrações com "web browsing" ou ferramentas genéricas.
- **Escopo Fechado de Ferramentas:**
  - *Filesystem CRUD:* Criar, ler, atualizar, deletar e navegar por pastas e arquivos.
  - *Terminal Access:* Executar comandos de bash, rodar scripts e ler logs de stdout/stderr.
  - *Vision (Opcional):* Leitura de imagens/screenshots (UI mockups) para análise de layout.
- **Gramática Mista (Two-Stage GBNF):** Para suportar a "voz interna" dos modelos modernos (DeepSeek R1, Qwen CoT) sem matar sua genialidade, o LGM implementará um compilador de gramática de dois estágios:
  - **Estágio 1 (Caos Controlado):** O modelo é forçado a abrir a tag `<think>`. Lá dentro, ele tem passe livre absoluto para alucinar, planejar e arquitetar texto livre.
  - **Estágio 2 (A Guilhotina Matemática):** Ao fechar a tag `</think>`, a liberdade acaba. O motor aciona a trava estrita de JSON Schema, forçando o modelo a traduzir todo o plano gerado no Estágio 1 para chamadas de ferramentas sintaticamente perfeitas.
- Isso previne o "emburrecimento" do modelo, garantindo o máximo de raciocínio lógico seguido de 100% de precisão na execução.

### Fase 3: Persistência de KV Cache (Memória de Longo Prazo)
- **Swapping de Estado Mental:** Como ler 40GB do SSD repetidamente destrói o tempo de inferência, o LGM será capaz de fazer um "Save State" do KV Cache da conversa para um arquivo binário.
- Se o usuário fechar a IDE ou ejetar o modelo para jogar, ao retornar, a IDE carrega diretamente os tensores de contexto, permitindo que o modelo continue a conversa instantaneamente sem precisar reler todo o histórico de prompts passados.

---
## 4. Notas de Reflexão Aberta
- *Como gerenciar a limpeza dos arquivos físicos do KV Cache no disco para que a pasta do projeto não lote?*
- *O Autocomplete atual usa embeddings (Brain) instantâneos. O Mega-Model cuidará apenas do Chat/Agente. Estamos totalmente livres de conflito de paralelismo.*
