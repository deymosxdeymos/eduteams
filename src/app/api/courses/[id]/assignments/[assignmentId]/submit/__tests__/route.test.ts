import { describe, expect, it, mock } from 'bun:test';

// Prisma mock with minimal methods used in the route
const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'mahasiswa',
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
      // First call may be empty, second call returns ids for provided names
      if (prismaMock.skill.__call === 1) {
        return names.map((n, i) => ({ id: `skill-${i + 1}`, name: n }));
      }
      prismaMock.skill.__call = 1;
      return [];
    }),
    createMany: mock(async () => ({})),
    __call: 0,
  },
  assignmentTopic: {
    findMany: mock(async (args: any) => {
      const names: string[] = args?.where?.name?.in || [];
      if (prismaMock.assignmentTopic.__call === 1) {
        return names.map((n, i) => ({ id: `topic-${i + 1}`, name: n }));
      }
      prismaMock.assignmentTopic.__call = 1;
      return [];
    }),
    createMany: mock(async () => ({})),
    __call: 0,
  },
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
    };
    await fn(tx);
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/courses/[id]/assignments/[assignmentId]/submit', () => {
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
