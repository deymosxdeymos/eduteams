import { protectDashboard } from '@/lib/server-auth';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import Sidebar from '@/components/dashboard/sidebar';
import { updateWelcomeSplashStatus } from '@/lib/actions/dashboard';
import Nav from '@/components/dashboard/nav';
import Content from '@/components/dashboard/content';

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
      <main className='bg-accent px-10 py-8 h-screen flex flex-col'>
        <div className='mb-8'>
          <Nav />
        </div>
        <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
          <Sidebar />
          <div className='px-8 pb-0'>
            <Content />
          </div>
        </div>
      </main>
    </DashboardClient>
  );
}
