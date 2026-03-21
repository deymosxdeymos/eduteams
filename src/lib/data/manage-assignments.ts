import prisma from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";
import type { ManageAssignmentRow } from "@/types/manage";

export async function getManageAssignmentsForCourse(
  courseId: string,
  user: Pick<ExtendedUser, "id"> & Partial<Pick<ExtendedUser, "email">>,
  totalStudentsInput: number | Promise<number>,
): Promise<ManageAssignmentRow[]> {
  const [assignments, totalStudents] = await Promise.all([
    prisma.assignment.findMany({
      where: {
        courseId,
        course: {
          dosenId: user.id,
        },
      },
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
      orderBy: { createdAt: "desc" },
    }),
    totalStudentsInput,
  ]);

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
