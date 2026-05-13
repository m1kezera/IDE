/**
 * Design Studio — Color Palette Generator
 * Generates harmonious color palettes using color theory algorithms.
 */

// ─── Color Conversion Utilities ─────────────────────────────────────

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── Palette Algorithms ─────────────────────────────────────────────

export type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'tetradic' | 'monochromatic';

export function generatePalette(baseHex: string, type: PaletteType): string[] {
  const { h, s, l } = hexToHSL(baseHex);
  
  switch (type) {
    case 'complementary':
      return [
        baseHex,
        hslToHex((h + 180) % 360, s, l),
        hslToHex(h, Math.max(s - 20, 10), Math.min(l + 15, 90)),
        hslToHex((h + 180) % 360, Math.max(s - 20, 10), Math.min(l + 15, 90)),
        hslToHex(h, s, Math.max(l - 20, 10)),
      ];
    case 'analogous':
      return [
        hslToHex((h - 30 + 360) % 360, s, l),
        hslToHex((h - 15 + 360) % 360, s, l),
        baseHex,
        hslToHex((h + 15) % 360, s, l),
        hslToHex((h + 30) % 360, s, l),
      ];
    case 'triadic':
      return [
        baseHex,
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
        hslToHex(h, Math.max(s - 30, 10), Math.min(l + 20, 90)),
        hslToHex((h + 120) % 360, Math.max(s - 30, 10), Math.min(l + 20, 90)),
      ];
    case 'split-complementary':
      return [
        baseHex,
        hslToHex((h + 150) % 360, s, l),
        hslToHex((h + 210) % 360, s, l),
        hslToHex(h, s, Math.min(l + 20, 90)),
        hslToHex(h, s, Math.max(l - 20, 10)),
      ];
    case 'tetradic':
      return [
        baseHex,
        hslToHex((h + 90) % 360, s, l),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 270) % 360, s, l),
        hslToHex(h, Math.max(s - 30, 10), l),
      ];
    case 'monochromatic':
      return [
        hslToHex(h, s, Math.max(l - 30, 5)),
        hslToHex(h, s, Math.max(l - 15, 10)),
        baseHex,
        hslToHex(h, s, Math.min(l + 15, 90)),
        hslToHex(h, s, Math.min(l + 30, 95)),
      ];
  }
}

// ─── Preset Palettes ────────────────────────────────────────────────

export const PALETTE_PRESETS: { name: string; colors: string[] }[] = [
  { name: 'Neon Cyber', colors: ['#7c3aed', '#06b6d4', '#f43f5e', '#10b981', '#f59e0b'] },
  { name: 'Ocean Breeze', colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#155e75', '#083344'] },
  { name: 'Sunset Glow', colors: ['#f97316', '#ef4444', '#ec4899', '#fbbf24', '#a855f7'] },
  { name: 'Nature', colors: ['#22c55e', '#15803d', '#a3e635', '#365314', '#86efac'] },
  { name: 'Corporate', colors: ['#1e3a5f', '#3b82f6', '#f8fafc', '#64748b', '#0f172a'] },
  { name: 'Pastel Dream', colors: ['#c4b5fd', '#fbcfe8', '#a5f3fc', '#bef264', '#fde68a'] },
  { name: 'Dark Mode', colors: ['#0d0d15', '#1e1e2e', '#313244', '#585b70', '#cdd6f4'] },
  { name: 'Warm Earth', colors: ['#92400e', '#d97706', '#fbbf24', '#451a03', '#f5f5f4'] },
];

// ─── Palette UI Renderer ────────────────────────────────────────────

export function renderPaletteGenerator(onColorSelect: (color: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

  // Base color picker
  const pickerRow = document.createElement('div');
  pickerRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
  pickerRow.innerHTML = `
    <span style="font-size:10px;color:#585b70;">Base</span>
    <input type="color" value="#7c3aed" style="width:28px;height:24px;border:none;padding:0;cursor:pointer;border-radius:3px;" />
    <select style="flex:1;background:#0d0d15;border:1px solid #313244;color:#cdd6f4;border-radius:4px;padding:3px 6px;font-size:10px;">
      <option value="complementary">Complementary</option>
      <option value="analogous">Analogous</option>
      <option value="triadic">Triadic</option>
      <option value="split-complementary">Split Complementary</option>
      <option value="tetradic">Tetradic</option>
      <option value="monochromatic">Monochromatic</option>
    </select>`;
  container.appendChild(pickerRow);

  const colorInput = pickerRow.querySelector('input[type=color]') as HTMLInputElement;
  const typeSelect = pickerRow.querySelector('select') as HTMLSelectElement;

  // Generated palette display
  const paletteRow = document.createElement('div');
  paletteRow.style.cssText = 'display:flex;gap:4px;';
  container.appendChild(paletteRow);

  function updatePalette() {
    const colors = generatePalette(colorInput.value, typeSelect.value as PaletteType);
    paletteRow.innerHTML = '';
    for (const c of colors) {
      const swatch = document.createElement('div');
      swatch.style.cssText = `flex:1;height:28px;border-radius:4px;background:${c};cursor:pointer;border:1px solid rgba(255,255,255,0.1);transition:transform 0.15s;`;
      swatch.title = c;
      swatch.addEventListener('mouseenter', () => { swatch.style.transform = 'scale(1.1)'; });
      swatch.addEventListener('mouseleave', () => { swatch.style.transform = 'scale(1)'; });
      swatch.addEventListener('click', () => onColorSelect(c));
      paletteRow.appendChild(swatch);
    }
  }

  colorInput.addEventListener('input', updatePalette);
  typeSelect.addEventListener('change', updatePalette);
  updatePalette();

  // Preset palettes
  const presetsLabel = document.createElement('div');
  presetsLabel.style.cssText = 'font-size:10px;color:#585b70;margin-top:4px;';
  presetsLabel.textContent = 'PRESETS';
  container.appendChild(presetsLabel);

  for (const preset of PALETTE_PRESETS) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 0;cursor:pointer;';
    row.innerHTML = `<span style="font-size:10px;color:#a6adc8;min-width:70px;">${preset.name}</span>`;
    const swatches = document.createElement('div');
    swatches.style.cssText = 'display:flex;gap:2px;flex:1;';
    for (const c of preset.colors) {
      const s = document.createElement('div');
      s.style.cssText = `flex:1;height:16px;border-radius:3px;background:${c};cursor:pointer;`;
      s.addEventListener('click', () => onColorSelect(c));
      swatches.appendChild(s);
    }
    row.appendChild(swatches);
    container.appendChild(row);
  }

  return container;
}
