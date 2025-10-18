import prisma from '@/lib/prisma';

export type PersonalityAxisKey = 'ei' | 'sn' | 'tf' | 'pj';

export interface PersonalityQuestionRecord {
  id: string;
  bankVersion: number;
  locale: string;
  text: string;
  dimension: PersonalityAxisKey;
  orderHint: number;
  reversed: boolean;
  isAttentionCheck: boolean;
}

export interface ActivePersonalityBank {
  bankVersion: number;
  locale: string;
  questions: PersonalityQuestionRecord[];
}

const DEFAULT_LOCALE = 'id-ID';

export async function getActivePersonalityBank(
  locale: string = DEFAULT_LOCALE
): Promise<ActivePersonalityBank | null> {
  const latest = await prisma.personalityQuestion.findFirst({
    where: { status: 'ACTIVE', locale },
    orderBy: [{ bankVersion: 'desc' }, { orderHint: 'asc' }],
    select: { bankVersion: true },
  });

  if (!latest) {
    if (locale !== DEFAULT_LOCALE) {
      return getActivePersonalityBank(DEFAULT_LOCALE);
    }
    return null;
  }

  const questions = await prisma.personalityQuestion.findMany({
    where: {
      status: 'ACTIVE',
      locale,
      bankVersion: latest.bankVersion,
    },
    orderBy: { orderHint: 'asc' },
    select: {
      id: true,
      bankVersion: true,
      locale: true,
      text: true,
      dimension: true,
      orderHint: true,
      reversed: true,
      isAttentionCheck: true,
    },
  });

  return {
    bankVersion: latest.bankVersion,
    locale,
    questions: questions.map(question => {
      const dimension = question.dimension.toLowerCase() as PersonalityAxisKey;
      return {
        id: question.id,
        bankVersion: question.bankVersion,
        locale: question.locale,
        text: question.text,
        dimension,
        orderHint: question.orderHint,
        reversed: question.reversed ?? false,
        isAttentionCheck: question.isAttentionCheck ?? false,
      } satisfies PersonalityQuestionRecord;
    }),
  };
}

export async function getMBTIQuestions(
  locale: string = DEFAULT_LOCALE
): Promise<PersonalityQuestionRecord[]> {
  const bank = await getActivePersonalityBank(locale);
  return bank?.questions.filter(q => !q.isAttentionCheck) ?? [];
}
