# Lumina IDE - Linux / God Mode Edition

Bem-vindo ao **Lumina IDE (Linux Edition)**. Esta é a versão moderna, refatorada e nativa de Linux do Lumina, desenvolvida para ser a interface de programação assistida por IA mais rápida, bruta e responsiva possível.

Ela substitui o antigo stack (Electron/TS) por uma interface rica de terminal (TUI) desenvolvida em **Textual** (Python) conectada a um motor **Local GGUF** que roda isolado em **Docker com aceleração CUDA**.

---

## 🏗️ Arquitetura

1. **Frontend (TUI)**: Escrito puramente em Python usando o framework `Textual`. Ele te dá uma experiência de IDE com suporte a mouse, rolagem suave, cores de terminal ricas, painel de VRAM real-time e botões clicáveis sem precisar abrir um navegador de internet.
2. **Orquestrador de Container**: O frontend é integrado a um ciclo de vida Docker (`docker-compose`). Ao digitar o comando de inicialização, a TUI liga e prepara a máquina, disparando comandos Docker por trás dos panos.
3. **Backend Engine**: Um container isolado `nvidia/cuda` rodando FastAPI, `llama-cpp-python` e lógica de Agente Autônomo (ReAct). O motor carrega modelos pesados (como o *Qwen 14B*) diretamente na memória da sua placa de vídeo.

---

## 🚀 Instalação e Uso

### 1. Dependências do Frontend
A interface precisa de algumas bibliotecas do Python na máquina local para desenhar a TUI e ler os dados da placa de vídeo.
```bash
cd LinuxIDE/backend/cli
pip install -e .
```
*(Isso instala o comando `lumina` no seu sistema)*

### 2. Iniciando a IDE
Basta digitar o comando global no seu terminal:
```bash
lumina
```
A interface vai abrir, carregar o backend via Docker (o que pode demorar alguns segundos) e exibir o painel central.

### 3. Painel e Controles

A interface possui uma barra lateral com **Controles de Motor**:
- **Sair da UI (Disconnect):** Apenas fecha a tela. O motor e o modelo continuam carregados na Placa de Vídeo (VRAM). Perfeito para voltar rápido.
- **Stop Engine:** Pausa o container do Docker e limpa 100% da sua VRAM. A próxima inicialização leva cerca de 2 segundos.
- **Destroy Engine:** Deleta completamente o container (útil caso algo trave gravemente).

---

## 🧠 Modelos e VRAM
Os modelos devem ser baixados em formato `.gguf` e colocados dentro da subpasta `models/`. 
O dropdown na interface lerá automaticamente esses arquivos. 

**Importante:** Ao enviar o primeiro prompt do dia, o Lumina transferirá o arquivo pesado do seu HD para a VRAM da sua placa. Isso demora em torno de **40 segundos** para um modelo de 10GB. O Lumina informará isso na tela. Nas mensagens subsequentes, as respostas serão instantâneas!
