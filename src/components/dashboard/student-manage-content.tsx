import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';
import { getStudentAssignmentStatus } from '@/lib/utils/student-status';
import type { GroupListItem } from '@/types/manage';
import { StudentManageShell } from './student-manage-shell';

const TEAM_TASK_ID_SUFFIX_RE = /^(.+)-\d+$/;

interface StudentManageContentProps {
  user: ExtendedUser;
}

export async function StudentManageContent({
  user,
}: StudentManageContentProps) {
  const translationsPromise = getTranslations('dashboard.studentManage');

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

  const courseIds = enrollments.map(
    (e: (typeof enrollments)[number]) => e.courseId
  );

  if (courseIds.length === 0) {
    const t = await translationsPromise;

    // No enrolled courses
    return (
      <section className='flex h-full flex-col rounded-3xl bg-white px-6 py-6'>
        <div className='mb-6'>
          <h1 className='text-2xl font-semibold text-neutral-900'>
            {t('title')}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('subtitle', { name: user.name ?? 'Student' })}
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
                      personalityProfile: {
                        select: {
                          mbtiType: true,
                        },
                      },
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

  type Assignment = (typeof assignments)[number];
  type Enrollment = (typeof enrollments)[number];

  const enrollmentByCourseId = new Map<string, Enrollment>(
    enrollments.map((enrollment: Enrollment) => [
      enrollment.courseId,
      enrollment,
    ])
  );

  const assignmentIds = assignments.map(
    (assignment: Assignment) => assignment.id
  );
  const assignmentsMissingTeamFormation = assignments.filter(
    (assignment: Assignment) => !assignment.teamFormationRequests[0]
  );
  const ownerIdsWithMissingTeamFormation = [
    ...new Set(
      assignmentsMissingTeamFormation.map(
        (assignment: Assignment) => assignment.createdById
      )
    ),
  ];

  const submissionsPromise = assignmentIds.length
    ? prisma.assignmentSubmission.findMany({
        where: {
          studentId: user.id,
          assignmentId: { in: assignmentIds },
          needsUpdate: false,
        },
        select: { assignmentId: true },
      })
    : Promise.resolve([]);

  const legacyTeamFormationsPromise = ownerIdsWithMissingTeamFormation.length
    ? prisma.teamFormationRequest.findMany({
        where: {
          ownerId: { in: ownerIdsWithMissingTeamFormation },
          assignmentId: null,
          status: 'COMPLETED',
        },
        select: {
          id: true,
          ownerId: true,
          createdAt: true,
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
                      personalityProfile: {
                        select: {
                          mbtiType: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ ownerId: 'asc' }, { createdAt: 'desc' }],
      })
    : Promise.resolve([]);

  const [submissions, legacyTeamFormations] = await Promise.all([
    submissionsPromise,
    legacyTeamFormationsPromise,
  ]);

  const submissionSet = new Set(
    submissions.map(
      (submission: (typeof submissions)[number]) => submission.assignmentId
    )
  );

  const legacyTeamFormationsByOwner = new Map<
    string,
    (typeof legacyTeamFormations)
  >();
  for (const teamFormation of legacyTeamFormations) {
    const existing = legacyTeamFormationsByOwner.get(teamFormation.ownerId);
    if (existing) {
      existing.push(teamFormation);
      continue;
    }

    legacyTeamFormationsByOwner.set(teamFormation.ownerId, [teamFormation]);
  }

  type ResolvedTeamFormation =
    | (typeof assignments)[number]['teamFormationRequests'][number]
    | (typeof legacyTeamFormations)[number]
    | null;

  const resolvedTeamFormationByAssignment = new Map<
    string,
    ResolvedTeamFormation
  >();
  const topicIdsByAssignment = new Map<string, string[]>();

  for (const assignment of assignments) {
    let teamFormation: ResolvedTeamFormation =
      assignment.teamFormationRequests[0] ?? null;

    if (!teamFormation) {
      const legacyCandidates =
        legacyTeamFormationsByOwner.get(assignment.createdById) ?? [];
      teamFormation =
        legacyCandidates.find(
          (candidate: (typeof legacyTeamFormations)[number]) =>
            assignment.startAt ? candidate.createdAt >= assignment.startAt : true
        ) ?? null;
    }

    resolvedTeamFormationByAssignment.set(assignment.id, teamFormation);

    const response = teamFormation?.responseData as
      | { teams?: Array<{ taskId: string }> }
      | null;
    const originalTopicIds =
      response?.teams?.map((team: { taskId: string }) => {
        const match = team.taskId.match(TEAM_TASK_ID_SUFFIX_RE);
        return match ? match[1] : team.taskId;
      }) ?? [];

    topicIdsByAssignment.set(assignment.id, originalTopicIds);
  }

  const uniqueTopicIds = [
    ...new Set(
      [...topicIdsByAssignment.values()].flatMap(
        (topicIds: string[]) => topicIds
      )
    ),
  ];
  const topicRows = uniqueTopicIds.length
    ? await prisma.assignmentTopic.findMany({
        where: { id: { in: uniqueTopicIds } },
        select: { id: true, name: true },
      })
    : [];

  const topicNameById = new Map<string, string>(
    topicRows.map((topic: (typeof topicRows)[number]) => [topic.id, topic.name])
  );
  const topicsByAssignment = new Map<string, string[]>();
  for (const [assignmentId, topicIds] of topicIdsByAssignment.entries()) {
    topicsByAssignment.set(
      assignmentId,
      topicIds.map((topicId: string) => topicNameById.get(topicId) || '-')
    );
  }

  // Map to GroupListItem with status
  const items: GroupListItem[] = assignments.map((assignment: Assignment) => {
    const enrollment = enrollmentByCourseId.get(assignment.courseId);
    const course = enrollment?.course;

    const hasSubmission = submissionSet.has(assignment.id);

    // Find which team the student is in and get all team members
    const teamFormation =
      resolvedTeamFormationByAssignment.get(assignment.id) ?? null;

    type Team = NonNullable<typeof teamFormation>['teams'][number];
    type Member = Team['members'][number];
    const studentTeam = teamFormation?.teams.find((team: Team) =>
      team.members.some((m: Member) => m.userId === user.id)
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
      teamMembers = studentTeam.members.map((m: Member) => ({
        id: m.id,
        user: {
          id: m.user.id,
          name: m.user.name,
          mbtiType: m.user.personalityProfile?.mbtiType as string | null,
        },
      }));

      teamName = studentTeam.name ?? undefined;
      teamQuality = studentTeam.quality ?? undefined;

      // Get topic name for this team
      const teamIndex = teamFormation?.teams.findIndex(
        (t: Team) => t.id === studentTeam.id
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
  });

  const t = await translationsPromise;

  return (
    <section className='flex h-full flex-col rounded-3xl bg-white px-6 py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-neutral-900'>
          {t('title')}
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t('subtitle', { name: user.name ?? 'Student' })}
        </p>
      </div>
      <div className='flex-1 min-h-0'>
        <StudentManageShell items={items} isLoading={false} />
      </div>
    </section>
  );
}
