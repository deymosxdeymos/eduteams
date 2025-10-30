import { toggleAssignmentArchive } from '@/lib/actions/manage-assignments';
import type { ManageAssignmentRow } from '@/types/manage';
import { ManageAssignmentsView } from './manage-assignments-view';

interface DosenManageAssignmentsContentProps {
  assignments: ManageAssignmentRow[];
  courseId: string;
}

export function DosenManageAssignmentsContent({
  assignments,
  courseId,
}: DosenManageAssignmentsContentProps) {
  async function handleArchiveToggle(assignment: ManageAssignmentRow) {
    'use server';

    await toggleAssignmentArchive({
      assignmentId: assignment.id,
      archive: !assignment.isArchived,
    });
  }

  return (
    <ManageAssignmentsView
      assignments={assignments}
      courseId={courseId}
      searchPlaceholder='Cari tugas…'
      emptyActiveMessage='Belum ada tugas aktif'
      emptyArchivedMessage='Belum ada tugas yang diarsipkan'
      onArchiveToggle={handleArchiveToggle}
    />
  );
}
