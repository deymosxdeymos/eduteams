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
}

export async function ManageAssignmentsLayout({
  user,
  course,
}: ManageAssignmentsLayoutProps) {
  // Transform course data to match Nav component's expected Course type
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
        <div className='px-8 pb-0 min-h-0'>
          <section className='flex h-full flex-col gap-6 rounded-3xl bg-white p-6'>
            <div className='flex items-center justify-center h-full'>
              <p className='text-muted-foreground text-sm'>
                Konten manajemen tugas akan ditambahkan di sini
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
