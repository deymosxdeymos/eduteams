import { describe, expect, it, mock } from 'bun:test';
import { NextResponse } from 'next/server';

// Mock session and prisma for getCurrentUser()
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1', name: 'U', email: 'u@example.com',
      role: 'dosen', isOnboarded: true,
      createdAt: new Date(), updatedAt: new Date(),
      nimNpm: null, gender: 'MALE', hasSeenWelcomeSplash: false,
      onboardingStep: null, onboardingData: null,
      mbtiType: null, ei: 0, sn: 0, tf: 0, pj: 0,
    })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));

describe('api-utils wrappers', () => {
  it('withAuth provides user to handler', async () => {
    const m = await import('@/lib/api-utils');
    const handler = m.withAuth(async (_req, ctx) => {
      return NextResponse.json({ success: true, userId: ctx.user.id });
    });
    const res = await handler(new Request('http://localhost/x') as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.userId).toBe('u1');
  });

  it('withAuth returns 401 when no session', async () => {
    // Override auth to return null
    const { auth } = await import('@/lib/auth');
    (auth.api.getSession as any) = async () => ({ user: null });
    const m = await import('@/lib/api-utils');
    const handler = m.withAuth(async () => NextResponse.json({ ok: true }));
    const res = await handler(new Request('http://localhost/x') as any, undefined as any);
    expect(res.status).toBe(401);
  });

  it('withValidation parses data and fails invalid body', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));
    const m = await import('@/lib/api-utils');
    const schema = (d: unknown) => {
      const obj = d as any;
      if (!obj || typeof obj.name !== 'string') throw new Error('bad');
      return { name: obj.name as string };
    };
    const route = m.withAuth(
      m.withValidation(schema, async (_req, ctx) => {
        return NextResponse.json({ ok: true, name: (ctx as any).validatedData.name });
      })
    );

    const ok = await route(new Request('http://localhost/y', { method: 'POST', body: JSON.stringify({ name: 'A' }) }) as any, undefined as any);
    expect(ok.status).toBe(200);
    const bad = await route(new Request('http://localhost/y', { method: 'POST', body: '{}' }) as any, undefined as any);
    expect(bad.status).toBe(400);
  });

  it('createApiResponse returns success JSON', async () => {
    const m = await import('@/lib/api-utils');
    const res = m.createApiResponse({ x: 1 }, 'ok', 201);
    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.x).toBe(1);
  });
});
