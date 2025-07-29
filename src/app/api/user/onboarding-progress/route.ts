import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createApiResponse, withAuth, withValidation } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

const onboardingProgressSchema = z.object({
  step: z.enum(['role', 'data-diri', 'kepribadian']),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => onboardingProgressSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      const { step } = validatedData;

      await prisma.user.update({
        where: { id: user?.id },
        data: { onboardingStep: step },
      });

      return createApiResponse({ success: true });
    }
  )
);
