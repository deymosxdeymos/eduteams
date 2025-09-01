import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AssignmentLayout } from '@/components/dashboard/assignment-layout';
import { AssignmentTaskContent } from '@/components/dashboard/assignment-task-content';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getCourseAndStudents(
  courseId: string,
  assignmentId: string,
  user: ExtendedUser
) {
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isMahasiswa) return { course: null, students: [] };

  // Check if user has submitted the assignment
  const submission = await prisma.assignmentSubmission.findUnique({
    where: {
      assignmentId_studentId: { assignmentId, studentId: user.id },
    },
  });

  if (!submission) {
    // Redirect to quiz if not submitted
    return { course: null, students: [], needsQuiz: true };
  }

  // Get course and students data
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
  const { enrollments: _, ...course } = enrollment.course;

  return {
    course,
    students,
    needsQuiz: false,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}): Promise<Metadata> {
  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { title: true },
  });

  const title = assignment
    ? `${assignment.title} - Tugas | EduTeams`
    : 'Tugas - EduTeams';

  return { title, description: 'Halaman tugas kelompok' };
}

interface AssignmentTaskPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentTaskPage({
  params,
}: AssignmentTaskPageProps) {
  const user = await protectDashboard();
  const { id: classId, assignmentId } = await params;

  const isMahasiswa = canAccessMahasiswaFeatures(user);
  if (!isMahasiswa) notFound();

  const { course, students, needsQuiz } = await getCourseAndStudents(
    classId,
    assignmentId,
    user
  );

  if (needsQuiz) {
    // Redirect to quiz if not submitted
    return (
      <DashboardClient
        user={user}
        shouldShowSplash={false}
        isFirstVisit={false}
      >
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold mb-4'>Anda belum mengisi quiz</h1>
            <p className='text-gray-600 mb-4'>
              Silakan isi quiz terlebih dahulu untuk melanjutkan ke tugas.
            </p>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  setTimeout(() => {
                    window.location.href = '/dashboard/class/${classId}/assignments/${assignmentId}/quiz';
                  }, 2000);
                `,
              }}
            />
          </div>
        </div>
      </DashboardClient>
    );
  }

  if (!course) notFound();

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <AssignmentLayout
        user={user}
        course={course}
        classId={classId}
        assignmentId={assignmentId}
        students={students}
        canManage={false} // Students cannot manage assignments
      >
        <AssignmentTaskContent assignmentId={assignmentId} classId={classId} />
      </AssignmentLayout>
    </DashboardClient>
  );
}
