import { getMessages } from 'next-intl/server';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { getMBTIQuestions } from '@/lib/mbti-questions';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage() {
  const questions = await getMBTIQuestions();
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

  return <PersonalityTestClient questions={questions} dict={messages} />;
}
