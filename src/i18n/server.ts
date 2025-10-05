import { cookies, headers } from 'next/headers';
import { defaultLocale, type Locale, locales } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

function pickLocaleFromAcceptLanguage(value: string | null): Locale {
  if (!value) return defaultLocale;
  const lower = value.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('id') || lower.startsWith('in')) return 'id';
  return defaultLocale;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('lang')?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale as Locale;
  }
  const hdrs = await headers();
  const accept = hdrs.get('accept-language');
  return pickLocaleFromAcceptLanguage(accept);
}

export async function getMessages() {
  const locale = await getLocale();
  const messages = await getDictionary(locale);
  return { locale, messages } as const;
}
