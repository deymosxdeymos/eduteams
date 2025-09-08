import { type NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

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
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Check if session token exists (lightweight check without database)
  const sessionCookie = getSessionCookie(request);
  const hasSessionToken = !!sessionCookie;

  const publicRoutes = ['/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Redirect authenticated users from homepage to onboarding/resume
  if (pathname === '/' && hasSessionToken) {
    const res = NextResponse.redirect(
      new URL('/onboarding/resume', request.url)
    );
    return applySecurityHeaders(res);
  }

  // Handle auth pages (login/register)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (hasSessionToken) {
      const res = NextResponse.redirect(new URL('/dashboard', request.url));
      return applySecurityHeaders(res);
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Protect non-public routes
  if (!isPublicRoute && !hasSessionToken) {
    const res = NextResponse.redirect(new URL('/', request.url));
    return applySecurityHeaders(res);
  }

  // Let server components handle full session validation and onboarding logic
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
