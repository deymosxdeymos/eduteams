'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { defaultLocale, type Locale, locales } from '@/i18n/config';

const LocaleSchema = z.enum(locales as unknown as [string, ...string[]]);

export async function setLocale(
  localeInput: unknown,
  options?: { path?: string }
) {
  const result = LocaleSchema.safeParse(localeInput);
  const locale: Locale = result.success
    ? (result.data as Locale)
    : defaultLocale;
  const store = await cookies();
  store.set('lang', locale, { path: '/', httpOnly: false, sameSite: 'lax' });
  if (options?.path) {
    const normalized = options.path.replace(/^\/en(\/|$)/, '/');
    revalidatePath(normalized);
  }
}
