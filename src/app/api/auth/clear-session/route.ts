import { type NextRequest, NextResponse } from 'next/server';
import { clearAuthSessionCookies } from '@/lib/demo/auth';

export async function POST(request: NextRequest) {
  await clearAuthSessionCookies();
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
