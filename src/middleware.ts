import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

function applySecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy-Report-Only', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Prefer frame-ancestors over X-Frame-Options, but include XFO for legacy
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set(
    'Permissions-Policy',
    [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'interest-cohort=()',
      'fullscreen=(self)',
    ].join(', ')
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname: originalPathname, search } = request.nextUrl;
  const method = request.method;
  const acceptHeader = request.headers.get('accept') || '';
  const isDocumentRequest = acceptHeader.includes('text/html');

  const hasEnPrefix =
    originalPathname === '/en' || originalPathname.startsWith('/en/');
  const effectivePathname = hasEnPrefix
    ? originalPathname.replace(/^\/en(\/|$)/, '/').replace(/\/+/, '/')
    : originalPathname;

  // Determine preferred locale
  const cookieLang = request.cookies.get('lang')?.value;
  const accept = request.headers.get('accept-language')?.toLowerCase() || '';
  const inferred = accept.startsWith('en') ? 'en' : 'id';
  const currentLocale = hasEnPrefix
    ? 'en'
    : cookieLang === 'en'
      ? 'en'
      : cookieLang === 'id'
        ? 'id'
        : inferred;

  // Handle first visit without cookie and without prefix: redirect en to prefixed, id stays unprefixed
  if (
    method === 'GET' &&
    isDocumentRequest &&
    !cookieLang &&
    !hasEnPrefix &&
    currentLocale === 'en'
  ) {
    const url = new URL(`/en${effectivePathname}${search}`, request.url);
    const res = NextResponse.redirect(url);
    res.cookies.set('lang', 'en', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
    return applySecurityHeaders(res);
  }

  // Align path with cookie: if cookie says en but path is unprefixed, redirect to prefixed
  if (
    method === 'GET' &&
    isDocumentRequest &&
    cookieLang === 'en' &&
    !hasEnPrefix
  ) {
    const url = new URL(`/en${effectivePathname}${search}`, request.url);
    const res = NextResponse.redirect(url);
    return applySecurityHeaders(res);
  }

  // Skip handling for static assets, API routes, and Next internals based on effective path
  if (
    effectivePathname.includes('/_next') ||
    effectivePathname.includes('/api/') ||
    effectivePathname.startsWith('/static/') ||
    effectivePathname.includes('.') ||
    effectivePathname.startsWith('/favicon')
  ) {
    // If en-prefixed, rewrite to unprefixed so assets/api resolve correctly
    if (hasEnPrefix) {
      const url = new URL(`${effectivePathname}${search}`, request.url);
      const headers = new Headers(request.headers);
      headers.set('x-lang', 'en');
      const res = NextResponse.rewrite(url, { request: { headers } });
      // Do not set cookies for assets/api
      return applySecurityHeaders(res);
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Check if session token exists (lightweight check without database)
  const hasSessionToken = (() => {
    try {
      const tokenFromHeader = getSessionCookie(request.headers);
      if (tokenFromHeader) return true;
    } catch {
      // ignore and fallback
    }
    const token = request.cookies.get('better-auth.session_token')?.value;
    return Boolean(token);
  })();

  // Ensure language cookie is aligned; set it if missing or when en-prefixed
  let response: NextResponse | null = null;
  if (!cookieLang && isDocumentRequest) {
    response = NextResponse.next();
    response.cookies.set('lang', currentLocale, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
  }
  if (hasEnPrefix && cookieLang !== 'en' && isDocumentRequest) {
    response ||= NextResponse.next();
    response.cookies.set('lang', 'en', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });
  }

  const publicRoutes = ['/'];
  const isPublicRoute = publicRoutes.includes(effectivePathname);

  // Allow authenticated users to stay on homepage
  // They can continue their session by clicking "masuk" button

  // Handle auth pages (login/register)
  if (
    effectivePathname.startsWith('/login') ||
    effectivePathname.startsWith('/register')
  ) {
    if (hasSessionToken) {
      const target = currentLocale === 'en' ? '/en/dashboard' : '/dashboard';
      if (method === 'GET') {
        const res = NextResponse.redirect(new URL(target, request.url));
        return applySecurityHeaders(res);
      }
      return applySecurityHeaders(NextResponse.next());
    }
    if (response) {
      return applySecurityHeaders(response);
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Protect non-public routes
  if (!isPublicRoute && !hasSessionToken) {
    const url = new URL('/', request.url);
    if (cookieLang === 'en' || hasEnPrefix) {
      url.pathname = '/en';
    }
    const res = NextResponse.redirect(url);
    return applySecurityHeaders(res);
  }

  // Apply rewrite for en-prefixed paths so the app can keep unprefixed routes
  if (hasEnPrefix) {
    const url = new URL(`${effectivePathname}${search}`, request.url);
    const headers = new Headers(request.headers);
    headers.set('x-lang', 'en');
    const res = NextResponse.rewrite(url, { request: { headers } });
    if (isDocumentRequest) {
      res.cookies.set('lang', 'en', {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
      });
    }
    return applySecurityHeaders(res);
  }

  // Let server components handle full session validation and onboarding logic
  if (response) {
    return applySecurityHeaders(response);
  }
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
