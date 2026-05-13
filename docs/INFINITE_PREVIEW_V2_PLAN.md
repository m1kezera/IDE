# ∞ Infinite Preview v2.0 — Rewrite Completo

> Reescrever o canvas do zero, replicando a arquitetura e design do Obsidian Canvas.
> Formato de dados: 100% compatível com [JSON Canvas Spec 1.0](https://jsoncanvas.org/spec/1.0)

---

## Arquitetura Obsidian (o que vamos replicar)

| Técnica | Descrição |
|---------|-----------|
| **DOM-based** | Cada nó é um `<div>`, não `<canvas>` HTML5 |
| **CSS Transform** | Pan/zoom via `transform: translate() scale()` com `will-change: transform` |
| **Viewport Culling** | Só nós visíveis existem no DOM, os outros são removidos |
| **Dirty Rendering** | Atualiza só o nó que mudou, nunca recria tudo |
| **Inline Editing** | Textarea dentro do nó, sem `prompt()` |
| **Drag-to-Connect** | Arrastar das portas pra criar edges |
| **Resize Handles** | 4 cantos + 4 lados funcionais |

---

## Estrutura de Arquivos (Nova)

```
frontend-ts/src/ui/canvas/
├── CanvasEngine.ts          # Já existe — modelo de dados (manter)
├── CanvasView.ts            # NOVO — orquestrador principal (substitui InfinitePreview.ts)
├── CanvasRenderer.ts        # NOVO — renderização + viewport culling
├── CanvasInteraction.ts     # NOVO — state machine de interações
├── CanvasNodeElement.ts     # NOVO — cria/atualiza DOM de um nó
├── CanvasEdgeRenderer.ts    # NOVO — SVG edges com bezier curves
└── CanvasToolbar.ts         # NOVO — toolbar + color picker

frontend-ts/src/style.css    # Reescrever seção canvas (linhas 4430-4700)
```

**Por que separar?** O `InfinitePreview.ts` atual tem 606 linhas com rendering, events, toolbar, e state machine tudo misturado. Separar em módulos de responsabilidade única evita o espaguete.

---

## Módulo 1: CanvasRenderer.ts — Viewport Culling + Dirty Rendering

### Viewport Culling

```typescript
class CanvasRenderer {
  private visibleNodes = new Set<string>();
  private nodeElements = new Map<string, HTMLElement>();
  
  /** Chamado a cada pan/zoom — recalcula quais nós estão na tela */
  updateVisibility(viewport: DOMRect, tx: number, ty: number, scale: number): void {
    const margin = 200; // render 200px extra fora da tela (smooth scroll)
    const viewLeft   = (-tx - margin) / scale;
    const viewTop    = (-ty - margin) / scale;
    const viewRight  = (-tx + viewport.width + margin) / scale;
    const viewBottom = (-ty + viewport.height + margin) / scale;

    const engine = this.engine;
    const newVisible = new Set<string>();

    for (const node of engine.data.nodes || []) {
      const inView =
        node.x + node.width  > viewLeft  &&
        node.x               < viewRight &&
        node.y + node.height > viewTop   &&
        node.y               < viewBottom;

      if (inView) {
        newVisible.add(node.id);
        if (!this.visibleNodes.has(node.id)) {
          // ENTROU na tela — criar elemento DOM
          this.mountNode(node);
        }
      } else if (this.visibleNodes.has(node.id)) {
        // SAIU da tela — remover do DOM (mas manter no data)
        this.unmountNode(node.id);
      }
    }

    this.visibleNodes = newVisible;
  }
}
```

### Dirty Rendering

```typescript
/** Atualiza APENAS o nó que mudou — nunca recria tudo */
updateNodeDOM(nodeId: string): void {
  const el = this.nodeElements.get(nodeId);
  const node = this.engine.getNode(nodeId);
  if (!el || !node) return;

  // Posição
  el.style.left = `${node.x}px`;
  el.style.top  = `${node.y}px`;
  el.style.width  = `${node.width}px`;
  el.style.height = `${node.height}px`;

  // Cor accent
  const accent = el.querySelector('.canvas-node-accent') as HTMLElement;
  if (accent) {
    accent.style.background = resolveColor(node.color) || 'transparent';
  }

  // Conteúdo (só se mudou)
  const content = el.querySelector('.canvas-node-content') as HTMLElement;
  if (node.type === 'text' && content) {
    const newText = (node as TextNode).text;
    if (content.dataset.text !== newText) {
      content.innerHTML = renderMarkdown(newText);
      content.dataset.text = newText;
    }
  }
}

/** Atualiza só as edges conectadas a um nó específico */
updateEdgesForNode(nodeId: string): void {
  for (const edge of this.engine.data.edges || []) {
    if (edge.fromNode === nodeId || edge.toNode === nodeId) {
      this.updateEdgePath(edge.id);
    }
  }
}
```

---

## Módulo 2: CanvasNodeElement.ts — Design Obsidian

### Estrutura DOM de um nó (Obsidian-like)

```html
<!-- Nó de Texto -->
<div class="canvas-node" data-node-id="abc123" data-node-type="text">
  <div class="canvas-node-accent" style="background: #fb4934;"></div>
  <div class="canvas-node-header">
    <span class="canvas-node-badge">📝</span>
    <span class="canvas-node-filename">Nota</span>
  </div>
  <div class="canvas-node-content">
    <div class="markdown-body">
      <h1>Título</h1>
      <p>Conteúdo renderizado em Markdown</p>
    </div>
  </div>
  <!-- Portas de conexão (aparecem no hover) -->
  <div class="canvas-node-port" data-side="top"></div>
  <div class="canvas-node-port" data-side="right"></div>
  <div class="canvas-node-port" data-side="bottom"></div>
  <div class="canvas-node-port" data-side="left"></div>
  <!-- Resize handles (aparecem na seleção) -->
  <div class="canvas-node-resize" data-corner="nw"></div>
  <div class="canvas-node-resize" data-corner="ne"></div>
  <div class="canvas-node-resize" data-corner="sw"></div>
  <div class="canvas-node-resize" data-corner="se"></div>
</div>

<!-- Nó de Link -->
<div class="canvas-node" data-node-id="def456" data-node-type="link">
  <div class="canvas-node-accent"></div>
  <div class="canvas-node-header">
    <span class="canvas-node-badge">🔗</span>
    <span class="canvas-node-filename">google.com</span>
  </div>
  <div class="canvas-node-content">
    <iframe src="..." sandbox="allow-scripts"></iframe>
  </div>
  <div class="canvas-link-label">https://google.com</div>
</div>

<!-- Nó de Grupo (Obsidian-style) -->
<div class="canvas-node canvas-node-group" data-node-id="ghi789" data-node-type="group">
  <div class="canvas-group-header">
    <span class="canvas-group-label">Módulo Auth</span>
  </div>
</div>

<!-- Nó de Arquivo -->
<div class="canvas-node" data-node-id="jkl012" data-node-type="file">
  <div class="canvas-node-accent"></div>
  <div class="canvas-node-header">
    <span class="canvas-node-badge">📄</span>
    <span class="canvas-node-filename">router.py</span>
  </div>
  <div class="canvas-node-content">
    <div class="canvas-file-placeholder">
      <span style="font-size:24px;">📄</span>
      <span>router.py</span>
    </div>
  </div>
</div>
```

### Badges por tipo

| Tipo | Badge | Header |
|------|-------|--------|
| `text` | 📝 | "Nota" |
| `file` | 📄 | nome do arquivo |
| `link` | 🔗 | domínio extraído da URL |
| `group` | — | label acima com dashed border |

---

## Módulo 3: CanvasInteraction.ts — State Machine

### Estados

```
idle → panning      (click no background + drag)
idle → dragging     (click no nó + drag)
idle → resizing     (click no resize handle + drag)
idle → connecting   (click na porta + drag)  ← NOVO
idle → selecting    (click no background + shift/ctrl + drag = box select) ← NOVO
idle → editing      (double-click no nó = inline textarea) ← NOVO
```

### Inline Editing (substituir prompt())

```typescript
function startInlineEdit(nodeId: string): void {
  const node = engine.getNode(nodeId);
  if (!node || node.type !== 'text') return;

  const el = renderer.getElement(nodeId);
  const content = el?.querySelector('.canvas-node-content');
  if (!content) return;

  // Substituir conteúdo por textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'canvas-inline-editor';
  textarea.value = (node as TextNode).text;
  textarea.style.cssText = `
    width: 100%; height: 100%; resize: none; border: none;
    background: transparent; color: #cdd6f4; font-size: 12px;
    line-height: 1.5; padding: 8px 10px; font-family: inherit;
    outline: none;
  `;

  content.innerHTML = '';
  content.appendChild(textarea);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  // Salvar ao sair
  const save = () => {
    (node as TextNode).text = textarea.value;
    engine.notifyChange();
    renderer.updateNodeDOM(nodeId); // Re-render markdown
  };

  textarea.addEventListener('blur', save);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      save();
      textarea.blur();
    }
  });
}
```

### Edge Creation (drag de porta)

```typescript
// Estado connecting
function onPortDragStart(nodeId: string, side: NodeSide): void {
  interaction = 'connecting';
  connectFrom = { nodeId, side };
  // Criar linha temporária SVG do ponto de partida ao mouse
  tempEdge = createTempEdgeSVG(portPos(engine.getNode(nodeId)!, side));
}

function onPortDragMove(e: PointerEvent): void {
  if (interaction !== 'connecting' || !tempEdge) return;
  const worldPos = screenToWorld(e.clientX, e.clientY);
  updateTempEdgeTo(tempEdge, worldPos);

  // Highlight porta mais próxima como target
  highlightNearestPort(worldPos);
}

function onPortDragEnd(e: PointerEvent): void {
  if (!connectFrom) return;
  const target = findPortUnderCursor(e.clientX, e.clientY);
  
  if (target && target.nodeId !== connectFrom.nodeId) {
    engine.addEdge({
      id: generateId(),
      fromNode: connectFrom.nodeId,
      fromSide: connectFrom.side,
      toNode: target.nodeId,
      toSide: target.side,
      toEnd: 'arrow',
    });
  }
  
  removeTempEdge();
  interaction = 'idle';
}
```

### Resize funcional

```typescript
// Estado resizing
let resizeCorner: 'nw' | 'ne' | 'sw' | 'se' = 'se';
let resizeStartBounds = { x: 0, y: 0, w: 0, h: 0 };

function onResizeMove(e: PointerEvent): void {
  const dx = (e.clientX - pointerStartX) / scale;
  const dy = (e.clientY - pointerStartY) / scale;
  const b = resizeStartBounds;
  const MIN_W = 80, MIN_H = 60;

  let newX = b.x, newY = b.y, newW = b.w, newH = b.h;

  switch (resizeCorner) {
    case 'se': newW = Math.max(MIN_W, b.w + dx); newH = Math.max(MIN_H, b.h + dy); break;
    case 'sw': newX = b.x + dx; newW = Math.max(MIN_W, b.w - dx); newH = Math.max(MIN_H, b.h + dy); break;
    case 'ne': newW = Math.max(MIN_W, b.w + dx); newY = b.y + dy; newH = Math.max(MIN_H, b.h - dy); break;
    case 'nw': newX = b.x + dx; newY = b.y + dy; newW = Math.max(MIN_W, b.w - dx); newH = Math.max(MIN_H, b.h - dy); break;
  }

  node.x = Math.round(newX);
  node.y = Math.round(newY);
  node.width = Math.round(newW);
  node.height = Math.round(newH);
  renderer.updateNodeDOM(nodeId);
  renderer.updateEdgesForNode(nodeId);
}
```

---

## Módulo 4: CSS — Design Obsidian Dark Theme

### Princípios do Obsidian Canvas

1. **Fundo:** Grid de pontos sutis (já temos)
2. **Cards:** Background escuro sólido `#262630`, borda ultra sutil `rgba(255,255,255,0.06)`
3. **Accent bar:** Barra colorida na esquerda (3px), não no topo
4. **Seleção:** Borda `var(--accent)` + glow sutil
5. **Grupos:** Borda dashed, sem background, label flutuante acima
6. **Edges:** Bezier curves suaves, cor `#888` default, arrows com marker SVG
7. **Portas:** Círculos que aparecem no hover, escalam no hover da porta
8. **Resize:** Quadradinhos nos cantos, aparecem só quando selecionado

### CSS a reescrever (substituir linhas 4430-4700 do style.css)

```css
/* ─── Canvas Viewport ─────────────────────────────────────────── */
.canvas-viewport {
  width: 100%; height: 100%;
  overflow: hidden; position: relative;
  cursor: grab;
  background-color: var(--canvas-bg, #1e1e2e);
  background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}
.canvas-viewport.is-panning { cursor: grabbing; }
.canvas-viewport.is-connecting { cursor: crosshair; }

/* ─── World Container ─────────────────────────────────────────── */
.canvas-world {
  position: absolute; top: 0; left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

/* ─── Node Card ───────────────────────────────────────────────── */
.canvas-node {
  position: absolute;
  background: var(--canvas-card-bg, #262630);
  border: 1.5px solid var(--canvas-card-border, rgba(255,255,255,0.06));
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
  cursor: default;
}
.canvas-node:hover {
  border-color: rgba(255,255,255,0.12);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.canvas-node-selected {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 2px rgba(124,58,237,0.3), 0 4px 16px rgba(0,0,0,0.4) !important;
}

/* Accent bar (Obsidian-style left stripe) */
.canvas-node-accent {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 8px 0 0 8px;
  z-index: 2; transition: background 0.2s;
}

/* Header */
.canvas-node-header {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  cursor: move; min-height: 28px; flex-shrink: 0;
}
.canvas-node-badge { font-size: 12px; flex-shrink: 0; }
.canvas-node-filename {
  font-size: 11px; font-weight: 600;
  color: var(--text-secondary, #a6adc8);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* Content */
.canvas-node-content {
  flex: 1; overflow: auto;
  padding: 10px 12px;
  font-size: 13px; color: #cdd6f4; line-height: 1.6;
}

/* ─── Group (dashed border, transparent) ──────────────────────── */
.canvas-node-group {
  background: rgba(124,58,237,0.03);
  border: 2px dashed var(--node-accent, rgba(124,58,237,0.4));
  box-shadow: none; z-index: 0; overflow: visible;
  border-radius: 12px;
}
.canvas-group-header {
  position: absolute; top: -26px; left: 8px;
  background: transparent; border: none; padding: 0;
}
.canvas-group-label {
  font-size: 14px; font-weight: 700;
  color: var(--node-accent, #a78bfa);
  letter-spacing: 0.3px;
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}

/* ─── Inline Editor ───────────────────────────────────────────── */
.canvas-inline-editor {
  width: 100%; height: 100%; resize: none;
  border: none; outline: none;
  background: transparent;
  color: #cdd6f4; font-size: 13px; line-height: 1.6;
  padding: 10px 12px; font-family: inherit;
}

/* ─── Portas de Conexão ───────────────────────────────────────── */
.canvas-node-port {
  position: absolute;
  width: 12px; height: 12px;
  background: var(--accent, #7c3aed);
  border: 2.5px solid var(--canvas-bg, #1e1e2e);
  border-radius: 50%;
  cursor: crosshair;
  opacity: 0;
  transition: opacity 0.15s, transform 0.15s;
  z-index: 10;
}
.canvas-node:hover .canvas-node-port { opacity: 0.5; }
.canvas-node-port:hover {
  opacity: 1 !important;
  transform: scale(1.4);
  box-shadow: 0 0 8px rgba(124,58,237,0.5);
}
.canvas-node-port[data-side="top"]    { top: -6px;    left: 50%; transform: translateX(-50%); }
.canvas-node-port[data-side="bottom"] { bottom: -6px; left: 50%; transform: translateX(-50%); }
.canvas-node-port[data-side="left"]   { left: -6px;   top: 50%;  transform: translateY(-50%); }
.canvas-node-port[data-side="right"]  { right: -6px;  top: 50%;  transform: translateY(-50%); }
.canvas-node-port.is-target {
  opacity: 1 !important;
  transform: scale(1.6);
  background: var(--accent-green, #33ffaa);
}

/* ─── Resize Handles ──────────────────────────────────────────── */
.canvas-node-resize {
  position: absolute;
  width: 8px; height: 8px;
  background: var(--accent); border: 1.5px solid var(--canvas-bg);
  border-radius: 2px;
  opacity: 0; transition: opacity 0.15s;
  z-index: 10;
}
.canvas-node-selected .canvas-node-resize { opacity: 1; }
.canvas-node-resize[data-corner="nw"] { top: -4px;    left: -4px;   cursor: nw-resize; }
.canvas-node-resize[data-corner="ne"] { top: -4px;    right: -4px;  cursor: ne-resize; }
.canvas-node-resize[data-corner="sw"] { bottom: -4px; left: -4px;   cursor: sw-resize; }
.canvas-node-resize[data-corner="se"] { bottom: -4px; right: -4px;  cursor: se-resize; }

/* ─── SVG Edges ───────────────────────────────────────────────── */
.canvas-edge-path {
  fill: none;
  stroke: rgba(166,173,200,0.4);
  stroke-width: 2;
  transition: stroke 0.15s;
}
.canvas-edge-path:hover {
  stroke: var(--accent);
  stroke-width: 3;
}
.canvas-edge-path.is-selected {
  stroke: var(--accent);
  stroke-width: 2.5;
}
.canvas-edge-temp {
  stroke: var(--accent);
  stroke-width: 2;
  stroke-dasharray: 8 4;
  opacity: 0.6;
}
.canvas-edge-label {
  font-size: 11px; font-weight: 500;
  fill: var(--text-secondary);
}
.canvas-edge-label-bg {
  fill: var(--canvas-bg, #1e1e2e);
  rx: 4;
}
```

---

## Módulo 5: CanvasToolbar.ts — Toolbar Redesign

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ∞ Lumina Canvas    [Código] [Editar] [Ver]    [Exportar] [✕] │
├──────────────────────────────────────────────────────────────┤
│ [📝 Texto] [🔗 Link] [📦 Grupo] │ [🔍+ 🔍- ⊞] │ [🎨···] │ [🗑️] │
└──────────────────────────────────────────────────────────────┘
```

### Features extras do toolbar:
- **Minimap** (canto inferior direito) — retângulo que mostra posição do viewport no canvas inteiro
- **Zoom indicator** — mostra % atual do zoom (ex: "125%")
- **Selection info** — quando nós selecionados, mostra "3 selecionados"

---

## Ordem de Implementação

### Fase 1: Core (rendering + interação base)
1. `CanvasRenderer.ts` — viewport culling + mount/unmount
2. `CanvasNodeElement.ts` — estrutura DOM Obsidian
3. `CanvasView.ts` — orquestrador (substitui InfinitePreview.ts)
4. CSS rewrite

### Fase 2: Interações completas
5. `CanvasInteraction.ts` — state machine
6. Drag de nós (já funciona, migrar)
7. Resize funcional (4 cantos)
8. Inline editing (textarea)

### Fase 3: Edges + Polish
9. `CanvasEdgeRenderer.ts` — dirty update por nó
10. Edge creation por drag de porta
11. `CanvasToolbar.ts` — toolbar redesign
12. Minimap

### Fase 4: Performance
13. Viewport culling otimizado (spatial index)
14. Debounce no pan/zoom
15. requestAnimationFrame batching

---

## Estimativas

| Fase | Tempo | Prioridade |
|------|-------|-----------|
| Fase 1 | ~4h | P0 — sem isso nada funciona |
| Fase 2 | ~3h | P0 — interação mínima |
| Fase 3 | ~3h | P1 — features completas |
| Fase 4 | ~2h | P2 — otimização |
| **Total** | **~12h** | |

---

## Referências

- [JSON Canvas Spec 1.0](https://jsoncanvas.org/spec/1.0)
- [Obsidian Canvas — Electron/DOM-based, CSS transform, viewport culling](https://obsidian.md)
- Classes CSS do Obsidian: `.canvas-node`, `.canvas-node-container`, `.canvas-node-content`, `.canvas-edge-path`
- Nosso `CanvasEngine.ts` já é 100% compatível com a spec

---

*Documento criado em: Abril 2026*
*Status: Planejado — aguardando sessão dedicada*
