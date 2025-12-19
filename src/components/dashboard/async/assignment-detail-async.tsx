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
    submittedForAssignment.map((s: { studentId: string }) => s.studentId)
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
      select: {
        studentId: true,
        student: {
          select: {
            personalityProfile: {
              select: {
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
            },
          },
        },
      },
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
        assignmentId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        teams: { include: { members: true } },
      },
    });
    if (latest) {
      const memberIds = new Set(
        latest.teams.flatMap((t: { members: { userId: string }[] }) =>
          t.members.map((m: { userId: string }) => m.userId)
        )
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

  // Calculate how many students haven't submitted the assignment quiz
  const incompleteCount = totalEnrollments - submittedStudentIds.size;

  // Build enrolled students list for edit mode
  const enrolledStudents = await prisma.courseEnrollment.findMany({
    where: { courseId: classId },
    select: {
      student: {
        select: {
          id: true,
          name: true,
          nim: true,
          email: true,
          personalityProfile: {
            select: {
              mbtiType: true,
            },
          },
          gender: true,
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });

  const enrolledStudentsList = enrolledStudents.map(
    (e: {
      student: {
        id: string;
        name: string;
        nim: string | null;
        email: string;
        personalityProfile: { mbtiType: string | null } | null;
        gender: string | null;
      };
    }) => ({
      id: e.student.id,
      name: e.student.name,
      nim: e.student.nim,
      email: e.student.email,
      mbtiType: e.student.personalityProfile?.mbtiType ?? null,
      gender: e.student.gender,
    })
  );

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
        ei: number | null;
        sn: number | null;
        tf: number | null;
        pj: number | null;
      };
    }>;
  }> = [];
  let topicNames: Record<string, string> = {};
  let taskIdByIndex: string[] = [];

  if (assignment && percentAssigned > 0) {
    const latest = await prisma.teamFormationRequest.findFirst({
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
    });

    if (latest && latest.teams.length > 0) {
      teamsData = latest.teams.map((team: TeamFromQuery) => ({
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

          const sortedSkills = [...personSkills].sort(
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
            member.user.AssignmentTopicPreference?.map(
              (pref: TopicPrefItem) => ({
                name: pref.topic?.name ?? null,
                preference: pref.preference ?? 0,
              })
            ) ?? [];
          type TopicPrefMapped = { name: string | null; preference: number };
          const preferredTopics = topicPreferences
            .filter((pref: TopicPrefMapped) => pref.name)
            .sort(
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
          topicRecordsWithNames.map(
            (r: { id: string; name: string }) => [r.id, r.name] as const
          )
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
        enrollmentCount={enrollments.length}
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
