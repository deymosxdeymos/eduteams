'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { calculatePersonalityScores } from '@/lib/personality';
import { getCurrentUser } from '@/lib/api-utils';
import { AuthError, ValidationError } from '@/lib/types';

const personalitySubmissionSchema = z.object({
  answers: z.record(z.string(), z.number().min(1).max(5)),
});

export async function submitPersonalityTest(formData: FormData) {
  try {
    const user = await getCurrentUser();
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ei: scores.ei,
        sn: scores.sn,
        tf: scores.tf,
        pj: scores.pj,
        isOnboarded: true,
      },
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');
  } catch (error) {
    if (error instanceof AuthError || error instanceof ValidationError) {
      throw error;
    }

    console.error('Error submitting personality test:', error);
    throw new Error('Failed to submit personality test');
  }
}
