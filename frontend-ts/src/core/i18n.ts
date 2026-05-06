/**
 * Lumina IDE — i18n Engine (v1.1)
 * Lightweight translation system with data-i18n auto-update.
 */

import { PubSub } from './PubSub';

import ptBR from '../locales/pt-BR';
import enUS from '../locales/en-US';

export interface LangInfo { code: string; name: string; flag: string; }

export const LANGUAGES: LangInfo[] = [
  { code: 'pt-BR', name: 'Português',  flag: '🇧🇷' },
  { code: 'en-US', name: 'English',    flag: '🇺🇸' },
];

const translations: Record<string, Record<string, string>> = {
  'pt-BR': ptBR, 'en-US': enUS,
};

let currentLang = localStorage.getItem('lumina_lang') || 'pt-BR';

export function t(key: string): string {
  const dict = translations[currentLang];
  if (dict && dict[key]) return dict[key];
  const fallback = translations['pt-BR'];
  if (fallback && fallback[key]) return fallback[key];
  return key;
}

export function getLang(): string { return currentLang; }

export function setLang(code: string): void {
  if (!translations[code]) return;
  currentLang = code;
  localStorage.setItem('lumina_lang', code);
  updateDataI18n();
  PubSub.emit('lang:changed', code);
}

/** Update all elements with data-i18n attribute */
function updateDataI18n(): void {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
}
