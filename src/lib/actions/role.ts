'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/api-utils';
import { isInstitutionalEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { AuthError } from '@/lib/types';

const roleSchema = z.object({
  role: z
    .enum(['dosen', 'mahasiswa'])
    .transform(val => (val === 'dosen' ? 'TEACHER' : 'STUDENT')),
});

export async function submitRole(
  formData: FormData,
  getCurrentUserImpl = getCurrentUser
) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError('Authentication required');
  }

  const rawData = {
    role: formData.get('role') as string,
  };

  const validatedData = roleSchema.parse(rawData);
  const { role } = validatedData;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      onboardingStep: 'role',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/onboarding');

  const roleSlug = role === 'TEACHER' ? 'dosen' : 'mahasiswa';

  if (role === 'TEACHER') {
    if (isInstitutionalEmail(user.email)) {
      redirect('/onboarding/data-diri/dosen');
    } else {
      redirect('/onboarding/role?err=dosen_email');
    }
  } else {
    redirect(`/onboarding/data-diri/${roleSlug}`);
  }
}

export async function autoAssignRole(getCurrentUserImpl = getCurrentUser) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError('Authentication required');
  }

  if (process.env.DEV_DISABLE_AUTO_ROLE === 'true') {
    redirect('/onboarding/role');
  }

  const role = isInstitutionalEmail(user.email) ? 'TEACHER' : 'STUDENT';
  const roleSlug = role === 'TEACHER' ? 'dosen' : 'mahasiswa';

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role,
      onboardingStep: 'role',
    },
  });

  redirect(`/onboarding/data-diri/${roleSlug}`);
}
