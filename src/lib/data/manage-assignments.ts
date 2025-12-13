import prisma from '@/lib/prisma';
import type { ManageAssignmentRow } from '@/types/manage';

export async function getManageAssignmentsForCourse(
  courseId: string,
  dosenId: string
): Promise<ManageAssignmentRow[]> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, dosenId },
    select: { _count: { select: { enrollments: true } } },
  });

  if (!course) {
    throw new Error('Course not found or unauthorized');
  }

  const totalStudents = course._count.enrollments;

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startAt: true,
      createdAt: true,
      archivedAt: true,
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return assignments.map((assignment: (typeof assignments)[number]) => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    status: assignment.status,
    startAt: assignment.startAt.toISOString(),
    createdAt: assignment.createdAt.toISOString(),
    isArchived: assignment.archivedAt !== null,
    submissionsCount: assignment._count.submissions,
    totalStudents,
  }));
}
