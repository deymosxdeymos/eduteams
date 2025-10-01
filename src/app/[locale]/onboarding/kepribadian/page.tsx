import { getMessages } from 'next-intl/server';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { getMBTIQuestions } from '@/lib/mbti-questions';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage() {
  const questions = await getMBTIQuestions();
  const messages = (await getMessages()) as any;

  return <PersonalityTestClient questions={questions} dict={messages} />;
}
