import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'mahasiswa' })),
    update: mock(async () => ({})),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/mbti-questions-simple', () => ({
  getActivePersonalityBank: async () => ({
    bankVersion: 1,
    locale: 'id-ID',
    questions: [
      {
        id: 'q1',
        bankVersion: 1,
        locale: 'id-ID',
        text: 'q1',
        dimension: 'ei',
        orderHint: 1,
        reversed: false,
        isAttentionCheck: false,
      },
      {
        id: 'q2',
        bankVersion: 1,
        locale: 'id-ID',
        text: 'q2',
        dimension: 'sn',
        orderHint: 2,
        reversed: false,
        isAttentionCheck: false,
      },
      {
        id: 'q3',
        bankVersion: 1,
        locale: 'id-ID',
        text: 'q3',
        dimension: 'tf',
        orderHint: 3,
        reversed: false,
        isAttentionCheck: false,
      },
      {
        id: 'q4',
        bankVersion: 1,
        locale: 'id-ID',
        text: 'q4',
        dimension: 'pj',
        orderHint: 4,
        reversed: false,
        isAttentionCheck: false,
      },
    ],
  }),
}));

describe('POST /api/user/complete-onboarding', () => {
  it('calculates personality for mahasiswa answers', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 4; i++) answers[String(i)] = 3;
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
