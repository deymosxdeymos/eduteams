import type { Course, ExtendedUser } from '@/lib/types';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentList } from './student-list';

interface AssignmentLayoutProps {
  user: ExtendedUser;
  course: Course;
  classId: string;
  assignmentId: string;
  students: Array<{
    id: string;
    name: string;
    nim: string;
    email: string;
    mbtiType?: string | null;
    ei?: number | null;
    sn?: number | null;
    tf?: number | null;
    pj?: number | null;
    enrolledAt: Date;
  }>;
  canManage: boolean;
  children?: React.ReactNode;
}

export function AssignmentLayout({
  user,
  course,
  classId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assignmentId: _assignmentId,
  students,
  canManage,
  children,
}: AssignmentLayoutProps) {
  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} className={course} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]'>
          <div className='bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden'>
            {children}
          </div>
          <StudentList
            classId={classId}
            initialData={students}
            currentUserId={user.id}
            canManage={canManage}
          />
        </div>
      </div>
    </main>
  );
}
