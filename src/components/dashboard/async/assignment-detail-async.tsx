import { AssignmentContent } from '@/components/dashboard/assignment-content';
import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import prisma from '@/lib/prisma';
import { getAssignmentStats } from '@/lib/stats/assignment';
import type { Course, ExtendedUser } from '@/lib/types';

type TeamMemberFromQuery = {
  id: string;
  assignedSkillIds: string[];
  user: {
    id: string;
    name: string | null;
    email: string;
    nim: string | null;
    gender: string | null;
    personalityProfile: {
      mbtiType: string | null;
      ei: number | null;
      sn: number | null;
      tf: number | null;
      pj: number | null;
    } | null;
    personSkills: Array<{
      skillId: string;
      level: number;
      skill: { id: string; name: string };
    }>;
    AssignmentTopicPreference: Array<{
      preference: number;
      topic: { id: string; name: string };
    }>;
  };
};

type TeamFromQuery = {
  id: string;
  quality: number | null;
  createdAt: Date;
  members: TeamMemberFromQuery[];
};

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
    gender: string | null;
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
  // Parallel fetch: all independent queries at once
  const [
    submissionCheck,
    assignment,
    stats,
    submittedForAssignment,
    topicRecords,
    pendingFormation,
    latestFormation,
  ] = await Promise.all([
    // For mahasiswa, determine submission status
    isMahasiswa
      ? prisma.assignmentSubmission.findUnique({
          where: {
            assignmentId_studentId: { assignmentId, studentId: user.id },
          },
          select: { id: true },
        })
      : null,
    // Fetch assignment title for breadcrumbs
    prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        title: true,
        description: true,
        startAt: true,
        course: { select: { dosenId: true } },
      },
    }),
    // Stats for graphs
    getAssignmentStats(assignmentId, classId),
    // Submissions for this assignment
    prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      select: { studentId: true },
    }),
    // Topics - fetch id and name for both count and topic name lookup
    prisma.assignmentTopic.findMany({
      where: { assignmentId },
      select: { id: true, name: true },
    }),
    // Pending formation check
    prisma.teamFormationRequest.findFirst({
      where: {
        assignmentId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }),
    // Completed team formation - for percentage calc and team display
    prisma.teamFormationRequest.findFirst({
      where: {
        assignmentId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        teams: {
          orderBy: { createdAt: 'asc' },
          include: {
            members: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                userId: true,
                assignedSkillIds: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    nim: true,
                    personalityProfile: {
                      select: {
                        mbtiType: true,
                        ei: true,
                        sn: true,
                        tf: true,
                        pj: true,
                      },
                    },
                    gender: true,
                    personSkills: {
                      select: {
                        skillId: true,
                        level: true,
                        skill: { select: { id: true, name: true } },
                      },
                    },
                    AssignmentTopicPreference: {
                      where: {
                        topic: {
                          assignmentId,
                        },
                      },
                      select: {
                        preference: true,
                        topic: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const hasSubmitted = !!submissionCheck;
  const assignmentTitle = assignment?.title ?? 'Tugas';
  const submittedStudentIds = new Set<string>(
    submittedForAssignment.map((s: { studentId: string }) => s.studentId)
  );
  const isTeamFormationProcessing = Boolean(pendingFormation);

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

  const totalEnrollments = students.length;
  const quizCompletionPercent = totalEnrollments
    ? Math.round(
        (Math.min(stats.quizSubmissions, totalEnrollments) / totalEnrollments) *
          100
      )
    : 0;

  // Calculate how many students haven't submitted the assignment quiz
  const incompleteCount = totalEnrollments - submittedStudentIds.size;

  const enrolledStudentsList = students.map(student => ({
    id: student.id,
    name: student.name,
    nim: student.nim,
    email: student.email,
    mbtiType: student.mbtiType ?? null,
    gender: student.gender,
  }));

  // Teams data derived from latestFormation query in Promise.all
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
        ei: number | null;
        sn: number | null;
        tf: number | null;
        pj: number | null;
      };
    }>;
  }> = [];
  let topicNames: Record<string, string> = {};
  let taskIdByIndex: string[] = [];
  let percentAssigned = 0;

  // Calculate percentage from latestFormation query result
  if (latestFormation) {
    const memberIds = new Set(
      latestFormation.teams.flatMap((t: { members: { userId: string }[] }) =>
        t.members.map((m: { userId: string }) => m.userId)
      )
    );
    percentAssigned =
      totalEnrollments > 0
        ? Math.round((memberIds.size / totalEnrollments) * 100)
        : 0;
  }

  if (latestFormation && latestFormation.teams.length > 0) {
    teamsData = latestFormation.teams.map((team: TeamFromQuery) => ({
      id: team.id,
      quality: team.quality,
      createdAt: team.createdAt,
      members: team.members.map((member: TeamMemberFromQuery) => {
        const assignedSkillIds = member.assignedSkillIds ?? [];
        const assignedSkillSet = new Set(assignedSkillIds);

        type PersonSkillItem = {
          skillId: string;
          level: number;
          skill: { id: string; name: string };
        };
        const personSkills =
          member.user.personSkills?.map((skill: PersonSkillItem) => ({
            skillId: skill.skillId,
            level: skill.level ?? 0,
            name: skill.skill?.name ?? null,
          })) ?? [];

        const sortedSkills = personSkills.toSorted(
          (a, b) => (b.level ?? 0) - (a.level ?? 0)
        );
        const filteredSkills = sortedSkills.filter(skill =>
          assignedSkillSet.size === 0
            ? true
            : assignedSkillSet.has(skill.skillId)
        );
        const relevantSkills =
          filteredSkills.length > 0 ? filteredSkills : sortedSkills;
        const topSkills = Array.from(
          new Set(relevantSkills.map(skill => skill.name).filter(Boolean))
        ) as string[];

        type TopicPrefItem = {
          preference: number;
          topic: { id: string; name: string };
        };
        const topicPreferences =
          member.user.AssignmentTopicPreference?.map((pref: TopicPrefItem) => ({
            name: pref.topic?.name ?? null,
            preference: pref.preference ?? 0,
          })) ?? [];
        type TopicPrefMapped = { name: string | null; preference: number };
        const preferredTopics = topicPreferences
          .filter((pref: TopicPrefMapped) => pref.name)
          .toSorted(
            (a: TopicPrefMapped, b: TopicPrefMapped) =>
              (b.preference ?? 0) - (a.preference ?? 0)
          )
          .map((pref: TopicPrefMapped) => pref.name as string);

        return {
          id: member.id,
          assignedSkillIds,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            mbtiType: member.user.personalityProfile?.mbtiType ?? null,
            nim: member.user.nim,
            ei: member.user.personalityProfile?.ei ?? null,
            sn: member.user.personalityProfile?.sn ?? null,
            tf: member.user.personalityProfile?.tf ?? null,
            pj: member.user.personalityProfile?.pj ?? null,
            gender: member.user.gender,
          },
          topSkills,
          preferredTopics,
        };
      }),
    }));

    // Try to extract taskId mapping from responseData
    try {
      const resp = latestFormation.responseData as unknown as {
        teams?: Array<{ taskId: string }>;
      } | null;
      if (resp?.teams?.length) {
        taskIdByIndex = resp.teams.map(t => t.taskId);
      }
    } catch {
      // ignore
    }

    // Build topic name lookup from already-fetched topicRecords
    if (taskIdByIndex.length) {
      const taskIdSet = new Set(taskIdByIndex);
      topicNames = Object.fromEntries(
        topicRecords
          .filter((r: { id: string; name: string }) => taskIdSet.has(r.id))
          .map((r: { id: string; name: string }) => [r.id, r.name] as const)
      );
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
      hideStudentList={percentAssigned > 0}
      assignmentTitle={assignmentTitle}
      submittedStudentIds={Array.from(submittedStudentIds) as string[]}
    >
      <AssignmentContent
        assignmentId={assignmentId}
        classId={classId}
        courseId={classId}
        assignmentTitleLabel={assignmentTitle}
        courseNameLabel={course.namaMataKuliah}
        courseClassLabel={course.kelas}
        canManage={isDosen}
        isStudent={isMahasiswa}
        hasSubmitted={hasSubmitted}
        stats={stats}
        hasTeams={percentAssigned > 0}
        topicCount={topicCount}
        enrollmentCount={totalEnrollments}
        quizCompletionPercent={quizCompletionPercent}
        teams={teamsData}
        topicNames={topicNames}
        taskIdByIndex={taskIdByIndex}
        isTeamFormationProcessing={isTeamFormationProcessing}
        incompleteStudentCount={incompleteCount}
        currentUserId={user.id}
        enrolledStudents={enrolledStudentsList}
        submittedStudentIds={submittedStudentIds}
      />
    </AssignmentLayout>
  );
}
