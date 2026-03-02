import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { DosenManageAssignmentsContent } from '@/components/dashboard/dosen-manage-assignments-content';
import { ManageAssignmentsLayout } from '@/components/dashboard/manage-assignments-layout';
import { StudentList } from '@/components/dashboard/student-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { getAuthorizedStudentsData } from '@/lib/data/course-data';
import { getManageAssignmentsForCourse } from '@/lib/data/manage-assignments';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

async function getCourseForManage(courseId: string, dosenId: string) {
  return await prisma.course.findFirst({
    where: {
      id: courseId,
      dosenId: dosenId,
    },
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<Metadata> {
  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: { id: courseId },
    select: { namaMataKuliah: true, kelas: true },
  });

  const title = course
    ? `Manage Assignments - ${course.namaMataKuliah} ${course.kelas} | EduTeams`
    : 'Manage Assignments - EduTeams';

  const description = course
    ? `Manage assignments for ${course.namaMataKuliah} - ${course.kelas}`
    : 'Manage course assignments';

  return { title, description };
}

interface ManageAssignmentsPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ManageAssignmentsPage({
  params,
}: ManageAssignmentsPageProps) {
  const user = await protectDashboard();
  const { courseId } = await params;

  if (!canAccessDosenFeatures(user)) {
    redirect('/dashboard');
  }

  const coursePromise = getCourseForManage(courseId, user.id);
  const [course, assignments, students] = await Promise.all([
    coursePromise,
    getManageAssignmentsForCourse(
      courseId,
      user.id,
      coursePromise.then(course => course?._count.enrollments ?? 0)
    ),
    getAuthorizedStudentsData(courseId, user),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <Suspense
        fallback={
          <div className='flex h-screen items-center justify-center'>
            <LoadingSpinner size='lg' />
          </div>
        }
      >
        <ManageAssignmentsLayout
          user={user}
          course={{
            id: course.id,
            namaMataKuliah: course.namaMataKuliah,
            kelas: course.kelas,
            tahunAwalPeriode: course.tahunAwalPeriode,
            tahunAkhirPeriode: course.tahunAkhirPeriode,
            periode: course.periode,
          }}
        >
          <div className='grid grid-cols-[1fr_400px] h-full min-h-0'>
            <DosenManageAssignmentsContent
              assignments={assignments}
              courseId={courseId}
            />
            <StudentList
              classId={courseId}
              initialData={students}
              currentUserId={user.id}
              canManage
            />
          </div>
        </ManageAssignmentsLayout>
      </Suspense>
    </DashboardClient>
  );
}
