import type { ReactNode } from 'react';
import type { ExtendedUser } from '@/lib/types';
import Nav from './nav';
import Sidebar from './sidebar';

interface ManageAssignmentsLayoutProps {
  user: ExtendedUser;
  course: {
    id: string;
    namaMataKuliah: string;
    kelas: string;
    tahunAwalPeriode: number;
    tahunAkhirPeriode: number;
    periode: string;
  };
  children: ReactNode;
}

export async function ManageAssignmentsLayout({
  user,
  course,
  children,
}: ManageAssignmentsLayoutProps) {
  const courseForNav = {
    ...course,
    dosenId: user.id,
    shareToken: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} className={courseForNav} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 pr-0 min-h-0'>{children}</div>
      </div>
    </main>
  );
}
