import { redirect } from '@/i18n/routing';
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
    redirect({ href: '/dashboard?firstVisit=true', locale });
  }

  const isOnboardingRole =
    !user.role || user.role === 'dosen' || user.role === 'mahasiswa';

  if (!isOnboardingRole) {
    redirect({ href: '/dashboard?firstVisit=true', locale });
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

  if (!user.role) {
    redirect({ href: '/onboarding/resume', locale });
  }

  if (needsDataDiri(user)) {
    redirect({ href: `/onboarding/data-diri/${targetRole}`, locale });
  }

  if (targetRole === 'mahasiswa') {
    if (!sessionStatus || sessionStatus.status !== 'completed_valid') {
      redirect({ href: '/onboarding/kepribadian', locale });
    }

    await markUserOnboarded();

    redirect({ href: '/dashboard?firstVisit=true', locale });
  }

  // Mark user as onboarded before redirecting to dashboard
  await markUserOnboarded();

  redirect({ href: '/dashboard?firstVisit=true', locale });
}
