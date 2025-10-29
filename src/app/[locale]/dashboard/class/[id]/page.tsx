import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ClassAssignmentsAsync } from '@/components/dashboard/async/class-assignments-async';
import { StudentClassDataAsync } from '@/components/dashboard/async/student-class-data-async';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { AssignmentListSkeleton } from '@/components/ui/skeletons/assignment-list-skeleton';
import { StudentListSkeleton } from '@/components/ui/skeletons/student-list-skeleton';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import { getStudentsData } from '@/lib/data/course-data';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { ExtendedUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Get full course data for rendering
async function getCourseData(id: string, user: ExtendedUser) {
  const isDosen = canAccessDosenFeatures(user);

  if (isDosen) {
    return await prisma.course.findFirst({
      where: { id, dosenId: user.id },
      include: {
        dosen: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: { courseId: id, studentId: user.id },
    },
    include: {
      course: {
        include: {
          dosen: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return enrollment?.course ?? null;
}

// Lightweight course check - only verifies access
async function verifyCourseAccess(id: string, user: ExtendedUser) {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (isDosen) {
    return await prisma.course.findFirst({
      where: { id, dosenId: user.id },
      select: { id: true },
    });
  }

  if (isMahasiswa) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: { courseId: id, studentId: user.id },
      },
      select: { courseId: true },
    });
    return enrollment ? { id: enrollment.courseId } : null;
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Lightweight query for metadata only
  const course = await prisma.course.findFirst({
    where: { id },
    select: { namaMataKuliah: true, kelas: true },
  });

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

  // Quick access verification
  const hasAccess = await verifyCourseAccess(id, user);
  if (!hasAccess) {
    notFound();
  }

  // Fetch minimal course data needed for initial render
  const course = await getCourseData(id, user);
  if (!course) {
    notFound();
  }

  // Fetch students list (quick query for initial data)
  const studentsData = await getStudentsData(id);

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <div className='space-y-6'>
        {isDosen && (
          <Suspense fallback={<StudentListSkeleton />}>
            <ClassAssignmentsAsync
              courseId={id}
              classId={id}
              dosenId={user.id}
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
