import { toggleCourseArchive } from '@/lib/actions/manage-courses';
import type { ManageCourseRow } from '@/types/manage';
import { ManageCoursesView } from './manage-courses-view';

interface DosenManageContentProps {
  courses: ManageCourseRow[];
}

export function DosenManageContent({ courses }: DosenManageContentProps) {
  async function handleArchiveToggle(course: ManageCourseRow) {
    'use server';

    await toggleCourseArchive({
      courseId: course.id,
      archive: !course.isManuallyArchived,
    });
  }

  return (
    <ManageCoursesView
      courses={courses}
      searchPlaceholder='Cari kelas atau kode'
      archivedLabel='Kelas yang diarsipkan'
      emptyActiveMessage='Belum ada kelas aktif.'
      emptyArchivedMessage='Belum ada kelas yang diarsipkan.'
      onArchiveToggle={handleArchiveToggle}
    />
  );
}
