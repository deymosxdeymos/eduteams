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
  hideStudentList?: boolean;
  assignmentTitle?: string;
  answersCrumb?: string | boolean;
  submittedStudentIds?: string[];
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
  hideStudentList = false,
  assignmentTitle,
  answersCrumb,
  submittedStudentIds,
  children,
}: AssignmentLayoutProps) {
  // Calculate submission stats for display in student list
  const submittedCount = submittedStudentIds ? submittedStudentIds.length : 0;
  const totalStudents = students.length;

  return (
    <main className='bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden'>
      <div className='mb-8'>
        <Nav
          user={user}
          className={course}
          assignmentTitle={assignmentTitle}
          answersCrumb={answersCrumb}
        />
      </div>
      <div className='grid grid-cols-[auto_1fr] flex-1 min-h-0'>
        <Sidebar />
        <div
          className={
            hideStudentList
              ? 'px-8 pb-0 min-h-0 grid grid-cols-[1fr]'
              : 'px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]'
          }
        >
          <div
            className={
              hideStudentList
                ? 'bg-white rounded-3xl h-full flex flex-col overflow-hidden'
                : 'bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden'
            }
          >
            {children}
          </div>
          {!hideStudentList && (
            <StudentList
              classId={classId}
              initialData={students}
              currentUserId={user.id}
              canManage={canManage}
              submittedStudentIds={submittedStudentIds}
              submittedCount={submittedCount}
              totalStudents={totalStudents}
            />
          )}
        </div>
      </div>
    </main>
  );
}
