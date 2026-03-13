import { getSidebarDataForUser } from "@/lib/dashboard/sidebar-data";
import { getDemoSandboxPrincipalId } from "@/lib/demo/sandbox";
import type { Course, ExtendedUser } from "@/lib/types";
import type { AssignmentResponse } from "@/lib/validation/assignments";
import { ClassAssignments } from "./class-assignments";
import Nav from "./nav";
import Sidebar from "./sidebar";
import { StudentList } from "./student-list";

type StudentData = {
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
};

interface ClassPageLayoutProps {
  classId: string;
  user: ExtendedUser;
  course: Course;
  initialAssignments?: AssignmentResponse[];
  studentsData?: StudentData[];
}

export async function ClassPageLayout({
  classId,
  user,
  course,
  initialAssignments,
  studentsData,
}: ClassPageLayoutProps) {
  const sidebarData = await getSidebarDataForUser(user);
  const currentUserId = getDemoSandboxPrincipalId(user) ?? user.id;
  const canManage = user.role === "TEACHER" && currentUserId === course.dosenId;

  return (
    <main className="bg-accent px-10 py-8 h-screen flex flex-col overflow-hidden">
      <div className="mb-8">
        <Nav user={user} className={course} />
      </div>
      <div className="grid grid-cols-[auto_1fr] flex-1 min-h-0">
        <Sidebar user={sidebarData.user} notStartedCount={sidebarData.notStartedCount} />
        <div className="px-8 pb-0 min-h-0 grid grid-cols-[1fr_400px]">
          <ClassAssignments
            classId={classId}
            courseData={course}
            initialAssignments={initialAssignments}
            studentCount={studentsData?.length ?? 0}
          />
          <StudentList
            classId={classId}
            initialData={studentsData}
            currentUserId={currentUserId}
            canManage={canManage}
          />
        </div>
      </div>
    </main>
  );
}
