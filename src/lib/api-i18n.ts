import type { NextRequest } from 'next/server';
import enMessages from '@/../messages/en.json';
import idMessages from '@/../messages/id.json';
import { routing } from '@/i18n/routing';

export type RequestLocale = 'id' | 'en';

export function getRequestLocale(request: NextRequest): RequestLocale {
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const pathname = new URL(referer, 'http://localhost').pathname;
      if (pathname === '/en' || pathname.startsWith('/en/')) {
        return 'en';
      }
    } catch {
      // Ignore malformed referer headers and fall back to the default locale.
    }
  }

  return (routing.defaultLocale ?? 'id') as RequestLocale;
}

export function getLocalizedApiMessage(
  locale: RequestLocale,
  key: string
): string {
  const messages = locale === 'en' ? enMessages : idMessages;
  const keys = key.split('.');
  let value: Record<string, unknown> | string = messages;

  for (const segment of keys) {
    value = (value as Record<string, unknown>)?.[segment] as
      | Record<string, unknown>
      | string;
  }

  return typeof value === 'string' ? value : key;
}
