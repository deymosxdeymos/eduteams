import { describe, expect, it, mock } from 'bun:test';

const actualAuth = await import('@/lib/auth');

// Mock auth + prisma before importing route
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: null,
      isOnboarded: true,
      name: 'User',
      email: 'user@example.com',
    })),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/auth', () => ({
  ...actualAuth,
  auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
}));

mock.module('@/lib/prisma', () => ({
  default: prismaMock,
}));

describe('POST /api/user/role', () => {
  it('updates role for authenticated user', async () => {
    const { POST } = await import('../route');

    const req = new Request('http://localhost/api/user/role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'TEACHER' }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'TEACHER' },
    });
  });

  it('rejects invalid payload', async () => {
    const { POST } = await import('../route');

    const req = new Request('http://localhost/api/user/role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: 'teacher' }),
    });

    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(400);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
  });
});
