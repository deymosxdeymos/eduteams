import { toNextJsHandler } from 'better-auth/next-js';
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const authHandlers = toNextJsHandler(auth);

export const GET = authHandlers.GET;

export async function POST(request: NextRequest) {
  const { shouldBlockPublicDemoCredentialAuth } = await import('@/lib/auth');

  if (shouldBlockPublicDemoCredentialAuth?.(request) ?? false) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return authHandlers.POST(request);
}
