import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { updateWelcomeSplashStatus } from '@/lib/actions/dashboard';
import { canAccessDosenFeatures } from '@/lib/authorization';
import {
  type DosenCourseSummary,
  getCoursesForDosen,
} from '@/lib/dashboard/courses';
import {
  EMPTY_DASHBOARD_STATISTICS,
  getDashboardStatisticsForUser,
} from '@/lib/dashboard/statistics';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Dashboard - EduTeams',
    description: 'Your team management dashboard',
  };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ firstVisit?: string }>;
}) {
  const user = await protectDashboard();
  const params = await searchParams;

  const isFirstVisit = params.firstVisit === 'true';
  const shouldShowSplash = isFirstVisit && !user.hasSeenWelcomeSplash;

  let statistics = EMPTY_DASHBOARD_STATISTICS;
  let courses: DosenCourseSummary[] = [];

  if (canAccessDosenFeatures(user)) {
    [statistics, courses] = await Promise.all([
      getDashboardStatisticsForUser(user.id),
      getCoursesForDosen(user.id),
    ]);
  }

  if (shouldShowSplash) {
    await updateWelcomeSplashStatus();
  }
  return (
    <DashboardClient
      user={user}
      shouldShowSplash={shouldShowSplash}
      isFirstVisit={isFirstVisit}
    >
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center'>
            <LoadingSpinner size='lg' />
          </div>
        }
      >
        <DashboardLayout
          user={user}
          statistics={statistics}
          courses={courses}
        />
      </Suspense>
    </DashboardClient>
  );
}
