import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "as-needed",
  localeDetection: false,
});

const navigation = createNavigation(routing);

export const { Link, redirect, usePathname, useRouter } = navigation;

export function getLocalizedHref(locale: string, href: string) {
  if (locale === routing.defaultLocale || !href.startsWith("/")) {
    return href;
  }

  if (href === "/") {
    return `/${locale}`;
  }

  if (href === `/${locale}` || href.startsWith(`/${locale}/`)) {
    return href;
  }

  return `/${locale}${href}`;
}
