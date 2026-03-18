import { toggleAssignmentArchive } from "@/lib/actions/manage-assignments";
import type { ManageAssignmentRow } from "@/types/manage";
import { ManageAssignmentsView } from "./manage-assignments-view";

interface DosenManageAssignmentsContentProps {
  assignments: ManageAssignmentRow[];
  courseId: string;
  totalStudents: number;
}

export function DosenManageAssignmentsContent({
  assignments,
  courseId,
  totalStudents,
}: DosenManageAssignmentsContentProps) {
  async function handleArchiveToggle(assignment: ManageAssignmentRow) {
    "use server";

    await toggleAssignmentArchive({
      assignmentId: assignment.id,
      archive: !assignment.isArchived,
    });
  }

  return (
    <ManageAssignmentsView
      assignments={assignments}
      courseId={courseId}
      totalStudents={totalStudents}
      onArchiveToggle={handleArchiveToggle}
    />
  );
}
