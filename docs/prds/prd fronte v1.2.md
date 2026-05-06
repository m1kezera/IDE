🎨 PRD Frontend Update — Lumina IDE v1.2
1. Módulo de Onboarding e Setup Inicial
O objetivo é guiar o usuário na configuração do ambiente de IA antes de liberar o acesso ao editor.

1.1 Componente OnboardingModal.jsx
Bloqueio de UI: O modal deve sobrepor toda a IDE caso o status retornado por GET /api/setup/status seja negativo.

Seleção de Modelos: Exibir cards interativos para modelos populares (Mistral, Llama 3, Phi-3) com descrições de hardware recomendado.

Barra de Progresso Real-time: Implementar o consumo da rota SSE POST /api/setup/pull para exibir a porcentagem de download e status (ex: "Downloading", "Verifying", "Success").

2. Gestão de Planejamento e Rastreamento (UX)
Trazer a "âncora de realidade" do arquivo físico para a interface visual do chat.

2.1 Widget PlanStepper.jsx
Localização: Integrar no painel inferior ou na barra lateral direita.

Sincronização Ativa: O componente deve monitorar o arquivo LUMINA_PLAN.md (via WebSocket ou polling curto) e renderizar uma lista de tarefas com checkboxes.

Feedback de Conclusão: Itens marcados com [x] no disco devem ser exibidos com estilo "riscado" e cor verde na UI, fornecendo um tracking de progresso real.

2.2 Botão "Gerenciar Planejamento"
Seletor de Arquivos: Adicionar um botão na barra de ferramentas que abre o explorador de arquivos para o usuário selecionar um .md ou .txt customizado.

3. Painel de Controle de Autonomia e Segurança
Permitir que o usuário configure quão "agressiva" a IA pode ser no workspace.

3.1 Aba de Configurações do Agente
Seletor de Nível (Dropdown/Radio):

Manual: IA apenas sugere código.

Híbrido: IA cria arquivos, mas pede permissão para deletar.

Agente: Autonomia total baseada no plano.

Toggle de Override: Interruptor para permitir/bloquear a edição de arquivos protegidos (Lista Core).

3.2 UI de Aprovação (Bottom Panel)
Alertas de Confirmação: Implementar um banner amarelo piscante que aparece quando o backend emite o evento pending_confirmation.

Visualização de Diff: Botão para visualizar o que será alterado antes de clicar em "Aprovar Mudanças".

4. Estabilidade do Terminal e Feedback
Renderização UTF-8: Garantir que o componente de terminal suporte a renderização de emojis e cores vindas do PowerShell através do novo encoding utf-8.

Badge de Modelo Ativo: Exibir no chat qual modelo está sendo usado e se ele pertence à classe Eco, Pro ou Elite baseado no parameter_size.