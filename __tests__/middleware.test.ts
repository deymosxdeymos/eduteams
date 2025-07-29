import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../src/middleware';

// Mock Next.js server components
const mockRedirect = mock();
const mockNext = mock();

mock.module('next/server', () => ({
  NextRequest: class MockNextRequest {
    nextUrl: { pathname: string };
    url: string;
    cookies: { get: (name: string) => { value?: string } | undefined };

    constructor(url: string, options?: { cookies?: Record<string, string> }) {
      this.url = url;
      this.nextUrl = { pathname: new URL(url).pathname };
      this.cookies = {
        get: (name: string) => {
          const cookieValue = options?.cookies?.[name];
          return cookieValue ? { value: cookieValue } : undefined;
        },
      };
    }
  },
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}));

describe('Middleware', () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockNext.mockReset();
    mockRedirect.mockReturnValue(new Response('', { status: 302 }));
    mockNext.mockReturnValue(new Response('', { status: 200 }));
  });

  describe('Static Asset Handling', () => {
    test('should skip middleware for _next paths', async () => {
      const request = new NextRequest(
        'http://localhost:3000/_next/static/chunk.js'
      ) as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should skip middleware for API routes', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/user/data'
      ) as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should skip middleware for static assets', async () => {
      const request = new NextRequest(
        'http://localhost:3000/static/logo.png'
      ) as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should skip middleware for files with extensions', async () => {
      const request = new NextRequest(
        'http://localhost:3000/robots.txt'
      ) as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should skip middleware for favicon', async () => {
      const request = new NextRequest(
        'http://localhost:3000/favicon.ico'
      ) as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Detection', () => {
    test('should redirect authenticated users from homepage to resume', async () => {
      const request = new NextRequest('http://localhost:3000/') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/onboarding/resume',
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should detect unauthenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/') as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Homepage Redirect Logic', () => {
    test('should redirect authenticated users from homepage to resume', async () => {
      const request = new NextRequest('http://localhost:3000/') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/onboarding/resume',
        })
      );
    });

    test('should allow unauthenticated users to stay on homepage', async () => {
      const request = new NextRequest('http://localhost:3000/') as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Auth Routes Handling', () => {
    test('should redirect authenticated users from login to dashboard', async () => {
      const request = new NextRequest('http://localhost:3000/login') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/dashboard',
        })
      );
    });

    test('should redirect authenticated users from register to dashboard', async () => {
      const request = new NextRequest('http://localhost:3000/register') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/dashboard',
        })
      );
    });

    test('should allow unauthenticated users to access login', async () => {
      const request = new NextRequest('http://localhost:3000/login') as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should allow unauthenticated users to access register', async () => {
      const request = new NextRequest('http://localhost:3000/register') as any;

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    test('should redirect unauthenticated users from dashboard to homepage', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard') as any;

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    test('should redirect unauthenticated users from onboarding to homepage', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboarding/role'
      ) as any;

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    test('should allow authenticated users to access dashboard', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should allow authenticated users to access onboarding', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboarding/role'
      ) as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Public Routes', () => {
    test('should allow access to homepage for both authenticated and unauthenticated users', async () => {
      // Unauthenticated user
      const unauthRequest = new NextRequest('http://localhost:3000/') as any;
      await middleware(unauthRequest);
      expect(mockNext).toHaveBeenCalled();

      mockNext.mockClear();

      // Authenticated user should be redirected to resume
      const authRequest = new NextRequest('http://localhost:3000/', {
        cookies: { 'better-auth.session_token': 'valid-token' },
      }) as any;
      await middleware(authRequest);
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing session token cookie', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard') as any;

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    test('should handle empty session token', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard') as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token' ? { value: '' } : undefined,
      };

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    test('should handle malformed URLs gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboarding//role'
      ) as any;

      await middleware(request);

      expect(mockRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    test('should handle deep nested onboarding paths', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboarding/data-diri/mahasiswa'
      ) as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    test('should handle resume page correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/onboarding/resume'
      ) as any;
      request.cookies = {
        get: (name: string) =>
          name === 'better-auth.session_token'
            ? { value: 'valid-token' }
            : undefined,
      };

      await middleware(request);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('Route Matching', () => {
    test('should process paths that match the matcher pattern', async () => {
      const testPaths = [
        '/dashboard',
        '/onboarding/role',
        '/onboarding/data-diri/mahasiswa',
        '/onboarding/kepribadian',
        '/onboarding/resume',
        '/settings',
      ];

      for (const path of testPaths) {
        mockNext.mockClear();
        mockRedirect.mockClear();

        const request = new NextRequest(`http://localhost:3000${path}`) as any;
        await middleware(request);

        // Should either redirect or continue, not be skipped
        expect(
          mockNext.mock.calls.length + mockRedirect.mock.calls.length
        ).toBeGreaterThan(0);
      }
    });

    test('should skip paths that do not match the matcher pattern', async () => {
      const testPaths = [
        '/_next/static/chunks/app.js',
        '/api/auth/login',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
      ];

      for (const path of testPaths) {
        mockNext.mockClear();
        mockRedirect.mockClear();

        const request = new NextRequest(`http://localhost:3000${path}`) as any;
        await middleware(request);

        expect(mockNext).toHaveBeenCalled();
        expect(mockRedirect).not.toHaveBeenCalled();
      }
    });
  });
});
