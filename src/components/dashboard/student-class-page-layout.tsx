import { getSidebarDataForUser } from '@/lib/dashboard/sidebar-data';
import type { Course, ExtendedUser } from '@/lib/types';
import type { AssignmentClient } from '@/lib/validation/assignments';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentClassAssignments } from './student-class-assignments';
import { StudentList } from './student-list';

interface StudentClassPageLayoutProps {
  classId: string;
  user: ExtendedUser;
  course: Course;
  studentsData?: Student[];
  initialAssignments?: AssignmentClient[];
}

interface Student {
  id: string;
  name: string;
  nim: string;
  email: string;
  mbtiType?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
}

export async function StudentClassPageLayout({
  classId,
  user,
  course,
  studentsData = [],
  initialAssignments,
}: StudentClassPageLayoutProps) {
  const sidebarData = await getSidebarDataForUser(user);

  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} className={course} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar
          user={sidebarData.user}
          notStartedCount={sidebarData.notStartedCount}
        />
        <div className='px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]'>
          <StudentClassAssignments
            classId={classId}
            initialAssignments={initialAssignments}
            studentCount={studentsData.length}
          />
          <StudentList
            classId={classId}
            initialData={studentsData}
            currentUserId={user.id}
            canManage={false}
          />
        </div>
      </div>
    </main>
  );
}
