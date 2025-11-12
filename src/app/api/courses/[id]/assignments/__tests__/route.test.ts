import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: 'dosen',
      isOnboarded: true,
    })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.dosenId === 'u1' && args?.where?.id === 'c1'
        ? { id: 'c1', dosenId: 'u1' }
        : null
    ),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.courseId === 'c1' &&
      args?.where?.courseId_studentId?.studentId === 's1'
        ? { courseId: 'c1', studentId: 's1' }
        : null
    ),
  },
  assignment: {
    findMany: mock(async (args: any) => {
      const isSelectingSubmissions =
        args?.select?.submissions && args.select.submissions !== false;
      return [
        {
          id: 'a1',
          courseId: 'c1',
          title: 'Tugas 1',
          description: null,
          startAt: new Date('2025-01-01T00:00:00Z'),
          createdAt: new Date('2025-01-02T00:00:00Z'),
          status: 'BELUM_ISI',
          _count: { submissions: 2 },
          ...(isSelectingSubmissions ? { submissions: [{ id: 'sub1' }] } : {}),
        },
      ];
    }),
    create: mock(async (args: any) => ({
      id: 'a2',
      ...args.data,
      createdAt: new Date('2025-01-03T00:00:00Z'),
      status: 'BELUM_ISI',
    })),
  },
  skill: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({ count: 0 })),
  },
  courseSkill: {
    createMany: mock(async () => ({ count: 0 })),
  },
  assignmentTopic: {
    createMany: mock(async () => ({ count: 0 })),
  },
  $transaction: mock(async (callback: any) => {
    // Execute callback with prismaMock as transaction context
    return await callback(prismaMock);
  }),
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('courses/[id]/assignments API', () => {
  it('GET returns assignments for dosen owner without submittedByMe', async () => {
    // Auth: dosen u1
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1/assignments') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0].id).toBe('a1');
    expect(json.data[0].submittedByMe).toBeUndefined();
  });

  it('GET returns assignments for mahasiswa with submittedByMe', async () => {
    // Auth: mahasiswa s1
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 's1',
      role: 'mahasiswa',
      isOnboarded: true,
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1/assignments') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data[0].submittedByMe).toBe(true);
  });

  it('GET returns 404 for dosen non-owner', async () => {
    // Auth: dosen u1, wrong course id
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/wrong/assignments') as any,
      { params: Promise.resolve({ id: 'wrong' }) } as any
    );
    expect(res.status).toBe(404);
  });

  it('POST creates assignment for dosen owner with 201', async () => {
    // Auth: dosen u1
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses/c1/assignments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: 'T2',
        description: '  desc  ',
        skills: ['Frontend'],
        topics: ['Topic1', ' Topic2 '],
      }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data.skills).toEqual(['Frontend']);
    expect(json.data.topics).toEqual(['Topic1', 'Topic2']);
  });

  it('POST denies mahasiswa', async () => {
    // Auth: mahasiswa s1
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 's1',
      role: 'mahasiswa',
      isOnboarded: true,
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/courses/c1/assignments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'T', skills: [], topics: [] }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(403);
  });
});
