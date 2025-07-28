import { getMBTIQuestions } from '@/lib/mbti-questions';
import PersonalityTestClient from '@/components/onboarding/kepribadian/personality-test-client';

export const dynamic = 'force-dynamic';

export default async function KepribadianPage() {
  // Fetch questions from database on server
  const questions = await getMBTIQuestions();

  return <PersonalityTestClient questions={questions} />;
}
