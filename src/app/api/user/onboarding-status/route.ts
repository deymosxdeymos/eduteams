import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/api-utils';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let redirectUrl = null;
    if (!user.isOnboarded) {
      // onboardingStep represents the LAST COMPLETED step
      switch (user.onboardingStep) {
        case 'role':
          redirectUrl = `/onboarding/data-diri/${user.role}`;
          break;
        case 'data-diri':
          if (!user.role) {
            // If role is missing, redirect back to role selection
            redirectUrl = '/onboarding/role';
          } else {
            redirectUrl =
              user.role === 'mahasiswa'
                ? '/onboarding/kepribadian'
                : '/dashboard';
          }
          break;
        case 'kepribadian':
          redirectUrl = '/dashboard';
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
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
