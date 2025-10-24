import { redirect } from 'next/navigation';
import { autoAssignRole } from '@/lib/actions/role';
import { getCurrentUser } from '@/lib/api-utils';
import { isInstitutionalEmail } from '@/lib/email';
import { getUserPersonalitySessionStatus } from '@/lib/personality-session';
import SessionClearClient from './session-clear-client';

export const dynamic = 'force-dynamic';

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return <SessionClearClient />;
  }

  if (user.isOnboarded) {
    redirect('/dashboard');
  }

  const isOnboardingRole =
    !user.role || user.role === 'dosen' || user.role === 'mahasiswa';

  if (!isOnboardingRole) {
    redirect('/dashboard');
  }

  const expectedRole = isInstitutionalEmail(user.email) ? 'dosen' : 'mahasiswa';
  const shouldAutoAssign = !user.role || user.role !== expectedRole;

  if (shouldAutoAssign) {
    await autoAssignRole();
  }

  const targetRole = user.role ?? expectedRole;

  const sessionStatus =
    targetRole === 'mahasiswa'
      ? await getUserPersonalitySessionStatus(user.id, locale)
      : null;

  console.log('Resume page - User data:', {
    isOnboarded: user.isOnboarded,
    onboardingStep: user.onboardingStep,
    role: user.role,
    sessionStatus: sessionStatus?.status ?? null,
  });

  if (!user.role) {
    redirect('/onboarding/resume');
  }

  if (!user.nimNpm) {
    redirect(`/onboarding/data-diri/${targetRole}`);
  }

  if (targetRole === 'mahasiswa') {
    if (!sessionStatus) {
      redirect('/dashboard?firstVisit=true');
    }

    if (sessionStatus.status === 'completed_valid') {
      redirect('/dashboard?firstVisit=true');
    }

    redirect('/onboarding/kepribadian');
  }

  redirect('/dashboard?firstVisit=true');
}
