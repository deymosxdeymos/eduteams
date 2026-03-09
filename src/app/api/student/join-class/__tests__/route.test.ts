import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const originalDemoMode = process.env.DEMO_MODE;

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({
      id: 's1',
      role: 'STUDENT',
      isOnboarded: true,
      name: 'Student',
      email: 'student@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: '20250001',
      gender: 'MALE',
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    })),
  },
  course: {
    findUnique: mock(async (args: any) =>
      args?.where?.shareToken === 'token123'
        ? {
            id: 'c1',
            namaMataKuliah: 'Algoritma',
            kelas: 'RA',
            tahunAwalPeriode: 2025,
            tahunAkhirPeriode: 2025,
            dosenId: 'u1',
            dosen: { name: 'Dosen', email: 'teacher@if.itera.ac.id' },
          }
        : null
    ),
    update: mock(async () => ({})),
  },
  courseEnrollment: {
    findUnique: mock(async () => null),
    create: mock(async () => ({})),
  },
};

function applyModuleMocks() {
  mock.module('next/cache', () => ({ revalidateTag: () => {} }));
  mock.module('@/lib/csrf', () => ({ isSameOrigin: () => true }));
  mock.module('@/lib/prisma', () => ({ default: prismaMock }));
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  prismaMock.user.findUnique.mockReset();
  prismaMock.courseEnrollment.create.mockReset();
  prismaMock.courseEnrollment.findUnique.mockReset();
  prismaMock.course.findUnique.mockReset();
  prismaMock.user.findUnique.mockResolvedValue({
    id: 's1',
    role: 'STUDENT',
    isOnboarded: true,
    name: 'Student',
    email: 'student@example.com',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    nim: '20250001',
    gender: 'MALE',
    hasSeenWelcomeSplash: true,
    onboardingStep: null,
    onboardingData: null,
    personalityProfile: null,
  });
  prismaMock.courseEnrollment.findUnique.mockResolvedValue(null);
    prismaMock.course.findUnique.mockImplementation(async (args: any) =>
      args?.where?.shareToken === 'token123'
        ? {
            id: 'c1',
            namaMataKuliah: 'Algoritma',
            kelas: 'RA',
            tahunAwalPeriode: 2025,
            tahunAkhirPeriode: 2025,
            dosenId: 'u1',
            dosen: { name: 'Dosen', email: 'teacher@if.itera.ac.id' },
          }
        : null
  );
  applyModuleMocks();
});

afterEach(() => {
  mock.restore();

  if (originalAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  }

  if (originalDemoMode === undefined) {
    delete process.env.DEMO_MODE;
    return;
  }

  process.env.DEMO_MODE = originalDemoMode;
});

describe('POST /api/student/join-class', () => {
  it('joins class with valid token', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'token123' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(prismaMock.courseEnrollment.create).toHaveBeenCalled();
  });

  it('rejects invalid token', async () => {
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'bad' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(404);
  });

  it('rejects demo students from joining shared classes', async () => {
    process.env.DEMO_MODE = '1';
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 's1',
      role: 'STUDENT',
      isOnboarded: true,
      name: 'Demo Student',
      email: 'demo.student.visitor1234@eduteams.local',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      nim: '20260001',
      gender: 'MALE',
      hasSeenWelcomeSplash: true,
      onboardingStep: null,
      onboardingData: null,
      personalityProfile: null,
    });
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'token123' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
    expect(prismaMock.courseEnrollment.create).not.toHaveBeenCalled();
  });

  it('rejects real students from joining demo-owned classes', async () => {
    process.env.DEMO_MODE = '1';
    prismaMock.course.findUnique.mockResolvedValueOnce({
      id: 'c1',
      namaMataKuliah: 'Algoritma',
      kelas: 'RA',
      tahunAwalPeriode: 2025,
      tahunAkhirPeriode: 2025,
      dosenId: 'u1',
      dosen: {
        name: 'Demo Teacher',
        email: 'demo.teacher.visitor1234@eduteams.local',
      },
    });
    mock.module('@/lib/auth', () => ({
      auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/student/join-class', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000',
        'x-forwarded-host': 'localhost',
      },
      body: JSON.stringify({ token: 'token123' }),
    });
    const res = await POST(req as any, undefined as any);
    expect(res.status).toBe(403);
    expect(prismaMock.courseEnrollment.create).not.toHaveBeenCalled();
  });
});
