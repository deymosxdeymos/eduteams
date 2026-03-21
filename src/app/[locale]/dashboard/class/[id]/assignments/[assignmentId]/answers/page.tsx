import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AnswersControlsClient } from "@/components/dashboard/answers-controls-client";
import { AssignmentAnswersTabs } from "@/components/dashboard/assignment-answers-tabs";
import { AssignmentLayout } from "@/components/dashboard/assignment-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ProfileHeader } from "@/components/dashboard/profile-header";
import { getLocalizedHref } from "@/i18n/routing";
import { canAccessDosenFeatures } from "@/lib/authorization";
import { getMBTIQuestions } from "@/lib/mbti-questions-simple";
import prisma from "@/lib/prisma";
import { protectDashboard } from "@/lib/server-auth";
import type { Course, ExtendedUser } from "@/lib/types";
import { buildAssignmentAnswerRows } from "@/lib/dashboard/assignment-answer-rows";
import { getAssignmentAnswerView } from "@/lib/dashboard/assignment-answer-view";
import { getMBTIType } from "@/lib/utils/mbti-helpers";

export const dynamic = "force-dynamic";

const getAssignmentTitle = cache(async (assignmentId: string) =>
  prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  }),
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const { assignmentId } = await params;
  const [assignment, t] = await Promise.all([
    getAssignmentTitle(assignmentId),
    getTranslations("dashboard.assignment"),
  ]);
  const answersLabel = t("answersTabs.personality");
  const title = assignment
    ? `${assignment.title} - ${answersLabel} | EduTeams`
    : `${answersLabel} - EduTeams`;
  return { title };
}

async function getCourseForDosen(courseId: string, dosenId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, dosenId },
    include: { dosen: { select: { id: true, name: true, email: true } } },
  });
  return course as unknown as Course | null;
}

async function getSubmittedStudents(assignmentId: string) {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    select: {
      studentId: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          role: true,
          image: true,
          gender: true,
          personalityProfile: {
            select: {
              mbtiType: true,
              ei: true,
              sn: true,
              tf: true,
              pj: true,
              personalityData: true,
            },
          },
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  });
  return submissions.map((s: (typeof submissions)[number]) => {
    const { personalityProfile, ...rest } = s.student;
    return {
      ...rest,
      mbtiType: personalityProfile?.mbtiType ?? null,
      ei: personalityProfile?.ei ?? null,
      sn: personalityProfile?.sn ?? null,
      tf: personalityProfile?.tf ?? null,
      pj: personalityProfile?.pj ?? null,
      personalityData: personalityProfile?.personalityData ?? null,
    };
  });
}

interface AnswersPageProps {
  params: Promise<{ locale: string; id: string; assignmentId: string }>;
  searchParams: Promise<{
    studentId?: string | string[];
  }>;
}

export default async function AssignmentAnswersPage({ params, searchParams }: AnswersPageProps) {
  const user = await protectDashboard();
  const { locale, id: classId, assignmentId } = await params;
  const isDosen = canAccessDosenFeatures(user);
  if (!isDosen) notFound();
  const tAssignment = await getTranslations("dashboard.assignment");
  const sp = await searchParams;

  const [course, students] = await Promise.all([
    getCourseForDosen(classId, user.id),
    getSubmittedStudents(assignmentId),
  ]);
  if (!course) notFound();
  const studentsLite = students.map((s: (typeof students)[number]) => ({
    id: s.id,
    name: s.name ?? "Mahasiswa",
  }));
  let currentIndex = 0;
  const requestedStudentId = Array.isArray(sp.studentId) ? sp.studentId[0] : sp.studentId;
  if (requestedStudentId) {
    const idx = students.findIndex((s: (typeof students)[number]) => s.id === requestedStudentId);
    currentIndex = idx >= 0 ? idx : 0;
  }
  const selected = students[currentIndex];

  // If there are no submissions yet, show an empty state
  if (!selected) {
    const assignmentTitle =
      (await getAssignmentTitle(assignmentId))?.title ?? tAssignment("defaultTitle");

    return (
      <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
        <AssignmentLayout
          user={user}
          course={course}
          classId={classId}
          students={[]}
          canManage={true}
          hideStudentList
          assignmentTitle={assignmentTitle}
          answersCrumb
        >
          <div className="flex flex-col p-6 gap-6">
            <AnswersControlsClient
              backHref={getLocalizedHref(
                locale,
                `/dashboard/class/${classId}/assignments/${assignmentId}`,
              )}
              students={studentsLite}
              currentIndex={0}
              baseHref={getLocalizedHref(
                locale,
                `/dashboard/class/${classId}/assignments/${assignmentId}/answers`,
              )}
            />
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-neutral-600">
                {tAssignment("answersTabs.emptyAnswers")}
              </div>
            </div>
          </div>
        </AssignmentLayout>
      </DashboardClient>
    );
  }

  // Build ExtendedUser-like object for ProfileHeader
  const selectedUser = selected as unknown as ExtendedUser;

  const [answersView, mbtiQuestions] = await Promise.all([
    getAssignmentAnswerView(assignmentId, selected.id),
    getMBTIQuestions(locale),
  ]);
  const assignmentTitle = answersView?.title ?? tAssignment("defaultTitle");
  const personalityJson = selected.personalityData as unknown as {
    answers?: Record<string, number>;
  } | null;
  const personalityAnswers = (personalityJson?.answers ?? {}) as Record<string, number>;

  const mbtiType = getMBTIType(selectedUser);
  const { personalityRows, skillRows, topicRows } = buildAssignmentAnswerRows({
    mbtiQuestions,
    personalityAnswers,
    skills: answersView?.skills ?? [],
    topics: answersView?.topics ?? [],
  });

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <AssignmentLayout
        user={user}
        course={course}
        classId={classId}
        students={[]}
        canManage={true}
        hideStudentList
        assignmentTitle={assignmentTitle}
        answersCrumb
      >
        <div className="flex flex-col p-6 gap-6">
          <AnswersControlsClient
            backHref={getLocalizedHref(
              locale,
              `/dashboard/class/${classId}/assignments/${assignmentId}`,
            )}
            students={studentsLite}
            currentIndex={currentIndex}
            baseHref={getLocalizedHref(
              locale,
              `/dashboard/class/${classId}/assignments/${assignmentId}/answers`,
            )}
          />
          <ProfileHeader user={selectedUser} hideEditButton />

          <AssignmentAnswersTabs
            personalityRows={personalityRows}
            skills={skillRows}
            topics={topicRows}
            mbtiType={mbtiType}
          />
        </div>
      </AssignmentLayout>
    </DashboardClient>
  );
}
