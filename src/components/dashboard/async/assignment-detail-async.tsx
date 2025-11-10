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
    select: {
      title: true,
      description: true,
      startAt: true,
      course: { select: { dosenId: true } },
    },
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

  // Server-side: gather counts for UI and teams percentage
  // Topics count and enrollments
  const [topicRecords, enrollments] = await Promise.all([
    prisma.assignmentTopic.findMany({
      where: { assignmentId },
      select: { id: true },
    }),
    prisma.courseEnrollment.findMany({
      where: { courseId: classId },
      select: { studentId: true },
    }),
  ]);

  // Topics are optional: prefer assignment's current description JSON;
  // fall back to historical topic records only if parsing fails.
  let topicCount = 0;
  if (assignment?.description) {
    try {
      const parsed = JSON.parse(assignment.description) as {
        topics?: unknown;
      };
      if (Array.isArray(parsed?.topics)) {
        topicCount = parsed.topics
          .map(topic => (typeof topic === 'string' ? topic.trim() : ''))
          .filter(Boolean).length;
      } else {
        topicCount = 0;
      }
    } catch {
      topicCount = topicRecords.length;
    }
  } else {
    topicCount = topicRecords.length;
  }

  const pendingFormation = await prisma.teamFormationRequest.findFirst({
    where: {
      assignmentId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  const isTeamFormationProcessing = Boolean(pendingFormation);

  let percentAssigned = 0;
  if (assignment) {
    const latest = await prisma.teamFormationRequest.findFirst({
      where: {
        ownerId: course.dosenId,
        createdAt: { gte: assignment.startAt },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        teams: { include: { members: true } },
      },
    });
    if (latest) {
      const memberIds = new Set(
        latest.teams.flatMap(t => t.members.map(m => m.userId))
      );
      const total = enrollments.length;
      percentAssigned =
        total > 0 ? Math.round((memberIds.size / total) * 100) : 0;
    }
  }

  const totalEnrollments = enrollments.length;
  const quizCompletionPercent = totalEnrollments
    ? Math.round(
        (Math.min(stats.quizSubmissions, totalEnrollments) / totalEnrollments) *
          100
      )
    : 0;

  // Fetch teams data if teams are formed
  let teamsData: Array<{
    id: string;
    quality: number | null;
    createdAt: Date;
    members: Array<{
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        mbtiType: string | null;
        nim: string | null;
      };
    }>;
  }> = [];
  let topicNames: Record<string, string> = {};
  let taskIdByIndex: string[] = [];

  if (assignment && percentAssigned > 0) {
    const latest = await prisma.teamFormationRequest.findFirst({
      where: {
        ownerId: course.dosenId,
        createdAt: { gte: assignment.startAt },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        teams: {
          orderBy: { createdAt: 'asc' },
          include: {
            members: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    mbtiType: true,
                    nim: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (latest && latest.teams.length > 0) {
      teamsData = latest.teams.map(team => ({
        id: team.id,
        quality: team.quality,
        createdAt: team.createdAt,
        members: team.members.map(m => ({
          id: m.id,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            mbtiType: m.user.mbtiType,
            nim: m.user.nim,
          },
        })),
      }));

      // Try to extract taskId mapping from responseData
      try {
        const resp = latest.responseData as unknown as {
          teams?: Array<{ taskId: string }>;
        } | null;
        if (resp?.teams?.length) {
          taskIdByIndex = resp.teams.map(t => t.taskId);
        }
      } catch {
        // ignore
      }

      // If taskId looks like assignmentTopic id, fetch names
      if (taskIdByIndex.length) {
        const topicRecordsWithNames = await prisma.assignmentTopic.findMany({
          where: { assignmentId, id: { in: taskIdByIndex } },
          select: { id: true, name: true },
        });
        topicNames = Object.fromEntries(
          topicRecordsWithNames.map(r => [r.id, r.name] as const)
        );
      }
    }
  }

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
        courseId={classId}
        canManage={isDosen}
        isStudent={isMahasiswa}
        hasSubmitted={hasSubmitted}
        stats={stats}
        hasTeams={percentAssigned > 0}
        topicCount={topicCount}
        enrollmentCount={enrollments.length}
        quizCompletionPercent={quizCompletionPercent}
      teams={teamsData}
      topicNames={topicNames}
      taskIdByIndex={taskIdByIndex}
      isTeamFormationProcessing={isTeamFormationProcessing}
    />
    </AssignmentLayout>
  );
}
