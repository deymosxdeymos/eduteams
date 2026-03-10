import { type NextRequest, NextResponse } from 'next/server';
import { clearAuthSessionCookies } from '@/lib/demo/auth';

function getRedirectTarget(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect');

  if (!redirectTo || !redirectTo.startsWith('/')) {
    return '/';
  }

  return redirectTo;
}

async function clearSessionAndRedirect(request: NextRequest) {
  await clearAuthSessionCookies();
  return NextResponse.redirect(new URL(getRedirectTarget(request), request.url));
}

export async function GET(request: NextRequest) {
  return clearSessionAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return clearSessionAndRedirect(request);
}
