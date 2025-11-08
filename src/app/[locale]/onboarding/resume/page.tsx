import { redirect } from 'next/navigation';
import { autoAssignRole } from '@/lib/actions/role';
import { getCurrentUser } from '@/lib/api-utils';
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
    if (!sessionStatus || sessionStatus.status !== 'completed_valid') {
      redirect('/onboarding/kepribadian');
    }

    // Mark user as onboarded before redirecting to dashboard
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnboarded: true },
    });

    redirect('/dashboard?firstVisit=true');
  }

  // Mark user as onboarded before redirecting to dashboard
  await prisma.user.update({
    where: { id: user.id },
    data: { isOnboarded: true },
  });

  redirect('/dashboard?firstVisit=true');
}
