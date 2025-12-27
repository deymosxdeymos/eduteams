import { NextResponse } from 'next/server';
import { createErrorResponse, getCurrentUser } from '@/lib/api-utils';
import { needsDataDiri } from '@/lib/authorization';
import {
  getUserPersonalitySessionStatus,
  type UserPersonalitySessionStatus,
} from '@/lib/personality-session';

export const GET = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    let redirectUrl: string | null = null;
    let sessionStatus: UserPersonalitySessionStatus | null = null;

    if (user.role === 'STUDENT') {
      sessionStatus = await getUserPersonalitySessionStatus(user.id);
    }

    if (!user.isOnboarded) {
      if (!user.role) {
        redirectUrl = '/onboarding/resume';
      } else if (needsDataDiri(user)) {
        // Check if user needs data-diri (mahasiswa needs NIM, dosen needs name/gender)
        const roleSlug = user.role === 'TEACHER' ? 'dosen' : 'mahasiswa';
        redirectUrl = `/onboarding/data-diri/${roleSlug}`;
      } else if (user.role === 'STUDENT') {
        if (sessionStatus && sessionStatus.status === 'completed_valid') {
          redirectUrl = '/dashboard?firstVisit=true';
        } else {
          redirectUrl = '/onboarding/kepribadian';
        }
      } else {
        redirectUrl = '/dashboard?firstVisit=true';
      }
    }

    const personality = sessionStatus
      ? {
          bankVersion: sessionStatus.bankVersion,
          locale: sessionStatus.locale,
          status: sessionStatus.status,
          sessionId: sessionStatus.sessionId ?? null,
          attentionPassed: sessionStatus.attentionPassed ?? null,
          durationMs: sessionStatus.durationMs ?? null,
          submittedAt: sessionStatus.submittedAt ?? null,
          hasActiveSession: sessionStatus.status === 'in_progress',
          canStartNew:
            sessionStatus.status === 'not_started' ||
            sessionStatus.status === 'completed_attention_failed' ||
            sessionStatus.status === 'completed_speeding',
        }
      : null;

    return NextResponse.json({
      onboardingStep: user.onboardingStep,
      isOnboarded: user.isOnboarded,
      role: user.role,
      redirectUrl,
      personality,
    });
  } catch {
    return createErrorResponse('Internal server error', 500);
  }
};
