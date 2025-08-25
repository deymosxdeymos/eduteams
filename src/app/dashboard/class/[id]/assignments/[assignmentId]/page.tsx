import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { canAccessDosenFeatures, canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { Course, ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

async function getCourseAndStudents(
  courseId: string,
  user: ExtendedUser
): Promise<{ course: Course | null; students: Array<{ id: string; name: string; nim: string; email: string; mbtiType?: string | null; ei?: number | null; sn?: number | null; tf?: number | null; pj?: number | null; enrolledAt: Date }>; }> {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) return { course: null, students: [] };

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
              nimNpm: true,
              mbtiType: true,
              ei: true,
              sn: true,
              tf: true,
              pj: true,
            },
          },
        },
        orderBy: { student: { name: 'asc' } },
      }),
    ]);

    const students = enrollments.map(e => ({
      id: e.student.id,
      name: e.student.name || 'Unknown',
      nim: e.student.nimNpm || 'N/A',
      email: e.student.email || 'N/A',
      mbtiType: e.student.mbtiType,
      ei: e.student.ei,
      sn: e.student.sn,
      tf: e.student.tf,
      pj: e.student.pj,
      enrolledAt: e.enrolledAt,
    }));

    return { course: course as unknown as Course, students };
  }

  // mahasiswa
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
                  nimNpm: true,
                  mbtiType: true,
                  ei: true,
                  sn: true,
                  tf: true,
                  pj: true,
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

  const students = enrollment.course.enrollments.map(e => ({
    id: e.student.id,
    name: e.student.name || 'Unknown',
    nim: e.student.nimNpm || 'N/A',
    email: e.student.email || 'N/A',
    mbtiType: e.student.mbtiType,
    ei: e.student.ei,
    sn: e.student.sn,
    tf: e.student.tf,
    pj: e.student.pj,
    enrolledAt: e.enrolledAt,
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enrollments: _ignored, ...course } = enrollment.course;
  return { course: course as unknown as Course, students };
}

interface AssignmentPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const user = await protectDashboard();
  const { id, assignmentId } = await params;

  const { course, students } = await getCourseAndStudents(id, user);
  if (!course) notFound();

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<div>Loading...</div>}>
        <AssignmentLayout
          user={user}
          course={course}
          classId={id}
          assignmentId={assignmentId}
          students={students}
          canManage={user.role === 'dosen' && user.id === course.dosenId}
        >
          {/* TODO: Assignment content will be implemented later */}
        </AssignmentLayout>
      </Suspense>
    </DashboardClient>
  );
}
