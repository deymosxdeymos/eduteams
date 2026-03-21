import type { NextRequest } from "next/server";
import { z } from "zod";
import type { MBTIType, Prisma as PrismaNS } from "@/generated/prisma/client";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { type ActivePersonalityBank, getActivePersonalityBank } from "@/lib/mbti-questions-simple";
import { calculatePersonalityScores, getMBTIType } from "@/lib/personality";
import prisma, { type TransactionClient } from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";
// Prisma requires Node.js runtime
export const runtime = "nodejs";

type PersonalityProfileUpdate = {
  ei: number;
  sn: number;
  tf: number;
  pj: number;
  mbtiType: MBTIType;
  personalityData: PrismaNS.InputJsonValue;
};

const completeOnboardingSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)).optional(),
});

function hasNonNumericAnswerKeys(answers: Record<string, number>): boolean {
  return Object.keys(answers).some((key) => !/^\d+$/.test(key));
}

async function resolveBankForAnswers(
  answers: Record<string, number>,
): Promise<ActivePersonalityBank | null> {
  if (Object.keys(answers).length === 0) {
    return getActivePersonalityBank();
  }

  const needsIdMatch = hasNonNumericAnswerKeys(answers);
  const localesToTry: Array<string | undefined> = [undefined];
  if (needsIdMatch) {
    localesToTry.push("en-US");
  }
  if (!localesToTry.includes("id-ID")) {
    localesToTry.push("id-ID");
  }

  const seen = new Set<string | undefined>();
  let firstBank: ActivePersonalityBank | null = null;

  for (const locale of localesToTry) {
    if (seen.has(locale)) continue;
    seen.add(locale);

    const bank = await getActivePersonalityBank(locale);
    if (!bank) continue;
    if (!firstBank) firstBank = bank;

    if (!needsIdMatch) {
      return bank;
    }

    const matches = bank.questions.some((question) => Object.hasOwn(answers, question.id));

    if (matches) {
      return bank;
    }
  }

  return needsIdMatch ? null : firstBank;
}

export const POST = withAuth(
  withValidation<z.infer<typeof completeOnboardingSchema>, { user: ExtendedUser }>(
    (data: unknown) => completeOnboardingSchema.parse(data),
    async (
      _request: NextRequest,
      {
        user,
        validatedData,
      }: { user: ExtendedUser; validatedData: z.infer<typeof completeOnboardingSchema> },
    ) => {
      const { answers } = validatedData;

      const persistedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      if (!persistedUser) {
        return createErrorResponse("User not found", 404);
      }

      let personalityUpdate: PersonalityProfileUpdate | null = null;

      if (persistedUser.role === "STUDENT" && answers) {
        const bank = await resolveBankForAnswers(answers);
        if (!bank) {
          return createErrorResponse("Personality bank unavailable", 400);
        }

        const normalizedAnswers: Record<string, number> = {};
        for (const [key, value] of Object.entries(answers)) {
          if (typeof value === "number") {
            normalizedAnswers[key] = value;
          }
        }

        bank.questions.forEach((question, index) => {
          const ordinalKey = String(index + 1);
          const byId = normalizedAnswers[question.id];
          const byOrder = normalizedAnswers[ordinalKey];
          if (byId !== undefined && byOrder === undefined) {
            normalizedAnswers[ordinalKey] = byId;
          } else if (byId === undefined && byOrder !== undefined) {
            normalizedAnswers[question.id] = byOrder;
          }
        });

        const hasAnyMatch = bank.questions.some((question, index) => {
          const ordinalKey = String(index + 1);
          return (
            normalizedAnswers[question.id] !== undefined ||
            normalizedAnswers[ordinalKey] !== undefined
          );
        });

        if (!hasAnyMatch) {
          return createErrorResponse("No answers matched the current question bank", 400);
        }

        const questions = bank.questions.filter((q) => !q.isAttentionCheck);
        const scores = calculatePersonalityScores(normalizedAnswers, questions);
        const mbtiType = getMBTIType(scores) as MBTIType;

        personalityUpdate = {
          ei: scores.ei,
          sn: scores.sn,
          tf: scores.tf,
          pj: scores.pj,
          mbtiType,
          personalityData: {
            answers: normalizedAnswers,
            scores,
            metadata: { completedAt: new Date().toISOString() },
          } as unknown as PrismaNS.InputJsonValue,
        };
      }

      await prisma.$transaction(async (tx: TransactionClient) => {
        await tx.user.update({
          where: { id: user.id },
          data: { isOnboarded: true },
        });

        if (personalityUpdate) {
          await tx.personalityProfile.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              ...personalityUpdate,
            },
            update: personalityUpdate,
          });
        }
      });

      return createApiResponse({ success: true });
    },
  ),
);
