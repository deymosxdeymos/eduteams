import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { ManageLayout } from '@/components/dashboard/manage-layout';
import { CourseListSkeleton } from '@/components/ui/skeletons/course-list-skeleton';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Kelola - EduTeams',
    description: 'Kelola fitur dashboard untuk peran dosen dan mahasiswa.',
  };
}

export default async function ManagePage() {
  const user = await protectDashboard();

  if (!canAccessDosenFeatures(user) && !canAccessMahasiswaFeatures(user)) {
    redirect('/dashboard');
  }

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<CourseListSkeleton />}>
        <ManageLayout user={user} />
      </Suspense>
    </DashboardClient>
  );
}
