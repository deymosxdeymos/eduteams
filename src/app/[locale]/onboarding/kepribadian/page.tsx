import { getMessages } from 'next-intl/server';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { ensurePersonalitySession } from '@/lib/actions/personality';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
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
      };
    };
  };

  return <PersonalityTestClient session={session} dict={messages} />;
}
