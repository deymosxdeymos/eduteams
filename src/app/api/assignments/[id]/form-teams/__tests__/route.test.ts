import { beforeEach, describe, expect, it, mock } from 'bun:test';

process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.BETTER_AUTH_SECRET = 'test-secret';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      role: 'dosen',
      isOnboarded: true,
    })),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1'
        ? {
            id: 'a1',
            courseId: 'c1',
            course: { dosenId: 'u1' },
            description: null,
          }
        : null
    ),
    update: mock(async () => ({})),
  },
  courseEnrollment: {
    findMany: mock(async (args: any) => {
      if (args?.where?.courseId !== 'c1') return [];
      return [
        {
          student: {
            id: 's1',
            gender: 'MALE',
            ei: 0,
            sn: 0,
            tf: 0,
            pj: 0,
            personSkills: [{ skillId: 'sk1', level: 0.8 }],
          },
        },
        {
          student: {
            id: 's2',
            gender: 'FEMALE',
            ei: 0,
            sn: 0,
            tf: 0,
            pj: 0,
            personSkills: [{ skillId: 'sk1', level: 0.6 }],
          },
        },
        {
          student: {
            id: 's3',
            gender: 'MALE',
            ei: 0,
            sn: 0,
            tf: 0,
            pj: 0,
            personSkills: [{ skillId: 'sk1', level: 0.7 }],
          },
        },
        {
          student: {
            id: 's4',
            gender: 'FEMALE',
            ei: 0,
            sn: 0,
            tf: 0,
            pj: 0,
            personSkills: [{ skillId: 'sk1', level: 0.5 }],
          },
        },
      ];
    }),
  },
  skill: {
    findMany: mock(async () => [{ id: 'sk1', name: 'Frontend' }]),
  },
  assignmentTopic: {
    findMany: mock(async () => []),
    createMany: mock(async () => ({})),
  },
  assignmentTopicPreference: {
    findMany: mock(async () => []),
  },
  teamFormationRequest: {
    create: mock(async () => ({ id: 'tfr1' })),
    update: mock(async () => ({ id: 'tfr1' })),
    findFirst: mock(async () => null),
    updateMany: mock(async () => ({})),
  },
};

const authMock = {
  auth: {
    api: {
      getSession: mock(async () => ({ user: { id: 'u1' } })),
    },
  },
};

// Create a mockable edu2com function at the top level
const callEdu2comBackgroundTeamFormationMock = mock(async () => undefined);

mock.module('@/lib/prisma', () => ({ default: prismaMock }));
mock.module('@/lib/auth', () => authMock);
mock.module('@/lib/edu2com/api', () => ({
  callEdu2comBackgroundTeamFormation: callEdu2comBackgroundTeamFormationMock,
}));

// Reset mocks before each test
beforeEach(() => {
  // Reset all prisma mocks to their default implementations
  prismaMock.assignment.findUnique.mockImplementation(async (args: any) =>
    args?.where?.id === 'a1'
      ? {
          id: 'a1',
          courseId: 'c1',
          course: { dosenId: 'u1' },
          description: null,
        }
      : null
  );
  prismaMock.courseEnrollment.findMany.mockImplementation(async (args: any) => {
    if (args?.where?.courseId !== 'c1') return [];
    return [
      {
        student: {
          id: 's1',
          gender: 'MALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [{ skillId: 'sk1', level: 0.8 }],
        },
      },
      {
        student: {
          id: 's2',
          gender: 'FEMALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [{ skillId: 'sk1', level: 0.6 }],
        },
      },
      {
        student: {
          id: 's3',
          gender: 'MALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [{ skillId: 'sk1', level: 0.7 }],
        },
      },
      {
        student: {
          id: 's4',
          gender: 'FEMALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [{ skillId: 'sk1', level: 0.5 }],
        },
      },
    ];
  });
  prismaMock.skill.findMany.mockImplementation(async () => [
    { id: 'sk1', name: 'Frontend' },
  ]);
  prismaMock.assignmentTopic.findMany.mockImplementation(async () => []);
  prismaMock.assignmentTopicPreference.findMany.mockImplementation(
    async () => []
  );
  prismaMock.teamFormationRequest.findFirst.mockImplementation(
    async () => null
  );
  prismaMock.teamFormationRequest.create.mockClear();
  prismaMock.teamFormationRequest.update.mockClear();

  // Reset edu2com mock to succeed by default
  callEdu2comBackgroundTeamFormationMock.mockImplementation(
    async () => undefined
  );
});

describe('POST /api/assignments/[id]/form-teams', () => {
  it('forms teams for dosen with JUMLAH_KELOMPOK method and persists', async () => {
    // edu2com mock is already set up to succeed by default in beforeEach
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.teamFormationRequest.create).toHaveBeenCalled();
    expect(prismaMock.teamFormationRequest.update).not.toHaveBeenCalled();
  });

  it('prevents concurrent requests when one is already processing', async () => {
    prismaMock.teamFormationRequest.findFirst.mockImplementation(async () => ({
      id: 'existing',
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('rejects when less than 2 students', async () => {
    prismaMock.courseEnrollment.findMany.mockImplementation(async () => [
      { student: { id: 's1', personSkills: [] } },
    ]);
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 1 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when assignment not found', async () => {
    const { POST } = await import('../route');
    const req = new Request(
      'http://localhost/api/assignments/nonexistent/form-teams',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
      }
    );
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'nonexistent' }) } as any
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Assignment not found');
  });

  it('returns 403 when user is not the owner', async () => {
    // Mock assignment with different owner
    prismaMock.assignment.findUnique.mockImplementationOnce(
      async (args: any) =>
        args?.where?.id === 'a1'
          ? {
              id: 'a1',
              courseId: 'c1',
              course: { dosenId: 'different-user' },
              description: null,
            }
          : null
    );
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Unauthorized');
  });

  it('returns 400 when no skills found in database', async () => {
    // Mock empty skills
    prismaMock.skill.findMany.mockImplementation(async () => []);
    // Mock students with no skills
    prismaMock.courseEnrollment.findMany.mockImplementation(async () => [
      {
        student: {
          id: 's1',
          gender: 'MALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [],
        },
      },
      {
        student: {
          id: 's2',
          gender: 'FEMALE',
          ei: 0,
          sn: 0,
          tf: 0,
          pj: 0,
          personSkills: [],
        },
      },
    ]);
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Tidak ada skill yang ditemukan');
  });

  it('returns 400 when JUMLAH_KELOMPOK value is too high', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 10 }), // Too many groups for 4 students
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Jumlah kelompok terlalu banyak');
  });

  it('returns 400 when JUMLAH_MHS_PER_KELOMPOK value is less than 2', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_MHS_PER_KELOMPOK', value: 1 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Minimal 2 mahasiswa per kelompok.');
  });

  it('handles JUMLAH_MHS_PER_KELOMPOK with valid configuration', async () => {
    // edu2com mock is already set up to succeed by default in beforeEach
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_MHS_PER_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('handles API call failure gracefully', async () => {
    callEdu2comBackgroundTeamFormationMock.mockImplementation(async () => {
      throw new Error('API call failed');
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Gagal mengirim permintaan pembentukan kelompok');
    // Should update the team formation request with failed status
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED',
        }),
      })
    );
  });

  it('returns 504 when Edu2com request times out', async () => {
    callEdu2comBackgroundTeamFormationMock.mockImplementation(async () => {
      const error = new Error('This operation was aborted');
      error.name = 'AbortError';
      throw error;
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(504);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('batas waktu');
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorMessage: expect.stringContaining('Timeout contacting Edu2com'),
          status: 'FAILED',
        }),
      })
    );
  });

  it('forwards Edu2com HttpError status and message', async () => {
    const { HttpError } = await import('@/lib/utils/errors');
    callEdu2comBackgroundTeamFormationMock.mockImplementation(async () => {
      throw new HttpError(422, 'Cannot form the teams with the provided data.');
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Cannot form the teams with the provided data.');
  });

  it('handles invalid request body', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
  });

  it('handles assignment topics and preferences', async () => {
    // Mock topics and preferences
    prismaMock.assignmentTopic.findMany.mockImplementation(async () => [
      { id: 't1', name: 'Topic 1' },
      { id: 't2', name: 'Topic 2' },
    ]);
    prismaMock.assignmentTopicPreference.findMany.mockImplementation(
      async () => [
        { assignmentTopicId: 't1', personId: 's1', preference: 0.8 },
        { assignmentTopicId: 't1', personId: 's2', preference: 0.6 },
        { assignmentTopicId: 't2', personId: 's3', preference: 0.9 },
      ]
    );

    // edu2com mock is already set up to succeed by default in beforeEach
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('ensures unique task IDs when topic count differs from group count', async () => {
    // Provide more topics than groups (3 topics, 2 groups)
    prismaMock.assignmentTopic.findMany.mockImplementation(async () => [
      { id: 't1', name: 'Topic 1' },
      { id: 't2', name: 'Topic 2' },
      { id: 't3', name: 'Topic 3' },
    ]);

    // Capture payload sent to external API
    let captured: any;
    callEdu2comBackgroundTeamFormationMock.mockImplementation(
      async (payload: any) => {
        captured = payload;
      }
    );

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    expect(captured).toBeTruthy();
    const ids = captured.tasks.map((t: any) => t.id);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(ids.length); // ensure uniqueness
  });

  it('handles malformed JSON in request body', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json',
    });
    const res = await POST(
      req as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(400);
  });
});
