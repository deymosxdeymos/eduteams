import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { PersonalityAxis } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

type PersonalityAxisKey = PersonalityAxis;

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
  ei: "ei",
  sn: "sn",
  tf: "tf",
  pj: "pj",
  i: "i",
  e: "e",
  s: "s",
  n: "n",
  f: "f",
  t: "t",
  j: "j",
  p: "p",
  nj: "nj",
  np: "np",
  sj: "sj",
  sp: "sp",
  ef: "ef",
  et: "et",
  if: "if",
  it: "it",
};

const DEFAULT_LOCALE = "id-ID";
const FALLBACK_LOCALES = ["id-ID"];

const NEXT_INTL_TO_PRISMA_LOCALE: Record<string, string> = {
  en: "en-US",
  "en-us": "en-US",
  id: "id-ID",
  "id-id": "id-ID",
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
  const mapped = (normalized && NEXT_INTL_TO_PRISMA_LOCALE[normalized]) ?? locale;

  pushUnique(mapped);
  pushUnique(DEFAULT_LOCALE);
  for (const fallback of FALLBACK_LOCALES) {
    pushUnique(fallback);
  }

  return priorities;
}

async function loadBankForLocaleUncached(locale: string): Promise<ActivePersonalityBank | null> {
  const latest = await prisma.personalityQuestion.findFirst({
    where: { status: "ACTIVE", locale },
    orderBy: [{ bankVersion: "desc" }, { orderHint: "asc" }],
    select: { bankVersion: true },
  });

  if (!latest) {
    return null;
  }

  const questions = await prisma.personalityQuestion.findMany({
    where: {
      status: "ACTIVE",
      locale,
      bankVersion: latest.bankVersion,
    },
    orderBy: { orderHint: "asc" },
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
    questions: questions.map(
      (question: {
        id: string;
        bankVersion: number;
        locale: string;
        text: string;
        dimension: PersonalityAxis;
        orderHint: number;
        reversed: boolean | null;
        isAttentionCheck: boolean | null;
      }) => {
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
      },
    ),
  };
}

const loadBankForLocale = unstable_cache(
  async (locale: string) => loadBankForLocaleUncached(locale),
  ["mbti-active-personality-bank"],
  {
    revalidate: 60 * 60,
  },
);

const getActivePersonalityBankCached = cache(
  async (locale?: string): Promise<ActivePersonalityBank | null> => {
    const priorities = resolvePrismaLocale(locale);

    for (const candidate of priorities) {
      const bank = await loadBankForLocale(candidate);
      if (bank) {
        return bank;
      }
    }

    return null;
  },
);

export async function getActivePersonalityBank(
  locale?: string,
): Promise<ActivePersonalityBank | null> {
  return getActivePersonalityBankCached(locale);
}

const getMBTIQuestionsCached = cache(
  async (locale?: string): Promise<PersonalityQuestionRecord[]> => {
    const bank = await getActivePersonalityBank(locale);
    return bank?.questions.filter((q) => !q.isAttentionCheck) ?? [];
  },
);

export async function getMBTIQuestions(locale?: string): Promise<PersonalityQuestionRecord[]> {
  return getMBTIQuestionsCached(locale);
}
