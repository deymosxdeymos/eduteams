import { describe, expect, it, mock } from 'bun:test';

const prismaMock: any = {
  user: {
    findUnique: mock(async () => ({ id: 's1', role: 'mahasiswa', isOnboarded: false, onboardingStep: 'data-diri' })),
  },
};

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

describe('GET /api/user/onboarding-status', () => {
  it('returns redirectUrl based on onboarding step', async () => {
    mock.module('@/lib/auth', () => ({ auth: { api: { getSession: async () => ({ user: { id: 's1' } }) } } }));
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.redirectUrl).toContain('/onboarding');
  });
});

