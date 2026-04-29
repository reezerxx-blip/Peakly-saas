import { cookies } from 'next/headers';
import type { Language } from '@/lib/i18n-types';

export async function getRequestLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value;
  return lang === 'en' ? 'en' : 'fr';
}
