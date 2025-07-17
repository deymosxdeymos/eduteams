'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/api-utils';
import { AuthError, ValidationError } from '@/lib/types';

const roleSchema = z.object({
  role: z.enum(['dosen', 'mahasiswa']),
});

export async function submitRole(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const rawData = {
      role: formData.get('role') as string,
    };

    const validatedData = roleSchema.parse(rawData);
    const { role } = validatedData;

    // Update user role and onboarding progress in a single transaction
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role,
        onboardingStep: 'role',
      },
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    // Redirect to next step
    redirect(`/onboarding/data-diri/${role}`);
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

    console.error('Error submitting role:', error);
    throw new Error('Failed to submit role');
  }
}

export async function getCurrentUserRole() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        onboardingStep: true,
      },
    });

    return currentUser;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}
