import { ClassPageLayout } from '@/components/dashboard/class-page-layout';
import { getInitialAssignments, getStudentsData } from '@/lib/data/course-data';
import type { Course, ExtendedUser } from '@/lib/types';
import type { StudentData } from '@/types/course';

interface ClassAssignmentsAsyncProps {
  courseId: string;
  classId: string;
  user: ExtendedUser;
  course: Course;
  studentsData: StudentData[];
}

export async function ClassAssignmentsAsync({
  courseId,
  classId,
  user,
  course,
  studentsData,
}: ClassAssignmentsAsyncProps) {
  const [initialAssignments, students] = await Promise.all([
    getInitialAssignments(courseId, user),
    studentsData.length > 0 ? studentsData : getStudentsData(courseId),
  ]);

  return (
    <ClassPageLayout
      classId={classId}
      user={user}
      course={course}
      initialAssignments={initialAssignments}
      studentsData={students}
    />
  );
}
