import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AssignmentDetailAsync } from '@/components/dashboard/async/assignment-detail-async';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { AssignmentSkeleton } from '@/components/ui/skeletons/assignment-skeleton';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { Course, ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

type EnrollmentWithStudent = {
  enrolledAt: Date;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    nim: string | null;
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
  const { id } = await params;
  const course = await prisma.course.findFirst({
    where: { id },
    select: { namaMataKuliah: true, kelas: true },
  });
  const title = course
    ? `${course.namaMataKuliah} - ${course.kelas} | Tugas | EduTeams`
    : 'Tugas - EduTeams';
  const description = course
    ? `Detail tugas untuk ${course.namaMataKuliah} - ${course.kelas}`
    : 'Halaman detail tugas';
  return { title, description };
}

// Get full course and student data
async function getCourseAndStudents(courseId: string, user: ExtendedUser) {
  const isDosen = canAccessDosenFeatures(user);

  if (isDosen) {
    const [course, enrollments] = await Promise.all([
      prisma.course.findFirst({
        where: { id: courseId, dosenId: user.id },
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
        orderBy: { student: { name: 'asc' } },
      }),
    ]);

    const students = enrollments.map((e: EnrollmentWithStudent) => ({
      id: e.student.id,
      name: e.student.name || 'Unknown',
      nim: e.student.nim || 'N/A',
      email: e.student.email || 'N/A',
      mbtiType: e.student.personalityProfile?.mbtiType ?? null,
      ei: e.student.personalityProfile?.ei ?? null,
      sn: e.student.personalityProfile?.sn ?? null,
      tf: e.student.personalityProfile?.tf ?? null,
      pj: e.student.personalityProfile?.pj ?? null,
      enrolledAt: e.enrolledAt,
    }));

    return { course: course as unknown as Course, students };
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: user.id } },
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
            orderBy: { student: { name: 'asc' } },
          },
        },
      },
    },
  });

  if (!enrollment) return { course: null, students: [] };

  const students = enrollment.course.enrollments.map(
    (e: EnrollmentWithStudent) => ({
      id: e.student.id,
      name: e.student.name || 'Unknown',
      nim: e.student.nim || 'N/A',
      email: e.student.email || 'N/A',
      mbtiType: e.student.personalityProfile?.mbtiType ?? null,
      ei: e.student.personalityProfile?.ei ?? null,
      sn: e.student.personalityProfile?.sn ?? null,
      tf: e.student.personalityProfile?.tf ?? null,
      pj: e.student.personalityProfile?.pj ?? null,
      enrolledAt: e.enrolledAt,
    })
  );

  const { enrollments: _enrollments, ...course } = enrollment.course;
  return { course: course as unknown as Course, students };
}

interface AssignmentPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const user = await protectDashboard();
  const { id, assignmentId } = await params;

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) {
    notFound();
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
