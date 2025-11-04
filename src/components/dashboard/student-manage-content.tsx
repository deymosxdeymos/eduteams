import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';
import { getStudentAssignmentStatus } from '@/lib/utils/student-status';
import { getTeamFormationForAssignment } from '@/lib/utils/team-formation';
import type { GroupListItem } from '@/types/manage';
import { StudentManageShell } from './student-manage-shell';

interface StudentManageContentProps {
  user: ExtendedUser;
}

export async function StudentManageContent({
  user,
}: StudentManageContentProps) {
  // Get all courses the student is enrolled in
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId: user.id },
    select: {
      courseId: true,
      course: {
        select: {
          id: true,
          namaMataKuliah: true,
          periode: true,
          tahunAwalPeriode: true,
          tahunAkhirPeriode: true,
        },
      },
    },
  });

  const courseIds = enrollments.map(e => e.courseId);

  if (courseIds.length === 0) {
    // No enrolled courses
    return (
      <section className='flex h-full flex-col rounded-3xl bg-white px-6 py-6'>
        <div className='mb-6'>
          <h1 className='text-2xl font-semibold text-neutral-900'>
            Kelola Kelas
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Halo {user.name ?? 'Mahasiswa'}, kelola kelompok dan tugasmu di
            sini.
          </p>
        </div>
        <div className='flex-1 min-h-0'>
          <StudentManageShell items={[]} isLoading={false} />
        </div>
      </section>
    );
  }

  // Get all active (non-archived) assignments for these courses
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courseIds },
      archivedAt: null,
    },
    select: {
      id: true,
      title: true,
      description: true,
      startAt: true,
      status: true,
      courseId: true,
      createdById: true,
      teamFormationRequests: {
        where: {
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          responseData: true,
          teams: {
            select: {
              id: true,
              name: true,
              quality: true,
              members: {
                select: {
                  id: true,
                  userId: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      mbtiType: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get all submissions for this student (excluding those that need updates)
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      studentId: user.id,
      assignmentId: { in: assignments.map(a => a.id) },
      needsUpdate: false,
    },
    select: { assignmentId: true },
  });

  const submissionSet = new Set(submissions.map(s => s.assignmentId));

  // Fetch topic names for assignments with team formations
  const assignmentsWithTopics = await Promise.all(
    assignments
      .filter(a => a.teamFormationRequests[0]?.responseData)
      .map(async assignment => {
        const teamFormation = assignment.teamFormationRequests[0];
        if (!teamFormation) return { assignmentId: assignment.id, topics: [] };

        // Extract taskId mapping from responseData
        let taskIdByIndex: string[] = [];
        try {
          const resp = teamFormation.responseData as unknown as {
            teams?: Array<{ taskId: string }>;
          } | null;
          if (resp?.teams?.length) {
            taskIdByIndex = resp.teams.map(t => t.taskId);
          }
        } catch {
          // ignore
        }

        if (taskIdByIndex.length === 0) {
          return { assignmentId: assignment.id, topics: [] };
        }

        // Strip suffix from task IDs (form-teams API adds -${i+1} when topic count != group count)
        // e.g., "abc123-1" -> "abc123"
        const originalTopicIds = taskIdByIndex.map(id => {
          const match = id.match(/^(.+)-\d+$/);
          return match ? match[1] : id;
        });

        // Fetch topic names
        const topics = await prisma.assignmentTopic.findMany({
          where: { assignmentId: assignment.id, id: { in: originalTopicIds } },
          select: { id: true, name: true },
        });

        const topicMap = new Map(topics.map(t => [t.id, t.name]));
        return {
          assignmentId: assignment.id,
          topics: originalTopicIds.map(id => topicMap.get(id) || '-'),
        };
      })
  );

  const topicsByAssignment = new Map(
    assignmentsWithTopics.map(a => [a.assignmentId, a.topics])
  );

  // Map to GroupListItem with status
  const items: GroupListItem[] = await Promise.all(
    assignments.map(async assignment => {
      const enrollment = enrollments.find(
        e => e.courseId === assignment.courseId
      );
      const course = enrollment?.course;

      const hasSubmission = submissionSet.has(assignment.id);

      // Find which team the student is in and get all team members
      let teamFormation = assignment.teamFormationRequests[0];

      // Fallback for legacy data: if no team formation found with assignmentId,
      // try to find the most recent completed team formation for this assignment's owner
      if (!teamFormation) {
        const fallbackTeamFormation = await getTeamFormationForAssignment(
          assignment.id,
          assignment.createdById
        );
        if (fallbackTeamFormation) {
          teamFormation = fallbackTeamFormation;
        }
      }

      const studentTeam = teamFormation?.teams.find(team =>
        team.members.some(m => m.userId === user.id)
      );
      const isInTeam = !!studentTeam;

      const status = getStudentAssignmentStatus({
        assignmentStatus: assignment.status,
        hasSubmission,
        isInTeam,
      });

      const academicYear = course
        ? `${course.tahunAwalPeriode}/${course.tahunAkhirPeriode} ${course.periode}`
        : 'N/A';

      // Get team details if student is in a team
      let teamMembers: GroupListItem['teamMembers'];
      let teamName: string | undefined;
      let teamQuality: number | undefined;
      let topicName: string | undefined;

      if (studentTeam) {
        teamMembers = studentTeam.members.map(m => ({
          id: m.id,
          user: {
            id: m.user.id,
            name: m.user.name,
            mbtiType: m.user.mbtiType as string | null,
          },
        }));

        teamName = studentTeam.name ?? undefined;
        teamQuality = studentTeam.quality ?? undefined;

        // Get topic name for this team
        const teamIndex = teamFormation?.teams.findIndex(
          t => t.id === studentTeam.id
        );
        const topics = topicsByAssignment.get(assignment.id);
        if (
          teamIndex !== undefined &&
          teamIndex >= 0 &&
          topics &&
          topics[teamIndex]
        ) {
          topicName = topics[teamIndex];
        }
      }

      return {
        id: assignment.id,
        courseId: assignment.courseId,
        taskTitle: assignment.title,
        className: course?.namaMataKuliah ?? 'Unknown Course',
        academicYear,
        status,
        teamMembers,
        teamName,
        teamQuality,
        topicName,
        startAt: assignment.startAt,
        description: assignment.description,
      };
    })
  );

  return (
    <section className='flex h-full flex-col rounded-3xl bg-white px-6 py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-neutral-900'>
          Kelola Kelas
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Halo {user.name ?? 'Mahasiswa'}, kelola kelompok dan tugasmu di sini.
        </p>
      </div>
      <div className='flex-1 min-h-0'>
        <StudentManageShell items={items} isLoading={false} />
      </div>
    </section>
  );
}
