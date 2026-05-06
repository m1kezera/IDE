/**
 * Lumina IDE — Onboarding Guide (v1.1)
 * First-access: Language picker → 8-step guided tour.
 * Reopenable via ❓ icon in status bar.
 */

import { t, getLang, setLang, LANGUAGES } from '../core/i18n';
import { PubSub } from '../core/PubSub';

interface GuideStep {
  icon: string;
  titleKey: string;
  descKey: string;
  tipKey: string;
}

const STEPS: GuideStep[] = [
  { icon: '📁', titleKey: 'onboarding.step1_title', descKey: 'onboarding.step1_desc', tipKey: 'onboarding.step1_tip' },
  { icon: '✏️', titleKey: 'onboarding.step2_title', descKey: 'onboarding.step2_desc', tipKey: 'onboarding.step2_tip' },
  { icon: '🤖', titleKey: 'onboarding.step3_title', descKey: 'onboarding.step3_desc', tipKey: 'onboarding.step3_tip' },
  { icon: '💻', titleKey: 'onboarding.step4_title', descKey: 'onboarding.step4_desc', tipKey: 'onboarding.step4_tip' },
  { icon: '🔀', titleKey: 'onboarding.step5_title', descKey: 'onboarding.step5_desc', tipKey: 'onboarding.step5_tip' },
  { icon: '🎵', titleKey: 'onboarding.step6_title', descKey: 'onboarding.step6_desc', tipKey: 'onboarding.step6_tip' },
  { icon: '🎨', titleKey: 'onboarding.step7_title', descKey: 'onboarding.step7_desc', tipKey: 'onboarding.step7_tip' },
  { icon: '🧠', titleKey: 'onboarding.step8_title', descKey: 'onboarding.step8_desc', tipKey: 'onboarding.step8_tip' },
  { icon: '☁️', titleKey: 'onboarding.step9_title', descKey: 'onboarding.step9_desc', tipKey: 'onboarding.step9_tip' },
  { icon: '🐝', titleKey: 'onboarding.step10_title', descKey: 'onboarding.step10_desc', tipKey: 'onboarding.step10_tip' },
  { icon: '🖥️', titleKey: 'onboarding.step11_title', descKey: 'onboarding.step11_desc', tipKey: 'onboarding.step11_tip' },
  { icon: '⚙️', titleKey: 'onboarding.step12_title', descKey: 'onboarding.step12_desc', tipKey: 'onboarding.step12_tip' },
];

let overlay: HTMLElement | null = null;
// -1 = language picker, 0..7 = guide steps
let currentStep = -1;

export function initOnboarding(): void {
  createHelpButton();

  PubSub.on('lang:changed', () => {
    if (overlay && overlay.style.display !== 'none') render();
  });

  // First access → show language picker first
  if (!localStorage.getItem('lumina_onboarded')) {
    setTimeout(() => showGuide(), 1500);
  }
}

export function showGuide(): void {
  currentStep = -1; // Start with language picker

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lumina-onboarding';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.3s ease;';
    document.body.appendChild(overlay);
  }

  overlay.style.display = 'flex';
  render();
}

function hideGuide(): void {
  if (overlay) overlay.style.display = 'none';
  localStorage.setItem('lumina_onboarded', 'true');
}

function render(): void {
  if (!overlay) return;
  if (currentStep === -1) {
    renderLangPicker();
  } else {
    renderStep();
  }
}

// ─── Language Picker (step -1) ──────────────────────────────────────
function renderLangPicker(): void {
  if (!overlay) return;
  const cur = getLang();

  overlay.innerHTML =
    '<div style="width:480px;max-width:90vw;background:var(--bg-surface, #1a1b2e);border:1px solid var(--border, #2a2b3e);border-radius:12px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5);animation:slideUp 0.3s ease;">'

    // Header
    + '<div style="padding:20px 24px;border-bottom:1px solid var(--border, #2a2b3e);background:var(--bg-overlay, #12132a);text-align:center;">'
    + '<h2 style="margin:0;font-size:15px;color:var(--text, #e0e6f0);font-weight:600;">Lumina IDE</h2>'
    + '</div>'

    // Body
    + '<div style="padding:20px 24px;text-align:center;">'
    + '<div style="font-size:36px;margin-bottom:8px;">🌐</div>'
    + '<h3 style="margin:0 0 4px;font-size:15px;color:var(--text, #e0e6f0);font-weight:700;">Escolha seu idioma</h3>'
    + '<p style="margin:0 0 14px;font-size:10px;color:var(--text-muted, #888);">Choose your language · Elige tu idioma · 言語を選択</p>'

    // Language buttons — 2-column grid
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;max-height:280px;overflow-y:auto;padding-right:4px;">'
    + LANGUAGES.map(l =>
      '<button class="ob-lang" data-lang="' + l.code + '" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;transition:all 0.2s;font-size:11px;'
      + 'background:' + (l.code === cur ? 'var(--accent, #00A3FF)' : 'var(--bg-overlay, #12132a)') + ';'
      + 'color:' + (l.code === cur ? '#fff' : 'var(--text, #e0e6f0)') + ';'
      + 'border:1px solid ' + (l.code === cur ? 'var(--accent, #00A3FF)' : 'var(--border, #2a2b3e)') + ';'
      + 'font-weight:' + (l.code === cur ? 'bold' : 'normal') + ';">'
      + '<span style="font-size:14px;min-width:20px;">' + l.flag + '</span>'
      + '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + l.name + '</span>'
      + (l.code === cur ? '<span style="margin-left:auto;font-size:10px;">✓</span>' : '')
      + '</button>'
    ).join('')
    + '</div>'
    + '</div>'

    // Footer
    + '<div style="padding:12px 20px;border-top:1px solid var(--border, #2a2b3e);background:var(--bg-overlay, #12132a);display:flex;justify-content:flex-end;">'
    + '<button id="ob-lang-next" style="background:var(--accent, #00A3FF);color:#fff;border:none;border-radius:6px;padding:8px 22px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;">Continuar →</button>'
    + '</div>'
    + '</div>'

    + '<style>'
    + '@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }'
    + '@keyframes fadeIn { from{opacity:0} to{opacity:1} }'
    + '.ob-lang:hover{border-color:var(--accent, #00A3FF)!important;transform:scale(1.02)}'
    + '#ob-lang-next:hover{filter:brightness(1.15);transform:scale(1.02)}'
    + '</style>';

  // Wire language buttons
  overlay.querySelectorAll('.ob-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = (btn as HTMLElement).dataset.lang || 'pt-BR';
      setLang(code);
      // Re-render to update selection (lang:changed will trigger render)
    });
  });

  // Continue button → go to step 0
  overlay.querySelector('#ob-lang-next')?.addEventListener('click', () => {
    currentStep = 0;
    render();
  });
}

// ─── Guide Step (steps 0..7) ────────────────────────────────────────
function renderStep(): void {
  if (!overlay) return;
  const step = STEPS[currentStep];
  const total = STEPS.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;

  overlay.innerHTML =
    '<div style="width:520px;max-width:90vw;background:var(--bg-surface, #1a1b2e);border:1px solid var(--border, #2a2b3e);border-radius:12px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.5);animation:slideUp 0.3s ease;">'

    // Header
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border, #2a2b3e);background:var(--bg-overlay, #12132a);">'
    + '<h2 style="margin:0;font-size:14px;color:var(--text, #e0e6f0);font-weight:600;">' + t('onboarding.title') + '</h2>'
    + '<span style="font-size:11px;color:var(--text-muted, #888);font-weight:600;">' + t('onboarding.step') + ' ' + (currentStep + 1) + ' ' + t('onboarding.of') + ' ' + total + '</span>'
    + '</div>'

    // Progress bar
    + '<div style="height:3px;background:var(--bg-overlay, #12132a);">'
    + '<div style="height:100%;width:' + ((currentStep + 1) / total * 100) + '%;background:var(--accent, #00A3FF);transition:width 0.3s;border-radius:0 3px 3px 0;"></div>'
    + '</div>'

    // Body
    + '<div style="padding:32px 28px;text-align:center;">'
    + '<div style="font-size:56px;margin-bottom:12px;animation:bounce 1s ease infinite;">' + step.icon + '</div>'
    + '<h3 style="margin:0 0 12px;font-size:18px;color:var(--text, #e0e6f0);font-weight:700;">' + t(step.titleKey) + '</h3>'
    + '<p style="margin:0 0 16px;font-size:12px;line-height:1.6;color:var(--text-secondary, #a0a8c0);max-width:420px;margin-left:auto;margin-right:auto;">' + t(step.descKey) + '</p>'

    // Tip box
    + '<div style="padding:10px 14px;background:rgba(255,204,102,0.06);border:1px solid rgba(255,204,102,0.15);border-radius:8px;text-align:left;">'
    + '<p style="margin:0;font-size:11px;color:var(--accent-yellow, #ffcc66);line-height:1.5;">💡 ' + t(step.tipKey) + '</p>'
    + '</div>'
    + '</div>'

    // Step dots
    + '<div style="display:flex;justify-content:center;gap:6px;padding-bottom:12px;">'
    + STEPS.map((_s, i) =>
      '<span style="width:' + (i === currentStep ? '20px' : '6px') + ';height:6px;border-radius:3px;transition:all 0.3s;'
      + 'background:' + (i === currentStep ? 'var(--accent, #00A3FF)' : 'var(--border, #2a2b3e)') + ';"></span>'
    ).join('')
    + '</div>'

    // Footer
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-top:1px solid var(--border, #2a2b3e);background:var(--bg-overlay, #12132a);">'
    + '<button id="ob-skip" style="background:none;border:none;color:var(--text-muted, #888);cursor:pointer;font-size:11px;padding:6px 12px;border-radius:4px;transition:all 0.2s;">' + t('onboarding.skip') + '</button>'
    + '<div style="display:flex;gap:8px;">'
    + (isFirst
      ? '<button id="ob-prev" style="background:var(--bg-overlay, #12132a);color:var(--text, #e0e6f0);border:1px solid var(--border, #2a2b3e);border-radius:6px;padding:6px 14px;cursor:pointer;font-size:11px;transition:all 0.2s;">🌐 ' + t('settings.language') + '</button>'
      : '<button id="ob-prev" style="background:var(--bg-overlay, #12132a);color:var(--text, #e0e6f0);border:1px solid var(--border, #2a2b3e);border-radius:6px;padding:6px 14px;cursor:pointer;font-size:11px;transition:all 0.2s;">' + t('onboarding.prev') + '</button>')
    + '<button id="ob-next" style="background:var(--accent, #00A3FF);color:#fff;border:none;border-radius:6px;padding:6px 18px;cursor:pointer;font-size:11px;font-weight:600;transition:all 0.2s;">'
    + (isLast ? t('onboarding.finish') : t('onboarding.next'))
    + '</button>'
    + '</div></div>'
    + '</div>'

    + '<style>'
    + '@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }'
    + '#ob-skip:hover{color:var(--text);background:rgba(255,255,255,0.05)}'
    + '#ob-prev:hover{border-color:var(--accent)}'
    + '#ob-next:hover{filter:brightness(1.15);transform:scale(1.02)}'
    + '</style>';

  // Wire events
  overlay.querySelector('#ob-skip')?.addEventListener('click', hideGuide);
  overlay.querySelector('#ob-prev')?.addEventListener('click', () => {
    if (currentStep === 0) { currentStep = -1; render(); } // Go back to lang picker
    else if (currentStep > 0) { currentStep--; render(); }
  });
  overlay.querySelector('#ob-next')?.addEventListener('click', () => {
    if (currentStep < STEPS.length - 1) { currentStep++; render(); }
    else hideGuide();
  });
}

// ─── Help Button ────────────────────────────────────────────────────
function createHelpButton(): void {
  const helpBtn = document.getElementById('lumina-help-btn');
  if (!helpBtn) return;
  helpBtn.addEventListener('mouseenter', () => { helpBtn.style.opacity = '1'; helpBtn.style.transform = 'scale(1.2)'; });
  helpBtn.addEventListener('mouseleave', () => { helpBtn.style.opacity = '0.6'; helpBtn.style.transform = 'scale(1)'; });
  helpBtn.addEventListener('click', () => showGuide());
}
