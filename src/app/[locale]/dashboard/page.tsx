import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { DashboardCoursesAsync } from '@/components/dashboard/async/dashboard-courses-async';
import { getStatsOrEmpty } from '@/components/dashboard/async/dashboard-stats-async';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import Nav from '@/components/dashboard/nav';
import Sidebar from '@/components/dashboard/sidebar';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { CourseListSkeleton } from '@/components/ui/skeletons/course-list-skeleton';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import { getSidebarData } from '@/lib/dashboard/sidebar-data';
import { getStudentClasses } from '@/lib/dashboard/student-classes';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard - EduTeams',
    description: 'Your team management dashboard',
  };
}

export default async function Dashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ firstVisit?: string }>;
}) {
  const user = await protectDashboard();
  await params;
  const t = await getTranslations('dashboard.layout');
  const searchParamsResolved = await searchParams;

  const isFirstVisit = searchParamsResolved.firstVisit === 'true';
  const shouldShowSplash = isFirstVisit && !user.hasSeenWelcomeSplash;

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  // Get statistics synchronously for dosen
  const statistics = isDosen ? await getStatsOrEmpty(user.id) : null;

  // Get sidebar data and student classes server-side
  const sidebarData = await getSidebarData();
  const studentClasses = isMahasiswa ? await getStudentClasses() : [];

  return (
    <DashboardClient
      user={user}
      shouldShowSplash={shouldShowSplash}
      isFirstVisit={isFirstVisit}
    >
      <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
        <div className='mb-8'>
          <Nav user={user} />
        </div>
        <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
          <Sidebar
            user={sidebarData.user}
            notStartedCount={sidebarData.notStartedCount}
          />
          <div className='px-8 pb-0 min-h-0'>
            {isDosen && statistics && (
              <Suspense fallback={<CourseListSkeleton />}>
                <DashboardCoursesAsync user={user} statistics={statistics} />
              </Suspense>
            )}
            {isMahasiswa && <StudentDashboard classes={studentClasses} />}
            {!isDosen && !isMahasiswa && (
              <div className='flex items-center justify-center h-full'>
                <p className='text-muted-foreground'>{t('unavailable')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardClient>
  );
}
