import { getCurrentUser } from '@/lib/api-utils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ResumePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  // This should never be reached if redirect works properly
  if (!user) {
    return null;
  }

  console.log('Resume page - User data:', {
    isOnboarded: user.isOnboarded,
    onboardingStep: user.onboardingStep,
    role: user.role,
  });

  if (user.isOnboarded) {
    redirect('/dashboard');
    return;
  }
  // Determine where to redirect based on onboarding step
  // onboardingStep represents the LAST COMPLETED step
  switch (user.onboardingStep) {
    case 'role':
      // User completed role selection
      if (user.role === 'dosen') {
        // Dosen needs token verification next
        redirect('/onboarding/token-verifikasi');
        return;
      } else {
        // Mahasiswa goes directly to data-diri
        redirect(`/onboarding/data-diri/${user.role}`);
        return;
      }
    case 'token-verified':
      // Dosen completed token verification, next is data-diri
      redirect('/onboarding/data-diri/dosen');
      return;
    case 'data-diri':
      // User completed data-diri, next is kepribadian (only for mahasiswa)
      if (user.role === 'mahasiswa') {
        redirect('/onboarding/kepribadian');
        return;
      } else {
        redirect('/dashboard');
        return;
      }
    case 'kepribadian':
      // User completed kepribadian, go to dashboard
      redirect('/dashboard');
      return;
    default:
      // No progress yet, start with role selection
      redirect('/onboarding/role');
      return;
  }
}
