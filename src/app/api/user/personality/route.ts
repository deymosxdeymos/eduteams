import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { calculatePersonalityScores } from '@/lib/personality';
import { withAuth, withValidation, createApiResponse } from '@/lib/api-utils';

const personalitySchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => personalitySchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { answers } = validatedData;
      // Convert string keys to numbers for calculation
      const numericAnswers: Record<number, number> = {};
      for (const [key, value] of Object.entries(answers)) {
        numericAnswers[parseInt(key)] = value;
      }
      // Calculate MBTI scores from answers
      const scores = calculatePersonalityScores(numericAnswers);
      // Update user with personality scores
      await prisma.user.update({
        where: { id: user!.id },
        data: {
          ei: scores.ei,
          sn: scores.sn,
          tf: scores.tf,
          pj: scores.pj,
        },
      });
      return createApiResponse({
        success: true,
        scores,
      });
    }
  )
);
