import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Get session token from cookies for lightweight check
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  const isAuthenticated = !!sessionToken;

  // Public routes that don't require authentication
  const publicRoutes = ['/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is on homepage and authenticated, redirect to resume to determine next step
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/onboarding/resume', request.url));
  }

  // Auth routes (redirect to onboarding if already logged in)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/onboarding/resume', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
