import { redirect } from 'next/navigation';
import { autoAssignRole } from '@/lib/actions/role';
import { getCurrentUser } from '@/lib/api-utils';
import { needsDataDiri } from '@/lib/authorization';
import { isInstitutionalEmail } from '@/lib/email';
import { getUserPersonalitySessionStatus } from '@/lib/personality-session';
import prisma from '@/lib/prisma';
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

  let userOnboarded = user.isOnboarded;
  const markUserOnboarded = async () => {
    if (userOnboarded) return;
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnboarded: true },
    });
    userOnboarded = true;
  };

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

  if (needsDataDiri(user)) {
    redirect(`/onboarding/data-diri/${targetRole}`);
  }

  if (targetRole === 'mahasiswa') {
    if (!sessionStatus || sessionStatus.status !== 'completed_valid') {
      redirect('/onboarding/kepribadian');
    }

    await markUserOnboarded();

    redirect('/dashboard?firstVisit=true');
  }

  // Mark user as onboarded before redirecting to dashboard
  await markUserOnboarded();

  redirect('/dashboard?firstVisit=true');
}
