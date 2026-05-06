# Mapeamento de Dependências Frontend (v2.5.3)

**Versão do Projeto:** 0.0.0

### Dependências de Produção (`dependencies`)

- **@xterm/addon-fit**: `^0.11.0`
- **@xterm/addon-web-links**: `^0.12.0`
- **gsap**: `^3.14.2`
- **lucide-react**: `^0.577.0`
- **react**: `^19.2.4`
- **react-dom**: `^19.2.4`
- **react-resizable-panels**: `^4.7.1`
- **react-syntax-highlighter**: `^16.1.1`
- **xterm**: `^5.3.0`

### Dependências de Desenvolvimento (`devDependencies`)

- **@types/react**: `^19.2.14`
- **@types/react-dom**: `^19.2.3`
- **@vitejs/plugin-react**: `^5.1.4`
- **autoprefixer**: `^10.4.27`
- **postcss**: `^8.5.8`
- **tailwindcss**: `^3.4.19`
- **typescript**: `~5.9.3`
- **vite**: `^7.3.1`

### Scripts de Execução

- `dev`: `vite`
- `build`: `vite build && node -e "const fs=require('fs');const p='dist/index.html';fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace(/ crossorigin/g,''))"`
- `preview`: `vite preview`
