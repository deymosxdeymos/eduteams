import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { AssignmentAnswersTabs } from "@/components/dashboard/assignment-answers-tabs";
import { AssignmentLayout } from "@/components/dashboard/assignment-layout";
import { AssignmentQuizClient } from "@/components/dashboard/assignment-quiz-client";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { getLocalizedHref } from "@/i18n/routing";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import { parseAssignmentDescription } from "@/lib/assignment-description";
import {
  getStudentCompetencyPrefills,
  normalizeTopicKey,
} from "@/lib/data/student-competency-profiles";
import {
  DEMO_COURSE_ID,
  buildDemoAssignmentHref,
  buildDemoSandboxUser,
  getDemoAssignmentAnswersView,
  getDemoAssignmentDefinitionFromSearchParams,
  getDemoCourse,
  getDemoSandboxPrincipalId,
  isDemoSandboxAssignmentId,
  isDemoSandboxUser,
} from "@/lib/demo/sandbox";
import { getRemovedDemoStudentIdsFromCookieStore } from "@/lib/demo/sandbox-roster";
import { getDemoSubmittedAssignmentIdsFromCookieStore } from "@/lib/demo/sandbox-submissions";
import { buildAssignmentAnswerRows } from "@/lib/dashboard/assignment-answer-rows";
import { getAssignmentAnswerView } from "@/lib/dashboard/assignment-answer-view";
import { getMBTIQuestions } from "@/lib/mbti-questions-simple";
import prisma from "@/lib/prisma";
import { protectDashboard } from "@/lib/server-auth";
import type { Course, ExtendedUser } from "@/lib/types";
import { getMBTIType } from "@/lib/utils/mbti-helpers";

type SubmittedView = {
  title: string;
  skills: Array<{ name: string; level: number | null }>;
  topics: Array<{ name: string; preference: number | null }>;
};
type SubmittedData = { hasSubmitted: true; view: SubmittedView };
type UnsubmittedData = {
  hasSubmitted: false;
  assignment: {
    id: string;
    title: string;
    skills: string[];
    topics: string[];
    hasTopics: boolean;
    skillPrefills: Array<{
      name: string;
      level: number | null;
      profileId?: string | null;
      profileUpdatedAt?: string | null;
      sourceAssignmentId?: string | null;
    }>;
    topicPrefills: Array<{
      name: string;
      preference: number | null;
      profileId?: string | null;
      profileUpdatedAt?: string | null;
      sourceAssignmentId?: string | null;
    }>;
  };
};
type AssignmentData = SubmittedData | UnsubmittedData;

export const dynamic = "force-dynamic";

const getAssignmentRecord = cache(async (assignmentId: string) =>
  prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      title: true,
      description: true,
      AssignmentTopic: {
        select: {
          id: true,
          name: true,
        },
      },
      structureVersion: true,
    },
  }),
);

async function getAssignmentData(
  assignmentId: string,
  user: ExtendedUser,
): Promise<AssignmentData | null> {
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isMahasiswa) return null;

  // Check if user has already submitted
  const existingSubmission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: user.id },
    },
  });

  if (existingSubmission) {
    const answersView = await getAssignmentAnswerView(assignmentId, user.id);

    if (!answersView) return null;

    return {
      hasSubmitted: true as const,
      view: answersView,
    };
  }

  // Get assignment with skills and topics
  const assignment = await getAssignmentRecord(assignmentId);

  if (!assignment) return null;

  const { skills, topics } = parseAssignmentDescription(assignment.description);
  const hasTopics = topics.length > 0;

  const prefills = await getStudentCompetencyPrefills({
    studentId: user.id,
    skillNames: skills,
    topicNames: topics,
  });

  const skillPrefillMap = new Map(
    prefills.skills.map((prefill) => [prefill.name.trim().toLowerCase(), prefill]),
  );
  const topicPrefillMap = new Map(
    prefills.topics.map((prefill) => [normalizeTopicKey(prefill.name), prefill]),
  );

  const skillPrefills = skills.map((name) => {
    const match = skillPrefillMap.get(name.trim().toLowerCase());
    return {
      name,
      level: match?.level ?? null,
      profileId: match?.profileId ?? null,
      profileUpdatedAt: match?.profileUpdatedAt ? match.profileUpdatedAt.toISOString() : null,
      sourceAssignmentId: match?.sourceAssignmentId ?? null,
    };
  });
  const topicPrefills = topics.map((name) => {
    const match = topicPrefillMap.get(normalizeTopicKey(name));
    return {
      name,
      preference: match?.preference ?? null,
      profileId: match?.profileId ?? null,
      profileUpdatedAt: match?.profileUpdatedAt ? match.profileUpdatedAt.toISOString() : null,
      sourceAssignmentId: match?.sourceAssignmentId ?? null,
    };
  });

  return {
    hasSubmitted: false as const,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      skills,
      topics,
      hasTopics,
      skillPrefills,
      topicPrefills,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const user = await protectDashboard();
  const { assignmentId } = await params;

  if (!canAccessMahasiswaFeatures(user)) {
    notFound();
  }

  const assignment = await getAssignmentRecord(assignmentId);

  const title = assignment ? `${assignment.title} - Quiz | EduTeams` : "Quiz - EduTeams";

  return { title };
}

interface AssignmentQuizPageProps {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
  searchParams: Promise<{
    demoTitle?: string | string[];
    demoSkill?: string | string[];
    demoTopic?: string | string[];
    demoSkillsEmpty?: string | string[];
    demoTopicsEmpty?: string | string[];
  }>;
}

export default async function AssignmentQuizPage({
  params,
  searchParams,
}: AssignmentQuizPageProps) {
  const user = await protectDashboard();
  const { locale, id: classId, assignmentId } = await params;

  const isMahasiswa = canAccessMahasiswaFeatures(user);
  if (!isMahasiswa) notFound();

  const resolvedSearchParams = await searchParams;
  const isDemoAssignmentRoute =
    classId === DEMO_COURSE_ID &&
    isDemoSandboxUser(user) &&
    isDemoSandboxAssignmentId(assignmentId);

  let data: AssignmentData | null = null;
  let demoSubmittedUser: ExtendedUser | null = null;
  let demoPersonalityAnswers: Record<string, number> | null = null;
  let demoBackHref: string | null = null;
  let demoCourse: Course | null = null;

  if (isDemoAssignmentRoute) {
    const assignmentDefinition = getDemoAssignmentDefinitionFromSearchParams(resolvedSearchParams);
    const currentUserId = getDemoSandboxPrincipalId(user) ?? user.id;
    const [removedStudentIds, submittedAssignmentIds] = await Promise.all([
      getRemovedDemoStudentIdsFromCookieStore(),
      getDemoSubmittedAssignmentIdsFromCookieStore(),
    ]);

    if (removedStudentIds.includes(currentUserId)) {
      notFound();
    }

    const hasSubmittedDemoAssignment = submittedAssignmentIds.includes(assignmentId);

    if (hasSubmittedDemoAssignment) {
      const answersView = getDemoAssignmentAnswersView(currentUserId, assignmentDefinition);
      if (!answersView) {
        notFound();
      }

      demoSubmittedUser = buildDemoSandboxUser("STUDENT");
      demoPersonalityAnswers =
        (demoSubmittedUser.personalityData as { answers?: Record<string, number> } | null)
          ?.answers ?? null;
      demoBackHref = getLocalizedHref(
        locale,
        buildDemoAssignmentHref({
          classId,
          assignmentId,
          title: assignmentDefinition.title,
          skills: assignmentDefinition.skills,
          topics: assignmentDefinition.topics,
        }),
      );
      demoCourse = getDemoCourse();
      data = {
        hasSubmitted: true,
        view: answersView,
      };
    } else {
      data = {
        hasSubmitted: false,
        assignment: {
          id: assignmentId,
          title: assignmentDefinition.title,
          skills: assignmentDefinition.skills,
          topics: assignmentDefinition.topics,
          hasTopics: assignmentDefinition.topics.length > 0,
          skillPrefills: [],
          topicPrefills: [],
        },
      };
    }
  } else {
    data = await getAssignmentData(assignmentId, user);
  }

  if (!data) notFound();

  if (data.hasSubmitted) {
    const answers = data.view;

    // Fetch course for layout (student context) and hide student list
    const enrollment = demoCourse
      ? null
      : await prisma.courseEnrollment.findUnique({
          where: { courseId_studentId: { courseId: classId, studentId: user.id } },
          include: {
            course: {
              include: {
                dosen: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
    if (!demoCourse && !enrollment) notFound();
    const course = demoCourse ?? (enrollment?.course as unknown as Course);

    const [mbtiQuestions, userRecord, tActions] = await Promise.all([
      getMBTIQuestions(locale),
      demoSubmittedUser
        ? Promise.resolve(null)
        : prisma.user.findUnique({
            where: { id: user.id },
            select: {
              personalityProfile: { select: { personalityData: true } },
            },
          }),
      getTranslations("dashboard.assignment.actions"),
    ]);
    const personalityJson = userRecord?.personalityProfile?.personalityData as unknown as {
      answers?: Record<string, number>;
    } | null;
    const personalityAnswers =
      demoPersonalityAnswers ?? ((personalityJson?.answers ?? {}) as Record<string, number>);
    const submittedUser = demoSubmittedUser ?? user;
    const submittedUserMbtiType = getMBTIType(submittedUser);
    const { personalityRows, skillRows, topicRows } = buildAssignmentAnswerRows({
      mbtiQuestions,
      personalityAnswers,
      skills: answers.skills ?? [],
      topics: answers.topics ?? [],
    });

    return (
      <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
        <AssignmentLayout
          user={user}
          course={course}
          classId={classId}
          assignmentId={assignmentId}
          students={[]}
          canManage={false}
          hideStudentList
          assignmentTitle={answers.title}
          answersCrumb
        >
          <div className="flex flex-col p-6 gap-6">
            <div className="flex items-center">
              <Link
                href={
                  demoBackHref ??
                  getLocalizedHref(
                    locale,
                    `/dashboard/class/${classId}/assignments/${assignmentId}`,
                  )
                }
                className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-black"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-bold">{tActions("back")}</span>
              </Link>
            </div>
            <ProfileHeader user={submittedUser} hideEditButton />
            <AssignmentAnswersTabs
              personalityRows={personalityRows}
              skills={skillRows}
              topics={topicRows}
              mbtiType={submittedUserMbtiType}
            />
          </div>
        </AssignmentLayout>
      </DashboardClient>
    );
  }

  if (!data.assignment) {
    notFound();
  }

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <AssignmentQuizClient
        classId={classId}
        assignmentId={assignmentId}
        assignment={data.assignment}
      />
    </DashboardClient>
  );
}
