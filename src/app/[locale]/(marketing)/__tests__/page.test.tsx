import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';

const getTranslationsMock = mock(async () => {
  const t = ((key: string) => key) as ((key: string) => string) & {
    raw: (key: string) => string;
  };
  t.raw = (key: string) => key;
  return t;
});
const originalDemoMode = process.env.DEMO_MODE;

mock.module('next-intl/server', () => ({
  getTranslations: getTranslationsMock,
}));

mock.module('@/components/auth/demo-login-button', () => ({
  DemoLoginButton: ({ className }: { className?: string }) => (
    <button data-testid='demo-login-button' className={className}>
      Demo login
    </button>
  ),
}));

mock.module('@/components/auth/login-button', () => ({
  LoginButton: ({ className }: { className?: string }) => (
    <button data-testid='login-button' className={className}>
      Login
    </button>
  ),
}));

mock.module('@/components/dashboard/language-switcher-server', () => ({
  LanguageSwitcherServer: () => <div data-testid='language-switcher' />,
}));

mock.module('@/components/landing/animated-entj', () => ({
  AnimatedEntj: () => <div data-testid='animated-entj' />,
}));

mock.module('@/components/landing/hero-mbti-collage', () => ({
  HeroMbtiCollage: () => <div data-testid='hero-mbti-collage' />,
}));

mock.module('@/components/logo', () => ({
  default: () => <div data-testid='logo' />,
}));

mock.module('@/components/ui/highlight-text', () => ({
  HighlightText: ({ text }: { text: string }) => <span>{text}</span>,
}));

mock.module('@/components/ui/scroll-to-top-client', () => ({
  ScrollToTopClient: () => <div data-testid='scroll-to-top' />,
}));

mock.module('@/components/ui/skip-link', () => ({
  SkipLink: ({ children, href }: { children: any; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

mock.module('@/components/ui/social-row', () => ({
  SocialRow: () => <div data-testid='social-row' />,
}));

mock.module('next/image', () => ({
  default: ({ alt }: { alt: string }) => <div aria-label={alt} />,
}));

describe('marketing Home page', () => {
  beforeEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    getTranslationsMock.mockReset();

    getTranslationsMock.mockImplementation(async () => {
      const t = ((key: string) => key) as ((key: string) => string) & {
        raw: (key: string) => string;
      };
      t.raw = (key: string) => key;
      return t;
    });
  });

  it('renders the regular login CTA when demo mode is disabled', async () => {
    delete process.env.DEMO_MODE;

    const { default: Home } = await import('../page');

    render(await Home());

    expect(screen.getAllByTestId('login-button')).toHaveLength(2);
    expect(screen.queryByTestId('demo-login-button')).toBeNull();
  });

  it('renders only demo login CTAs when demo login is enabled', async () => {
    process.env.DEMO_MODE = '1';

    const { default: Home, dynamic } = await import('../page');

    render(await Home());

    expect(dynamic).toBe('force-dynamic');
    expect(screen.getAllByTestId('demo-login-button')).toHaveLength(2);
    expect(screen.queryByTestId('login-button')).toBeNull();
  });
});
