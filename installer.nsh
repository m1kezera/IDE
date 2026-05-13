; ─── Lumina IDE — Custom NSIS Installer Script ───────────────────
; Detects and installs Ollama automatically if missing.
; v7.0: Also configures Windows Firewall for Mesh (Colmeia) networking.

!macro customInstall
  ; ─── Welcome / Important info (bilingual) ───
  MessageBox MB_OK|MB_ICONINFORMATION \
    "🇺🇸 IMPORTANT INFORMATION — PLEASE READ$\n$\n\
    • If Ollama is running (system tray icon), close it.$\n\
      Lumina IDE manages Ollama automatically.$\n$\n\
    • On first launch, internet is required so Lumina can$\n\
      download the AI model (~4 GB).$\n$\n\
    • Network ports (8000, 8001, 11434) will be opened$\n\
      in Windows Firewall for LAN Mesh (Colmeia).$\n$\n\
    ───────────────────────────$\n$\n\
    🇧🇷 INFORMAÇÕES IMPORTANTES — POR FAVOR LEIA$\n$\n\
    • Se o Ollama estiver rodando (ícone na bandeja), feche-o.$\n\
      O Lumina gerencia o Ollama automaticamente.$\n$\n\
    • Na primeira abertura, tenha internet disponível para$\n\
      que o Lumina baixe o modelo de IA necessário (~4 GB).$\n$\n\
    • As portas de rede (8000, 8001, 11434) serão liberadas$\n\
      no Firewall para a Colmeia funcionar na rede local."

  ; ─── Check if Ollama is already installed ───
  nsExec::ExecToStack 'cmd /c where ollama 2>nul'
  Pop $0 ; return code
  Pop $1 ; output

  ${If} $0 != 0
    ; Ollama not found in PATH — check default install location
    IfFileExists "$LOCALAPPDATA\Programs\Ollama\ollama.exe" ollamaFound ollamaNotFound
    
    ollamaNotFound:
      MessageBox MB_YESNO|MB_ICONQUESTION \
        "Lumina IDE requires Ollama as a local AI engine.$\n\
        Ollama was NOT detected on this machine.$\n$\n\
        ⚠ Internet is required to install Ollama (~800 MB).$\n\
        Install Ollama automatically now? (Recommended)$\n$\n\
        ───────────────────────────$\n$\n\
        O Lumina IDE precisa do Ollama para funcionar como motor de IA local.$\n\
        O Ollama NÃO foi detectado nesta máquina.$\n$\n\
        ⚠ É necessário conexão com a internet para instalar o Ollama (~800 MB).$\n\
        Deseja instalar o Ollama automaticamente agora? (Recomendado)" \
        IDYES downloadOllama IDNO skipOllama
      
      downloadOllama:
        DetailPrint "Downloading Ollama (internet required)..."
        ; Download Ollama installer
        inetc::get /NOCANCEL \
          "https://ollama.com/download/OllamaSetup.exe" \
          "$TEMP\OllamaSetup.exe" \
          /END
        Pop $0
        
        ${If} $0 == "OK"
          DetailPrint "Installing Ollama silently..."
          ; Install Ollama silently
          nsExec::ExecToStack '"$TEMP\OllamaSetup.exe" /S'
          Pop $0
          
          ${If} $0 == 0
            DetailPrint "Ollama installed successfully!"
            MessageBox MB_OK|MB_ICONINFORMATION \
              "✅ Ollama installed successfully!$\n\
              IMPORTANT: Keep Ollama CLOSED (no tray icon).$\n\
              Lumina IDE manages Ollama automatically.$\n$\n\
              ✅ Ollama instalado com sucesso!$\n\
              IMPORTANTE: Mantenha o Ollama FECHADO (sem ícone na bandeja).$\n\
              O Lumina IDE gerencia o Ollama automaticamente."
          ${Else}
            DetailPrint "Ollama installation failed (code: $0)"
            MessageBox MB_OK|MB_ICONEXCLAMATION \
              "Ollama automatic installation failed.$\n\
              Please install manually: https://ollama.com/download$\n$\n\
              A instalação automática do Ollama falhou.$\n\
              Instale manualmente em: https://ollama.com/download"
          ${EndIf}
          
          ; Clean up
          Delete "$TEMP\OllamaSetup.exe"
        ${Else}
          DetailPrint "Failed to download Ollama: $0"
          MessageBox MB_OK|MB_ICONEXCLAMATION \
            "Could not download Ollama. Check your internet connection.$\n\
            Install manually: https://ollama.com/download$\n$\n\
            Não foi possível baixar o Ollama. Verifique sua conexão.$\n\
            Instale manualmente: https://ollama.com/download"
        ${EndIf}
        Goto ollamaDone
      
      skipOllama:
        MessageBox MB_OK|MB_ICONINFORMATION \
          "You can install Ollama later: https://ollama.com/download$\n\
          ⚠ Without Ollama, only Cloud mode (API key) will work.$\n$\n\
          Você pode instalar o Ollama depois em: https://ollama.com/download$\n\
          ⚠ Sem o Ollama, apenas o modo Cloud (API key) funcionará."
        Goto ollamaDone
    
    ollamaFound:
      DetailPrint "Ollama detected at: $LOCALAPPDATA\Programs\Ollama"
  ${Else}
    DetailPrint "Ollama detected in system PATH"
  ${EndIf}
  
  ollamaDone:

    ; ─── v7.0: Configure Windows Firewall for Mesh (Colmeia) ───
    ; These rules allow other machines on the LAN to reach the Lumina backend
    ; and Ollama API for swarm/mesh networking. Runs with admin privileges.
    DetailPrint "Configuring Firewall for Colmeia (Mesh)..."

    ; Remove old rules first (idempotent)
    nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Mesh-8001"'
    Pop $0
    nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Mesh-8000"'
    Pop $0
    nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Ollama-11434"'
    Pop $0

    ; Backend port 8001 (packaged mode)
    nsExec::ExecToStack 'netsh advfirewall firewall add rule name="LuminaIDE-Mesh-8001" dir=in action=allow protocol=TCP localport=8001 profile=private,domain description="Lumina IDE Backend - Mesh/Colmeia LAN access"'
    Pop $0
    ${If} $0 == 0
      DetailPrint "✅ Firewall: port 8001 (Backend) opened"
    ${Else}
      DetailPrint "⚠ Firewall: failed to open port 8001"
    ${EndIf}

    ; Backend port 8000 (dev mode fallback)
    nsExec::ExecToStack 'netsh advfirewall firewall add rule name="LuminaIDE-Mesh-8000" dir=in action=allow protocol=TCP localport=8000 profile=private,domain description="Lumina IDE Backend Dev - Mesh/Colmeia LAN access"'
    Pop $0
    ${If} $0 == 0
      DetailPrint "✅ Firewall: port 8000 (Backend Dev) opened"
    ${Else}
      DetailPrint "⚠ Firewall: failed to open port 8000"
    ${EndIf}

    ; Ollama API port 11434 (for remote model access)
    nsExec::ExecToStack 'netsh advfirewall firewall add rule name="LuminaIDE-Ollama-11434" dir=in action=allow protocol=TCP localport=11434 profile=private,domain description="Lumina IDE Ollama - Mesh/Colmeia remote model access"'
    Pop $0
    ${If} $0 == 0
      DetailPrint "✅ Firewall: port 11434 (Ollama) opened"
    ${Else}
      DetailPrint "⚠ Firewall: failed to open port 11434"
    ${EndIf}

    DetailPrint "✅ Lumina IDE installation complete!"
!macroend

!macro customUnInstall
  ; ─── v7.0: Clean up Firewall rules on uninstall ───
  nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Mesh-8001"'
  Pop $0  
  nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Mesh-8000"'
  Pop $0
  nsExec::ExecToStack 'netsh advfirewall firewall delete rule name="LuminaIDE-Ollama-11434"'
  Pop $0
!macroend

