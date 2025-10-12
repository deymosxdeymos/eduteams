import type { ManageCourseRow } from '@/types/manage';
import { ManageCoursesView } from './manage-courses-view';

interface DosenManageContentProps {
  courses: ManageCourseRow[];
}

export function DosenManageContent({ courses }: DosenManageContentProps) {
  return (
    <ManageCoursesView
      courses={courses}
      searchPlaceholder='Cari kelas atau kode'
      archivedLabel='Kelas yang diarsipkan'
      emptyActiveMessage='Belum ada kelas aktif.'
      emptyArchivedMessage='Belum ada kelas yang diarsipkan.'
    />
  );
}
