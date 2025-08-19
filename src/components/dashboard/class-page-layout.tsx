import type { Course, ExtendedUser } from '@/lib/types';
import { ClassAssignments } from './class-assignments';
import Nav from './nav';
import Sidebar from './sidebar';
import { StudentList } from './student-list';

type StudentData = {
  id: string;
  name: string;
  nim: string;
  email: string;
  enrolledAt: Date;
};

interface ClassPageLayoutProps {
  classId: string;
  dosenId: string;
  user: ExtendedUser;
  course: Course;
  studentsData?: StudentData[];
}

export function ClassPageLayout({
  classId,
  dosenId,
  user,
  course,
  studentsData,
}: ClassPageLayoutProps) {
  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav user={user} className={course} />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div className='px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]'>
          <ClassAssignments
            classId={classId}
            dosenId={dosenId}
            courseData={course}
          />
          <StudentList
            classId={classId}
            initialData={studentsData}
            currentUserId={user.id}
          />
        </div>
      </div>
    </main>
  );
}
