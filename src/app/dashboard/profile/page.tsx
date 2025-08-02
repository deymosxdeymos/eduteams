import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
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
      <Suspense fallback={<div>Loading profile...</div>}>
        <ProfileLayout user={user} />
      </Suspense>
    </DashboardClient>
  );
}
