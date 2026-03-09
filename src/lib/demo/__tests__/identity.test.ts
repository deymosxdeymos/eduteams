import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const actualPrisma = await import('@/lib/prisma');

const prismaUserFindUniqueMock = mock(async () => null);

function applyModuleMocks() {
  mock.module('@/lib/prisma', () => ({
    default: {
      user: {
        findUnique: prismaUserFindUniqueMock,
      },
    },
  }));
}

function restoreModuleMocks() {
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
}

function createRequestCookie(value?: string | null) {
  return {
    cookies: {
      get: () => (value ? { value } : undefined),
    },
  } as any;
}

describe('demo identity helpers', () => {
  const originalDemoMode = process.env.DEMO_MODE;

  beforeEach(() => {
    prismaUserFindUniqueMock.mockReset();
    delete process.env.DEMO_MODE;
    applyModuleMocks();
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();

    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
      return;
    }

    process.env.DEMO_MODE = originalDemoMode;
  });

  it('creates isolated demo accounts per visitor and role', async () => {
    const { getDemoAccount } = await import('../auth');

    const teacherA = getDemoAccount('TEACHER', 'visitor-alpha');
    const teacherB = getDemoAccount('TEACHER', 'visitor-bravo');
    const studentA = getDemoAccount('STUDENT', 'visitor-alpha');

    expect(teacherA.email).toBe('demo.teacher.visitor-alpha@eduteams.local');
    expect(teacherB.email).toBe('demo.teacher.visitor-bravo@eduteams.local');
    expect(studentA.email).toBe('demo.student.visitor-alpha@eduteams.local');
    expect(teacherA.password).not.toBe(teacherB.password);
    expect(teacherA.password).not.toBe(studentA.password);
  });

  it('reuses a valid visitor cookie when present', async () => {
    const { resolveDemoVisitorId } = await import('../auth');

    expect(resolveDemoVisitorId(createRequestCookie('visitor-alpha'))).toEqual({
      visitorId: 'visitor-alpha',
      shouldSetCookie: false,
    });
  });

  it('creates a visitor id when the cookie is missing or invalid', async () => {
    const { resolveDemoVisitorId } = await import('../auth');

    const missingCookie = resolveDemoVisitorId(createRequestCookie(null));
    expect(missingCookie.shouldSetCookie).toBe(true);
    expect(missingCookie.visitorId.length).toBeGreaterThan(7);

    const invalidCookie = resolveDemoVisitorId(createRequestCookie('bad value'));
    expect(invalidCookie.shouldSetCookie).toBe(true);
    expect(invalidCookie.visitorId).not.toBe('bad value');
  });

  it('can recover the demo role and visitor id from an existing demo email', async () => {
    const { parseDemoRoleFromEmail, parseDemoVisitorIdFromEmail } = await import(
      '../auth'
    );

    expect(
      parseDemoRoleFromEmail('demo.student.visitor-alpha@eduteams.local')
    ).toBe('STUDENT');
    expect(
      parseDemoVisitorIdFromEmail('demo.student.visitor-alpha@eduteams.local')
    ).toBe('visitor-alpha');
    expect(
      parseDemoRoleFromEmail('demo.teacher.visitor-bravo@eduteams.local')
    ).toBe('TEACHER');
    expect(
      parseDemoVisitorIdFromEmail('demo.teacher.visitor-bravo@eduteams.local')
    ).toBe('visitor-bravo');
    expect(parseDemoRoleFromEmail('user@example.com')).toBeNull();
    expect(parseDemoVisitorIdFromEmail('user@example.com')).toBeNull();
  });

  it('only treats demo emails as active demo accounts when demo mode is enabled', async () => {
    const { isActiveDemoAccountEmail, isDemoAccountEmail } = await import(
      '../auth'
    );

    delete process.env.DEMO_MODE;
    expect(
      isDemoAccountEmail('demo.teacher.visitor-alpha@eduteams.local')
    ).toBe(true);
    expect(
      isActiveDemoAccountEmail('demo.teacher.visitor-alpha@eduteams.local')
    ).toBe(false);

    process.env.DEMO_MODE = '1';
    expect(
      isActiveDemoAccountEmail('demo.teacher.visitor-alpha@eduteams.local')
    ).toBe(true);
    expect(isActiveDemoAccountEmail('user@example.com')).toBe(false);
  });
});
