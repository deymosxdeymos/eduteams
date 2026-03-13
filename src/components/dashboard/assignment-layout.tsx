import { getSidebarDataForUser } from "@/lib/dashboard/sidebar-data";
import { DEMO_COURSE_ID, getDemoSandboxPrincipalId } from "@/lib/demo/sandbox";
import type { Course, ExtendedUser } from "@/lib/types";
import Nav from "./nav";
import Sidebar from "./sidebar";
import { StudentList } from "./student-list";

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

export async function AssignmentLayout({
  user,
  course,
  classId,
  assignmentId: _,
  students,
  canManage,
  hideStudentList = false,
  assignmentTitle,
  answersCrumb,
  submittedStudentIds,
  children,
}: AssignmentLayoutProps) {
  const sidebarData = await getSidebarDataForUser(user);
  const currentUserId =
    course.id === DEMO_COURSE_ID ? (getDemoSandboxPrincipalId(user) ?? user.id) : user.id;
  const submittedCount = submittedStudentIds ? submittedStudentIds.length : 0;
  const totalStudents = students.length;

  return (
    <main className="bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden">
      <div className="mb-8">
        <Nav
          user={user}
          className={course}
          assignmentTitle={assignmentTitle}
          answersCrumb={answersCrumb}
        />
      </div>
      <div className="grid grid-cols-[auto_1fr] flex-1 min-h-0">
        <Sidebar user={sidebarData.user} notStartedCount={sidebarData.notStartedCount} />
        <div
          className={
            hideStudentList
              ? "px-8 pb-0 min-h-0 grid grid-cols-[1fr]"
              : "px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]"
          }
        >
          <div
            className={
              hideStudentList
                ? "bg-white rounded-3xl h-full flex flex-col overflow-hidden"
                : "bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden"
            }
          >
            {children}
          </div>
          {!hideStudentList && (
            <StudentList
              classId={classId}
              initialData={students}
              currentUserId={currentUserId}
              canManage={canManage}
              submittedStudentIds={canManage ? submittedStudentIds : undefined}
              submittedCount={submittedCount}
              totalStudents={totalStudents}
              isAssignmentPage={true}
            />
          )}
        </div>
      </div>
    </main>
  );
}
