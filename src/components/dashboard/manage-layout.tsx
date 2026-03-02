import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import { getSidebarDataForUser } from '@/lib/dashboard/sidebar-data';
import { getManageCoursesForDosen } from '@/lib/data/manage-dashboard';
import type { ExtendedUser } from '@/lib/types';
import { DosenManageContent } from './dosen-manage-content';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentManageContent } from './student-manage-content';

interface ManageLayoutProps {
  user: ExtendedUser;
}

export async function ManageLayout({ user }: ManageLayoutProps) {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);
  const [sidebarData, courses] = await Promise.all([
    getSidebarDataForUser(user),
    isDosen ? getManageCoursesForDosen(user.id) : [],
  ]);

  return (
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
          {isDosen ? (
            <DosenManageContent courses={courses} />
          ) : isMahasiswa ? (
            <StudentManageContent user={user} />
          ) : (
            <div className='flex h-full items-center justify-center'>
              <p className='text-muted-foreground text-sm'>
                Manage dashboard belum tersedia untuk peran kamu.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
