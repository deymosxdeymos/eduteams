import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ClassPageLayout } from '@/components/dashboard/class-page-layout';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { StudentClassPageLayout } from '@/components/dashboard/student-class-page-layout';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';

type CourseResult = {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
  dosenId: string;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Get course name for metadata
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

  return {
    title,
    description,
  };
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

  let course: CourseResult | null = null;

  if (isDosen) {
    // Dosen: Ensure they can only access their own courses
    course = await prisma.course.findFirst({
      where: {
        id,
        dosenId: user.id,
      },
    });
  } else if (isMahasiswa) {
    // Student: Ensure they are enrolled in the course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: id,
          studentId: user.id,
        },
      },
      include: {
        course: true,
      },
    });
    course = enrollment?.course || null;
  }

  if (!course) {
    notFound();
  }

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<div>Loading class...</div>}>
        {isDosen && (
          <ClassPageLayout
            classId={id}
            dosenId={user.id}
            user={user}
            course={course}
          />
        )}
        {isMahasiswa && (
          <StudentClassPageLayout classId={id} user={user} course={course} />
        )}
      </Suspense>
    </DashboardClient>
  );
}
