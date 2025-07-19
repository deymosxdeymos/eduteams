import { protectDashboard } from '@/lib/server-auth';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { updateWelcomeSplashStatus } from '@/lib/actions/dashboard';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

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
      <DashboardLayout />
    </DashboardClient>
  );
}
