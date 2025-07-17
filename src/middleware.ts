import { NextRequest, NextResponse } from 'next/server';

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
    return NextResponse.next();
  }

  // Check if session token exists (lightweight check without database)
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  const hasSessionToken = !!sessionToken;

  const publicRoutes = ['/'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Allow authenticated users to access homepage
  // Remove automatic redirect to onboarding/resume for homepage

  // Handle auth pages (login/register)
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (hasSessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect non-public routes
  if (!isPublicRoute && !hasSessionToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Let server components handle full session validation and onboarding logic
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
