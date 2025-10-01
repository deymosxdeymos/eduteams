import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api-utils';
import { isInstitutionalEmail } from '@/lib/email';
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
    if (user.role === 'dosen') {
      if (isInstitutionalEmail(user.email)) {
        redirect('/onboarding/data-diri/dosen');
      } else {
        redirect('/onboarding/role?err=dosen_email');
      }
    } else {
      redirect(`/onboarding/data-diri/${user.role}`);
    }
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
