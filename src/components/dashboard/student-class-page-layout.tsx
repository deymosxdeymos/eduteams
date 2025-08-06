import type { Course, ExtendedUser } from '@/lib/types';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentClassAssignments } from './student-class-assignments';
import { StudentList } from './student-list';

interface StudentClassPageLayoutProps {
  classId: string;
  user: ExtendedUser;
  course: Course;
}

export function StudentClassPageLayout({
  classId,
  user,
  course,
}: StudentClassPageLayoutProps) {
  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} className={course} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]'>
          <StudentClassAssignments classId={classId} />
          <StudentList classId={classId} />
        </div>
      </div>
    </main>
  );
}
