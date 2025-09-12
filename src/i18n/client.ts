'use client';

import type { Locale } from '@/i18n/config';

type LocaleChangeDetail = { locale: Locale };

const EVENT_NAME = 'locale-change';

export function getClientLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'id';
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('lang='))
    ?.split('=')[1];
  return (cookieValue === 'en' ? 'en' : 'id') as Locale;
}

export function onLocaleChange(callback: (locale: Locale) => void): () => void {
  const handler = (event: Event) => {
    const e = event as CustomEvent<LocaleChangeDetail>;
    if (e?.detail?.locale) callback(e.detail.locale);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler as EventListener);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handler as EventListener);
    }
  };
}

export function emitLocaleChange(locale: Locale): void {
  if (typeof window === 'undefined') return;
  const event: CustomEvent<LocaleChangeDetail> = new CustomEvent(EVENT_NAME, {
    detail: { locale },
  });
  window.dispatchEvent(event);
}
