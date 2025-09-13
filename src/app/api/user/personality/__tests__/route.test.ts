import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: { update: mock(async () => ({})) },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/user/personality', () => {
  it('calculates scores and returns MBTI only when fully answered', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } } }));
    mock.module('@/lib/mbti-questions', () => ({
      getMBTIQuestions: async () => Array.from({ length: 4 }).map((_, i) => ({ id: `q${i + 1}`, text: 'x', dimension: ['ei','sn','tf','pj'][i]})),
    }));
    const { POST } = await import('../route');
    // Partial answers (no MBTI)
    let req = new Request('http://localhost/api/user/personality', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers: { q1: 3 } }),
    });
    let res = await POST(req as any);
    expect(res.status).toBe(200);
    let json = (await res.json()) as any;
    expect(json.data.scores).toBeTruthy();
    expect(json.data.mbtiType).toBeUndefined();
    // Full answers (MBTI present)
    req = new Request('http://localhost/api/user/personality', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers: { q1: 3, q2: 3, q3: 3, q4: 3 } }),
    });
    res = await POST(req as any);
    json = (await res.json()) as any;
    expect(json.data.mbtiType).toBeDefined();
  });
});

