import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: { findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })) },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1'
        ? { id: 'a1', courseId: 'c1', description: JSON.stringify({ text: 'old', skills: ['A'], topics: ['X'] }), course: { dosenId: 'u1' } }
        : null
    ),
    update: mock(async (args: any) => ({
      id: 'a1',
      courseId: 'c1',
      title: args.data.title ?? 'T',
      description: args.data.description ?? JSON.stringify({ text: 'old', skills: ['A'], topics: ['X'] }),
      startAt: new Date('2025-01-01T00:00:00Z'),
      createdAt: new Date('2024-12-31T00:00:00Z'),
      status: args.data.status ?? 'MENUNGGU',
      _count: { submissions: 0 },
    })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('PATCH /api/assignments/[id]', () => {
  it('updates assignment title for owner', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));
    const { PATCH } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'New' }),
    });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.title).toBe('New');
  });

  it('returns 403 for non-owner', async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => ({ id: 'a1', courseId: 'c1', description: null, course: { dosenId: 'uX' } }));
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));
    const { PATCH } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1', { method: 'PATCH' });
    const res = await PATCH(req as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res.status).toBe(403);
  });
});
