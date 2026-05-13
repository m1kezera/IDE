# O Novo Motor: God Mode e Lógica de Camadas

Este documento explica os detalhes da arquitetura teórica e prática do "Motor de IA" embutido no Lumina LinuxIDE. 

## 1. O Loop ReAct (God Mode)
A espinha dorsal da "autonomia" do Lumina está no `handler_godmode.py`. O motor não é um simples Chatbot de pergunta-resposta; ele funciona como um loop *Reason + Act* (ReAct).
Ao enviar um prompt, o Lumina injeta as Ferramentas (Tools) embutidas da IDE no "System Prompt" do modelo (como ler arquivos, executar shell bash, ou alterar diretórios). O LLM é instruído a tentar completar o objetivo do usuário. Se ele identificar que precisa executar um comando, ele gera a resposta no formato exato de chamada de ferramenta.
O Backend captura essa chamada, executa localmente dentro do workspace (ou container sandbox), e envia o resultado (sucesso ou erro) de volta ao modelo para ele continuar trabalhando até julgar que terminou.

## 2. Dynamic Layer Queue (Offloading)
Originalmente, modelos de grandes dimensões (como 32B ou 70B) não cabem na memória da placa de vídeo de consumidores (VRAM de 12GB numa RTX 3060).
O Lumina usa `llama-cpp-python` que permite o **Layer Offloading**. 
* **Em modelos médios (14B)**: A configuração `gpu_layers=-1` envia 100% dos cálculos para a GPU, lotando a VRAM (cerca de 9.5GB), mas entregando velocidade máxima de geração.
* **Em modelos gigantes**: Limitando `gpu_layers=20`, a IA joga 20 camadas para a VRAM e a fila restante fica na RAM tradicional (DDR4/DDR5) processada pelo CPU. A carga é quebrada em pipeline (a Placa de Vídeo processa a parte inicial do neurônio e passa a bola para o Processador finalizar).

## 3. Desativação do Flash Attention
Embora o Flash Attention-2 diminua drasticamente o peso de contexto das KVs de memória e prometa menos consumo de VRAM, ele demonstrou travamentos fatais e loops mortos em placas da arquitetura Ampere quando mesclado com chamadas em fluxo contínuo. 
A decisão arquitetural final do motor foi **desligar o Flash Attention** e utilizar matrizes clássicas padrão. A estabilidade de 100% sem perdas ou bugs de conexão HTTP sobrepôs os poucos bytes a mais de economia de VRAM.

## 4. Lifecycle (A Vida do Backend)
O motor não "morre" ao finalizar uma mensagem, para evitar a lentidão astronômica da recarga de SSD (40 segundos). Em vez disso, aplicamos o lifecycle pela TUI:
- `Disconnect`: O motor fica inativo, aguardando. (0 tempo de recarga)
- `Stop`: O motor é desligado pelo orquestrador Docker. (VRAM limpa, mas buffer do kernel do Linux atua, gerando recargas de ~2 segundos depois).
