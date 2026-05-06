/**
 * Web Studio — Properties Panel
 *
 * Renders the right sidebar property editor for selected elements and artboards.
 * Extracted from WebStudioPanel.ts.
 */

import { COMPONENTS } from './ds-components';
import type { ComponentDef } from './ds-components';
import { renderGradientEditor, renderBorderRadiusEditor, renderSpacingVisualizer, renderFontBrowser, SCROLL_ANIMATION_PRESETS } from './ds-editors';
import { renderPaletteGenerator } from './ds-palette-gen';

export interface ElementStyle {
  opacity: number;
  blur: number;
  shadow: string;
  borderRadius: number;
  padding: string;
  margin: string;
  transform: string;
  animation: string;
  width: string;
  height: string;
  bgOverride: string;
  borderWidth: string;
  borderColor: string;
  filter: string;
  textAlign: string;
  cursor: string;
  // --- Premium Customizations ---
  fontFamily: string;
  fontWeight: string;
  fontSize: string;
  color: string;
  letterSpacing: string;
  lineHeight: string;
  mixBlendMode: string;
  backdropFilter: string;
  backgroundGradient: string;
  textGradient: string;
}

export interface Artboard {
  id: string;
  name: string;
  route: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  borderRadius: number;
  overflow: 'hidden' | 'visible';
  // Flexbox Layout capabilities
  display: 'block' | 'flex';
  flexDirection: 'row' | 'column';
  justifyContent: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap: number;
  flexWrap: 'nowrap' | 'wrap';
  elements: CanvasElement[];
}

export interface CanvasElement {
  id: string;
  componentId: string;
  props: Record<string, string>;
  order: number;
  style: ElementStyle;
  hoverStyle?: Partial<ElementStyle>;
  hoverEffect?: string;
  // Interaction / navigation
  actionType: 'none' | 'navigate' | 'url' | 'scroll';
  navigateTo: string;   // artboard ID for 'navigate'
  actionUrl: string;    // URL for 'url' action
  // Layer management
  visible: boolean;
  locked: boolean;
  name: string;         // custom display name
  // Absolute positioning (free-form drag)
  x: number;
  y: number;
  w: number;
  h: number;
  // Grouping
  groupId?: string;     // which group this element belongs to
  _grouped?: boolean;   // whether this element is hidden (rendered by a group)
}

export const BG_PRESETS = [
  { name: 'Dark',         value: '#0d0d15' },
  { name: 'Midnight',     value: '#11111b' },
  { name: 'Charcoal',     value: '#1e1e2e' },
  { name: 'White',        value: '#ffffff' },
  { name: 'Light Gray',   value: '#f5f5f7' },
  { name: 'Warm Gray',    value: '#f0ede8' },
  { name: 'Purple Grad',  value: 'linear-gradient(135deg, #1a1a2e, #2d1b69)' },
  { name: 'Ocean Grad',   value: 'linear-gradient(135deg, #0d1117, #0a192f, #112240)' },
  { name: 'Sunset Grad',  value: 'linear-gradient(135deg, #1a1a2e, #3d1f3d, #2b1055)' },
  { name: 'Aurora',       value: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },
  { name: 'Forest',       value: 'linear-gradient(150deg, #0a1a0f, #1a3a2a, #0d2818)' },
  { name: 'Rose Gold',    value: 'linear-gradient(135deg, #1f1015, #2d1a24, #3d1f2e)' },
  { name: 'Grid Dark',    value: '#0d0d15 url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1\' height=\'40\' fill=\'%23ffffff08\'/%3E%3Crect width=\'40\' height=\'1\' fill=\'%23ffffff08\'/%3E%3C/svg%3E") repeat' },
  { name: 'Dots Light',   value: '#f5f5f7 url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%2300000010\'/%3E%3C/svg%3E") repeat' },
];

export const ANIMATION_PRESETS = [
  { name: 'none', label: 'None', css: '' },
  { name: 'fadeIn', label: 'Fade In', css: 'ds-fadeIn 0.6s ease both' },
  { name: 'slideUp', label: 'Slide Up', css: 'ds-slideUp 0.6s ease both' },
  { name: 'slideDown', label: 'Slide Down', css: 'ds-slideDown 0.6s ease both' },
  { name: 'slideLeft', label: 'Slide Left', css: 'ds-slideLeft 0.6s ease both' },
  { name: 'scaleIn', label: 'Scale In', css: 'ds-scaleIn 0.5s ease both' },
  { name: 'bounce', label: 'Bounce', css: 'ds-bounce 0.8s ease both' },
  { name: 'pulse', label: 'Pulse', css: 'ds-pulse 2s ease infinite' },
  { name: 'float', label: 'Float', css: 'ds-float 3s ease-in-out infinite' },
  { name: 'shake', label: 'Shake', css: 'ds-shake 0.5s ease both' },
];

export const FILTER_PRESETS = [
  { name: 'none', label: 'None', css: '' },
  { name: 'grayscale', label: 'Grayscale', css: 'grayscale(100%)' },
  { name: 'sepia', label: 'Sepia', css: 'sepia(80%)' },
  { name: 'bright', label: 'Bright', css: 'brightness(1.3)' },
  { name: 'contrast', label: 'High Contrast', css: 'contrast(1.4)' },
  { name: 'saturate', label: 'Saturate', css: 'saturate(1.8)' },
  { name: 'hue', label: 'Hue Shift', css: 'hue-rotate(90deg)' },
  { name: 'invert', label: 'Invert', css: 'invert(100%)' },
  { name: 'vintage', label: 'Vintage', css: 'sepia(40%) contrast(1.1) brightness(0.9)' },
  { name: 'cool', label: 'Cool Tone', css: 'saturate(0.8) hue-rotate(10deg) brightness(1.05)' },
];

export const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];

export const FONTS = [
  'Inter', 'Roboto', 'Outfit', 'Playfair Display', 'JetBrains Mono', 'Poppins', 'Montserrat', 'Syne'
];

export const GRADIENTS = [
  { name: 'None', value: '' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #FF9D6C 0%, #BB4E75 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
  { name: 'Neon', value: 'linear-gradient(135deg, #FF0099 0%, #493240 100%)' },
  { name: 'Aurora', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: 'Cyber', value: 'linear-gradient(135deg, #fceabb 0%, #f8b500 100%)' },
  { name: 'Deep Space', value: 'linear-gradient(135deg, #000000 0%, #434343 100%)' },
  { name: 'Holographic', value: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
];

export const GLASS_PRESETS = [
  { name: 'None', value: '' },
  { name: 'Soft Glass', value: 'blur(8px) saturate(150%)' },
  { name: 'Frosted Glass', value: 'blur(16px) saturate(180%)' },
  { name: 'Heavy Glass', value: 'blur(24px) saturate(200%)' },
];

export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  opacity: 1, blur: 0, shadow: '', borderRadius: 0,
  padding: '', margin: '', transform: '', animation: 'none',
  width: '', height: '', bgOverride: '', borderWidth: '', borderColor: '',
  filter: '', textAlign: '', cursor: '',
  fontFamily: '', fontWeight: '', fontSize: '', color: '', letterSpacing: '', lineHeight: '',
  mixBlendMode: 'normal', backdropFilter: '', backgroundGradient: '', textGradient: ''
};

// ═══════════════════════════════════════════════════════════════════════
// CONTEXT — callbacks the properties panel needs from the orchestrator
// ═══════════════════════════════════════════════════════════════════════

export interface WSPropsContext {
    panel: HTMLElement;
    artboards: Artboard[];
    activeArtboardId: string | null;
    selectedElementId: string | null;
    propsEditState: 'normal' | 'hover';
    renderArtboards: () => void;
    renderAll: () => void;
    renderPages: () => void;
    renderProps: () => void;
    recordState: () => void;
    showToast: (msg: string) => void;
    setPropsEditState: (state: 'normal' | 'hover') => void;
}


export function renderPropsPanel(ctx: WSPropsContext): void {
    const panel = ctx.panel;

  if (!ctx.selectedElementId) {
    // Show artboard props if selected
    if (ctx.activeArtboardId) {
      const ab = ctx.artboards.find(a => a.id === ctx.activeArtboardId);
      if (ab) {
        // Detect if bg is a simple hex color
        const bgIsColor = /^#[0-9a-f]{3,8}$/i.test(ab.background || '');
        const bgColorVal = bgIsColor ? ab.background : '';

        let html = `
          <div class="ds-props-header">📄 ${ab.name}</div>

          <div class="ds-props-section-title">Page</div>
          <div class="ds-props-list">
            <div class="ds-prop-row"><label class="ds-prop-label">Route</label><input class="ds-prop-input" data-key="route" value="${ab.route || '/'}" placeholder="/about" /></div>
          </div>

          <div class="ds-props-section-title">Frame</div>
          <div class="ds-props-list">
            <div class="ds-prop-row"><label class="ds-prop-label">Name</label><input class="ds-prop-input" data-key="name" value="${ab.name}" /></div>
            <div class="ds-prop-row ds-prop-row-half">
              <div><label class="ds-prop-label">W</label><input class="ds-prop-input" data-key="width" type="number" value="${ab.width}" /></div>
              <div><label class="ds-prop-label">H</label><input class="ds-prop-input" data-key="height" type="number" value="${ab.height}" /></div>
            </div>
            <div class="ds-prop-row ds-prop-row-half">
              <div><label class="ds-prop-label">X</label><input class="ds-prop-input" data-key="x" type="number" value="${Math.round(ab.x)}" /></div>
              <div><label class="ds-prop-label">Y</label><input class="ds-prop-input" data-key="y" type="number" value="${Math.round(ab.y)}" /></div>
            </div>
          </div>

          <div class="ds-props-section-title">Layout</div>
          <div class="ds-props-list">
            <div class="ds-prop-row">
              <label class="ds-prop-label">Display</label>
              <select class="ds-prop-select" data-key="display">
                <option value="block" ${ab.display === 'block' ? 'selected' : ''}>Block</option>
                <option value="flex" ${ab.display === 'flex' ? 'selected' : ''}>Flexbox</option>
              </select>
            </div>
            ${ab.display !== 'block' ? `
            <div class="ds-prop-row ds-prop-row-half">
              <div><label class="ds-prop-label">Direction</label><select class="ds-prop-select" data-key="flexDirection">
                <option value="column" ${ab.flexDirection === 'column' ? 'selected' : ''}>⬇ Column</option>
                <option value="row" ${ab.flexDirection === 'row' ? 'selected' : ''}>➡ Row</option>
              </select></div>
              <div><label class="ds-prop-label">Gap</label><input class="ds-prop-input" data-key="gap" type="number" value="${ab.gap ?? 16}" /></div>
            </div>
            <div class="ds-prop-row">
              <label class="ds-prop-label">Justify Content</label>
              <select class="ds-prop-select" data-key="justifyContent">
                <option value="flex-start" ${ab.justifyContent === 'flex-start' ? 'selected' : ''}>Start</option>
                <option value="center" ${ab.justifyContent === 'center' ? 'selected' : ''}>Center</option>
                <option value="flex-end" ${ab.justifyContent === 'flex-end' ? 'selected' : ''}>End</option>
                <option value="space-between" ${ab.justifyContent === 'space-between' ? 'selected' : ''}>Space Between</option>
                <option value="space-around" ${ab.justifyContent === 'space-around' ? 'selected' : ''}>Space Around</option>
              </select>
            </div>
            <div class="ds-prop-row ds-prop-row-half">
              <div><label class="ds-prop-label">Align Items</label>
              <select class="ds-prop-select" data-key="alignItems">
                <option value="stretch" ${ab.alignItems === 'stretch' ? 'selected' : ''}>Stretch</option>
                <option value="flex-start" ${ab.alignItems === 'flex-start' ? 'selected' : ''}>Start</option>
                <option value="center" ${ab.alignItems === 'center' ? 'selected' : ''}>Center</option>
                <option value="flex-end" ${ab.alignItems === 'flex-end' ? 'selected' : ''}>End</option>
              </select></div>
              <div><label class="ds-prop-label">Wrap</label><select class="ds-prop-select" data-key="flexWrap">
                <option value="nowrap" ${ab.flexWrap === 'nowrap' ? 'selected' : ''}>No</option>
                <option value="wrap" ${ab.flexWrap === 'wrap' ? 'selected' : ''}>Yes</option>
              </select></div>
            </div>
            ` : ''}
          </div>

          <div class="ds-props-section-title">Background</div>
          <div class="ds-props-list">
            <div class="ds-prop-row">
              <div class="ds-bg-preview" style="background:${ab.background || '#0d0d15'};height:40px;border-radius:6px;border:1px solid #313244;margin-bottom:8px;"></div>
            </div>
            <div class="ds-prop-row">
              <label class="ds-prop-label">Background</label>
              <div class="ds-prop-input-wrap">
                ${bgColorVal ? `<input type="color" class="ds-prop-color" data-key="background" value="${bgColorVal}" />` : ''}
                <input type="text" class="ds-prop-input" data-key="background" value="${(ab.background || '#0d0d15').replace(/"/g, '&quot;')}" />
              </div>
            </div>
          </div>

          <div class="ds-props-section-title">Presets</div>
          <div class="ds-bg-presets">`;

        for (const preset of BG_PRESETS) {
          html += `<button class="ds-bg-preset-btn ${ab.background === preset.value ? 'active' : ''}" data-bg="${preset.value.replace(/"/g, '&quot;')}" title="${preset.name}" style="background:${preset.value};"></button>`;
        }

        html += `</div>

          <div class="ds-props-section-title">Style</div>
          <div class="ds-props-list">
            <div class="ds-prop-row">
              <label class="ds-prop-label">Border Radius</label>
              <div class="ds-prop-input-wrap">
                <input type="range" class="ds-prop-range" data-key="borderRadius" min="0" max="32" value="${ab.borderRadius || 0}" />
                <input type="number" class="ds-prop-input ds-prop-input-sm" data-key="borderRadius" value="${ab.borderRadius || 0}" />
              </div>
            </div>
            <div class="ds-prop-row">
              <label class="ds-prop-label">Overflow</label>
              <select class="ds-prop-select" data-key="overflow">
                <option value="hidden" ${ab.overflow === 'hidden' ? 'selected' : ''}>Hidden</option>
                <option value="visible" ${ab.overflow === 'visible' ? 'selected' : ''}>Visible</option>
              </select>
            </div>
          </div>`;

        panel.innerHTML = html;

        // Wire frame inputs
        panel.querySelectorAll<HTMLInputElement>('.ds-prop-input').forEach(input => {
          input.addEventListener('change', () => {
            const key = input.dataset.key!;
            if (key === 'name') ab.name = input.value;
            else if (key === 'route') ab.route = input.value;
            else if (key === 'width') ab.width = parseInt(input.value) || ab.width;
            else if (key === 'height') ab.height = parseInt(input.value) || ab.height;
            else if (key === 'x') ab.x = parseInt(input.value) || ab.x;
            else if (key === 'y') ab.y = parseInt(input.value) || ab.y;
            else if (key === 'background') { ab.background = input.value; }
            else if (key === 'borderRadius') ab.borderRadius = parseInt(input.value) || 0;
            else if (key === 'gap') ab.gap = parseInt(input.value) || 0;
            ctx.renderArtboards();
            ctx.renderPages();
          });
        });

        // Wire background color picker
        panel.querySelectorAll<HTMLInputElement>('.ds-prop-color').forEach(input => {
          input.addEventListener('input', () => {
            ab.background = input.value;
            const ti = panel.querySelector('.ds-prop-input[data-key="background"]') as HTMLInputElement;
            if (ti) ti.value = input.value;
            const preview = panel.querySelector('.ds-bg-preview') as HTMLElement;
            if (preview) preview.style.background = input.value;
            ctx.renderArtboards();
          });
        });

        // Wire bg presets
        panel.querySelectorAll<HTMLButtonElement>('.ds-bg-preset-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            ab.background = btn.dataset.bg || '#0d0d15';
            ctx.renderProps();
            ctx.renderArtboards();
          });
        });

        // Wire range slider
        panel.querySelectorAll<HTMLInputElement>('.ds-prop-range').forEach(range => {
          range.addEventListener('input', () => {
            const key = range.dataset.key!;
            if (key === 'borderRadius') ab.borderRadius = parseInt(range.value) || 0;
            const numInput = panel.querySelector(`.ds-prop-input-sm[data-key="${key}"]`) as HTMLInputElement;
            if (numInput) numInput.value = range.value;
            ctx.renderArtboards();
          });
        });

        // Wire select
        panel.querySelectorAll<HTMLSelectElement>('.ds-prop-select').forEach(sel => {
          sel.addEventListener('change', () => {
            const val = sel.value as any;
            if (sel.dataset.key === 'overflow') ab.overflow = val;
            else if (sel.dataset.key === 'display') { ab.display = val; ctx.renderProps(); } // re-render props toggles visibility of flex options
            else if (sel.dataset.key === 'flexDirection') ab.flexDirection = val;
            else if (sel.dataset.key === 'justifyContent') ab.justifyContent = val;
            else if (sel.dataset.key === 'alignItems') ab.alignItems = val;
            else if (sel.dataset.key === 'flexWrap') ab.flexWrap = val;
            
            ctx.renderArtboards();
          });
        });

        return;
      }
    }
    panel.innerHTML = `<div class="ds-props-empty"><span style="font-size:32px;opacity:0.3;">📋</span><p>Select an element to edit properties</p></div>`;
    return;
  }

  // Find element
  let foundEl: CanvasElement | null = null;
  let foundDef: ComponentDef | undefined;
  for (const ab of ctx.artboards) {
    const el = ab.elements.find(e => e.id === ctx.selectedElementId);
    if (el) { foundEl = el; foundDef = COMPONENTS.find(c => c.id === el.componentId); break; }
  }

  if (!foundEl || foundEl.componentId === '__raw__') {
    panel.innerHTML = `<div class="ds-props-empty"><span style="font-size:32px;opacity:0.3;">📄</span><p>Raw HTML file — edit in code view</p></div>`;
    return;
  }
  if (!foundDef) return;

  // Interactive State toggling
  const baseStyle = foundEl.style || { ...DEFAULT_ELEMENT_STYLE };
  const elStyle = ctx.propsEditState === 'hover' ? { ...baseStyle, ...(foundEl.hoverStyle || {}) } : baseStyle;

  const setStyleProp = (key: string, value: any) => {
    if (ctx.propsEditState === 'hover') {
      if (!foundEl!.hoverStyle) foundEl!.hoverStyle = {};
      (foundEl!.hoverStyle as any)[key] = value;
    } else {
      (foundEl!.style as any)[key] = value;
    }
  };

  let html = `<div class="ds-props-header">${foundDef.icon} ${foundDef.name}</div>`;

  // Hover Toggle UI
  html += `<div style="padding: 12px 14px 4px;">
    <div class="ds-sidebar-tabs" style="margin: 0; background: #0d0d15;">
      <button class="ds-sidebar-tab ${ctx.propsEditState === 'normal' ? 'active' : ''}" data-edit-state="normal">Normal</button>
      <button class="ds-sidebar-tab ${ctx.propsEditState === 'hover' ? 'active' : ''}" data-edit-state="hover">Hover</button>
    </div>
  </div>`;

  // ——— Properties (open by default) ———
  html += '<details class="ds-section" open><summary class="ds-section-title">📝 Properties</summary><div class="ds-props-list">';
  for (const [key, val] of Object.entries(foundEl.props)) {
    // Skip image data fields — they are handled by the dedicated Image section
    if (foundEl.componentId === 'user-image' && (key === 'src' || key === 'alt' || key === 'objectFit')) continue;
    const isColor = /^(#[0-9a-f]{3,8}|rgba?\()/i.test(val);
    const colorVal = isColor && val.startsWith('#') ? val : '';
    // For media URL props, show a preview + upload button + text input
    const isMediaKey = /^(src|imgSrc|imgUrl|bgImg|bannerImg|slide\dImg|img\d?|videoUrl|videoSrc|embedUrl|imageUrl|thumbUrl|heroImg|posterUrl)$/i.test(key);
    const isMediaProp = isMediaKey;
    if (isMediaProp) {
      const truncVal = val.length > 80 ? val.slice(0, 80) + '…' : val;
      const hasImage = val && (val.startsWith('data:') || val.startsWith('http'));
      const isVideo = /^(videoUrl|videoSrc|embedUrl)$/i.test(key);
      const previewBg = hasImage ? `url('${val.replace(/'/g, "\\'").slice(0, 2000)}') center/cover no-repeat, #181825` : '#181825';
      const emptyLabel = isVideo ? '🎬 Paste video URL' : '🖼️ No image — click Upload';
      html += `<div class="ds-prop-row">
        <label class="ds-prop-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
        <div class="ds-prop-input-wrap" style="flex-direction:column;gap:4px;">
          <div style="width:100%;height:48px;border-radius:6px;background:${previewBg};border:1px solid #313244;display:flex;align-items:center;justify-content:center;">
            ${!hasImage ? `<span style="font-size:10px;color:#585b70;">${emptyLabel}</span>` : ''}
          </div>
          <div style="display:flex;gap:4px;width:100%;">
            <input type="text" class="ds-prop-input" data-key="${key}" value="${truncVal.replace(/"/g, '&quot;')}" placeholder="${isVideo ? 'YouTube or video URL...' : 'Image URL or upload...'}" style="font-size:10px;flex:1;" />
            ${!isVideo ? `<button class="ds-project-btn ds-prop-upload-btn" data-upload-key="${key}" style="padding:2px 8px;font-size:10px;white-space:nowrap;">${hasImage ? '📤 Replace' : '📤 Upload'}</button>` : ''}
          </div>
        </div>
      </div>`;
    } else {
      html += `<div class="ds-prop-row">
        <label class="ds-prop-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</label>
        <div class="ds-prop-input-wrap">
          ${colorVal ? `<input type="color" class="ds-prop-color" data-key="${key}" value="${colorVal}" />` : ''}
          <input type="text" class="ds-prop-input" data-key="${key}" value="${val.replace(/"/g, '&quot;')}" />
        </div>
      </div>`;
    }
  }
  html += '</div></details>';

  // ——— Typography ———
  html += '<details class="ds-section"><summary class="ds-section-title">🔠 Typography</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Font Family</label><select class="ds-prop-select ds-style-select" data-skey="fontFamily">
    <option value="">Theme Default</option>`;
  for (const font of FONTS) {
    html += `<option value="${font}" ${elStyle.fontFamily === font ? 'selected' : ''}>${font}</option>`;
  }
  html += `</select></div>`;
  html += `<div class="ds-prop-row ds-prop-row-half">
    <div><label class="ds-prop-label">Weight</label><select class="ds-prop-select ds-style-select" data-skey="fontWeight">
      <option value="" ${!elStyle.fontWeight ? 'selected' : ''}>—</option>
      <option value="300" ${elStyle.fontWeight === '300' ? 'selected' : ''}>Light</option>
      <option value="400" ${elStyle.fontWeight === '400' ? 'selected' : ''}>Regular</option>
      <option value="500" ${elStyle.fontWeight === '500' ? 'selected' : ''}>Medium</option>
      <option value="600" ${elStyle.fontWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
      <option value="700" ${elStyle.fontWeight === '700' ? 'selected' : ''}>Bold</option>
      <option value="800" ${elStyle.fontWeight === '800' ? 'selected' : ''}>Extra-Bold</option>
    </select></div>
    <div><label class="ds-prop-label">Size</label><input class="ds-prop-input ds-style-text" data-skey="fontSize" value="${elStyle.fontSize || ''}" placeholder="16px" /></div>
  </div>`;
  html += `<div class="ds-prop-row ds-prop-row-half">
    <div><label class="ds-prop-label">Line Height</label><input class="ds-prop-input ds-style-text" data-skey="lineHeight" value="${elStyle.lineHeight || ''}" placeholder="1.5" /></div>
    <div><label class="ds-prop-label">Spacing</label><input class="ds-prop-input ds-style-text" data-skey="letterSpacing" value="${elStyle.letterSpacing || ''}" placeholder="-0.02em" /></div>
  </div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Text Color</label><div class="ds-prop-input-wrap">
    ${elStyle.color && /^#/.test(elStyle.color) ? `<input type="color" class="ds-prop-color ds-style-color" data-skey="color" value="${elStyle.color}" />` : ''}
    <input class="ds-prop-input ds-style-text" data-skey="color" value="${elStyle.color || ''}" placeholder="#ffffff" />
  </div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Text Gradient Preset</label><select class="ds-prop-select ds-style-select" data-skey="textGradient">`;
  for (const grad of GRADIENTS) {
    html += `<option value="${grad.value}" ${elStyle.textGradient === grad.value ? 'selected' : ''}>${grad.name}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Style ———
  html += '<details class="ds-section"><summary class="ds-section-title">🎨 Style</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Opacity</label><div class="ds-prop-input-wrap"><input type="range" class="ds-prop-range ds-style-range" data-skey="opacity" min="0" max="1" step="0.05" value="${elStyle.opacity}" /><input type="number" class="ds-prop-input ds-prop-input-sm ds-style-num" data-skey="opacity" step="0.05" min="0" max="1" value="${elStyle.opacity}" /></div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Border Radius</label><div class="ds-prop-input-wrap"><input type="range" class="ds-prop-range ds-style-range" data-skey="borderRadius" min="0" max="48" value="${elStyle.borderRadius}" /><input type="number" class="ds-prop-input ds-prop-input-sm ds-style-num" data-skey="borderRadius" value="${elStyle.borderRadius}" /></div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Blur</label><div class="ds-prop-input-wrap"><input type="range" class="ds-prop-range ds-style-range" data-skey="blur" min="0" max="20" value="${elStyle.blur}" /><input type="number" class="ds-prop-input ds-prop-input-sm ds-style-num" data-skey="blur" value="${elStyle.blur}" /></div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Shadow</label><input type="text" class="ds-prop-input ds-style-text" data-skey="shadow" value="${(elStyle.shadow || '').replace(/"/g, '&quot;')}" placeholder="0 4px 20px rgba(0,0,0,0.3)" /></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Padding</label><input type="text" class="ds-prop-input ds-style-text" data-skey="padding" value="${elStyle.padding || ''}" placeholder="16px" /></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Margin</label><input type="text" class="ds-prop-input ds-style-text" data-skey="margin" value="${elStyle.margin || ''}" placeholder="8px 0" /></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Transform</label><input type="text" class="ds-prop-input ds-style-text" data-skey="transform" value="${(elStyle.transform || '').replace(/"/g, '&quot;')}" placeholder="rotate(5deg) scale(1.1)" /></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Animation</label><select class="ds-prop-select ds-style-select" data-skey="animation">`;
  for (const anim of ANIMATION_PRESETS) {
    html += `<option value="${anim.name}" ${elStyle.animation === anim.name ? 'selected' : ''}>${anim.label}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Interaction (all elements) ———
  if (ctx.artboards.length > 0) {
    const aType = foundEl.actionType || 'none';
    const navTarget = foundEl.navigateTo || '';
    const actionUrl = foundEl.actionUrl || '';
    html += '<details class="ds-section"><summary class="ds-section-title">🔗 Interaction</summary><div class="ds-props-list">';
    html += `<div class="ds-prop-row"><label class="ds-prop-label">Action</label><select class="ds-prop-select ds-action-type-select">
      <option value="none" ${aType === 'none' ? 'selected' : ''}>— No Action —</option>
      <option value="navigate" ${aType === 'navigate' ? 'selected' : ''}>📄 Navigate to Page</option>
      <option value="url" ${aType === 'url' ? 'selected' : ''}>🌐 Open External URL</option>
      <option value="scroll" ${aType === 'scroll' ? 'selected' : ''}>⬇️ Scroll to Section</option>
    </select></div>`;
    if (aType === 'navigate') {
      html += `<div class="ds-prop-row"><label class="ds-prop-label">Target Page</label><select class="ds-prop-select ds-navigate-select"><option value="">— Select —</option>`;
      for (const ab of ctx.artboards) {
        const icon = ab.id === ctx.activeArtboardId ? '📌' : '📄';
        html += `<option value="${ab.id}" ${navTarget === ab.id ? 'selected' : ''}>${icon} ${ab.name}  ·  ${ab.route}</option>`;
      }
      html += `</select></div>`;
    }
    if (aType === 'url') {
      html += `<div class="ds-prop-row"><label class="ds-prop-label">URL</label><input class="ds-prop-input ds-action-url" value="${actionUrl.replace(/"/g, '&quot;')}" placeholder="https://example.com" /></div>`;
    }
    if (aType === 'scroll') {
      html += `<div class="ds-prop-row"><label class="ds-prop-label">Section ID</label><input class="ds-prop-input ds-action-url" value="${actionUrl}" placeholder="#features" /></div>`;
    }
    html += '</div></details>';
  }

  // ——— Layout ———
  html += '<details class="ds-section"><summary class="ds-section-title">📐 Layout</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row ds-prop-row-half">
    <div><label class="ds-prop-label">Width</label><input class="ds-prop-input ds-style-text" data-skey="width" value="${elStyle.width || ''}" placeholder="auto" /></div>
    <div><label class="ds-prop-label">Height</label><input class="ds-prop-input ds-style-text" data-skey="height" value="${elStyle.height || ''}" placeholder="auto" /></div>
  </div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Text Align</label><div class="ds-btn-group">
    <button class="ds-tb-btn ds-align-btn ${elStyle.textAlign === 'left' ? 'active' : ''}" data-align="left">◀</button>
    <button class="ds-tb-btn ds-align-btn ${elStyle.textAlign === 'center' ? 'active' : ''}" data-align="center">◆</button>
    <button class="ds-tb-btn ds-align-btn ${elStyle.textAlign === 'right' ? 'active' : ''}" data-align="right">▶</button>
  </div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Cursor</label><select class="ds-prop-select ds-style-select" data-skey="cursor">
    <option value="" ${!elStyle.cursor ? 'selected' : ''}>Default</option>
    <option value="pointer" ${elStyle.cursor === 'pointer' ? 'selected' : ''}>Pointer</option>
    <option value="crosshair" ${elStyle.cursor === 'crosshair' ? 'selected' : ''}>Crosshair</option>
    <option value="grab" ${elStyle.cursor === 'grab' ? 'selected' : ''}>Grab</option>
    <option value="not-allowed" ${elStyle.cursor === 'not-allowed' ? 'selected' : ''}>Not Allowed</option>
  </select></div>`;
  html += '</div></details>';

  // ——— Border ———
  html += '<details class="ds-section"><summary class="ds-section-title">🔲 Border</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row ds-prop-row-half">
    <div><label class="ds-prop-label">Width</label><input class="ds-prop-input ds-style-text" data-skey="borderWidth" value="${elStyle.borderWidth || ''}" placeholder="0px" /></div>
    <div><label class="ds-prop-label">Color</label><div class="ds-prop-input-wrap">
      ${elStyle.borderColor && /^#/.test(elStyle.borderColor) ? `<input type="color" class="ds-prop-color ds-style-color" data-skey="borderColor" value="${elStyle.borderColor}" />` : ''}
      <input class="ds-prop-input ds-style-text" data-skey="borderColor" value="${elStyle.borderColor || ''}" placeholder="#313244" />
    </div></div>
  </div>`;
  html += '</div></details>';

  // ——— Background ———
  html += '<details class="ds-section"><summary class="ds-section-title">🎨 Background</summary><div class="ds-props-list">';
  const bgOv = elStyle.bgOverride || '';
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Solid Color Override</label><div class="ds-prop-input-wrap">
    ${bgOv && /^#/.test(bgOv) ? `<input type="color" class="ds-prop-color ds-style-color" data-skey="bgOverride" value="${bgOv}" />` : ''}
    <input class="ds-prop-input ds-style-text" data-skey="bgOverride" value="${bgOv.replace(/"/g, '&quot;')}" placeholder="transparent" />
  </div></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Gradient Preset</label><select class="ds-prop-select ds-style-select" data-skey="backgroundGradient">`;
  for (const grad of GRADIENTS) {
    html += `<option value="${grad.value}" ${elStyle.backgroundGradient === grad.value ? 'selected' : ''}>${grad.name}</option>`;
  }
  html += `</select></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Blend Mode</label><select class="ds-prop-select ds-style-select" data-skey="mixBlendMode">`;
  for (const bm of BLEND_MODES) {
    html += `<option value="${bm}" ${elStyle.mixBlendMode === bm ? 'selected' : ''}>${bm.replace(/-/g, ' ').replace(/^./, s=>s.toUpperCase())}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Filters & Glassmorphism ———
  html += '<details class="ds-section"><summary class="ds-section-title">🎛️ Filters & Effects</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Filter Preset</label><select class="ds-prop-select ds-style-select" data-skey="filter">`;
  for (const fp of FILTER_PRESETS) {
    html += `<option value="${fp.css}" ${elStyle.filter === fp.css ? 'selected' : ''}>${fp.label}</option>`;
  }
  html += `</select></div>`;
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Custom Filter</label><input class="ds-prop-input ds-style-text" data-skey="filter" value="${(elStyle.filter || '').replace(/"/g, '&quot;')}" placeholder="brightness(1.2)" /></div>`;
  html += `<div class="ds-prop-row" style="margin-top:6px;"><label class="ds-prop-label">Backdrop Filter (Glass)</label><select class="ds-prop-select ds-style-select" data-skey="backdropFilter">`;
  for (const gp of GLASS_PRESETS) {
    html += `<option value="${gp.value}" ${elStyle.backdropFilter === gp.value ? 'selected' : ''}>${gp.name}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Magic Interactions (1-Click Hover Effects) ———
  html += '<details class="ds-section"><summary class="ds-section-title">🪄 Magic Interactions</summary><div class="ds-props-list">';
  const hoverEffects = [
    { id: 'none', name: 'None' },
    { id: 'h-scale-up', name: 'Scale Up (Float)' },
    { id: 'h-glass-tilt', name: 'Glass 3D Tilt' },
    { id: 'h-neon-glow', name: 'Neon Glow Pulse' },
    { id: 'h-slide-up', name: 'Slide Up Soft' },
    { id: 'h-blur-out', name: 'Focus Blur' }
  ];
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Interactive Preset</label><select class="ds-prop-select ds-hover-effect-select">`;
  for (const he of hoverEffects) {
    html += `<option value="${he.id}" ${foundEl.hoverEffect === he.id ? 'selected' : ''}>${he.name}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Image (user-image only) ———
  if (foundEl.componentId === 'user-image') {
    html += `<details class="ds-section" open><summary class="ds-section-title">🖼️ Image</summary><div class="ds-props-list">
      <div class="ds-prop-row"><button class="ds-project-btn" id="ds-replace-image">📤 Replace Image</button></div>
      <div class="ds-prop-row"><label class="ds-prop-label">Fit</label><select class="ds-prop-select" data-key="objectFit">
        <option value="cover" ${foundEl.props.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
        <option value="contain" ${foundEl.props.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
        <option value="fill" ${foundEl.props.objectFit === 'fill' ? 'selected' : ''}>Fill</option>
        <option value="none" ${foundEl.props.objectFit === 'none' ? 'selected' : ''}>None</option>
      </select></div>
      <div class="ds-prop-row ds-prop-row-half">
        <div><label class="ds-prop-label">Width</label><input class="ds-prop-input" data-key="width" value="${foundEl.props.width || '100%'}" /></div>
        <div><label class="ds-prop-label">Height</label><input class="ds-prop-input" data-key="height" value="${foundEl.props.height || 'auto'}" /></div>
      </div>
    </div></details>`;
  }

  // ——— Shadow Presets ———
  html += '<details class="ds-section"><summary class="ds-section-title">✨ Shadow Presets</summary><div class="ds-shadow-presets">';
  const shadowPresets = [
    { name: 'None', val: '' },
    { name: 'Soft', val: '0 2px 8px rgba(0,0,0,0.15)' },
    { name: 'Medium', val: '0 4px 20px rgba(0,0,0,0.25)' },
    { name: 'Heavy', val: '0 8px 40px rgba(0,0,0,0.4)' },
    { name: 'Purple', val: '0 4px 20px rgba(124,58,237,0.3)' },
    { name: 'Neon', val: '0 0 15px rgba(124,58,237,0.5),0 0 45px rgba(124,58,237,0.15)' },
  ];
  for (const sp of shadowPresets) {
    html += `<button class="ds-shadow-preset-btn ${elStyle.shadow === sp.val ? 'active' : ''}" data-shadow="${sp.val}" title="${sp.name}">${sp.name}</button>`;
  }
  html += '</div></details>';
  // ——— Color Palette Generator ———
  html += '<details class="ds-section"><summary class="ds-section-title">🎨 Color Palette</summary><div class="ds-props-list"><div id="ds-palette-gen-slot"></div></div></details>';

  // ——— Gradient Editor ———
  html += '<details class="ds-section"><summary class="ds-section-title">🌈 Gradient Editor</summary><div class="ds-props-list"><div id="ds-gradient-editor-slot"></div></div></details>';

  // ——— Spacing Visualizer ———
  html += '<details class="ds-section"><summary class="ds-section-title">📏 Spacing</summary><div class="ds-props-list"><div id="ds-spacing-viz-slot"></div></div></details>';

  // ——— Border Radius Editor ———
  html += '<details class="ds-section"><summary class="ds-section-title">⬜ Border Radius</summary><div class="ds-props-list"><div id="ds-border-radius-slot"></div></div></details>';

  // ——— Scroll Animation ———
  html += '<details class="ds-section"><summary class="ds-section-title">📜 Scroll Animation</summary><div class="ds-props-list">';
  html += `<div class="ds-prop-row"><label class="ds-prop-label">Scroll Effect</label><select class="ds-prop-select ds-scroll-anim-select">`;
  for (const sa of SCROLL_ANIMATION_PRESETS) {
    html += `<option value="${sa.name}" ${elStyle.animation === sa.css ? 'selected' : ''}>${sa.label}</option>`;
  }
  html += `</select></div>`;
  html += '</div></details>';

  // ——— Font Browser ———
  html += '<details class="ds-section"><summary class="ds-section-title">🔤 Font Browser</summary><div class="ds-props-list"><div id="ds-font-browser-slot"></div></div></details>';

  panel.innerHTML = html;

  // Mount dynamic visual editors into their slots
  const paletteSlot = panel.querySelector('#ds-palette-gen-slot');
  if (paletteSlot) {
    paletteSlot.appendChild(renderPaletteGenerator((color) => {
      // Apply color to the active style color field
      setStyleProp('color', color);
      ctx.renderArtboards();
    }));
  }

  const gradSlot = panel.querySelector('#ds-gradient-editor-slot');
  if (gradSlot) {
    gradSlot.appendChild(renderGradientEditor(elStyle.backgroundGradient || '', (css) => {
      setStyleProp('backgroundGradient', css);
      ctx.renderArtboards();
    }));
  }

  const spacingSlot = panel.querySelector('#ds-spacing-viz-slot');
  if (spacingSlot) {
    spacingSlot.appendChild(renderSpacingVisualizer(
      elStyle.padding || '0',
      elStyle.margin || '0',
      (val) => { setStyleProp('padding', val); ctx.renderArtboards(); },
      (val) => { setStyleProp('margin', val); ctx.renderArtboards(); },
    ));
  }

  const brSlot = panel.querySelector('#ds-border-radius-slot');
  if (brSlot) {
    brSlot.appendChild(renderBorderRadiusEditor(elStyle.borderRadius || 0, (val) => {
      setStyleProp('borderRadius', parseInt(val) || 0);
      ctx.renderArtboards();
    }));
  }

  const fontSlot = panel.querySelector('#ds-font-browser-slot');
  if (fontSlot) {
    fontSlot.appendChild(renderFontBrowser(elStyle.fontFamily || '', (font) => {
      setStyleProp('fontFamily', font);
      ctx.recordState();
      ctx.renderAll();
    }));
  }

  // Wire scroll animation select
  panel.querySelector('.ds-scroll-anim-select')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const preset = SCROLL_ANIMATION_PRESETS.find(p => p.name === val);
    if (preset) {
      setStyleProp('animation', preset.css || 'none');
      ctx.recordState();
      ctx.renderArtboards();
    }
  });

  // Wire property inputs
  panel.querySelectorAll<HTMLInputElement>('.ds-prop-input:not(.ds-style-text):not(.ds-style-num)').forEach(input => {
    input.addEventListener('input', () => { foundEl!.props[input.dataset.key!] = input.value; ctx.renderArtboards(); });
  });
  panel.querySelectorAll<HTMLInputElement>('.ds-prop-color').forEach(input => {
    input.addEventListener('input', () => {
      foundEl!.props[input.dataset.key!] = input.value;
      const ti = panel.querySelector(`.ds-prop-input[data-key="${input.dataset.key}"]`) as HTMLInputElement;
      if (ti) ti.value = input.value;
      ctx.renderArtboards();
    });
  });

  // Wire Hover State toggle
  panel.querySelectorAll<HTMLButtonElement>('.ds-sidebar-tab[data-edit-state]').forEach(btn => {
    btn.addEventListener('click', () => {
      ctx.setPropsEditState(btn.dataset.editState as 'normal' | 'hover');
      ctx.renderProps();
    });
  });

  // Wire style range sliders
  panel.querySelectorAll<HTMLInputElement>('.ds-style-range').forEach(range => {
    range.addEventListener('input', () => {
      const skey = range.dataset.skey as keyof ElementStyle;
      if (skey === 'opacity') setStyleProp('opacity', parseFloat(range.value));
      else if (skey === 'borderRadius') setStyleProp('borderRadius', parseInt(range.value) || 0);
      else if (skey === 'blur') setStyleProp('blur', parseInt(range.value) || 0);
      const numInput = panel.querySelector(`.ds-style-num[data-skey="${skey}"]`) as HTMLInputElement;
      if (numInput) numInput.value = range.value;
      ctx.renderArtboards();
    });
  });

  // Wire style number inputs
  panel.querySelectorAll<HTMLInputElement>('.ds-style-num').forEach(input => {
    input.addEventListener('change', () => {
      const skey = input.dataset.skey as keyof ElementStyle;
      if (skey === 'opacity') setStyleProp('opacity', parseFloat(input.value));
      else if (skey === 'borderRadius') setStyleProp('borderRadius', parseInt(input.value) || 0);
      else if (skey === 'blur') setStyleProp('blur', parseInt(input.value) || 0);
      const rangeInput = panel.querySelector(`.ds-style-range[data-skey="${skey}"]`) as HTMLInputElement;
      if (rangeInput) rangeInput.value = input.value;
      ctx.renderArtboards();
    });
  });

  // Wire style text inputs
  panel.querySelectorAll<HTMLInputElement>('.ds-style-text').forEach(input => {
    input.addEventListener('change', () => {
      setStyleProp(input.dataset.skey!, input.value);
      ctx.renderArtboards();
    });
  });

  // Wire style select (animation, filter, cursor, etc.)
  panel.querySelectorAll<HTMLSelectElement>('.ds-style-select').forEach(sel => {
    sel.addEventListener('change', () => {
      setStyleProp(sel.dataset.skey!, sel.value);
      ctx.renderArtboards();
    });
  });

  // Wire style color pickers (borderColor, bgOverride)
  panel.querySelectorAll<HTMLInputElement>('.ds-style-color').forEach(input => {
    input.addEventListener('input', () => {
      const skey = input.dataset.skey!;
      setStyleProp(skey, input.value);
      const ti = panel.querySelector(`.ds-style-text[data-skey="${skey}"]`) as HTMLInputElement;
      if (ti) ti.value = input.value;
      ctx.renderArtboards();
    });
  });

  // Wire shadow presets
  panel.querySelectorAll<HTMLButtonElement>('.ds-shadow-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setStyleProp('shadow', btn.dataset.shadow || '');
      ctx.renderProps();
      ctx.renderArtboards();
    });
  });

  // Wire text align buttons
  panel.querySelectorAll<HTMLButtonElement>('.ds-align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setStyleProp('textAlign', btn.dataset.align || '');
      ctx.renderProps();
      ctx.renderArtboards();
    });
  });

  // Wire action type select
  panel.querySelector('.ds-action-type-select')?.addEventListener('change', (e) => {
    foundEl!.actionType = (e.target as HTMLSelectElement).value as any;
    ctx.renderProps(); // re-render to show/hide target fields
  });

  // Wire navigate target select
  panel.querySelector('.ds-navigate-select')?.addEventListener('change', (e) => {
    foundEl!.navigateTo = (e.target as HTMLSelectElement).value;
  });

  // Wire action URL input
  panel.querySelector('.ds-action-url')?.addEventListener('change', (e) => {
    foundEl!.actionUrl = (e.target as HTMLInputElement).value;
  });

  // Wire Replace Image button
  panel.querySelector('#ds-replace-image')?.addEventListener('click', async () => {
    const eAPI = (window as any).electronAPI;
    let dataUrl: string | null = null;
    let fileName = 'image';
    if (eAPI?.selectImage) {
      const result = await eAPI.selectImage();
      if (!result?.dataUrl) return;
      dataUrl = result.dataUrl;
      fileName = result.name || 'image';
    } else {
      dataUrl = await new Promise((resolve) => {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = () => {
          const file = inp.files?.[0];
          if (!file) { resolve(null); return; }
          fileName = file.name;
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(file);
        };
        const onFocusBack = () => {
          window.removeEventListener('focus', onFocusBack);
          setTimeout(() => { if (!inp.files?.length) resolve(null); }, 300);
        };
        window.addEventListener('focus', onFocusBack);
        inp.click();
      });
    }
    if (dataUrl && foundEl) {
      foundEl.props.src = dataUrl;
      foundEl.props.alt = fileName;
      ctx.renderAll();
      ctx.showToast(`📤 Image replaced with "${fileName}"`);
    }
  });

  // Wire generic image upload buttons (for any component with image URL props)
  panel.querySelectorAll<HTMLButtonElement>('.ds-prop-upload-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const propKey = btn.dataset.uploadKey;
      if (!propKey || !foundEl) return;
      const eAPI = (window as any).electronAPI;
      let dataUrl: string | null = null;
      let fileName = 'image';
      if (eAPI?.selectImage) {
        const result = await eAPI.selectImage();
        if (!result?.dataUrl) return;
        dataUrl = result.dataUrl;
        fileName = result.name || 'image';
      } else {
        dataUrl = await new Promise((resolve) => {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/*,video/*';
          inp.onchange = () => {
            const file = inp.files?.[0];
            if (!file) { resolve(null); return; }
            fileName = file.name;
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(file);
          };
          const onFocusBack = () => {
            window.removeEventListener('focus', onFocusBack);
            setTimeout(() => { if (!inp.files?.length) resolve(null); }, 300);
          };
          window.addEventListener('focus', onFocusBack);
          inp.click();
        });
      }
      if (dataUrl && foundEl) {
        foundEl.props[propKey] = dataUrl;
        ctx.renderAll();
        ctx.showToast(`📤 "${propKey}" updated with "${fileName}"`);
      }
    });
  });

  // Wire image-specific selects (objectFit)
  if (foundEl?.componentId === 'user-image') {
    panel.querySelectorAll<HTMLSelectElement>('.ds-prop-select[data-key]').forEach(sel => {
      sel.addEventListener('change', () => {
        foundEl!.props[sel.dataset.key!] = sel.value;
        ctx.renderArtboards();
      });
    });
  }

  // Wire magic interaction hover effects
  panel.querySelector('.ds-hover-effect-select')?.addEventListener('change', (e) => {
    foundEl!.hoverEffect = (e.target as HTMLSelectElement).value;
    ctx.renderArtboards();
  });
}
