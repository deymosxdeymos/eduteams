import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { middleware } from '@/middleware';

const mockRedirect = mock();
const mockNext = mock();

mock.module('next/server', () => ({
  NextRequest: class MockNextRequest {
    nextUrl: { pathname: string };
    url: string;
    cookies: { get: (name: string) => { value?: string } | undefined };
    headers: Map<string, string>;

    constructor(url: string, options?: { cookies?: Record<string, string>; headers?: Record<string, string> }) {
      this.url = url;
      this.nextUrl = { pathname: new URL(url).pathname };
      this.cookies = {
        get: (name: string) => {
          const cookieValue = options?.cookies?.[name];
          return cookieValue ? { value: cookieValue } : undefined;
        },
      };
      this.headers = new Map(Object.entries(options?.headers || {}));
    }

    get headers() {
      return this.headers;
    }
  },
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}));

describe('Middleware language cookie', () => {
  beforeEach(() => {
    mockRedirect.mockReset();
    mockNext.mockReset();
    mockRedirect.mockReturnValue(new Response('', { status: 302 }));
    mockNext.mockReturnValue(new Response('', { status: 200 }));
  });

  test('sets lang from Accept-Language when missing', async () => {
    const req: any = new (require('next/server').NextRequest)(
      'http://localhost:3000/dashboard',
      { headers: { 'accept-language': 'en-US,en;q=0.9' } }
    );
    const res = await middleware(req);
    expect(res.headers.get('set-cookie') || '').toContain('lang=en');
  });
});


