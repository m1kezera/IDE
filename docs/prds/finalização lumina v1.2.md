🗺️ Plano de Finalização: Lumina IDE v1.2
1. 🚀 Onboarding e Setup Automatizado
O objetivo é que o usuário não precise configurar nada manualmente após instalar o Electron.

Implementar setup_manager.py: Criar um módulo no backend que verifica a presença do binário do Ollama no PATH do Windows 10.

Instalação Silenciosa: Se o Ollama não for detectado, o sistema deve baixar o instalador oficial e executá-lo em modo silencioso.

Fluxo de Primeiro Boot: Desenvolver a tela no React que obriga o usuário a escolher um modelo inicial (ex: Mistral 7B) e exibe o progresso do ollama pull em tempo real.

2. 🛡️ Refinamento de Autonomia e Travas
Garantir que as configurações de "sempre perguntar" vs "autonomia" reflitam na interface.

Criar a Tabela agent_permissions: No models.py, adicionar uma tabela para persistir o nível de autonomia escolhido pelo usuário (Manual, Híbrido, Agente).

Interceptador de Confirmação: Modificar o router.py para que, no modo Manual, o streaming pause após gerar o código e aguarde uma rota de POST /api/confirm antes de disparar o write_file_blocks.

Bypass de Proteção: Adicionar uma flag visual no editor para permitir a edição manual de arquivos protegidos (como o .env), caso o usuário realmente precise.

3. 🖥️ Estabilidade de Terminal e UI
O terminal atual (cmd.exe) ainda é um ponto de falha para caracteres especiais e fluidez.

Migração para PowerShell: No terminal.py, alterar a chamada do processo de cmd.exe para powershell.exe.

Ajuste de Encoding: Forçar o pipe de saída para UTF-8 para garantir que os emojis de progresso e logs de erro da IA não quebrem a interface.

Stepper de Planejamento: No componente Chat, criar uma lista visual que lê o LUMINA_PLAN.md e mostra uma barra de progresso baseada nos itens concluídos ([x]).

📦 4. Empacotamento Electron (Finalização)
Garantir que o SQLite e os binários funcionem fora do ambiente de desenvolvimento.

Configurar extraResources: No arquivo de build do Electron, incluir o binário do sqlite3 e o arquivo knowledge_base.json para que sejam acessíveis no .exe final.

Validação de Caminhos: Testar se o config.py está criando corretamente a pasta em %APPDATA%/lumina-ide/ para evitar erros de permissão de escrita em pastas do sistema.