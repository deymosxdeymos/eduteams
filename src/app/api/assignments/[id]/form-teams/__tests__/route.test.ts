import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1'
        ? { id: 'a1', courseId: 'c1', course: { dosenId: 'u1' }, description: null }
        : null
    ),
    update: mock(async () => ({})),
  },
  courseEnrollment: {
    findMany: mock(async (args: any) => {
      if (args?.where?.courseId !== 'c1') return [];
      return [
        { student: { id: 's1', gender: 'MALE', ei: 0, sn: 0, tf: 0, pj: 0, personSkills: [{ skillId: 'sk1', level: 0.8 }] } },
        { student: { id: 's2', gender: 'FEMALE', ei: 0, sn: 0, tf: 0, pj: 0, personSkills: [{ skillId: 'sk1', level: 0.6 }] } },
        { student: { id: 's3', gender: 'MALE', ei: 0, sn: 0, tf: 0, pj: 0, personSkills: [{ skillId: 'sk1', level: 0.7 }] } },
        { student: { id: 's4', gender: 'FEMALE', ei: 0, sn: 0, tf: 0, pj: 0, personSkills: [{ skillId: 'sk1', level: 0.5 }] } },
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
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('POST /api/assignments/[id]/form-teams', () => {
  it('forms teams for dosen with JUMLAH_KELOMPOK method and persists', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    mock.module('@/lib/edu2com/api', () => ({
      callEdu2comTeamFormation: async () => ({ teams: [
        { quality: 0.9, people: [{ id: 's1', skillIds: ['sk1'] }] },
        { quality: 0.8, people: [{ id: 's2', skillIds: ['sk1'] }] },
      ] }),
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 2 }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.teamFormationRequest.create).toHaveBeenCalled();
    expect(prismaMock.teamFormationRequest.update).toHaveBeenCalled();
    expect(prismaMock.assignment.update).toHaveBeenCalled();
  });

  it('rejects when less than 2 students', async () => {
    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => [{ student: { id: 's1', personSkills: [] } }]);
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/assignments/a1/form-teams', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'JUMLAH_KELOMPOK', value: 1 }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ id: 'a1' }) } as any);
    expect(res.status).toBe(400);
  });
});

