import type { Locale } from '@/i18n/config';

type Messages = typeof import('@/i18n/dictionaries/id').messages;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (Array.isArray(base)) {
    if (Array.isArray(override)) return override as T;
    return base;
  }
  if (isRecord(base) && isRecord(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (key in base) {
        const baseValue = (base as Record<string, unknown>)[key];
        result[key] = deepMerge(baseValue as unknown, value) as unknown;
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }
  if (override !== undefined) return override as T;
  return base;
}

export async function getDictionary(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'en': {
      const en = (await import('@/i18n/dictionaries/en')).messages as unknown;
      const id = (await import('@/i18n/dictionaries/id')).messages as Messages;
      return deepMerge(id, en) as Messages;
    }
    default:
      return (await import('@/i18n/dictionaries/id')).messages as Messages;
  }
}
