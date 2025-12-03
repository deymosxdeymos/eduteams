'use server';

import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { AuthError } from '@/lib/types';

export async function updateWelcomeSplashStatus() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Authentication required');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hasSeenWelcomeSplash: true },
  });

  return { success: true };
}
