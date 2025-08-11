import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { MBTIOverviewLayout } from '@/components/dashboard/mbti-overview-layout';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Persebaran MBTI - EduTeams',
    description: 'Lihat persebaran dan daftar semua tipe MBTI',
  };
}

export default async function MBTIOverviewPage() {
  const user = await protectDashboard();

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense fallback={<div>Loading...</div>}>
        <MBTIOverviewLayout user={user} />
      </Suspense>
    </DashboardClient>
  );
}
