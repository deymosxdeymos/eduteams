import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  localePrefix: 'as-needed',
  localeDetection: false,
});

const navigation = createNavigation(routing);

export const { Link, usePathname, useRouter } = navigation;
