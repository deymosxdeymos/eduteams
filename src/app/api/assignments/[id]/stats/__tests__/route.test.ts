import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 'u1', role: 'dosen', isOnboarded: true })),
  },
  assignment: {
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'a1' ? { id: 'a1', courseId: 'c1' } : null
    ),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/assignments/[id]/stats', () => {
  it('returns stats from service', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    mock.module('@/lib/stats/assignment', () => ({
      getAssignmentStats: async () => ({
        mbti: [{ kategori: 'INTJ', jumlah: 1 }],
        gender: [{ name: 'laki', value: 2 }],
        skills: [{ label: 'Frontend', value: 80 }],
        topicPreferences: [{ name: 'Topic1', value: 90 }],
        teamsFormed: false,
      }),
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/assignments/a1/stats') as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.mbti[0].kategori).toBe('INTJ');
  });

  it('zeros values when zeroIfNoTeams=1 and no teams formed', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    mock.module('@/lib/stats/assignment', () => ({
      getAssignmentStats: async () => ({
        mbti: [{ kategori: 'INTJ', jumlah: 3 }],
        gender: [{ name: 'perempuan', value: 5 }],
        skills: [{ label: 'Backend', value: 70 }],
        topicPreferences: [{ name: 'Topic2', value: 50 }],
        teamsFormed: false,
      }),
    }));
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/assignments/a1/stats?zeroIfNoTeams=1') as any,
      { params: Promise.resolve({ id: 'a1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.mbti[0].jumlah).toBe(0);
    expect(json.data.gender[0].value).toBe(0);
    expect(json.data.skills[0].value).toBe(0);
    expect(json.data.topicPreferences[0].value).toBe(0);
  });

  it('returns 404 if assignment not found', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));
    prismaMock.assignment.findUnique.mockImplementationOnce(async () => null);
    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/assignments/ax/stats') as any,
      { params: Promise.resolve({ id: 'ax' }) } as any
    );
    expect(res.status).toBe(404);
  });
});
