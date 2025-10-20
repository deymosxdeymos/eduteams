import { describe, expect, it, mock } from 'bun:test';
import type { NextRequest } from 'next/server';
import type { PrismaClient } from '@/generated/prisma';
import type { DefaultRouteContext } from '@/lib/api-utils';
import type { ExtendedUser } from '@/lib/types';

const createMockUser = (): ExtendedUser =>
  ({
    id: 'u1',
    name: 'Dosen User',
    email: 'dosen@example.com',
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isOnboarded: true,
    hasSeenWelcomeSplash: true,
    role: 'dosen',
    nimNpm: null,
    onboardingStep: null,
    mbtiType: null,
    ei: null,
    sn: null,
    tf: null,
    pj: null,
    gender: null,
    onboardingData: null,
    personalityData: null,
    personalitySessions: [],
    accounts: [],
    personPreferences: [],
    preferredBy: [],
    personSkills: [],
    sessions: [],
    taskPreferences: [],
    ownedTeamRequests: [],
    teamMemberships: [],
    courses: [],
    courseEnrollments: [],
    dosenTokenUsages: [],
    createdAssignments: [],
    assignmentSubmissions: [],
    AssignmentTopicPreference: [],
  }) satisfies ExtendedUser;

type AssignmentModel = PrismaClient['assignment'];

const prismaMock = {
  user: {
    findUnique: mock(async () => createMockUser()),
  },
  assignment: {
    findUnique: mock(
      async (
        args: Parameters<AssignmentModel['findUnique']>[0]
      ): Promise<Awaited<ReturnType<AssignmentModel['findUnique']>>> =>
        args?.where?.id === 'a1'
          ? { id: 'a1', course: { select: undefined, dosenId: 'u1' } }
          : null
    ),
    update: mock(
      async (): Promise<Awaited<ReturnType<AssignmentModel['update']>>> => ({})
    ),
  },
} satisfies Pick<PrismaClient, 'user' | 'assignment'>;

mock.module('@/lib/prisma', () => ({ default: prismaMock }));

const authModule = {
  auth: {
    api: {
      getSession: async () =>
        ({
          user: createMockUser(),
        }) as const,
    },
  },
};

const baseContext: DefaultRouteContext<{ id: string }> = {
  params: Promise.resolve({ id: 'a1' }),
};

describe('POST /api/assignments/[id]/reset-teams', () => {
  it('resets teams when dosen owner', async () => {
    mock.module('@/lib/auth', () => authModule);

    const { POST } = await import('../route');
    const response = await POST(
      new Request(
        'http://localhost/api/assignments/a1/reset-teams'
      ) as unknown as NextRequest,
      baseContext
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { success: boolean };
    expect(json.success).toBe(true);
    expect(prismaMock.assignment.update).toHaveBeenCalled();
  });

  it('returns 403 for non-owner', async () => {
    prismaMock.assignment.findUnique.mockImplementationOnce(
      async (): Promise<
        Awaited<ReturnType<AssignmentModel['findUnique']>>
      > => ({
        id: 'a1',
        course: { select: undefined, dosenId: 'uX' },
      })
    );
    mock.module('@/lib/auth', () => authModule);

    const { POST } = await import('../route');
    const response = await POST(
      new Request(
        'http://localhost/api/assignments/a1/reset-teams'
      ) as unknown as NextRequest,
      baseContext
    );

    expect(response.status).toBe(403);
  });
});
