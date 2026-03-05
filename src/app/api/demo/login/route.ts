import { revalidateTag } from 'next/cache';
import { headers as nextHeaders } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { routing } from '@/i18n/routing';
import { getRequestLocale } from '@/lib/api-i18n';
import { auth } from '@/lib/auth';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { isSameOrigin } from '@/lib/csrf';
import {
  clearAuthSessionCookies,
  getDemoAccount,
  getDemoAuthRecoveryState,
  parseDemoVisitorIdFromEmail,
  resolveDemoVisitorId,
  setDemoVisitorCookie,
} from '@/lib/demo/auth';
import { isDemoModeEnabled } from '@/lib/demo/config';
import { getDemoStudentVisitorEmailPrefix } from '@/lib/demo/seed-students';
import { bootstrapDemoStudentAccount } from '@/lib/demo/sync-account';
import { DASHBOARD_STATISTICS_TAG } from '@/lib/dashboard/statistics';
import prisma, { type TransactionClient } from '@/lib/prisma';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

const demoLoginSchema = z.object({
  role: z.enum(['TEACHER', 'STUDENT']).optional(),
});

function getLocalizedPath(
  locale: ReturnType<typeof getRequestLocale>,
  path: string
) {
  if (locale === routing.defaultLocale) {
    return path;
  }

  return `/${locale}${path}`;
}

async function getRequestedDemoRole(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody) {
    return { success: true as const, role: 'TEACHER' as const };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return { success: false as const };
  }

  const parsedBody = demoLoginSchema.safeParse(parsedJson);
  if (!parsedBody.success) {
    return { success: false as const };
  }

  return {
    success: true as const,
    role: parsedBody.data.role ?? 'TEACHER',
  };
}

async function getPairedDemoTeacherId(
  tx: TransactionClient,
  account: ReturnType<typeof getDemoAccount>
) {
  if (account.role !== 'STUDENT') {
    return null;
  }

  const visitorId = parseDemoVisitorIdFromEmail(account.email);
  if (!visitorId) {
    return null;
  }

  const pairedTeacher = await tx.user.findUnique({
    where: { email: getDemoAccount('TEACHER', visitorId).email },
    select: { id: true },
  });

  return pairedTeacher?.id ?? null;
}

async function resetDemoUserState(
  tx: TransactionClient,
  userId: string,
  account: ReturnType<typeof getDemoAccount>
) {
  const pairedDemoTeacherId = await getPairedDemoTeacherId(tx, account);
  const submittedAssignmentIds =
    pairedDemoTeacherId
      ? Array.from(
          new Set(
            (
              await tx.assignmentSubmission.findMany({
                where: {
                  studentId: userId,
                  assignment: {
                    course: {
                      dosenId: pairedDemoTeacherId,
                    },
                  },
                },
                select: { assignmentId: true },
              })
            ).map(submission => submission.assignmentId)
          )
        )
      : [];

  if (pairedDemoTeacherId) {
    await tx.courseEnrollment.deleteMany({
      where: {
        studentId: userId,
        course: {
          dosenId: pairedDemoTeacherId,
        },
      },
    });
  }

  await tx.personalitySession.deleteMany({ where: { userId } });
  await tx.personalityProfile.deleteMany({ where: { userId } });
  await tx.personSkill.deleteMany({ where: { personId: userId } });
  await tx.studentCompetencyProfile.deleteMany({ where: { studentId: userId } });

  if (pairedDemoTeacherId) {
    await tx.assignmentSubmission.deleteMany({
      where: {
        studentId: userId,
        assignment: {
          course: {
            dosenId: pairedDemoTeacherId,
          },
        },
      },
    });
    await tx.assignmentTopicPreference.deleteMany({
      where: {
        personId: userId,
        topic: {
          assignment: {
            course: {
              dosenId: pairedDemoTeacherId,
            },
          },
        },
      },
    });
    await tx.teamMember.deleteMany({
      where: {
        userId,
        team: {
          teamFormationRequest: {
            ownerId: pairedDemoTeacherId,
          },
        },
      },
    });
  }

  const clearedTeamFormationRequests =
    pairedDemoTeacherId && submittedAssignmentIds.length > 0
      ? await tx.teamFormationRequest.deleteMany({
          where: {
            ownerId: pairedDemoTeacherId,
            assignmentId: {
              in: submittedAssignmentIds,
            },
          },
        })
      : { count: 0 };

  await tx.user.update({
    where: { id: userId },
    data: {
      name: account.name,
      role: null,
      isOnboarded: false,
      hasSeenWelcomeSplash: false,
      onboardingStep: null,
      nim: null,
      gender: null,
    },
  });

  return {
    clearedTeamFormationRequestCount: clearedTeamFormationRequests.count,
  };
}

async function resetDemoAccount(
  userId: string,
  account: ReturnType<typeof getDemoAccount>
) {
  const visitorId = parseDemoVisitorIdFromEmail(account.email);

  return prisma.$transaction(async (tx: TransactionClient) => {
    let pairedStudentId: string | null = null;
    let clearedTeamFormationRequestCount = 0;

    if (account.role === 'TEACHER') {
      await tx.course.deleteMany({ where: { dosenId: userId } });
      const deletedTeacherRequests = await tx.teamFormationRequest.deleteMany({
        where: { ownerId: userId },
      });
      clearedTeamFormationRequestCount += deletedTeacherRequests.count;

      if (visitorId) {
        await tx.user.deleteMany({
          where: {
            email: {
              startsWith: getDemoStudentVisitorEmailPrefix(visitorId),
            },
          },
        });

        const pairedStudentAccount = getDemoAccount('STUDENT', visitorId);
        const pairedStudent = await tx.user.findUnique({
          where: { email: pairedStudentAccount.email },
          select: { id: true },
        });

        if (pairedStudent) {
          pairedStudentId = pairedStudent.id;
          const pairedReset = await resetDemoUserState(
            tx,
            pairedStudent.id,
            pairedStudentAccount
          );
          clearedTeamFormationRequestCount +=
            pairedReset.clearedTeamFormationRequestCount;
        }
      }
    }

    const resetResult = await resetDemoUserState(tx, userId, account);
    clearedTeamFormationRequestCount +=
      resetResult.clearedTeamFormationRequestCount;

    return { pairedStudentId, clearedTeamFormationRequestCount };
  });
}

async function rollbackCreatedDemoAuthState(userId: string) {
  let deleteError: unknown = null;

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    deleteError = error;
  }

  await clearAuthSessionCookies();

  if (deleteError) {
    throw deleteError;
  }
}

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden origin' },
      { status: 403 }
    );
  }

  const locale = getRequestLocale(request);
  const onboardingRedirect = getLocalizedPath(locale, '/onboarding/role');
  const demoVisitor = resolveDemoVisitorId(request);

  const createResponse = (
    body: Record<string, unknown>,
    init?: ResponseInit
  ) => {
    const response = NextResponse.json(body, init);

    if (demoVisitor.shouldSetCookie) {
      setDemoVisitorCookie(response, demoVisitor.visitorId);
    }

    return response;
  };

  const clientId = getClientIdentifier(request);
  if (!clientId && process.env.NODE_ENV === 'production') {
    console.error(
      'Demo login requires a trusted client identifier in production. Configure TRUSTED_CLIENT_IP_HEADERS for self-hosted deployments and set TRUSTED_PROXY_HOPS when using multi-proxy x-forwarded-for chains.'
    );
    return createResponse(
      {
        success: false,
        error: 'Demo login is unavailable on this deployment.',
        code: 'DEMO_CLIENT_IDENTIFIER_REQUIRED',
      },
      { status: 503 }
    );
  }

  const rateLimit = await checkRateLimit({
    key: clientId
      ? `demo-login:ip:${clientId}`
      : `demo-login:visitor:${demoVisitor.visitorId}`,
    limit: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return createResponse(
      {
        success: false,
        error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      },
      { status: 429 }
    );
  }

  const requestedRole = await getRequestedDemoRole(request);
  if (!requestedRole.success) {
    return createResponse(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const account = getDemoAccount(requestedRole.role, demoVisitor.visitorId);
    const reqHeaders = await nextHeaders();
    const bootstrapStudentState = async (
      userId: string,
      options: { revalidate?: boolean } = {}
    ) => {
      if (requestedRole.role !== 'STUDENT') {
        return;
      }

      const bootstrapResult = await bootstrapDemoStudentAccount(
        userId,
        demoVisitor.visitorId,
        {
          revalidate: false,
        }
      );

      if (!options.revalidate) {
        return;
      }

      revalidateTag(CACHE_TAGS.studentClasses(userId));

      if (bootstrapResult.demoTeacherId) {
        revalidateTag(CACHE_TAGS.coursesByDosen(bootstrapResult.demoTeacherId));
      }
    };

    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true },
    });

    if (existingUser) {
      const resetResult = await resetDemoAccount(existingUser.id, account);

      if (account.role === 'TEACHER') {
        revalidateTag(CACHE_TAGS.coursesByDosen(existingUser.id));
        revalidateTag(DASHBOARD_STATISTICS_TAG);

        if (resetResult.pairedStudentId) {
          revalidateTag(CACHE_TAGS.studentClasses(resetResult.pairedStudentId));
        }
      } else if (resetResult.clearedTeamFormationRequestCount > 0) {
        revalidateTag(DASHBOARD_STATISTICS_TAG);
      }

      await bootstrapStudentState(existingUser.id, { revalidate: true });

      try {
        await auth.api.signInEmail({
          body: {
            email: account.email,
            password: account.password,
          },
          headers: reqHeaders,
        });

        return createResponse({
          success: true,
          data: { redirectTo: onboardingRedirect },
        });
      } catch (error) {
        const recoveryState = await getDemoAuthRecoveryState(account.email, error);
        if (!recoveryState) {
          throw error;
        }

        if (recoveryState.type !== 'missing-user') {
          await prisma.user.delete({ where: { id: recoveryState.userId } });
        }
      }
    }

    const signUpResponse = await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: account.password,
      },
      headers: reqHeaders,
    });

    if (!signUpResponse?.user) {
      return createResponse(
        { success: false, error: 'Failed to create demo user' },
        { status: 500 }
      );
    }

    try {
      await bootstrapStudentState(signUpResponse.user.id);
    } catch (error) {
      await rollbackCreatedDemoAuthState(signUpResponse.user.id);
      throw error;
    }

    return createResponse({
      success: true,
      data: { redirectTo: onboardingRedirect },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return createResponse(
      { success: false, error: 'Failed to create demo session' },
      { status: 500 }
    );
  }
}
