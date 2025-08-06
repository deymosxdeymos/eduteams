'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { AuthError, ValidationError } from '@/lib/types';

const tokenSchema = z.object({
  token: z.string().min(1, 'Token tidak boleh kosong'),
});

export async function verifyDosenToken(
  formData: FormData,
  getCurrentUserImpl = getCurrentUser
) {
  try {
    const user = await getCurrentUserImpl();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const rawData = {
      token: formData.get('token') as string,
    };

    const validatedData = tokenSchema.parse(rawData);
    const { token } = validatedData;

    // Check if user is dosen
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
      },
    });

    if (currentUser?.role !== 'dosen') {
      throw new ValidationError(
        'Hanya dosen yang dapat menggunakan token verifikasi'
      );
    }

    // Verify token in a transaction
    await prisma.$transaction(async tx => {
      // Find the token
      const dosenToken = await tx.dosenToken.findUnique({
        where: { token },
        select: {
          id: true,
        },
      });

      if (!dosenToken) {
        throw new ValidationError('Token tidak valid');
      }

      // Check if user has already used this token
      const existingUsage = await tx.dosenTokenUsage.findUnique({
        where: {
          tokenId_userId: {
            tokenId: dosenToken.id,
            userId: user.id,
          },
        },
      });

      // If user hasn't used this token yet, record the usage
      if (!existingUsage) {
        await tx.dosenTokenUsage.create({
          data: {
            tokenId: dosenToken.id,
            userId: user.id,
          },
        });
      }

      // Update user onboarding step
      await tx.user.update({
        where: { id: user.id },
        data: {
          onboardingStep: 'token-verified',
        },
      });
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    // Redirect to data-diri page
    redirect('/onboarding/data-diri/dosen');
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

    console.error('Error verifying dosen token:', error);
    throw new Error('Gagal memverifikasi token');
  }
}

export async function getDosenTokens() {
  try {
    const tokens = await prisma.dosenToken.findMany({
      select: {
        id: true,
        token: true,
        description: true,
        createdAt: true,
        usages: {
          select: {
            usedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            usedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return tokens;
  } catch (error) {
    console.error('Error fetching dosen tokens:', error);
    return [];
  }
}
