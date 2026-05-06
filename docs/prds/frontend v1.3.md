🛸 PRD Frontend v1.2 — Interface de Engenharia e Terminal Interativo
1. Terminal Interativo de Baixa Latência (Padrão VS Code)
O componente atual baseado em <pre> e <input> deve ser totalmente descartado em favor de uma emulação real de terminal.

Motor de Renderização: Implementar a biblioteca xterm.js com os addons FitAddon (para redimensionamento automático) e WebLinksAddon.

Integração com Backend: O WebSocket deve ser conectado diretamente ao motor xterm, permitindo o fluxo bidirecional de dados brutos do PowerShell.

Capacidades Interativas:

Captura de Teclado: O terminal deve capturar sequências de escape, permitindo o uso de setas para histórico de comandos, Ctrl+C para cancelar processos e comandos interativos como npm init.

Suporte UTF-8 Real: Renderizar corretamente os indicadores de progresso e emojis que o backend agora emite via UTF-8.

Múltiplas Instâncias: Manter o suporte a abas de terminal, mas cada aba deve instanciar um objeto xterm único e persistente na memória.

2. Hub de Logs e Output do Sistema
Ativar a aba "Output" para monitoramento técnico da IDE.

Stream de Debug: O backend deve expor um endpoint /api/system/logs que transmita o log do servidor FastAPI via SSE.

Filtragem Visual: No frontend, os logs de sistema devem ser coloridos por severidade (INFO em azul, WARNING em amarelo, ERROR em vermelho).

Diagnóstico de IA: Exibir nesta aba as falhas de Regex ou erros de comunicação com o Ollama que não devem poluir o chat do Agente.

3. Redesign Visual "Cyber-Engineering"
Transformar a interface visual em uma ferramenta de "prateleira" profissional.

3.1 Layout Flexível (Panels)
Resizable Layout: Utilizar a biblioteca react-resizable-panels para permitir que o usuário arraste a largura da Sidebar e a altura do Bottom Panel.

Persistência de Layout: Salvar as dimensões preferidas do usuário no localStorage para manter a consistência entre sessões.

3.2 Chat e Feedback Neural
Badges de Classe Dinâmicas: Refinar visualmente as insígnias ECO, PRO e ELITE com gradientes neon baseados no parameter_size detectado.

Diff Viewer embutido: Ao utilizar o modo Manual, o card de "Mudanças Pendentes" deve incluir um bloco de código com Syntax Highlighting básico para facilitar o Code Review antes da aprovação.

Integração PlanStepper: Mover o widget de planejamento para uma barra fixa no topo da área de chat, servindo como um "Head-Up Display" (HUD) do progresso do LUMINA_PLAN.md.

4. Segurança e Gestão de Autonomia (UI)
Expor as configurações de proteção de forma intuitiva.

Toggle de Proteção Core: Um interruptor de segurança nas configurações que, quando desativado (Override), exibe um aviso de "Modo de Risco" na StatusBar.

Dashboard de Economia: No painel de telemetria, incluir um gráfico de barras simples comparando o custo de tokens no modo Local vs Cloud.