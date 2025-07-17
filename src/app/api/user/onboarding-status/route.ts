import { NextRequest } from 'next/server';
import { withAuth, createApiResponse } from '@/lib/api-utils';

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  let redirectUrl = null;
  if (!user!.isOnboarded) {
    // onboardingStep represents the LAST COMPLETED step
    switch (user!.onboardingStep) {
      case 'role':
        redirectUrl = `/onboarding/data-diri/${user!.role}`;
        break;
      case 'data-diri':
        if (!user!.role) {
          // If role is missing, redirect back to role selection
          redirectUrl = '/onboarding/role';
        } else {
          redirectUrl =
            user!.role === 'mahasiswa'
              ? '/onboarding/kepribadian'
              : '/dashboard?firstVisit=true';
        }
        break;
      case 'kepribadian':
        redirectUrl = '/dashboard?firstVisit=true';
        break;
      default:
        redirectUrl = '/onboarding/role';
    }
  }

  return createApiResponse({
    onboardingStep: user!.onboardingStep,
    isOnboarded: user!.isOnboarded,
    role: user!.role,
    redirectUrl,
  });
});
