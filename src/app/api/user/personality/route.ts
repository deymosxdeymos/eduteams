import type { NextRequest } from 'next/server';
import { z } from 'zod';
import type { MBTIType } from '@/generated/prisma';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import { getMBTIQuestions } from '@/lib/mbti-questions';
import {
  calculatePersonalityScoresFromQuestions,
  getMBTIType,
} from '@/lib/personality';
import prisma from '@/lib/prisma';

const personalitySchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => personalitySchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { answers } = validatedData;
      const questions = await getMBTIQuestions();
      const scores = calculatePersonalityScoresFromQuestions(
        answers,
        questions
      );
      const answeredCount = Object.keys(answers).length;
      const includeMBTI =
        questions.length > 0 && answeredCount >= questions.length;
      const mbtiType = includeMBTI ? getMBTIType(scores) : undefined;
      // Update user with personality scores and derived MBTI type (only when complete)
      await prisma.user.update({
        where: { id: user?.id },
        data: {
          ei: scores.ei,
          sn: scores.sn,
          tf: scores.tf,
          pj: scores.pj,
          ...(includeMBTI ? { mbtiType: mbtiType as MBTIType } : {}),
        },
      });
      return createApiResponse({
        success: true,
        scores,
        ...(includeMBTI ? { mbtiType } : {}),
      });
    }
  )
);
