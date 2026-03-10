import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache, Suspense } from 'react';
import { ClassAssignmentsAsync } from '@/components/dashboard/async/class-assignments-async';
import { StudentClassDataAsync } from '@/components/dashboard/async/student-class-data-async';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { AssignmentListSkeleton } from '@/components/ui/skeletons/assignment-list-skeleton';
import { StudentListSkeleton } from '@/components/ui/skeletons/student-list-skeleton';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import { getAuthorizedStudentsData } from '@/lib/data/course-data';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

const getDosenCourseData = cache(async (id: string, userId: string) =>
  prisma.course.findFirst({
    where: { id, dosenId: userId },
    include: {
      dosen: {
        select: { id: true, name: true, email: true },
      },
    },
  })
);

const getMahasiswaCourseData = cache(async (id: string, userId: string) =>
  prisma.course.findFirst({
    where: {
      id,
      enrollments: { some: { studentId: userId } },
    },
    include: {
      dosen: {
        select: { id: true, name: true, email: true },
      },
    },
  })
);

async function getCourseData(id: string, user: ExtendedUser) {
  if (canAccessDosenFeatures(user)) {
    return getDosenCourseData(id, user.id);
  }
  if (canAccessMahasiswaFeatures(user)) {
    return getMahasiswaCourseData(id, user.id);
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await protectDashboard();
  const { id } = await params;
  const course = await getCourseData(id, user);

  const title = course
    ? `${course.namaMataKuliah} - ${course.kelas} | EduTeams`
    : 'Kelas - EduTeams';

  const description = course
    ? `Kelola kelas ${course.namaMataKuliah} - ${course.kelas}`
    : 'Halaman detail kelas';

  return { title, description };
}

interface ClassPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  const user = await protectDashboard();
  const { id } = await params;

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) {
    notFound();
  }

  const [course, studentsData] = await Promise.all([
    getCourseData(id, user),
    getAuthorizedStudentsData(id, user),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <DashboardClient shouldShowSplash={false} isFirstVisit={false}>
      <div className='space-y-6'>
        {isDosen && (
          <Suspense fallback={<StudentListSkeleton />}>
            <ClassAssignmentsAsync
              courseId={id}
              classId={id}
              user={user}
              course={course}
              studentsData={studentsData}
            />
          </Suspense>
        )}
        {isMahasiswa && (
          <Suspense fallback={<AssignmentListSkeleton />}>
            <StudentClassDataAsync
              classId={id}
              user={user}
              course={course}
              studentsData={studentsData}
            />
          </Suspense>
        )}
      </div>
    </DashboardClient>
  );
}
