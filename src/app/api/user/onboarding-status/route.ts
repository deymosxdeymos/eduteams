import { NextResponse } from 'next/server';
import { createErrorResponse, getCurrentUser } from '@/lib/api-utils';

export const GET = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    let redirectUrl: string | null = null;
    if (!user.isOnboarded) {
      switch (user.onboardingStep) {
        case 'role':
          redirectUrl = user.role
            ? `/onboarding/data-diri/${user.role}`
            : '/onboarding/role';
          break;
        case 'data-diri':
          redirectUrl = user.role
            ? user.role === 'mahasiswa'
              ? '/onboarding/kepribadian'
              : '/dashboard?firstVisit=true'
            : '/onboarding/role';
          break;
        case 'kepribadian':
          redirectUrl = '/dashboard?firstVisit=true';
          break;
        default:
          redirectUrl = '/onboarding/role';
      }
    }

    return NextResponse.json({
      onboardingStep: user.onboardingStep,
      isOnboarded: user.isOnboarded,
      role: user.role,
      redirectUrl,
    });
  } catch {
    return createErrorResponse('Internal server error', 500);
  }
};
