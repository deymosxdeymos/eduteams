import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { AssignmentDetailAsync } from "@/components/dashboard/async/assignment-detail-async";
import { AssignmentLayout } from "@/components/dashboard/assignment-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { DemoLocalAssignmentBody } from "@/components/demo/demo-local-assignment-body";
import { AssignmentSkeleton } from "@/components/ui/skeletons/assignment-skeleton";
import { canAccessDosenFeatures, canAccessMahasiswaFeatures } from "@/lib/authorization";
import {
  DEMO_COURSE_ID,
  getDemoAssignmentDefinitionFromSearchParams,
  getDemoAssignmentSubmissionSnapshot,
  getDemoCourse,
  getDemoSandboxPrincipalId,
  getDemoStudentsForCourse,
  isDemoSandboxAssignmentId,
  isDemoSandboxUser,
} from "@/lib/demo/sandbox";
import { getRemovedDemoStudentIdsFromCookieStore } from "@/lib/demo/sandbox-roster";
import { getDemoSubmittedAssignmentIdsFromCookieStore } from "@/lib/demo/sandbox-submissions";
import prisma from "@/lib/prisma";
import { protectDashboard } from "@/lib/server-auth";
import type { Course, ExtendedUser } from "@/lib/types";

export const dynamic = "force-dynamic";

type EnrollmentWithStudent = {
  enrolledAt: Date;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    nim: string | null;
    gender: string | null;
    personalityProfile: {
      mbtiType: string | null;
      ei: number | null;
      sn: number | null;
      tf: number | null;
      pj: number | null;
    } | null;
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const user = await protectDashboard();
  const { id } = await params;
  const { course } = await getCourseAndStudents(id, user);
  const title = course ? `${course.namaMataKuliah} - ${course.kelas} | EduTeams` : "EduTeams";
  return { title };
}

const mapEnrollmentStudents = (enrollments: EnrollmentWithStudent[]) =>
  enrollments.map((e: EnrollmentWithStudent) => ({
    id: e.student.id,
    name: e.student.name || "Unknown",
    nim: e.student.nim || "N/A",
    email: e.student.email || "N/A",
    gender: e.student.gender,
    mbtiType: e.student.personalityProfile?.mbtiType ?? null,
    ei: e.student.personalityProfile?.ei ?? null,
    sn: e.student.personalityProfile?.sn ?? null,
    tf: e.student.personalityProfile?.tf ?? null,
    pj: e.student.personalityProfile?.pj ?? null,
    enrolledAt: e.enrolledAt,
  }));

const getDosenCourseAndStudents = cache(async (courseId: string, userId: string) => {
  const [course, enrollments] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, dosenId: userId },
      include: {
        dosen: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.courseEnrollment.findMany({
      where: { courseId },
      select: {
        enrolledAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            nim: true,
            gender: true,
            personalityProfile: {
              select: {
                mbtiType: true,
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
            },
          },
        },
      },
      orderBy: { student: { name: "asc" } },
    }),
  ]);

  return {
    course: course as unknown as Course | null,
    students: mapEnrollmentStudents(enrollments),
  };
});

const getMahasiswaCourseAndStudents = cache(async (courseId: string, userId: string) => {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: userId } },
    include: {
      course: {
        include: {
          dosen: { select: { id: true, name: true, email: true } },
          enrollments: {
            select: {
              enrolledAt: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nim: true,
                  gender: true,
                  personalityProfile: {
                    select: {
                      mbtiType: true,
                      ei: true,
                      sn: true,
                      tf: true,
                      pj: true,
                    },
                  },
                },
              },
            },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
    },
  });

  if (!enrollment) {
    return { course: null, students: [] };
  }

  const { enrollments, ...course } = enrollment.course;
  return {
    course: course as unknown as Course,
    students: mapEnrollmentStudents(enrollments),
  };
});

async function getCourseAndStudents(courseId: string, user: ExtendedUser) {
  if (canAccessDosenFeatures(user)) {
    return getDosenCourseAndStudents(courseId, user.id);
  }
  if (canAccessMahasiswaFeatures(user)) {
    return getMahasiswaCourseAndStudents(courseId, user.id);
  }
  return { course: null, students: [] };
}

interface AssignmentPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
  searchParams: Promise<{
    demoTitle?: string | string[];
    demoSkill?: string | string[];
    demoTopic?: string | string[];
    demoSkillsEmpty?: string | string[];
    demoTopicsEmpty?: string | string[];
  }>;
}

export default async function AssignmentPage({ params, searchParams }: AssignmentPageProps) {
  const user = await protectDashboard();
  const { id, assignmentId } = await params;

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) {
    notFound();
  }

  if (id === DEMO_COURSE_ID && isDemoSandboxUser(user) && isDemoSandboxAssignmentId(assignmentId)) {
    const currentUserId = getDemoSandboxPrincipalId(user) ?? user.id;
    const assignmentDefinition = getDemoAssignmentDefinitionFromSearchParams(await searchParams);
    const course = getDemoCourse();
    const [removedStudentIds, submittedAssignmentIds] = await Promise.all([
      getRemovedDemoStudentIdsFromCookieStore(),
      getDemoSubmittedAssignmentIdsFromCookieStore(),
    ]);
    const students = getDemoStudentsForCourse({
      excludedStudentIds: removedStudentIds,
    }).map((student) => ({
      id: student.id,
      name: student.name,
      nim: student.nim,
      email: student.email,
      gender: student.gender,
      mbtiType: student.mbtiType,
      ei: student.ei,
      sn: student.sn,
      tf: student.tf,
      pj: student.pj,
      enrolledAt: student.enrolledAt,
    }));
    const submissionSnapshot = getDemoAssignmentSubmissionSnapshot({
      assignmentId,
      currentUserId,
      enrolledStudentIds: students.map((student) => student.id),
      submittedAssignmentIds,
    });

    return (
      <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
        <AssignmentLayout
          user={user}
          course={course}
          classId={id}
          assignmentId={assignmentId}
          students={students}
          canManage={isDosen}
          assignmentTitle={assignmentDefinition.title}
          submittedStudentIds={submissionSnapshot.submittedStudentIds}
        >
          <DemoLocalAssignmentBody
            classId={id}
            assignmentId={assignmentId}
            courseName={course.namaMataKuliah}
            courseClass={course.kelas}
            canManage={isDosen}
            isStudent={isMahasiswa}
            currentUserId={currentUserId}
            initialTitle={assignmentDefinition.title}
            initialSkills={assignmentDefinition.skills}
            initialTopics={assignmentDefinition.topics}
            initialSubmittedAssignmentIds={submittedAssignmentIds}
            enrolledStudents={students}
          />
        </AssignmentLayout>
      </DashboardClient>
    );
  }

  // Fetch course and students data
  const { course, students } = await getCourseAndStudents(id, user);
  if (!course) notFound();

  // Verify user role matches course access
  const isAuthorizedDosen = isDosen && user.id === course.dosenId;
  if (!isAuthorizedDosen && !isMahasiswa) {
    notFound();
  }

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<AssignmentSkeleton />}>
        <AssignmentDetailAsync
          user={user}
          course={course}
          classId={id}
          assignmentId={assignmentId}
          students={students}
          isDosen={isAuthorizedDosen}
          isMahasiswa={isMahasiswa}
        />
      </Suspense>
    </DashboardClient>
  );
}
