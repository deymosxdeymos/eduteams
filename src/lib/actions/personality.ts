'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { calculatePersonalityScores, getMBTIType } from '@/lib/personality';
import { getCurrentUser } from '@/lib/api-utils';
import { AuthError, ValidationError } from '@/lib/types';
import type { MBTIType } from '@/generated/prisma';

const personalitySubmissionSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export async function submitPersonalityTest(
  formData: FormData,
  getCurrentUserImpl = getCurrentUser
) {
  try {
    const user = await getCurrentUserImpl();
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

    const numericAnswers: Record<number, number> = {};
    for (const [key, value] of Object.entries(answers)) {
      numericAnswers[parseInt(key)] = value;
    }

    const scores = calculatePersonalityScores(numericAnswers);
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
    redirect('/dashboard?firstVisit=true');
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

    console.error('Error submitting personality test:', error);
    throw new Error('Failed to submit personality test');
  }
}
