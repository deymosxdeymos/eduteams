'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/api-utils';
import { AuthError, ValidationError } from '@/lib/types';

const dataDiriSchema = z.object({
  namaLengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  nim: z.string().optional().nullable(),
  npm: z.string().optional().nullable(),
  jenisKelamin: z.enum(['laki-laki', 'perempuan']),
  role: z.enum(['dosen', 'mahasiswa']),
});

export async function submitDataDiri(
  formData: FormData,
  getCurrentUserImpl = getCurrentUser
) {
  try {
    const user = await getCurrentUserImpl();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const rawData = {
      namaLengkap: formData.get('namaLengkap') as string,
      nim: formData.get('nim') as string,
      npm: formData.get('npm') as string,
      jenisKelamin: formData.get('jenisKelamin') as string,
      role: formData.get('role') as string,
    };

    const validatedData = dataDiriSchema.parse(rawData);
    const { namaLengkap, nim, npm, jenisKelamin, role } = validatedData;

    // Validate role-specific fields
    if (role === 'mahasiswa' && !nim) {
      throw new ValidationError('NIM is required for mahasiswa');
    }
    if (role === 'dosen' && !npm) {
      throw new ValidationError('NPM is required for dosen');
    }

    // Convert UI gender to enum
    const gender = jenisKelamin === 'laki-laki' ? 'MALE' : 'FEMALE';

    // Update user with data-diri information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: namaLengkap,
        nimNpm: role === 'mahasiswa' ? nim : npm,
        role,
        gender,
        isOnboarded: role === 'dosen', // dosen is fully onboarded after data-diri
        onboardingStep: 'data-diri',
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    // Navigate based on role
    if (role === 'mahasiswa') {
      redirect('/onboarding/kepribadian');
    } else {
      redirect('/dashboard?firstVisit=true');
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

    console.error('Error submitting data-diri:', error);
    throw new Error('Failed to submit data-diri');
  }
}

export async function getDataDiri(getCurrentUserImpl = getCurrentUser) {
  try {
    const user = await getCurrentUserImpl();
    if (!user) {
      throw new AuthError('Authentication required');
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        nimNpm: true,
        role: true,
        gender: true,
      },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Convert enum to UI format
    const jenisKelamin =
      currentUser.gender === 'MALE'
        ? 'laki-laki'
        : currentUser.gender === 'FEMALE'
          ? 'perempuan'
          : '';

    return {
      namaLengkap: currentUser.name || '',
      nimNpm: currentUser.nimNpm || '',
      jenisKelamin,
      role: currentUser.role || '',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error('Error fetching data-diri:', error);
    throw new Error('Failed to fetch data-diri');
  }
}
