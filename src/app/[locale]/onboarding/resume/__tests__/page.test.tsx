import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import React from 'react';
import { createApiUtilsModule } from '@/test-utils/api-utils-module';

const actualRouting = await import('@/i18n/routing');
const actualRoleActions = await import('@/lib/actions/role');
const actualAuthorization = await import('@/lib/authorization');
const actualPersonalitySession = await import('@/lib/personality-session');
const actualPrisma = await import('@/lib/prisma');

const getCurrentUserMock = mock(async () => null);
const autoAssignRoleMock = mock(async () => undefined);
const getUserPersonalitySessionStatusMock = mock(async () => null);
const redirectMock = mock((_args: unknown) => {
  throw new Error('NEXT_REDIRECT');
});

const prismaMock = {
  user: {
    update: mock(async () => ({})),
  },
};

function applyModuleMocks() {
  mock.module('@/i18n/routing', () => ({
    ...actualRouting,
    redirect: redirectMock,
  }));

  mock.module('@/lib/actions/role', () => ({
    autoAssignRole: autoAssignRoleMock,
  }));

  mock.module('@/lib/api-utils', () =>
    createApiUtilsModule({
      getCurrentUser: getCurrentUserMock,
    })
  );

  mock.module('@/lib/authorization', () => ({
    needsDataDiri: (user: {
      role: 'TEACHER' | 'STUDENT' | null;
      name?: string | null;
      gender?: string | null;
      nim?: string | null;
    }) => {
      if (user.role === 'STUDENT') {
        return !user.nim;
      }

      if (user.role === 'TEACHER') {
        return !user.name || !user.gender;
      }

      return false;
    },
  }));

  mock.module('@/lib/personality-session', () => ({
    getUserPersonalitySessionStatus: getUserPersonalitySessionStatusMock,
  }));

  mock.module('@/lib/prisma', () => ({
    default: prismaMock,
  }));

  mock.module('../session-clear-client', () => ({
    default: () =>
      React.createElement('div', { 'data-testid': 'session-clear-client' }),
  }));
}

describe('ResumePage', () => {
  const originalDemoMode = process.env.DEMO_MODE;
  const originalDisableInstitutionalEmail =
    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;

  afterAll(() => {
    mock.restore();
    mock.module('@/i18n/routing', () => actualRouting);
    mock.module('@/lib/actions/role', () => actualRoleActions);
    mock.module('@/lib/authorization', () => actualAuthorization);
    mock.module('@/lib/personality-session', () => actualPersonalitySession);
    mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
  });

  beforeEach(() => {
    applyModuleMocks();
    getCurrentUserMock.mockReset();
    autoAssignRoleMock.mockReset();
    getUserPersonalitySessionStatusMock.mockReset();
    redirectMock.mockReset();
    prismaMock.user.update.mockReset();

    redirectMock.mockImplementation((_args: unknown) => {
      throw new Error('NEXT_REDIRECT');
    });
    prismaMock.user.update.mockResolvedValue({});
    getUserPersonalitySessionStatusMock.mockResolvedValue(null);
  });

  afterEach(() => {
    mock.restore();
    mock.module('@/lib/api-utils', () => createApiUtilsModule());

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalDisableInstitutionalEmail === undefined) {
      delete process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL;
      return;
    }

    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL =
      originalDisableInstitutionalEmail;
  });

  it('redirects non-demo users back to explicit role selection in demo mode', async () => {
    process.env.DEMO_MODE = '1';
    process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL = '1';
    getCurrentUserMock.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: null,
      name: 'User',
      gender: null,
      nim: null,
      isOnboarded: false,
    });

    const { default: ResumePage } = await import('../page');

    await expect(
      ResumePage({ params: Promise.resolve({ locale: 'id' }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(autoAssignRoleMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith({
      href: '/onboarding/role',
      locale: 'id',
    });
  });

  it('preserves explicit demo teacher roles instead of auto-assigning them as students', async () => {
    process.env.DEMO_MODE = '1';
    getCurrentUserMock.mockResolvedValue({
      id: 'demo-teacher',
      email: 'demo.teacher.visitor1234@eduteams.local',
      role: 'TEACHER',
      name: 'Dr. Rina Wijaya',
      gender: 'FEMALE',
      nim: null,
      isOnboarded: false,
    });

    const { default: ResumePage } = await import('../page');

    await expect(
      ResumePage({ params: Promise.resolve({ locale: 'id' }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(autoAssignRoleMock).not.toHaveBeenCalled();
    expect(getUserPersonalitySessionStatusMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'demo-teacher' },
      data: { isOnboarded: true },
    });
    expect(redirectMock).toHaveBeenCalledWith({
      href: '/dashboard?firstVisit=true',
      locale: 'id',
    });
  });

  it('uses the demo email role when a demo account reaches resume before the role is persisted', async () => {
    process.env.DEMO_MODE = '1';
    getCurrentUserMock.mockResolvedValue({
      id: 'demo-teacher',
      email: 'demo.teacher.visitor1234@eduteams.local',
      role: null,
      name: 'Dr. Rina Wijaya',
      gender: null,
      nim: null,
      isOnboarded: false,
    });

    const { default: ResumePage } = await import('../page');

    await expect(
      ResumePage({ params: Promise.resolve({ locale: 'id' }) })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(autoAssignRoleMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'demo-teacher' },
      data: {
        role: 'TEACHER',
        onboardingStep: 'role',
      },
    });
    expect(redirectMock).toHaveBeenCalledWith({
      href: '/onboarding/data-diri/dosen',
      locale: 'id',
    });
  });
});
