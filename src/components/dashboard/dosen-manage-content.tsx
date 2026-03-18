import { toggleCourseArchive } from "@/lib/actions/manage-courses";
import type { ManageCourseRow } from "@/types/manage";
import { ManageCoursesView } from "./manage-courses-view";

interface DosenManageContentProps {
  courses: ManageCourseRow[];
}

export function DosenManageContent({ courses }: DosenManageContentProps) {
  async function handleArchiveToggle(course: ManageCourseRow) {
    "use server";

    await toggleCourseArchive({
      courseId: course.id,
      archive: !course.isArchived,
    });
  }

  return <ManageCoursesView courses={courses} onArchiveToggle={handleArchiveToggle} />;
}
