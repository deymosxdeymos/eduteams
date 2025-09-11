import type { Locale } from '@/i18n/config';

export async function getDictionary(locale: Locale) {
  switch (locale) {
    case 'en':
      return (await import('@/i18n/dictionaries/en')).messages;
    default:
      return (await import('@/i18n/dictionaries/id')).messages;
  }
}
