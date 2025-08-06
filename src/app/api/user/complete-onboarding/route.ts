import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import { calculatePersonalityScores } from '@/lib/personality';
import prisma from '@/lib/prisma';

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

      const updateData: {
        isOnboarded: boolean;
        ei?: number;
        sn?: number;
        tf?: number;
        pj?: number;
      } = { isOnboarded: true };

      // If user is mahasiswa and provided answers, calculate personality scores
      if (currentUser.role === 'mahasiswa' && answers) {
        const numericAnswers: Record<number, number> = {};
        for (const [key, value] of Object.entries(answers)) {
          numericAnswers[parseInt(key)] = value;
        }

        const scores = calculatePersonalityScores(numericAnswers);
        updateData.ei = scores.ei;
        updateData.sn = scores.sn;
        updateData.tf = scores.tf;
        updateData.pj = scores.pj;
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
