import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: 'STUDENT',
      isOnboarded: true,
    })),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/user/welcome-splash', () => {
  it('marks welcome splash as seen', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const res = await POST(
      new Request('http://localhost/api/user/welcome-splash') as any,
      undefined as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { hasSeenWelcomeSplash: true },
    });
  });
});
