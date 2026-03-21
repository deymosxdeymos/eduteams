import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { render, screen } from "@testing-library/react";

const getTranslationsMock = mock(async () => {
  const t = ((key: string) => key) as ((key: string) => string) & {
    raw: (key: string) => string;
  };
  t.raw = (key: string) => key;
  return t;
});

mock.module("next-intl/server", () => ({
  getTranslations: getTranslationsMock,
}));

mock.module("@/components/auth/login-button", () => ({
  LoginButton: ({ className }: { className?: string }) => (
    <button data-testid="login-button" className={className}>
      Login
    </button>
  ),
}));

mock.module("@/components/dashboard/language-switcher-server", () => ({
  LanguageSwitcherServer: () => <div data-testid="language-switcher" />,
}));

mock.module("@/components/landing/animated-entj", () => ({
  AnimatedEntj: () => <div data-testid="animated-entj" />,
}));

mock.module("@/components/landing/hero-mbti-collage", () => ({
  HeroMbtiCollage: () => <div data-testid="hero-mbti-collage" />,
}));

mock.module("@/components/landing/deferred-decorations", () => ({
  DeferredAnimatedEntj: () => <div data-testid="animated-entj" />,
  DeferredHeroMbtiCollage: () => <div data-testid="hero-mbti-collage" />,
}));

mock.module("@/components/logo", () => ({
  default: () => <div data-testid="logo" />,
}));

mock.module("@/components/ui/highlight-text", () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

mock.module("@/components/ui/scroll-to-top-client", () => ({
  ScrollToTopClient: () => <div data-testid="scroll-to-top" />,
}));

mock.module("@/components/ui/skip-link", () => ({
  SkipLink: ({ children, href }: { children: any; href: string }) => <a href={href}>{children}</a>,
}));

mock.module("@/components/ui/social-row", () => ({
  SocialRow: () => <div data-testid="social-row" />,
}));

mock.module("next/image", () => ({
  default: ({ alt }: { alt: string }) => <div aria-label={alt} />,
}));

afterAll(() => {
  mock.restore();
});

describe("marketing Home page", () => {
  beforeEach(() => {
    getTranslationsMock.mockReset();

    getTranslationsMock.mockImplementation(async () => {
      const t = ((key: string) => key) as ((key: string) => string) & {
        raw: (key: string) => string;
      };
      t.raw = (key: string) => key;
      return t;
    });
  });

  it("renders login CTAs", async () => {
    const { default: Home } = await import("../page");

    render(await Home());

    expect(screen.getAllByTestId("login-button")).toHaveLength(2);
  });
});
