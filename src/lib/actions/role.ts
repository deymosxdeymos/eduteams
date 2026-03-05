'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/api-utils';
import {
  isActiveDemoAccountEmail,
  parseDemoRoleFromEmail,
} from '@/lib/demo/auth';
import { isDemoModeEnabled } from '@/lib/demo/config';
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

  const isTeacherDemoAccount =
    isActiveDemoAccountEmail(user.email) &&
    parseDemoRoleFromEmail(user.email) === 'TEACHER';
  const isTeacherAllowed =
    role !== 'TEACHER' || isInstitutionalEmail(user.email) || isTeacherDemoAccount;

  if (!isTeacherAllowed) {
    redirect('/onboarding/role?err=dosen_email');
  }

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

  redirect(`/onboarding/data-diri/${roleSlug}`);
}

export async function autoAssignRole(getCurrentUserImpl = getCurrentUser) {
  const user = await getCurrentUserImpl();
  if (!user) {
    throw new AuthError('Authentication required');
  }

  if (process.env.DEV_DISABLE_AUTO_ROLE === 'true') {
    redirect('/onboarding/role');
  }

  const demoRole = isActiveDemoAccountEmail(user.email)
    ? parseDemoRoleFromEmail(user.email)
    : null;

  if (!demoRole && isDemoModeEnabled() && !isInstitutionalEmail(user.email)) {
    redirect('/onboarding/role');
  }

  const role = demoRole ?? (isInstitutionalEmail(user.email) ? 'TEACHER' : 'STUDENT');
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
