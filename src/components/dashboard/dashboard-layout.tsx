import Nav from './nav';
import Sidebar from './sidebar';
import Content from './content';

export function DashboardLayout() {
  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0'>
          <Content />
        </div>
      </div>
    </main>
  );
}
