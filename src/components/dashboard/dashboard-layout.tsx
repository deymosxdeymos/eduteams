import type { ExtendedUser } from '@/lib/types';
import Content from './content';
import Nav from './nav';
import Sidebar from './sidebar';

interface DashboardLayoutProps {
  dosenId: string;
  user: ExtendedUser;
}

export function DashboardLayout({ dosenId, user }: DashboardLayoutProps) {
  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0'>
          <Content dosenId={dosenId} />
        </div>
      </div>
    </main>
  );
}
