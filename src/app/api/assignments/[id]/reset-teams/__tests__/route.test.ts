import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1'
        ? { id: 'a1', course: { select: undefined, dosenId: 'u1' } }
        : null
    ),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/assignments/[id]/reset-teams', () => {
  it('resets teams when dosen owner', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const res = await POST(new Request('http://localhost/api/assignments/a1/reset-teams') as any, {
      params: Promise.resolve({ id: 'a1' }),
      user: { id: 'u1' },
    } as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.assignment.update).toHaveBeenCalled();
  });

  it('returns 403 for non-owner', async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => ({ id: 'a1', course: { dosenId: 'uX' } }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const res = await POST(new Request('http://localhost/api/assignments/a1/reset-teams') as any, {
      params: Promise.resolve({ id: 'a1' }),
      user: { id: 'u1' },
    } as any);
    expect(res.status).toBe(403);
  });
});

