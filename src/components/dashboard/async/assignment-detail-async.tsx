import { AssignmentContent } from '@/components/dashboard/assignment-content';
import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import prisma from '@/lib/prisma';
import { getAssignmentStats } from '@/lib/stats/assignment';
import type { Course, ExtendedUser } from '@/lib/types';

interface AssignmentDetailAsyncProps {
  user: ExtendedUser;
  course: Course;
  classId: string;
  assignmentId: string;
  students: Array<{
    id: string;
    name: string;
    nim: string;
    email: string;
    mbtiType?: string | null;
    ei?: number | null;
    sn?: number | null;
    tf?: number | null;
    pj?: number | null;
    enrolledAt: Date;
  }>;
  isDosen: boolean;
  isMahasiswa: boolean;
}

export async function AssignmentDetailAsync({
  user,
  course,
  classId,
  assignmentId,
  students,
  isDosen,
  isMahasiswa,
}: AssignmentDetailAsyncProps) {
  // For mahasiswa, determine submission status
  const hasSubmitted = isMahasiswa
    ? !!(await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: { assignmentId, studentId: user.id },
        },
      }))
    : false;

  // Fetch assignment title for breadcrumbs
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  });
  const assignmentTitle = assignment?.title ?? 'Tugas';

  // Stats for graphs
  const stats = await getAssignmentStats(assignmentId, classId);

  // Submissions for this assignment
  const submittedForAssignment = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: { studentId: true },
  });
  const submittedStudentIds = new Set<string>(
    submittedForAssignment.map(s => s.studentId)
  );

  return (
    <AssignmentLayout
      user={user}
      course={course}
      classId={classId}
      assignmentId={assignmentId}
      students={students}
      canManage={isDosen}
      hideStudentList={stats.teamsFormed}
      assignmentTitle={assignmentTitle}
      submittedStudentIds={Array.from(submittedStudentIds) as string[]}
    >
      <AssignmentContent
        assignmentId={assignmentId}
        classId={classId}
        canManage={isDosen}
        isStudent={isMahasiswa}
        hasSubmitted={hasSubmitted}
        stats={stats}
      />
    </AssignmentLayout>
  );
}
