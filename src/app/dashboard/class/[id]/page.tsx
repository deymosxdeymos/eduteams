import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ClassPageLayout } from '@/components/dashboard/class-page-layout';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';

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

  // Fetch class data for breadcrumb
  const course = await prisma.course.findFirst({
    where: {
      id,
      dosenId: user.id, // Ensure dosen can only access their own courses
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<div>Loading class...</div>}>
        <ClassPageLayout
          classId={id}
          dosenId={user.id}
          user={user}
          course={course}
        />
      </Suspense>
    </DashboardClient>
  );
}
