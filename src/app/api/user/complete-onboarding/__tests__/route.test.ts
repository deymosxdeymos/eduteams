import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'mahasiswa' })),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/user/complete-onboarding', () => {
  it('calculates personality for mahasiswa answers', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));
    const { POST } = await import('../route');
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 24; i++) answers[String(i)] = 3;
    const req = new Request('http://localhost/api/user/complete-onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });
});

