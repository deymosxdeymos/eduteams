import { beforeEach, describe, expect, it, mock } from 'bun:test';

// Prisma mock with minimal methods used in the route
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'STUDENT',
      isOnboarded: true,
    })),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.studentId === 's1' &&
      args?.where?.courseId_studentId?.courseId === 'c1'
        ? { courseId: 'c1', studentId: 's1' }
        : null
    ),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1' && args?.where?.courseId === 'c1'
        ? {
            id: 'a1',
            courseId: 'c1',
            description: JSON.stringify({
              skills: ['Frontend'],
              topics: ['Topic1'],
            }),
            structureVersion: 1,
          }
        : null
    ),
  },
  assignmentSubmission: {
    findUnique: mock(async () => null),
  },
  skill: {
    findMany: mock(async (args: any) => {
      const names: string[] = args?.where?.name?.in || [];
      // First call returns empty (no existing skills), second call returns ids
      if (prismaMock.skill.__call === 0) {
        prismaMock.skill.__call = 1;
        return [];
      }
      return names.map((n, i) => ({ id: `skill-${i + 1}`, name: n }));
    }),
    createMany: mock(async () => ({})),
    __call: 0,
  },
  assignmentTopic: {
    findMany: mock(async (args: any) => {
      const names: string[] = args?.where?.name?.in || [];
      // First call returns empty (no existing topics), second call returns ids
      if (prismaMock.assignmentTopic.__call === 0) {
        prismaMock.assignmentTopic.__call = 1;
        return [];
      }
      return names.map((n, i) => ({ id: `topic-${i + 1}`, name: n }));
    }),
    createMany: mock(async () => ({})),
    __call: 0,
  },
  __profileUpdateCounts: [] as number[],
  __lastTx: null as any,
  $transaction: async (fn: (tx: any) => Promise<void>) => {
    const tx = {
      personSkill: {
        upsert: mock(async () => ({})),
      },
      assignmentTopicPreference: {
        upsert: mock(async () => ({})),
      },
      assignmentSubmission: {
        upsert: mock(async () => ({})),
      },
      studentCompetencyProfile: {
        upsert: mock(async () => ({})),
        updateMany: mock(async () => {
          const counts = prismaMock.__profileUpdateCounts;
          const next = counts.shift();
          const count = typeof next === 'number' ? next : 1;
          return { count };
        }),
      },
    };
    prismaMock.__lastTx = tx;
    await fn(tx);
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/courses/[id]/assignments/[assignmentId]/submit', () => {
  beforeEach(() => {
    prismaMock.skill.__call = 0;
    prismaMock.assignmentTopic.__call = 0;
    prismaMock.__profileUpdateCounts = [];
    prismaMock.__lastTx = null;
  });

  it('accepts arrays payload for mahasiswa and creates submission', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/courses/c1/assignments/a1/submit',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          skills: [{ name: 'Frontend', level: 0.9 }],
          topics: [{ name: 'Topic1', preference: 0.8 }],
        }),
      }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1', assignmentId: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    const tx = prismaMock.__lastTx;
    expect(
      tx?.studentCompetencyProfile.upsert.mock.calls.length
    ).toBeGreaterThan(0);
  });

  it('returns 409 when competency profile was updated concurrently', async () => {
    prismaMock.__profileUpdateCounts = [0];
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/courses/c1/assignments/a1/submit',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          skills: [
            {
              name: 'Frontend',
              level: 0.5,
              profileId: '550e8400-e29b-41d4-a716-446655440000',
              profileUpdatedAt: new Date().toISOString(),
            },
          ],
        }),
      }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1', assignmentId: 'a1' }) } as any
    );
    expect(res.status).toBe(409);
  });

  it('rejects duplicate submissions', async () => {
    // Mark an existing submission
    prismaMock.assignmentSubmission.findUnique.mockImplementationOnce(
      async () => ({ id: 'sub1' })
    );
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/courses/c1/assignments/a1/submit',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skills: [], topics: [] }),
      }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1', assignmentId: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
  });

  it('rejects when not enrolled', async () => {
    prismaMock.courseEnrollment.findUnique.mockImplementationOnce(
      async () => null
    );
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/courses/c1/assignments/a1/submit',
      { method: 'POST' }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1', assignmentId: 'a1' }) } as any
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 for missing assignment', async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => null);
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/courses/c1/assignments/ax/submit',
      { method: 'POST' }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1', assignmentId: 'ax' }) } as any
    );
    expect(res.status).toBe(404);
  });
});
