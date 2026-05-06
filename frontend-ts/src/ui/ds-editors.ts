/**
 * Design Studio — Visual Property Editors
 * Gradient Editor, Border Radius Editor, Spacing Visualizer,
 * Google Fonts Browser, Scroll Animation Builder.
 */

// ─── Gradient Editor ────────────────────────────────────────────────

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export function parseGradient(css: string): { angle: number; stops: GradientStop[] } | null {
  const m = css.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (!m) return null;
  const angle = parseInt(m[1]);
  const stopParts = m[2].split(/,\s*(?=[#r])/);
  const stops: GradientStop[] = stopParts.map(s => {
    const parts = s.trim().split(/\s+/);
    return {
      color: parts[0],
      position: parts[1] ? parseInt(parts[1]) : 50,
    };
  });
  return { angle, stops };
}

export function buildGradientCSS(angle: number, stops: GradientStop[]): string {
  const stopsStr = stops.map(s => `${s.color} ${s.position}%`).join(', ');
  return `linear-gradient(${angle}deg, ${stopsStr})`;
}

export function renderGradientEditor(currentValue: string, onChange: (css: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ds-gradient-editor';
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

  const parsed = parseGradient(currentValue) || { angle: 135, stops: [{ color: '#7c3aed', position: 0 }, { color: '#6366f1', position: 100 }] };
  let { angle, stops } = parsed;

  function update() {
    const css = buildGradientCSS(angle, stops);
    preview.style.background = css;
    onChange(css);
  }

  // Preview bar
  const preview = document.createElement('div');
  preview.style.cssText = `width:100%;height:24px;border-radius:6px;border:1px solid #313244;background:${currentValue || buildGradientCSS(angle, stops)};cursor:crosshair;`;
  container.appendChild(preview);

  // Angle control
  const angleRow = document.createElement('div');
  angleRow.style.cssText = 'display:flex;align-items:center;gap:6px;';
  angleRow.innerHTML = `<span style="font-size:10px;color:#585b70;min-width:36px;">Angle</span>
    <input type="range" min="0" max="360" value="${angle}" style="flex:1;accent-color:#7c3aed;height:4px;" />
    <span style="font-size:10px;color:#a6adc8;min-width:28px;">${angle}°</span>`;
  const angleInput = angleRow.querySelector('input') as HTMLInputElement;
  const angleLabel = angleRow.querySelectorAll('span')[1];
  angleInput.addEventListener('input', () => {
    angle = parseInt(angleInput.value);
    angleLabel.textContent = `${angle}°`;
    update();
  });
  container.appendChild(angleRow);

  // Color stops
  for (let i = 0; i < stops.length; i++) {
    const stopRow = document.createElement('div');
    stopRow.style.cssText = 'display:flex;align-items:center;gap:4px;';
    stopRow.innerHTML = `<input type="color" value="${stops[i].color}" style="width:24px;height:20px;border:none;padding:0;cursor:pointer;border-radius:3px;" />
      <input type="range" min="0" max="100" value="${stops[i].position}" style="flex:1;accent-color:#7c3aed;height:3px;" />
      <span style="font-size:9px;color:#585b70;min-width:22px;">${stops[i].position}%</span>`;
    const colorInp = stopRow.querySelector('input[type=color]') as HTMLInputElement;
    const posInp = stopRow.querySelector('input[type=range]') as HTMLInputElement;
    const posLabel = stopRow.querySelector('span') as HTMLElement;
    const idx = i;
    colorInp.addEventListener('input', () => { stops[idx].color = colorInp.value; update(); });
    posInp.addEventListener('input', () => { stops[idx].position = parseInt(posInp.value); posLabel.textContent = `${posInp.value}%`; update(); });
    container.appendChild(stopRow);
  }

  // Add stop button
  const addBtn = document.createElement('button');
  addBtn.className = 'ds-project-btn';
  addBtn.style.cssText = 'font-size:10px;padding:2px 8px;';
  addBtn.textContent = '+ Add Stop';
  addBtn.addEventListener('click', () => {
    stops.push({ color: '#ffffff', position: 50 });
    // Re-render
    const parent = container.parentElement;
    const newEditor = renderGradientEditor(buildGradientCSS(angle, stops), onChange);
    parent?.replaceChild(newEditor, container);
  });
  container.appendChild(addBtn);

  return container;
}

// ─── Border Radius Editor ───────────────────────────────────────────

export function renderBorderRadiusEditor(current: number | string, onChange: (val: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

  let linked = true;
  let corners = [0, 0, 0, 0]; // TL, TR, BR, BL

  if (typeof current === 'number') {
    corners = [current, current, current, current];
  } else if (typeof current === 'string') {
    const parts = current.replace(/px/g, '').trim().split(/\s+/).map(Number);
    if (parts.length === 1) corners = [parts[0], parts[0], parts[0], parts[0]];
    else if (parts.length === 4) corners = parts;
  }

  function update() {
    const val = linked ? `${corners[0]}px` : `${corners[0]}px ${corners[1]}px ${corners[2]}px ${corners[3]}px`;
    onChange(val);
    prev.style.borderRadius = val;
  }

  // Preview box
  const prev = document.createElement('div');
  prev.style.cssText = `width:48px;height:48px;border:2px solid #7c3aed;margin:0 auto;border-radius:${corners[0]}px;background:rgba(124,58,237,0.1);`;
  container.appendChild(prev);

  // Link toggle
  const linkRow = document.createElement('div');
  linkRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;';
  linkRow.innerHTML = `<button class="ds-project-btn" style="font-size:9px;padding:1px 6px;">${linked ? '🔗 Linked' : '🔓 Independent'}</button>`;
  const linkBtn = linkRow.querySelector('button')!;
  linkBtn.addEventListener('click', () => {
    linked = !linked;
    linkBtn.textContent = linked ? '🔗 Linked' : '🔓 Independent';
  });
  container.appendChild(linkRow);

  // Corner inputs
  const labels = ['TL', 'TR', 'BR', 'BL'];
  const row = document.createElement('div');
  row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;';
  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('div');
    cell.style.cssText = 'display:flex;align-items:center;gap:2px;';
    cell.innerHTML = `<span style="font-size:9px;color:#585b70;min-width:16px;">${labels[i]}</span><input type="number" value="${corners[i]}" min="0" max="999" style="width:100%;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:2px 4px;font-size:10px;" />`;
    const inp = cell.querySelector('input') as HTMLInputElement;
    const idx = i;
    inp.addEventListener('input', () => {
      const v = parseInt(inp.value) || 0;
      if (linked) {
        corners = [v, v, v, v];
        row.querySelectorAll('input').forEach(i => (i as HTMLInputElement).value = String(v));
      } else {
        corners[idx] = v;
      }
      update();
    });
    row.appendChild(cell);
  }
  container.appendChild(row);

  return container;
}

// ─── Spacing Visualizer ─────────────────────────────────────────────

export function renderSpacingVisualizer(
  padding: string,
  margin: string,
  onPaddingChange: (val: string) => void,
  onMarginChange: (val: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;';

  function parseSides(val: string): number[] {
    const parts = val.replace(/px/g, '').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    if (parts.length === 0) return [0, 0, 0, 0];
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]];
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]];
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]];
    return parts.slice(0, 4);
  }

  const marginSides = parseSides(margin);
  const paddingSides = parseSides(padding);

  // Box model visual
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:140px;height:100px;';

  // Margin box (outer, orange tint)
  box.innerHTML = `
    <div style="position:absolute;inset:0;background:rgba(249,115,22,0.08);border:1px dashed rgba(249,115,22,0.3);border-radius:4px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:8px;color:#f97316;" class="ds-spacing-val" data-type="margin" data-side="0">${marginSides[0]}</div>
      <div style="position:absolute;bottom:1px;left:50%;transform:translateX(-50%);font-size:8px;color:#f97316;" class="ds-spacing-val" data-type="margin" data-side="2">${marginSides[2]}</div>
      <div style="position:absolute;left:2px;top:50%;transform:translateY(-50%);font-size:8px;color:#f97316;" class="ds-spacing-val" data-type="margin" data-side="3">${marginSides[3]}</div>
      <div style="position:absolute;right:2px;top:50%;transform:translateY(-50%);font-size:8px;color:#f97316;" class="ds-spacing-val" data-type="margin" data-side="1">${marginSides[1]}</div>
      <div style="width:80px;height:56px;background:rgba(34,197,94,0.08);border:1px dashed rgba(34,197,94,0.3);border-radius:3px;position:relative;">
        <div style="position:absolute;top:1px;left:50%;transform:translateX(-50%);font-size:8px;color:#22c55e;" class="ds-spacing-val" data-type="padding" data-side="0">${paddingSides[0]}</div>
        <div style="position:absolute;bottom:1px;left:50%;transform:translateX(-50%);font-size:8px;color:#22c55e;" class="ds-spacing-val" data-type="padding" data-side="2">${paddingSides[2]}</div>
        <div style="position:absolute;left:2px;top:50%;transform:translateY(-50%);font-size:8px;color:#22c55e;" class="ds-spacing-val" data-type="padding" data-side="3">${paddingSides[3]}</div>
        <div style="position:absolute;right:2px;top:50%;transform:translateY(-50%);font-size:8px;color:#22c55e;" class="ds-spacing-val" data-type="padding" data-side="1">${paddingSides[1]}</div>
        <div style="position:absolute;inset:14px;background:rgba(124,58,237,0.15);border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#7c3aed;">content</div>
      </div>
    </div>`;

  container.appendChild(box);

  // Labels
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:12px;font-size:9px;';
  legend.innerHTML = `<span style="color:#f97316;">■ margin</span><span style="color:#22c55e;">■ padding</span>`;
  container.appendChild(legend);

  // Editable inputs row
  const inputsRow = document.createElement('div');
  inputsRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;width:100%;';
  inputsRow.innerHTML = `
    <div style="display:flex;align-items:center;gap:2px;"><span style="font-size:9px;color:#f97316;min-width:35px;">Margin</span><input type="text" value="${margin || '0'}" style="width:100%;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:2px 4px;font-size:10px;" data-spacing="margin" /></div>
    <div style="display:flex;align-items:center;gap:2px;"><span style="font-size:9px;color:#22c55e;min-width:35px;">Padding</span><input type="text" value="${padding || '0'}" style="width:100%;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:2px 4px;font-size:10px;" data-spacing="padding" /></div>`;
  const marginInput = inputsRow.querySelector('[data-spacing=margin]') as HTMLInputElement;
  const paddingInput = inputsRow.querySelector('[data-spacing=padding]') as HTMLInputElement;
  marginInput?.addEventListener('change', () => onMarginChange(marginInput.value));
  paddingInput?.addEventListener('change', () => onPaddingChange(paddingInput.value));
  container.appendChild(inputsRow);

  return container;
}

// ─── Google Fonts Browser ───────────────────────────────────────────

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Lato', 'Playfair Display',
  'Raleway', 'Nunito', 'Outfit', 'Space Grotesk', 'Syne', 'JetBrains Mono', 'Fira Code',
  'Source Code Pro', 'IBM Plex Sans', 'DM Sans', 'Manrope', 'Plus Jakarta Sans', 'Lexend',
  'Bricolage Grotesque', 'Geist', 'Onest', 'Clash Display', 'Cabinet Grotesk', 'General Sans',
  'Satoshi', 'Switzer', 'Erode', 'Zodiak',
];

export function renderFontBrowser(currentFont: string, onSelect: (font: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;';

  // Search
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = '🔍 Search fonts...';
  search.style.cssText = 'width:100%;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:6px;padding:6px 10px;font-size:11px;box-sizing:border-box;';
  container.appendChild(search);

  const grid = document.createElement('div');
  grid.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

  function renderFonts(filter: string = '') {
    grid.innerHTML = '';
    const filtered = GOOGLE_FONTS.filter(f => f.toLowerCase().includes(filter.toLowerCase()));
    for (const font of filtered) {
      const item = document.createElement('div');
      const isActive = font === currentFont;
      item.style.cssText = `padding:8px 10px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid ${isActive ? '#7c3aed' : 'transparent'};background:${isActive ? 'rgba(124,58,237,0.1)' : 'transparent'};`;
      item.innerHTML = `<div style="font-family:'${font}',sans-serif;font-size:14px;color:#cdd6f4;">${font}</div><div style="font-family:'${font}',sans-serif;font-size:11px;color:#585b70;margin-top:2px;">The quick brown fox jumps over the lazy dog</div>`;
      item.addEventListener('mouseenter', () => { if (!isActive) item.style.background = 'rgba(255,255,255,0.03)'; });
      item.addEventListener('mouseleave', () => { if (!isActive) item.style.background = 'transparent'; });
      item.addEventListener('click', () => onSelect(font));
      grid.appendChild(item);
    }
  }

  search.addEventListener('input', () => renderFonts(search.value));
  renderFonts();
  container.appendChild(grid);

  // Load Google Fonts CSS
  if (!document.querySelector('#ds-google-fonts-css')) {
    const link = document.createElement('link');
    link.id = 'ds-google-fonts-css';
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(f => `family=${f.replace(/\s+/g, '+')}`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }

  return container;
}

// ─── Scroll Animation Presets ───────────────────────────────────────

export const SCROLL_ANIMATION_PRESETS = [
  { name: 'none', label: 'None', css: '' },
  { name: 'fadeInUp', label: 'Fade In Up', css: 'ds-fadeInUp 0.6s ease both', trigger: 'scroll-in' },
  { name: 'fadeInDown', label: 'Fade In Down', css: 'ds-fadeInDown 0.6s ease both', trigger: 'scroll-in' },
  { name: 'fadeInLeft', label: 'Fade In Left', css: 'ds-fadeInLeft 0.6s ease both', trigger: 'scroll-in' },
  { name: 'fadeInRight', label: 'Fade In Right', css: 'ds-fadeInRight 0.6s ease both', trigger: 'scroll-in' },
  { name: 'zoomIn', label: 'Zoom In', css: 'ds-zoomIn 0.5s ease both', trigger: 'scroll-in' },
  { name: 'zoomOut', label: 'Zoom Out', css: 'ds-zoomOut 0.5s ease both', trigger: 'scroll-in' },
  { name: 'flipIn', label: 'Flip In', css: 'ds-flipIn 0.6s ease both', trigger: 'scroll-in' },
  { name: 'parallaxSlow', label: 'Parallax Slow', css: '', trigger: 'scroll-progress' },
  { name: 'parallaxFast', label: 'Parallax Fast', css: '', trigger: 'scroll-progress' },
];

export const SCROLL_ANIMATION_KEYFRAMES = `
@keyframes ds-fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ds-fadeInDown { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ds-fadeInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes ds-fadeInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes ds-zoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes ds-zoomOut { from { opacity: 0; transform: scale(1.2); } to { opacity: 1; transform: scale(1); } }
@keyframes ds-flipIn { from { opacity: 0; transform: perspective(400px) rotateY(90deg); } to { opacity: 1; transform: perspective(400px) rotateY(0); } }
`;
