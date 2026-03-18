import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

const translations = {
  currentIndonesia: "Current language: Indonesian",
  currentEnglish: "Current language: English",
  switchToIndonesia: "Switch to Indonesian",
  switchToEnglish: "Switch to English",
} as const;

const useLocaleMock = mock(() => "id");
const getLocaleMock = mock(async () => "en");
const replaceMock = mock(() => undefined);

function installLanguageSwitcherMocks() {
  mock.module("next/image", () => ({
    default: ({ src, alt, ...props }: any) => (
      <div role="img" aria-label={alt} data-src={src} {...props} />
    ),
  }));

  mock.module("next-intl", () => ({
    useLocale: useLocaleMock,
    useTranslations: () => (key: keyof typeof translations) => translations[key] ?? key,
  }));

  mock.module("next-intl/server", () => ({
    getLocale: getLocaleMock,
    getTranslations: async () => (key: keyof typeof translations) => translations[key] ?? key,
  }));

  mock.module("@/i18n/routing", () => ({
    routing: {
      locales: ["id", "en"],
      defaultLocale: "id",
      localePrefix: "as-needed",
    },
    redirect: (href: string) => {
      throw new Error(`Redirecting to ${href}`);
    },
    getLocalizedHref: (locale: string, href: string) =>
      locale === "id" || !href.startsWith("/") ? href : `/${locale}${href}`,
    usePathname: () => "/dashboard",
    useRouter: () => ({ replace: replaceMock }),
    Link: ({ children, locale, ...props }: any) => (
      <a data-locale={locale} {...props}>
        {children}
      </a>
    ),
  }));

  mock.module("@/components/ui/button", () => ({
    Button: ({ children, asChild = false, variant: _variant, size: _size, ...props }: any) => {
      if (asChild) {
        return children;
      }

      return <button {...props}>{children}</button>;
    },
  }));

  mock.module("@/components/ui/loading-spinner", () => ({
    LoadingSpinner: () => <span data-testid="spinner" />,
  }));
}

installLanguageSwitcherMocks();

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    useLocaleMock.mockReset();
    useLocaleMock.mockReturnValue("id");
    getLocaleMock.mockReset();
    getLocaleMock.mockResolvedValue("en");
    replaceMock.mockReset();
  });

  afterAll(() => {
    mock.restore();
  });

  it("shows the destination locale in the client switcher", async () => {
    const { LanguageSwitcher } = await import("../language-switcher");

    render(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: translations.switchToEnglish });
    expect(button.textContent).toContain("EN");
    expect(screen.getByRole("img", { name: translations.switchToEnglish })).toBeTruthy();

    fireEvent.click(button);
    expect(replaceMock).toHaveBeenCalledWith("/dashboard", { locale: "en" });
  });

  it("shows the destination locale in the server switcher", async () => {
    const { LanguageSwitcherServer } = await import("../language-switcher-server");

    const html = renderToStaticMarkup(await LanguageSwitcherServer({}));

    expect(html).toContain("Switch to Indonesian");
    expect(html).toContain('data-locale="id"');
    expect(html).toContain(">ID<");
    expect(html).toContain("/indo.svg");
  });
});
