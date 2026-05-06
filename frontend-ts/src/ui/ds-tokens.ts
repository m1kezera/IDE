/**
 * Design Studio — Design Tokens System
 * Reusable design variables (colors, fonts, spacing, shadows).
 */

export interface DesignToken {
  id: string;
  name: string;         // e.g. "$primary", "$font-heading"
  value: string;        // e.g. "#7c3aed", "Inter"
  category: 'color' | 'typography' | 'spacing' | 'shadow';
}

let tokens: DesignToken[] = [
  // Default tokens
  { id: 'tk-1', name: '$primary', value: '#7c3aed', category: 'color' },
  { id: 'tk-2', name: '$secondary', value: '#3b82f6', category: 'color' },
  { id: 'tk-3', name: '$accent', value: '#f97316', category: 'color' },
  { id: 'tk-4', name: '$success', value: '#22c55e', category: 'color' },
  { id: 'tk-5', name: '$danger', value: '#ef4444', category: 'color' },
  { id: 'tk-6', name: '$text', value: '#cdd6f4', category: 'color' },
  { id: 'tk-7', name: '$bg', value: '#0d0d15', category: 'color' },
  { id: 'tk-8', name: '$surface', value: '#1e1e2e', category: 'color' },
  { id: 'tk-9', name: '$font-heading', value: 'Inter', category: 'typography' },
  { id: 'tk-10', name: '$font-body', value: 'Inter', category: 'typography' },
  { id: 'tk-11', name: '$font-mono', value: 'JetBrains Mono', category: 'typography' },
  { id: 'tk-12', name: '$space-xs', value: '4px', category: 'spacing' },
  { id: 'tk-13', name: '$space-sm', value: '8px', category: 'spacing' },
  { id: 'tk-14', name: '$space-md', value: '16px', category: 'spacing' },
  { id: 'tk-15', name: '$space-lg', value: '32px', category: 'spacing' },
  { id: 'tk-16', name: '$space-xl', value: '64px', category: 'spacing' },
  { id: 'tk-17', name: '$shadow-sm', value: '0 1px 3px rgba(0,0,0,0.2)', category: 'shadow' },
  { id: 'tk-18', name: '$shadow-md', value: '0 4px 12px rgba(0,0,0,0.3)', category: 'shadow' },
  { id: 'tk-19', name: '$shadow-lg', value: '0 8px 32px rgba(0,0,0,0.4)', category: 'shadow' },
];

export function getTokens(): DesignToken[] { return tokens; }
export function getTokensByCategory(cat: string): DesignToken[] { return tokens.filter(t => t.category === cat); }

export function addToken(name: string, value: string, category: DesignToken['category']): DesignToken {
  const tk: DesignToken = { id: `tk-${Date.now()}`, name: name.startsWith('$') ? name : `$${name}`, value, category };
  tokens.push(tk);
  return tk;
}

export function updateToken(id: string, name: string, value: string): void {
  const tk = tokens.find(t => t.id === id);
  if (tk) { tk.name = name; tk.value = value; }
}

export function deleteToken(id: string): void {
  tokens = tokens.filter(t => t.id !== id);
}

/** Resolve a token reference in a value string. E.g. "$primary" → "#7c3aed" */
export function resolveTokens(value: string): string {
  if (!value || !value.includes('$')) return value;
  let resolved = value;
  // Sort longest names first to prevent partial matches (e.g. $space-xs before $space)
  const sorted = [...tokens].sort((a, b) => b.name.length - a.name.length);
  // Single pass — no recursive resolution to prevent infinite loops
  for (const tk of sorted) {
    resolved = resolved.split(tk.name).join(tk.value);
  }
  return resolved;
}

export function loadTokens(data: DesignToken[]): void {
  if (data && data.length > 0) tokens = data;
}

export function serializeTokens(): DesignToken[] {
  return tokens;
}

/** Export tokens as CSS custom properties */
export function exportAsCSS(): string {
  let css = ':root {\n';
  for (const tk of tokens) {
    const varName = tk.name.replace('$', '--');
    css += `  ${varName}: ${tk.value};\n`;
  }
  css += '}\n';
  return css;
}

/** Export tokens as JSON */
export function exportAsJSON(): string {
  return JSON.stringify(tokens, null, 2);
}

// ─── Token Panel Renderer ───────────────────────────────────────────

export function renderTokensPanel(
  onUpdate: () => void,
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:8px;';

  // Add token form
  const addRow = document.createElement('div');
  addRow.style.cssText = 'display:flex;gap:4px;';
  addRow.innerHTML = `
    <input id="ds-tk-name" placeholder="$name" style="flex:1;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:4px 6px;font-size:10px;outline:none;" />
    <input id="ds-tk-value" placeholder="value" style="flex:1;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:4px 6px;font-size:10px;outline:none;" />
    <select id="ds-tk-cat" style="background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:4px;font-size:9px;">
      <option value="color">🎨 Color</option>
      <option value="typography">🔤 Type</option>
      <option value="spacing">📏 Space</option>
      <option value="shadow">🌑 Shadow</option>
    </select>
    <button id="ds-tk-add" style="background:#7c3aed;border:none;color:#fff;border-radius:4px;padding:4px 8px;font-size:10px;cursor:pointer;">+</button>
  `;
  container.appendChild(addRow);

  addRow.querySelector('#ds-tk-add')?.addEventListener('click', () => {
    const nameEl = addRow.querySelector('#ds-tk-name') as HTMLInputElement;
    const valEl = addRow.querySelector('#ds-tk-value') as HTMLInputElement;
    const catEl = addRow.querySelector('#ds-tk-cat') as HTMLSelectElement;
    if (nameEl.value && valEl.value) {
      addToken(nameEl.value, valEl.value, catEl.value as any);
      nameEl.value = ''; valEl.value = '';
      rebuildList();
      onUpdate();
    }
  });

  // Export buttons
  const exportRow = document.createElement('div');
  exportRow.style.cssText = 'display:flex;gap:4px;';
  exportRow.innerHTML = `
    <button class="ds-tk-export-css" style="flex:1;padding:3px;border-radius:4px;border:1px solid #313244;background:transparent;color:#585b70;font-size:9px;cursor:pointer;">📋 CSS</button>
    <button class="ds-tk-export-json" style="flex:1;padding:3px;border-radius:4px;border:1px solid #313244;background:transparent;color:#585b70;font-size:9px;cursor:pointer;">📋 JSON</button>
  `;
  exportRow.querySelector('.ds-tk-export-css')?.addEventListener('click', () => {
    navigator.clipboard.writeText(exportAsCSS());
  });
  exportRow.querySelector('.ds-tk-export-json')?.addEventListener('click', () => {
    navigator.clipboard.writeText(exportAsJSON());
  });
  container.appendChild(exportRow);

  // Token list by category
  const list = document.createElement('div');
  list.style.cssText = 'overflow-y:auto;max-height:calc(100vh - 300px);';
  container.appendChild(list);

  function rebuildList() {
    list.innerHTML = '';
    const categories = ['color', 'typography', 'spacing', 'shadow'] as const;
    const catLabels = { color: '🎨 Colors', typography: '🔤 Typography', spacing: '📏 Spacing', shadow: '🌑 Shadows' };

    for (const cat of categories) {
      const catTokens = getTokensByCategory(cat);
      if (catTokens.length === 0) continue;

      const header = document.createElement('div');
      header.style.cssText = 'font-size:10px;font-weight:600;color:#585b70;margin:8px 0 4px;';
      header.textContent = catLabels[cat];
      list.appendChild(header);

      for (const tk of catTokens) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:4px;padding:3px 4px;border-radius:4px;margin-bottom:2px;background:#11111b;';

        // Color swatch for color tokens
        if (cat === 'color') {
          const swatch = document.createElement('div');
          swatch.style.cssText = `width:14px;height:14px;border-radius:3px;border:1px solid #313244;background:${tk.value};flex-shrink:0;`;
          row.appendChild(swatch);
        }

        const name = document.createElement('span');
        name.style.cssText = 'font-size:10px;color:#7c3aed;font-weight:600;min-width:70px;';
        name.textContent = tk.name;
        row.appendChild(name);

        const val = document.createElement('input');
        val.type = 'text';
        val.value = tk.value;
        val.style.cssText = 'flex:1;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:3px;padding:2px 4px;font-size:9px;outline:none;';
        val.addEventListener('blur', () => {
          updateToken(tk.id, tk.name, val.value);
          onUpdate();
          rebuildList();
        });
        val.addEventListener('keydown', (e) => { if (e.key === 'Enter') val.blur(); });
        row.appendChild(val);

        const del = document.createElement('button');
        del.textContent = '✕';
        del.style.cssText = 'background:none;border:none;color:#f38ba8;cursor:pointer;font-size:9px;padding:2px;';
        del.addEventListener('click', () => { deleteToken(tk.id); rebuildList(); onUpdate(); });
        row.appendChild(del);

        list.appendChild(row);
      }
    }
  }

  rebuildList();
  return container;
}
