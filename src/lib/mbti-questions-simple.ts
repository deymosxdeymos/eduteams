import type { PersonalityAxis } from '@/generated/prisma';
import prisma from '@/lib/prisma';

export type PersonalityAxisKey = Lowercase<PersonalityAxis>;

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

const DIMENSION_NORMALIZER: Record<PersonalityAxis, PersonalityAxisKey> = {
  EI: 'ei',
  SN: 'sn',
  TF: 'tf',
  PJ: 'pj',
  I: 'i',
  E: 'e',
  S: 's',
  N: 'n',
  F: 'f',
  T: 't',
  J: 'j',
  P: 'p',
  NJ: 'nj',
  NP: 'np',
  SJ: 'sj',
  SP: 'sp',
  EF: 'ef',
  ET: 'et',
  IF: 'if',
  IT: 'it',
};

const DEFAULT_LOCALE = 'id-ID';
const FALLBACK_LOCALES = ['id-ID'];

const NEXT_INTL_TO_PRISMA_LOCALE: Record<string, string> = {
  en: 'en-US',
  'en-us': 'en-US',
  id: 'id-ID',
  'id-id': 'id-ID',
};

function resolvePrismaLocale(locale?: string): string[] {
  const priorities: string[] = [];

  const pushUnique = (value?: string) => {
    if (!value) return;
    if (!priorities.includes(value)) {
      priorities.push(value);
    }
  };

  const normalized = locale?.toLowerCase();
  const mapped =
    (normalized && NEXT_INTL_TO_PRISMA_LOCALE[normalized]) ?? locale;

  pushUnique(mapped);
  pushUnique(DEFAULT_LOCALE);
  for (const fallback of FALLBACK_LOCALES) {
    pushUnique(fallback);
  }

  return priorities;
}

async function loadBankForLocale(
  locale: string
): Promise<ActivePersonalityBank | null> {
  const latest = await prisma.personalityQuestion.findFirst({
    where: { status: 'ACTIVE', locale },
    orderBy: [{ bankVersion: 'desc' }, { orderHint: 'asc' }],
    select: { bankVersion: true },
  });

  if (!latest) {
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
      const dimension = DIMENSION_NORMALIZER[question.dimension];
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

export async function getActivePersonalityBank(
  locale?: string
): Promise<ActivePersonalityBank | null> {
  const priorities = resolvePrismaLocale(locale);

  for (const candidate of priorities) {
    const bank = await loadBankForLocale(candidate);
    if (bank) {
      return bank;
    }
  }

  return null;
}

export async function getMBTIQuestions(
  locale?: string
): Promise<PersonalityQuestionRecord[]> {
  const bank = await getActivePersonalityBank(locale);
  return bank?.questions.filter(q => !q.isAttentionCheck) ?? [];
}
