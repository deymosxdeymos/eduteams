import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';
import SessionClearClient from './session-clear-client';

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const user = await getCurrentUser();

  if (!user) {
    // User has session cookie but doesn't exist in database (DB was reset)
    // Render a client component to clear the session
    return <SessionClearClient />;
  }

  console.log('Resume page - User data:', {
    isOnboarded: user.isOnboarded,
    onboardingStep: user.onboardingStep,
    role: user.role,
  });

  if (user.isOnboarded) {
    redirect('/dashboard');
  }

  // Determine where to redirect based on onboarding step
  // onboardingStep represents the LAST COMPLETED step
  if (user.onboardingStep === 'role') {
    // User completed role selection
    if (user.role === 'dosen') {
      // Dosen needs token verification next
      redirect('/onboarding/token-verifikasi');
    } else {
      // Mahasiswa goes directly to data-diri
      redirect(`/onboarding/data-diri/${user.role}`);
    }
  } else if (user.onboardingStep === 'token-verified') {
    // Dosen completed token verification, next is data-diri
    redirect('/onboarding/data-diri/dosen');
  } else if (user.onboardingStep === 'data-diri') {
    // User completed data-diri, next is kepribadian (only for mahasiswa)
    if (user.role === 'mahasiswa') {
      redirect('/onboarding/kepribadian');
    } else {
      redirect('/dashboard');
    }
  } else if (user.onboardingStep === 'kepribadian') {
    // User completed kepribadian, go to dashboard
    redirect('/dashboard');
  } else {
    // No progress yet, start with role selection
    redirect('/onboarding/role');
  }
}
