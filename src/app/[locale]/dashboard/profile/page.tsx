import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProfileLayout } from '@/components/dashboard/profile-layout';
import { protectDashboard } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Profil - EduTeams',
    description: 'Kelola profil dan pengaturan akun Anda',
  };
}

export default async function ProfilePage() {
  const user = await protectDashboard();

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      <Suspense
        fallback={
          <div className='flex min-h-screen items-center justify-center'>
            <LoadingSpinner size='lg' />
          </div>
        }
      >
        <ProfileLayout user={user} />
      </Suspense>
    </DashboardClient>
  );
}
