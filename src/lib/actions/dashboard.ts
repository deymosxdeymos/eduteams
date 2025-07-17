'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/api-utils';
import { AuthError } from '@/lib/types';

export async function updateWelcomeSplashStatus() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { hasSeenWelcomeSplash: true },
    });

    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error('Error updating welcome splash status:', error);
    throw new Error('Failed to update welcome splash status');
  }
}
