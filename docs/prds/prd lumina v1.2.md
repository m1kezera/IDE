🛸 Lumina IDE — PRD Técnico Ultra Detalhado (v1.2)
1. Arquitetura de Pensamento e Planejamento (Core Logic)
A lógica v1.2 substitui a execução impulsiva por um fluxo de Planejamento Primário Persistente.

1.1 Protocolo LUMINA_PLAN.md
Geração Obrigatória: O agente deve gerar ou atualizar o arquivo LUMINA_PLAN.md na raiz do workspace antes de qualquer alteração de código.

Estrutura de Rastreamento: O plano deve conter checkboxes Markdown ([ ]). O backend deve monitorar o sucesso das operações e marcar automaticamente como concluído ([x]) no arquivo físico.

Gestão Manual: Interface para o usuário selecionar um arquivo .md existente como guia prioritário (Botão "Gerenciar Planejamento").

1.2 Camada de Raciocínio (Chain of Thought)
Bloco <thought>: O modelo deve explicar sua interpretação técnica e estratégia de implementação antes de emitir comandos de arquivo.

2. Inteligência Adaptativa (Model Fingerprinting)
A IDE ajusta sua complexidade baseada nos recursos do modelo detectado via Ollama (parameter_size).

2.1 Perfis de Comportamento
Classe Eco (< 8B): Prompt minimalista, sem exemplos de boilerplate, fatiamento de contexto (chunking) reduzido para 800 tokens.

Classe Pro (12B - 30B): Ativação de CoT detalhado e diretrizes de arquitetura SOLID.

Classe Elite (> 70B / Cloud): Autonomia total para refatoração de múltiplos arquivos e janelas de contexto de 4000 tokens.

3. Segurança e Controle de Autonomia
Implementação de barreiras de proteção para evitar deleções acidentais e alucinações de modelos fracos.

3.1 Modos de Permissão
Assistido: Exige clique em "Executar" para cada alteração.

Híbrido: Autônomo para criação, mas requer confirmação pop-up (Electron Dialog) para qualquer 🗑️ DELETE.

Agente: Execução sequencial baseada no planejamento.

3.2 Lista de Proteção Core (Hard-Lock)
Bloqueio de Escrita/Deleção: main.py, pulsyce.db, config.py, .env, backend/* e sqlite3.exe.

4. Engenharia de Baixo Nível e UX
4.1 Terminal de Alta Performance (terminal.py)
Shell: Migração obrigatória para PowerShell no Windows 10.

Resiliência: Buffer de 4096 bytes e encoding utf-8 (errors='replace') para suportar logs densos e caracteres especiais de IA.

4.2 Onboarding Autônomo
Bootstrapper: Verificação automática de instalação do Ollama no primeiro boot.

Setup Inicial: Download silencioso do Ollama e obrigatoriedade de baixar ao menos um modelo (Mistral ou Llama 3) via UI.

Dados do Usuário: Persistência do banco de dados e logs em %APPDATA%/lumina-ide/ para isolar dados de sistema do executável Electron.

5. Dicionário de Engenharia Full-Stack (knowledge_base.json)
Base de conhecimento estática injetada em cada prompt para garantir que o modelo entenda a stack completa, não apenas o frontend.

Backend: FastAPI (Async), SQLModel (ORM), SQLite.

Frontend: React 18, Vite, Tailwind CSS, GSAP.

DevOps: Gestão de dependências Python via pip install automático detectado pelo agente em erros de importação.

Normas Técnicas: Idempotência em operações de arquivo, sanidade de caminhos (os.path.normpath) e logging obrigatório de telemetria.