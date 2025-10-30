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

const toggleAssignmentArchiveInputSchema = z.object({
  assignmentId: z.string().uuid({ message: 'ID tugas tidak valid.' }),
  archive: z.boolean(),
});

type ToggleAssignmentArchiveInput = z.infer<
  typeof toggleAssignmentArchiveInputSchema
>;

export async function toggleAssignmentArchive(
  input: ToggleAssignmentArchiveInput
): Promise<{ success: true }> {
  const parsed = toggleAssignmentArchiveInputSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map(issue => issue.message).join(', ');
    throw new ValidationError(message);
  }

  const { assignmentId, archive } = parsed.data;
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError();
  }

  if (!canAccessDosenFeatures(user)) {
    throw new AuthorizationError('Hanya dosen yang dapat mengarsipkan tugas.');
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      createdById: true,
      course: { select: { dosenId: true } },
    },
  });

  if (!assignment) {
    throw new NotFoundError('Tugas tidak ditemukan.');
  }

  if (assignment.course.dosenId !== user.id) {
    throw new AuthorizationError('Tidak memiliki akses ke tugas ini.');
  }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { archivedAt: archive ? new Date() : null },
  });

  revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

  return { success: true };
}
