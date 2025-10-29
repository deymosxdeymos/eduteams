'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { CACHE_TAGS } from '@/lib/cache-tags';
import prisma from '@/lib/prisma';
import {
  AuthError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from '@/lib/utils/errors';

const toggleCourseArchiveInputSchema = z.object({
  courseId: z.string().uuid({ message: 'ID kelas tidak valid.' }),
  archive: z.boolean(),
});

type ToggleCourseArchiveInput = z.infer<typeof toggleCourseArchiveInputSchema>;

export async function toggleCourseArchive(
  input: ToggleCourseArchiveInput
): Promise<{ success: true }> {
  const parsed = toggleCourseArchiveInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => issue.message).join(', ');
    throw new ValidationError(message);
  }

  const { courseId, archive } = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError();
  }

  if (!canAccessDosenFeatures(user)) {
    throw new AuthorizationError('Hanya dosen yang dapat mengarsipkan kelas.');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, dosenId: true },
  });

  if (!course) {
    throw new NotFoundError('Kelas tidak ditemukan.');
  }

  if (course.dosenId !== user.id) {
    throw new AuthorizationError('Tidak memiliki akses ke kelas ini.');
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { archivedAt: archive ? new Date() : null },
  });

  revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

  return { success: true };
}

const deleteCourseInputSchema = z.object({
  courseId: z.string().uuid({ message: 'ID kelas tidak valid.' }),
});

type DeleteCourseInput = z.infer<typeof deleteCourseInputSchema>;

export async function deleteCourse(
  input: DeleteCourseInput
): Promise<{ success: true }> {
  const parsed = deleteCourseInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => issue.message).join(', ');
    throw new ValidationError(message);
  }

  const { courseId } = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError();
  }

  if (!canAccessDosenFeatures(user)) {
    throw new AuthorizationError('Hanya dosen yang dapat menghapus kelas.');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, dosenId: true },
  });

  if (!course) {
    throw new NotFoundError('Kelas tidak ditemukan.');
  }

  if (course.dosenId !== user.id) {
    throw new AuthorizationError('Tidak memiliki akses ke kelas ini.');
  }

  await prisma.course.delete({
    where: { id: courseId },
  });

  revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

  return { success: true };
}
