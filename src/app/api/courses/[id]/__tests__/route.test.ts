import { beforeEach, describe, expect, it, mock } from 'bun:test';

const baseCourse = {
  id: 'c1',
  namaMataKuliah: 'Algoritma',
  kelas: 'RA',
  tahunAwalPeriode: 2025,
  tahunAkhirPeriode: 2025,
  periode: 'ganjil',
  dosenId: 'u1',
  shareToken: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z'),
  dosen: { id: 'u1', name: 'Dosen', email: 'dosen@example.com' },
};

const prismaMock: any = {
  $transaction: mock(async (callback: (tx: any) => Promise<unknown>) =>
    callback(prismaMock)
  ),
  user: {
    findUnique: mock(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    })),
    deleteMany: mock(async () => ({ count: 0 })),
  },
  course: {
    findFirst: mock(async (args: any) =>
      args?.where?.dosenId === 'u1' ? { ...baseCourse } : null
    ),
    findUnique: mock(async (args: any) =>
      args?.where?.id === 'c1' ? { ...baseCourse } : null
    ),
    update: mock(async ({ data }: any) => ({
      ...baseCourse,
      ...data,
      updatedAt: new Date('2025-01-03T00:00:00Z'),
      dosen: baseCourse.dosen,
    })),
    delete: mock(async () => ({ ...baseCourse })),
  },
  courseEnrollment: {
    findUnique: mock(async (args: any) =>
      args?.where?.courseId_studentId?.studentId === 's1'
        ? {
            course: {
              id: 'c1',
              namaMataKuliah: 'Algoritma',
              kelas: 'RA',
              tahunAwalPeriode: 2025,
              tahunAkhirPeriode: 2025,
              periode: 'ganjil',
              dosenId: 'u2',
              shareToken: null,
              createdAt: new Date('2025-01-01T00:00:00Z'),
              updatedAt: new Date('2025-01-02T00:00:00Z'),
              dosen: {
                id: 'u2',
                name: 'Other Dosen',
                email: 'other@example.com',
              },
            },
          }
        : null
    ),
    findMany: mock(async () => []),
  },
};

const revalidateTagMock = mock(() => {});
const unstableCacheMock = mock(
  (fn: (...args: any[]) => Promise<unknown> | unknown) =>
    (...args: any[]) =>
      fn(...args)
);

mock.module('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  unstable_cache: unstableCacheMock,
}));
mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/courses/[id]', () => {
  it('dosen can get their own course', async () => {
    // Auth session: dosen u1
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe('c1');
    expect(json.data.dosen.id).toBe('u1');
  });

  it('mahasiswa can get enrolled course', async () => {
    // Auth session: mahasiswa s1
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 's1',
      email: 'student@example.com',
      role: 'STUDENT',
      isOnboarded: true,
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/c1') as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe('c1');
    expect(json.data.dosen.id).toBe('u2');
  });

  it('returns 403 if role lacks access', async () => {
    // Auth session: admin (not dosen/mahasiswa-onboarded path)
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'a1',
      email: 'admin@example.com',
      role: 'ADMIN',
      isOnboarded: true,
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'a1' } }) } },
    }));

    const { GET } = await import('../route');
    const res = await GET(
      new Request('http://localhost/api/courses/cX') as any,
      { params: Promise.resolve({ id: 'cX' }) } as any
    );
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/courses/[id]', () => {
  beforeEach(() => {
    revalidateTagMock.mockClear();
    prismaMock.$transaction.mockClear();
    prismaMock.course.delete.mockClear();
    prismaMock.courseEnrollment.findMany.mockClear();
    prismaMock.user.deleteMany.mockClear();
  });

  it('dosen can delete their own course and revalidate caches', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    prismaMock.courseEnrollment.findMany.mockImplementationOnce(async () => [
      { studentId: 's1' },
      { studentId: 's2' },
      { studentId: 's1' },
    ]);
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { DELETE } = await import('../route');
    const res = await DELETE(
      new Request('http://localhost/api/courses/c1', {
        method: 'DELETE',
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.course.delete).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidateTagMock.mock.calls.map(call => call[0])).toEqual([
      'courses-u1',
      'student-classes-s1',
      'student-classes-s2',
    ]);
  });

  it('removes seeded demo students when a demo teacher deletes a course', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'demo-teacher',
      email: 'demo.teacher.visitor1234@eduteams.local',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    prismaMock.course.findUnique.mockImplementationOnce(async () => ({
      id: 'c1',
      dosenId: 'demo-teacher',
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'demo-teacher' } }) } },
    }));

    const { getDemoStudentCourseEmailPrefix } = await import(
      '@/lib/demo/seed-students'
    );
    const { DELETE } = await import('../route');
    const res = await DELETE(
      new Request('http://localhost/api/courses/c1', {
        method: 'DELETE',
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
      where: {
        email: {
          startsWith: getDemoStudentCourseEmailPrefix('visitor1234', 'c1'),
        },
      },
    });
    expect(prismaMock.course.delete).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
  });

  it('returns 403 when deleting course not owned by dosen', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    prismaMock.course.findUnique.mockImplementationOnce(async () => ({
      ...baseCourse,
      dosenId: 'u2',
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { DELETE } = await import('../route');
    const res = await DELETE(
      new Request('http://localhost/api/courses/c1', {
        method: 'DELETE',
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(403);
    expect(prismaMock.course.delete).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 404 when course is not found', async () => {
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    prismaMock.course.findUnique.mockImplementationOnce(async () => null);
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { DELETE } = await import('../route');
    const res = await DELETE(
      new Request('http://localhost/api/courses/c1', {
        method: 'DELETE',
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(404);
    expect(prismaMock.course.delete).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/courses/[id]', () => {
  it('dosen can update their own course', async () => {
    revalidateTagMock.mockReset();
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    // Mock findUnique for the ownership check
    prismaMock.course.findUnique.mockImplementationOnce(async () => ({
      ...baseCourse,
    }));
    // Mock findFirst for the duplicate check - should return null (no duplicate)
    prismaMock.course.findFirst.mockImplementationOnce(async () => null);
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { PATCH } = await import('../route');
    const body = {
      namaMataKuliah: 'Algoritma Lanjut',
      kelas: 'RB',
      periode: 'genap',
    };
    const res = await PATCH(
      new Request('http://localhost/api/courses/c1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.namaMataKuliah).toBe('Algoritma Lanjut');
    expect(json.data.kelas).toBe('RB');
    expect(json.data.periode).toBe('genap');
    expect(revalidateTagMock).toHaveBeenCalled();
  });

  it('returns 403 when updating course not owned by dosen', async () => {
    revalidateTagMock.mockReset();
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    prismaMock.course.findUnique.mockImplementationOnce(async () => ({
      ...baseCourse,
      dosenId: 'u2',
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { PATCH } = await import('../route');
    const res = await PATCH(
      new Request('http://localhost/api/courses/c1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namaMataKuliah: 'Algoritma' }),
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid payload', async () => {
    revalidateTagMock.mockReset();
    prismaMock.user.findUnique.mockImplementationOnce(async () => ({
      id: 'u1',
      email: 'dosen@example.com',
      role: 'TEACHER',
      isOnboarded: true,
    }));
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    }));

    const { PATCH } = await import('../route');
    const res = await PATCH(
      new Request('http://localhost/api/courses/c1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Send invalid data - empty kelas string should fail validation
        body: JSON.stringify({ kelas: '' }),
      }) as any,
      { params: Promise.resolve({ id: 'c1' }) } as any
    );

    expect(res.status).toBe(400);
  });
});
