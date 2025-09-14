import { describe, expect, it, mock } from 'bun:test';
import { NextResponse } from 'next/server';

// Mock session and prisma for getCurrentUser()
const prismaMock: any = {
  user: {
    findUnique: mock(async ({ where }: any) => {
      if (where.id === 'u1') return {
        id: 'u1', name: 'U', email: 'u@example.com',
        role: 'dosen', isOnboarded: true,
        createdAt: new Date(), updatedAt: new Date(),
        nimNpm: null, gender: 'MALE', hasSeenWelcomeSplash: false,
        onboardingStep: null, onboardingData: null,
        mbtiType: null, ei: 0, sn: 0, tf: 0, pj: 0,
      };
      if (where.id === 'u2') return {
        id: 'u2', name: 'U2', email: 'u2@example.com',
        role: 'mahasiswa', isOnboarded: false,
        createdAt: new Date(), updatedAt: new Date(),
        nimNpm: '12345', gender: 'FEMALE', hasSeenWelcomeSplash: false,
        onboardingStep: null, onboardingData: null,
        mbtiType: null, ei: 0, sn: 0, tf: 0, pj: 0,
      };
      return null;
    }),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('api-utils', () => {
  describe('withAuth', () => {
    it('provides user to handler when authenticated', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u1' },
              session: {
                id: 's1',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u1',
              }
            })
          }
        },
      }));

      const { withAuth } = await import('@/lib/api-utils');
      const handler = withAuth(async (_req, ctx) => {
        return NextResponse.json({ success: true, userId: ctx.user.id });
      });
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.userId).toBe('u1');
    });

    it('returns 401 when no session', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => null
          }
        },
      }));

      const { withAuth } = await import('@/lib/api-utils');
      const handler = withAuth(async () => NextResponse.json({ ok: true }));
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(401);
    });
  });

  describe('withRole', () => {
    it('allows access when user has required role', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u1' },
              session: {
                id: 's1',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u1',
              }
            })
          }
        },
      }));

      const { withRole } = await import('@/lib/api-utils');
      const handler = withRole('dosen', async (_req, ctx) => {
        return NextResponse.json({ success: true, role: ctx.user.role });
      });
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.role).toBe('dosen');
    });

    it('denies access when user lacks required role', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u2' },
              session: {
                id: 's2',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u2',
              }
            })
          }
        },
      }));

      const { withRole } = await import('@/lib/api-utils');
      const handler = withRole('dosen', async () => NextResponse.json({ ok: true }));
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(403);
    });
  });

  describe('withOnboarded', () => {
    it('allows access when user is onboarded', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u1' },
              session: {
                id: 's1',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u1',
              }
            })
          }
        },
      }));

      const { withOnboarded } = await import('@/lib/api-utils');
      const handler = withOnboarded(async (_req, ctx) => {
        return NextResponse.json({ success: true, onboarded: ctx.user.isOnboarded });
      });
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.onboarded).toBe(true);
    });

    it('denies access when user is not onboarded', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u2' },
              session: {
                id: 's2',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u2',
              }
            })
          }
        },
      }));

      const { withOnboarded } = await import('@/lib/api-utils');
      const handler = withOnboarded(async () => NextResponse.json({ ok: true }));
      const res = await handler(new Request('http://localhost/x') as any, undefined as any);
      expect(res.status).toBe(403);
    });
  });

  describe('withValidation', () => {
    it('parses data and passes to handler', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u1' },
              session: {
                id: 's1',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u1',
              }
            })
          }
        },
      }));

      const { withAuth, withValidation } = await import('@/lib/api-utils');
      const schema = (d: unknown) => {
        const obj = d as any;
        if (!obj || typeof obj.name !== 'string') throw new Error('bad');
        return { name: obj.name as string };
      };
      const route = withAuth(
        withValidation(schema, async (_req, ctx) => {
          return NextResponse.json({ ok: true, name: (ctx as any).validatedData.name });
        })
      );

      const res = await route(new Request('http://localhost/y', { method: 'POST', body: JSON.stringify({ name: 'A' }) }) as any, undefined as any);
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.name).toBe('A');
    });

    it('returns 400 for invalid data', async () => {
      mock.module('@/lib/auth', () => ({
        auth: {
          api: {
            getSession: async () => ({
              user: { id: 'u1' },
              session: {
                id: 's1',
                expiresAt: new Date(),
                token: 'token',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: 'u1',
              }
            })
          }
        },
      }));

      const { withAuth, withValidation } = await import('@/lib/api-utils');
      const schema = (d: unknown) => {
        const obj = d as any;
        if (!obj || typeof obj.name !== 'string') throw new Error('bad');
        return { name: obj.name as string };
      };
      const route = withAuth(
        withValidation(schema, async () => NextResponse.json({ ok: true }))
      );

      const res = await route(new Request('http://localhost/y', { method: 'POST', body: '{}' }) as any, undefined as any);
      expect(res.status).toBe(400);
    });
  });

  describe('createApiResponse', () => {
    it('returns success JSON with data', async () => {
      const { createApiResponse } = await import('@/lib/api-utils');
      const res = createApiResponse({ x: 1 }, 'ok', 201);
      expect(res.status).toBe(201);
      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.x).toBe(1);
      expect(json.message).toBe('ok');
    });

    it('returns success JSON without message', async () => {
      const { createApiResponse } = await import('@/lib/api-utils');
      const res = createApiResponse({ x: 1 });
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.x).toBe(1);
      expect(json.message).toBeUndefined();
    });
  });

  describe('createErrorResponse', () => {
    it('returns error JSON', async () => {
      const { createErrorResponse } = await import('@/lib/api-utils');
      const res = createErrorResponse('Something went wrong', 400, 'BAD_REQUEST');
      expect(res.status).toBe(400);
      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error).toBe('Something went wrong');
      expect(json.code).toBe('BAD_REQUEST');
    });
  });

  describe('handleApiError', () => {
    it('handles HttpError', async () => {
      const { handleApiError } = await import('@/lib/api-utils');
      const { AuthError } = await import('@/lib/utils/errors');
      const error = new AuthError('Test auth error');
      const res = handleApiError(error);
      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error).toBe('Test auth error');
      expect(json.code).toBe('AUTH_ERROR');
    });

    it('handles generic Error', async () => {
      const { handleApiError } = await import('@/lib/api-utils');
      const error = new Error('Generic error');
      const res = handleApiError(error);
      expect(res.status).toBe(500);
      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error).toBe('Generic error');
    });

    it('handles unknown error', async () => {
      const { handleApiError } = await import('@/lib/api-utils');
      const error = 'string error';
      const res = handleApiError(error);
      expect(res.status).toBe(500);
      const json = (await res.json()) as any;
      expect(json.success).toBe(false);
      expect(json.error).toBe('Internal server error');
    });
  });

  describe('requireAuth', () => {
    it('throws AuthError', async () => {
      const { requireAuth } = await import('@/lib/api-utils');
      const { AuthError } = await import('@/lib/utils/errors');
      expect(() => requireAuth()).toThrow(AuthError);
      expect(() => requireAuth()).toThrow('This function must be called within an authenticated context');
    });
  });

  describe('requireRole', () => {
    it('passes when user has required role', async () => {
      const { requireRole } = await import('@/lib/api-utils');
      const user = { id: 'u1', role: 'dosen' as const, isOnboarded: true };
      expect(() => requireRole('dosen', user)).not.toThrow();
    });

    it('throws when user lacks required role', async () => {
      const { requireRole } = await import('@/lib/api-utils');
      const { AuthorizationError } = await import('@/lib/utils/errors');
      const user = { id: 'u1', role: 'mahasiswa' as const, isOnboarded: true };
      expect(() => requireRole('dosen', user)).toThrow(AuthorizationError);
      expect(() => requireRole('dosen', user)).toThrow('Insufficient permissions');
    });

    it('throws when user has no role', async () => {
      const { requireRole } = await import('@/lib/api-utils');
      const { AuthorizationError } = await import('@/lib/utils/errors');
      const user = { id: 'u1', role: null, isOnboarded: true };
      expect(() => requireRole('dosen', user)).toThrow(AuthorizationError);
    });
  });

  describe('requireOnboarded', () => {
    it('passes when user is onboarded', async () => {
      const { requireOnboarded } = await import('@/lib/api-utils');
      const user = { id: 'u1', role: 'dosen' as const, isOnboarded: true };
      expect(() => requireOnboarded(user)).not.toThrow();
    });

    it('throws when user is not onboarded', async () => {
      const { requireOnboarded } = await import('@/lib/api-utils');
      const { AuthorizationError } = await import('@/lib/utils/errors');
      const user = { id: 'u1', role: 'dosen' as const, isOnboarded: false };
      expect(() => requireOnboarded(user)).toThrow(AuthorizationError);
      expect(() => requireOnboarded(user)).toThrow('User must complete onboarding first');
    });
  });
});
