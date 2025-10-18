import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { MBTIType, Prisma as PrismaNS } from '@/generated/prisma';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import { getActivePersonalityBank } from '@/lib/mbti-questions-simple';
import { calculatePersonalityScores, getMBTIType } from '@/lib/personality';
import prisma from '@/lib/prisma';
// Prisma requires Node.js runtime
export const runtime = 'nodejs';

const completeOnboardingSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)).optional(),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => completeOnboardingSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { answers } = validatedData;

      // Get current user to check role
      const currentUser = await prisma.user.findUnique({
        where: { id: user?.id },
        select: { role: true },
      });

      if (!currentUser) {
        return createApiResponse(null, 'User not found', 404);
      }

      const updateData: Record<string, unknown> = { isOnboarded: true };

      // If user is mahasiswa and provided answers, calculate personality scores
      if (currentUser.role === 'mahasiswa' && answers) {
        const bank = await getActivePersonalityBank();
        if (!bank) {
          return createApiResponse(null, 'Personality bank unavailable', 400);
        }
        const normalizedAnswers: Record<string, number> = {};
        for (const [key, value] of Object.entries(answers)) {
          if (typeof value === 'number') {
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

        const questions = bank.questions.filter(q => !q.isAttentionCheck);
        const scores = calculatePersonalityScores(normalizedAnswers, questions);
        const mbtiType = getMBTIType(scores) as MBTIType;
        updateData.ei = scores.ei;
        updateData.sn = scores.sn;
        updateData.tf = scores.tf;
        updateData.pj = scores.pj;
        updateData.mbtiType = mbtiType;
        updateData.personalityData = {
          answers: normalizedAnswers,
          scores,
          metadata: { completedAt: new Date().toISOString() },
        } as unknown as PrismaNS.InputJsonValue;
      }

      // Mark user as fully onboarded and save personality data if applicable
      await prisma.user.update({
        where: { id: user?.id },
        data: updateData,
      });

      return createApiResponse({ success: true });
    }
  )
);
