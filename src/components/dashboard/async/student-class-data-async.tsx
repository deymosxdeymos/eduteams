import { StudentClassPageLayout } from "@/components/dashboard/student-class-page-layout";
import { getInitialAssignments } from "@/lib/data/course-data";
import type { Course, ExtendedUser } from "@/lib/types";
import type { StudentData } from "@/types/course";

interface StudentClassDataAsyncProps {
  classId: string;
  user: ExtendedUser;
  course: Course;
  studentsData: StudentData[];
}

export async function StudentClassDataAsync({
  classId,
  user,
  course,
  studentsData,
}: StudentClassDataAsyncProps) {
  const initialAssignments = await getInitialAssignments(classId, user);

  return (
    <StudentClassPageLayout
      classId={classId}
      user={user}
      course={course}
      studentsData={studentsData}
      initialAssignments={initialAssignments}
    />
  );
}
