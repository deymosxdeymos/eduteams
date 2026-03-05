import { DemoPersonalityPicker } from '@/components/onboarding/kepribadian/demo-personality-picker';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { redirect } from '@/i18n/routing';
import { ensurePersonalitySession } from '@/lib/actions/personality';
import { needsDataDiri } from '@/lib/authorization';
import { parseDemoVisitorIdFromEmail } from '@/lib/demo/auth';
import { isDemoModeEnabled } from '@/lib/demo/config';
import { protectOnboardingPage } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await protectOnboardingPage();
  const isDemoUser =
    isDemoModeEnabled() && parseDemoVisitorIdFromEmail(user.email) !== null;

  if (isDemoUser) {
    if (!user.role) {
      redirect({ href: '/onboarding/role', locale });
    }

    if (user.role === 'TEACHER') {
      redirect({
        href: needsDataDiri(user)
          ? '/onboarding/data-diri/dosen'
          : '/onboarding/resume',
        locale,
      });
    }

    if (user.role !== 'STUDENT') {
      redirect({ href: '/dashboard', locale });
    }

    if (needsDataDiri(user)) {
      redirect({ href: '/onboarding/data-diri/mahasiswa', locale });
    }

    return <DemoPersonalityPicker />;
  }

  const session = await ensurePersonalitySession(locale);
  const userRole = user.role === 'TEACHER' ? 'dosen' : 'mahasiswa';

  return <PersonalityTestClient session={session} userRole={userRole} />;
}
