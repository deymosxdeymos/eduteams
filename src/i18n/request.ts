import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This ensures that the locale from params is always respected
  let locale = await requestLocale;

  // Validate that locale is supported
  if (!locale || !routing.locales.includes(locale as 'id' | 'en')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
