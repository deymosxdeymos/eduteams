import { randomInt, randomUUID } from 'node:crypto';
import type { MBTIType, Prisma } from '@/generated/prisma/client';
import {
  type ActivePersonalityBank,
  getActivePersonalityBank,
  type PersonalityQuestionRecord,
} from '@/lib/mbti-questions-simple';
import {
  type AnswerRecord,
  calculatePersonalityScoresFromQuestions,
  getMBTIType,
  type PersonalityScores,
} from '@/lib/personality';
import prisma, { type TransactionClient } from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

interface PersonalityQuestionRow {
  id: string;
  dimension: string;
  reversed: boolean;
  isAttentionCheck: boolean;
}

const ATTENTION_CHECK_EXPECTED = 4;
const SPEEDER_THRESHOLD_MS = 60_000;
const ATTENTION_INSERT_MIN = 20; // 1-indexed
const ATTENTION_INSERT_MAX = 28; // 1-indexed

export interface SessionQuestionPayload {
  id: string;
  text: string;
  dimension: PersonalityQuestionRecord['dimension'];
  reversed: boolean;
  isAttentionCheck: boolean;
}

export interface CreatePersonalitySessionResult {
  sessionId: string;
  bankVersion: number;
  questions: SessionQuestionPayload[];
}

type PersonalitySessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed_valid'
  | 'completed_attention_failed'
  | 'completed_speeding';

export interface UserPersonalitySessionStatus {
  bankVersion: number;
  locale: string;
  status: PersonalitySessionStatus;
  sessionId?: string;
  attentionPassed?: boolean;
  durationMs?: number | null;
  submittedAt?: string | null;
  presentedOrder?: string[];
}

type PersonalitySessionSubmitStatus =
  | 'completed'
  | 'attention_check_failed'
  | 'speeding'
  | 'incomplete';

interface SubmitPersonalitySessionResult {
  status: PersonalitySessionSubmitStatus;
  durationMs: number;
  attentionPassed: boolean;
  scores?: PersonalityScores;
  mbtiType?: string;
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type QuestionForScoring = Pick<
  PersonalityQuestionRecord,
  'id' | 'dimension' | 'reversed' | 'isAttentionCheck'
>;

function normalizePresentedOrder(
  presentedOrder: Prisma.JsonValue | null | undefined
): string[] {
  if (Array.isArray(presentedOrder)) {
    return presentedOrder.filter(
      (value: unknown): value is string => typeof value === 'string'
    );
  }
  return [];
}

function resolveAnswerValue(
  answers: AnswerRecord,
  questionId: string,
  orderIndex: number
): number | undefined {
  // Accept both UUID keyed answers and legacy ordinal keys ("1", "2", ...)
  if (Object.hasOwn(answers, questionId)) {
    return answers[questionId];
  }
  const ordinalKey = (orderIndex + 1).toString();
  if (Object.hasOwn(answers, ordinalKey)) {
    return answers[ordinalKey];
  }
  return undefined;
}

function classifySessionStatus(options: {
  submittedAt: Date | null;
  attentionPassed: boolean;
  durationMs: number | null;
}): PersonalitySessionStatus {
  const { submittedAt, attentionPassed, durationMs } = options;
  if (!submittedAt) {
    return 'in_progress';
  }

  if (!attentionPassed) {
    return 'completed_attention_failed';
  }

  if ((durationMs ?? 0) < SPEEDER_THRESHOLD_MS) {
    return 'completed_speeding';
  }

  return 'completed_valid';
}

function buildQuestionPayloadFromOrder(
  order: string[],
  questionMap: Map<string, PersonalityQuestionRecord>
): SessionQuestionPayload[] {
  return order.map(questionId => {
    const question = questionMap.get(questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in active bank`);
    }
    return {
      id: question.id,
      text: question.text,
      dimension: question.dimension,
      reversed: question.reversed,
      isAttentionCheck: question.isAttentionCheck,
    } satisfies SessionQuestionPayload;
  });
}

async function rebuildScoresFromResponses(
  sessionId: string
): Promise<PersonalityScores | null> {
  const responses = await prisma.personalityResponse.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
    select: {
      questionId: true,
      rawValue: true,
      question: {
        select: {
          id: true,
          dimension: true,
          reversed: true,
          isAttentionCheck: true,
        },
      },
    },
  });

  if (responses.length === 0) {
    return null;
  }

  const answers = {} as AnswerRecord;
  const orderedQuestions: QuestionForScoring[] = [];

  for (const response of responses) {
    const question = response.question;
    if (!question) {
      continue;
    }

    const dimensionValue =
      typeof question.dimension === 'string'
        ? question.dimension.toLowerCase()
        : question.dimension;
    const dimension = dimensionValue as PersonalityQuestionRecord['dimension'];

    const validDimensions = [
      'ei',
      'sn',
      'tf',
      'pj',
      'i',
      's',
      'f',
      'j',
      'nj',
      'np',
      'sj',
      'sp',
      'ef',
      'et',
      'if',
      'it',
    ];
    if (!validDimensions.includes(dimension)) {
      continue;
    }

    orderedQuestions.push({
      id: question.id,
      dimension,
      reversed: question.reversed ?? false,
      isAttentionCheck: question.isAttentionCheck ?? false,
    });
    (answers as Record<string, number>)[question.id] = response.rawValue;
  }

  if (orderedQuestions.length === 0) {
    return null;
  }

  return calculatePersonalityScoresFromQuestions(answers, orderedQuestions);
}

async function getUserPersonalitySessionStatusForBank(
  userId: string,
  bank: ActivePersonalityBank
): Promise<UserPersonalitySessionStatus> {
  const pending = await prisma.personalitySession.findFirst({
    where: {
      userId,
      bankVersion: bank.bankVersion,
      submittedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      presentedOrder: true,
    },
  });

  if (pending) {
    return {
      bankVersion: bank.bankVersion,
      locale: bank.locale,
      status: 'in_progress',
      sessionId: pending.id,
      presentedOrder: normalizePresentedOrder(pending.presentedOrder),
    } satisfies UserPersonalitySessionStatus;
  }

  const latest = await prisma.personalitySession.findFirst({
    where: {
      userId,
      bankVersion: bank.bankVersion,
      submittedAt: { not: null },
    },
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      submittedAt: true,
      attentionPassed: true,
      durationMs: true,
    },
  });

  if (!latest) {
    return {
      bankVersion: bank.bankVersion,
      locale: bank.locale,
      status: 'not_started',
    } satisfies UserPersonalitySessionStatus;
  }

  const sessionStatus = classifySessionStatus({
    submittedAt: latest.submittedAt,
    attentionPassed: latest.attentionPassed,
    durationMs: latest.durationMs ?? 0,
  });

  return {
    bankVersion: bank.bankVersion,
    locale: bank.locale,
    status: sessionStatus,
    sessionId: latest.id,
    attentionPassed: latest.attentionPassed,
    durationMs: latest.durationMs ?? null,
    submittedAt: latest.submittedAt?.toISOString() ?? null,
  } satisfies UserPersonalitySessionStatus;
}

export async function getUserPersonalitySessionStatus(
  userId: string,
  locale?: string
): Promise<UserPersonalitySessionStatus | null> {
  const bank = await getActivePersonalityBank(locale);
  if (!bank) return null;
  return getUserPersonalitySessionStatusForBank(userId, bank);
}

export async function createPersonalitySessionForUser(
  user: Pick<ExtendedUser, 'id'>,
  locale?: string
): Promise<CreatePersonalitySessionResult | null> {
  const bank = await getActivePersonalityBank(locale);
  if (!bank) return null;

  const questionMap = new Map(bank.questions.map(q => [q.id, q] as const));

  const status = await getUserPersonalitySessionStatusForBank(user.id, bank);

  if (status.status === 'in_progress') {
    const order = status.presentedOrder ?? [];
    if (order.length === 0 || !status.sessionId) {
      throw new Error(
        `Active session for user ${user.id} is missing presented order data`
      );
    }

    return {
      sessionId: status.sessionId,
      bankVersion: bank.bankVersion,
      questions: buildQuestionPayloadFromOrder(order, questionMap),
    } satisfies CreatePersonalitySessionResult;
  }

  if (status.status === 'completed_valid') {
    return null;
  }

  const scored = bank.questions.filter(q => !q.isAttentionCheck);
  const attentionChecks = bank.questions.filter(q => q.isAttentionCheck);
  if (attentionChecks.length !== 1) {
    throw new Error(
      `Bank v${bank.bankVersion} must contain exactly one attention check`
    );
  }

  const attentionCheck = attentionChecks[0];
  const ordered = [...scored];
  shuffleInPlace(ordered);

  const minIndex = clamp(
    ATTENTION_INSERT_MIN - 1,
    0,
    Math.max(ordered.length, 0)
  );
  const maxIndex = clamp(
    ATTENTION_INSERT_MAX - 1,
    minIndex,
    Math.max(ordered.length, 0)
  );
  const insertIndex =
    ordered.length === 0 ? 0 : randomInt(minIndex, maxIndex + 1); // randomInt upper bound exclusive
  ordered.splice(insertIndex, 0, attentionCheck);

  const presentedOrder = ordered.map(q => q.id);

  const session = await prisma.personalitySession.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      bankVersion: bank.bankVersion,
      presentedOrder: presentedOrder as unknown as Prisma.JsonArray,
    },
    select: { id: true },
  });

  return {
    sessionId: session.id,
    bankVersion: bank.bankVersion,
    questions: buildQuestionPayloadFromOrder(presentedOrder, questionMap),
  } satisfies CreatePersonalitySessionResult;
}

export async function submitPersonalitySession(options: {
  sessionId: string;
  userId: string;
  answers: AnswerRecord;
}): Promise<SubmitPersonalitySessionResult> {
  const { sessionId, userId, answers } = options;

  const session = await prisma.personalitySession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      bankVersion: true,
      presentedOrder: true,
      startedAt: true,
      submittedAt: true,
      attentionPassed: true,
      durationMs: true,
      score: {
        select: {
          ei: true,
          sn: true,
          tf: true,
          pj: true,
        },
      },
    },
  });

  if (!session || session.userId !== userId) {
    throw new Error('Session not found or does not belong to user');
  }

  if (session.submittedAt) {
    const persistedDurationMs = session.durationMs ?? 0;
    const status: PersonalitySessionSubmitStatus = !session.attentionPassed
      ? 'attention_check_failed'
      : persistedDurationMs < SPEEDER_THRESHOLD_MS
        ? 'speeding'
        : 'completed';

    if (status === 'completed') {
      let scores: PersonalityScores | null = null;
      if (session.score) {
        scores = {
          ei: session.score.ei,
          sn: session.score.sn,
          tf: session.score.tf,
          pj: session.score.pj,
        };
      } else {
        scores = await rebuildScoresFromResponses(sessionId);
      }

      const mbtiType = scores ? getMBTIType(scores) : undefined;

      return {
        status,
        durationMs: persistedDurationMs,
        attentionPassed: true,
        ...(scores ? { scores } : {}),
        ...(mbtiType ? { mbtiType } : {}),
      };
    }

    return {
      status,
      durationMs: persistedDurationMs,
      attentionPassed: session.attentionPassed,
    };
  }

  const presentedOrder = Array.isArray(session.presentedOrder)
    ? (session.presentedOrder as string[])
    : [];
  if (presentedOrder.length === 0) {
    throw new Error('Session missing presented order metadata');
  }

  const questions = await prisma.personalityQuestion.findMany({
    where: { id: { in: presentedOrder } },
    select: {
      id: true,
      dimension: true,
      reversed: true,
      isAttentionCheck: true,
    },
  });

  const questionMap = new Map<string, PersonalityQuestionRow>(
    questions.map((q: PersonalityQuestionRow) => [q.id, q] as const)
  );

  const orderedQuestions: QuestionForScoring[] = presentedOrder.map(id => {
    const q = questionMap.get(id);
    if (!q) {
      throw new Error(`Question ${id} not found for session`);
    }
    const dimensionValue =
      typeof q.dimension === 'string' ? q.dimension.toLowerCase() : q.dimension;
    const dimension = dimensionValue as PersonalityQuestionRecord['dimension'];
    const validDimensions = [
      'ei',
      'sn',
      'tf',
      'pj',
      'i',
      's',
      'f',
      'j',
      'nj',
      'np',
      'sj',
      'sp',
      'ef',
      'et',
      'if',
      'it',
    ];
    if (!validDimensions.includes(dimension)) {
      throw new Error(`Invalid dimension ${q.dimension} for question ${id}`);
    }
    return {
      id: q.id,
      dimension,
      reversed: q.reversed ?? false,
      isAttentionCheck: q.isAttentionCheck ?? false,
    };
  });

  const missing = orderedQuestions.filter((question, index) => {
    return resolveAnswerValue(answers, question.id, index) === undefined;
  });
  if (missing.length > 0) {
    return {
      status: 'incomplete',
      attentionPassed: false,
      durationMs: 0,
    };
  }

  const submittedAt = new Date();
  const durationMs = Math.max(
    0,
    submittedAt.getTime() - new Date(session.startedAt).getTime()
  );

  let attentionPassed = false;
  const answersSnapshot: Record<string, number> = {};
  for (const [key, value] of Object.entries(
    answers as Record<string, number>
  )) {
    if (typeof value === 'number') {
      answersSnapshot[key] = value;
    }
  }

  const responsePayload = orderedQuestions.map((question, index) => {
    const rawValue = resolveAnswerValue(answers, question.id, index);
    if (rawValue === undefined) {
      throw new Error(`Answer missing for question ${question.id}`);
    }
    answersSnapshot[question.id] = rawValue;
    answersSnapshot[String(index + 1)] = rawValue;
    const scoredValue = question.reversed ? 6 - rawValue : rawValue;
    if (question.isAttentionCheck) {
      attentionPassed = rawValue === ATTENTION_CHECK_EXPECTED;
    }
    return {
      id: randomUUID(),
      sessionId,
      questionId: question.id,
      rawValue,
      scoredValue,
      position: index + 1,
    };
  });

  const scores = calculatePersonalityScoresFromQuestions(
    answersSnapshot,
    orderedQuestions
  );
  const mbtiType = getMBTIType(scores);

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.personalityResponse.deleteMany({ where: { sessionId } });
    await tx.personalityResponse.createMany({
      data: responsePayload,
    });

    await tx.personalitySession.update({
      where: { id: sessionId },
      data: {
        submittedAt,
        durationMs,
        attentionPassed,
        updatedAt: submittedAt,
      },
    });

    await tx.personalityScore.upsert({
      where: { sessionId },
      create: {
        sessionId,
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
      },
      update: {
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
        updatedAt: submittedAt,
      },
    });

    // Update user snapshot if this is the latest valid session
    if (attentionPassed && durationMs >= SPEEDER_THRESHOLD_MS) {
      const latestValid = await tx.personalitySession.findFirst({
        where: {
          userId,
          attentionPassed: true,
          submittedAt: { not: null },
        },
        orderBy: { submittedAt: 'desc' },
        select: { id: true },
      });

      if (latestValid?.id === sessionId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ei: scores.ei,
            sn: scores.sn,
            tf: scores.tf,
            pj: scores.pj,
            mbtiType: mbtiType as MBTIType,
            isOnboarded: true,
            onboardingStep: null,
            personalityData: {
              answers: answersSnapshot,
              scores: {
                ei: scores.ei,
                sn: scores.sn,
                tf: scores.tf,
                pj: scores.pj,
                mbtiType,
              },
              metadata: {
                sessionId,
                bankVersion: session.bankVersion,
                submittedAt: submittedAt.toISOString(),
                durationMs,
                attentionPassed,
              },
            } as Prisma.InputJsonValue,
          },
        });
      }
    }

    return true;
  });

  if (!result) {
    throw new Error('Failed to persist personality session data');
  }

  if (!attentionPassed) {
    return {
      status: 'attention_check_failed',
      attentionPassed: false,
      durationMs,
    };
  }

  if (durationMs < SPEEDER_THRESHOLD_MS) {
    return {
      status: 'speeding',
      attentionPassed: true,
      durationMs,
    };
  }

  return {
    status: 'completed',
    attentionPassed: true,
    durationMs,
    scores,
    mbtiType,
  };
}
