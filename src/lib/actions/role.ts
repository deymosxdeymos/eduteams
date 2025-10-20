'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/api-utils';
import { isInstitutionalEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { AuthError, ValidationError } from '@/lib/types';

const roleSchema = z.object({
  role: z.enum(['dosen', 'mahasiswa']),
});

export async function submitRole(
  formData: FormData,
  getCurrentUserImpl = getCurrentUser
) {
  try {
    const user = await getCurrentUserImpl();
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

    // Redirect to next step (domain-based for dosen)
    if (role === 'dosen') {
      if (isInstitutionalEmail(user.email)) {
        redirect('/onboarding/data-diri/dosen');
      } else {
        redirect('/onboarding/role?err=dosen_email');
      }
    } else {
      redirect(`/onboarding/data-diri/${role}`);
    }
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

export async function autoAssignRole(getCurrentUserImpl = getCurrentUser) {
  try {
    const user = await getCurrentUserImpl();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const role = isInstitutionalEmail(user.email) ? 'dosen' : 'mahasiswa';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role,
        onboardingStep: 'role',
      },
    });

    redirect(`/onboarding/data-diri/${role}`);
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof error.digest === 'string' &&
      error.digest.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }

    console.error('Error auto-assigning role:', error);
    throw new Error('Failed to auto-assign role');
  }
}
