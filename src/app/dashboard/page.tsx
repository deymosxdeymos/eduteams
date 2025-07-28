import { protectDashboard } from '@/lib/server-auth';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { updateWelcomeSplashStatus } from '@/lib/actions/dashboard';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Suspense } from 'react';
import { Metadata } from 'next';

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

  if (shouldShowSplash) {
    await updateWelcomeSplashStatus();
  }
  return (
    <DashboardClient
      user={user}
      shouldShowSplash={shouldShowSplash}
      isFirstVisit={isFirstVisit}
    >
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardLayout dosenId={user.id} />
      </Suspense>
    </DashboardClient>
  );
}
