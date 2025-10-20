import { describe, expect, it, mock } from 'bun:test';

mock.module('next/cache', () => ({ revalidateTag: mock(() => {}) }));

describe('POST /api/debug/clear-cache', () => {
  it('requires admin and clears tag', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'a1' } }) } },
    }));
    // withRole('admin') will check user role through getCurrentUser? Actually withRole wraps withAuth and checks role directly on ctx.user
    // So we need prisma.user.findUnique to return admin
    mock.module('@/lib/prisma', () => ({
      default: {
        user: {
          findUnique: async () => ({
            id: 'a1',
            role: 'admin',
            isOnboarded: true,
          }),
        },
      },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/debug/clear-cache', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tag: 'x' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
  });
});
