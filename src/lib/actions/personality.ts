'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import type { MBTIType } from '@/generated/prisma';

import { getCurrentUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { calculatePersonalityScores, getMBTIType } from '@/lib/personality';
import prisma from '@/lib/prisma';
import { AuthError, ValidationError } from '@/lib/types';

const personalitySubmissionSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export async function submitPersonalityTest(
  formData: FormData,
  getCurrentUserImpl?: typeof getCurrentUser
) {
  try {
    const resolveUser = getCurrentUserImpl ?? getCurrentUser;
    const user = await resolveUser();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const answersJson = formData.get('answers') as string;
    if (!answersJson) {
      throw new ValidationError('Answers are required');
    }

    const parsedData = personalitySubmissionSchema.parse({
      answers: JSON.parse(answersJson),
    });

    const { answers } = parsedData;

    // answers are numeric-keyed (as strings). Use numeric-based scorer
    const scores = calculatePersonalityScores(answers);
    const mbtiType = getMBTIType(scores);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
        mbtiType: mbtiType as MBTIType,
        isOnboarded: true,
      },
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
  } catch (error) {
    if (error instanceof AuthError || error instanceof ValidationError) {
      throw error;
    }

    // Don't catch redirect errors - let them bubble up
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }

    logger.error('Error submitting personality test:', error);
    throw new Error('Failed to submit personality test');
  }
}
