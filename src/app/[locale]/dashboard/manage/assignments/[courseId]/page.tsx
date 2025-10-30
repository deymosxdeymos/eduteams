import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ManageAssignmentsLayout } from '@/components/dashboard/manage-assignments-layout';
import { ManageAssignmentsView } from '@/components/dashboard/manage-assignments-view';
import { StudentList } from '@/components/dashboard/student-list';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { getStudentsData } from '@/lib/data/course-data';
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

  const course = await getCourseForManage(courseId, user.id);

  if (!course) {
    notFound();
  }

  const assignments = await getManageAssignmentsForCourse(courseId, user.id);
  const students = await getStudentsData(courseId);

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense
        fallback={
          <div className='flex h-screen items-center justify-center'>
            <LoadingSpinner size='lg' />
          </div>
        }
      >
        <ManageAssignmentsLayout user={user} course={course}>
          <div className='grid grid-cols-[1fr_400px] h-full min-h-0'>
            <ManageAssignmentsView
              assignments={assignments}
              courseId={courseId}
              searchPlaceholder='Cari tugas…'
              emptyActiveMessage='Belum ada tugas aktif'
              emptyArchivedMessage='Belum ada tugas yang diarsipkan'
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
