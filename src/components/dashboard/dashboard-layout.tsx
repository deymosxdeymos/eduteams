'use client';

import { useTranslations } from 'next-intl';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import type { DosenCourseSummary } from '@/lib/dashboard/courses';
import type { DashboardStatistics } from '@/lib/dashboard/statistics';
import type { ExtendedUser } from '@/lib/types';
import Content from './content';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentDashboard } from './student-dashboard';

interface DashboardLayoutProps {
  user: ExtendedUser;
  statistics: DashboardStatistics;
  courses: DosenCourseSummary[];
}

export function DashboardLayout({
  user,
  statistics,
  courses,
}: DashboardLayoutProps) {
  const t = useTranslations('dashboard.layout');

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0'>
          {isDosen && <Content statistics={statistics} courses={courses} />}
          {isMahasiswa && <StudentDashboard />}
          {!isDosen && !isMahasiswa && (
            <div className='flex items-center justify-center h-full'>
              <p className='text-muted-foreground'>{t('unavailable')}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
