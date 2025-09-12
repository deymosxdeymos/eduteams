import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/server';
import { getMBTIQuestions } from '@/lib/mbti-questions';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage() {
  // Fetch questions from database on server
  const questions = await getMBTIQuestions();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return <PersonalityTestClient questions={questions} dict={dict} />;
}
