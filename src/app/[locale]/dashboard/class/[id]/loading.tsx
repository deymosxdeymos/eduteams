import { AssignmentListSkeleton } from "@/components/ui/skeletons/assignment-list-skeleton";
import { StudentListSkeleton } from "@/components/ui/skeletons/student-list-skeleton";

export default function ClassLoading() {
  return (
    <div className="container mx-auto space-y-8 p-6" role="status" aria-label="Loading class data">
      <StudentListSkeleton />
      <AssignmentListSkeleton />
    </div>
  );
}
