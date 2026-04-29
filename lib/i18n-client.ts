import type { Language } from '@/lib/i18n-types';

export function getClientLanguage(): Language {
  if (typeof document === 'undefined') return 'fr';
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith('lang='))
    ?.split('=')[1];
  return value === 'en' ? 'en' : 'fr';
}
