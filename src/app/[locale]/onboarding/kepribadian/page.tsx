import { getMessages } from 'next-intl/server';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { ensurePersonalitySession } from '@/lib/actions/personality';
import { protectOnboardingPage } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const user = await protectOnboardingPage();
  const session = await ensurePersonalitySession(locale);
  const messages = (await getMessages()) as {
    onboarding: {
      kepribadian: {
        title: string;
        description: string;
        pageOf: string;
        sending: string;
        selesai: string;
        lanjut: string;
        instructions: {
          title: string;
          step1: string;
          step2: string;
          step3: string;
          step4: string;
          likertScale: {
            stronglyDisagree: string;
            disagree: string;
            neutral: string;
            agree: string;
            stronglyAgree: string;
          };
          startNow: string;
        };
        alerts: {
          submitFailed: string;
        };
        errors: {
          questionRequired: string;
        };
      };
    };
  };

  // Admin users shouldn't reach onboarding, but handle gracefully
  const userRole =
    user.role === 'admin' ? 'mahasiswa' : user.role || 'mahasiswa';

  return (
    <PersonalityTestClient
      session={session}
      userRole={userRole}
      dict={messages}
    />
  );
}
