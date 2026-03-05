import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { ensurePersonalitySession } from '@/lib/actions/personality';
import { protectOnboardingPage } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await protectOnboardingPage();
  const session = await ensurePersonalitySession(locale);

  // Admin users shouldn't reach onboarding, but handle gracefully
  // Default to mahasiswa for null/unset roles since this is a student-only flow
  const userRole = user.role === 'TEACHER' ? 'dosen' : 'mahasiswa';

  return <PersonalityTestClient session={session} userRole={userRole} />;
}
