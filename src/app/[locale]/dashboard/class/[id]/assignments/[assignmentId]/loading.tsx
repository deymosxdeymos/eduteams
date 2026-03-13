import { AssignmentSkeleton } from "@/components/ui/skeletons/assignment-skeleton";

export default function AssignmentLoading() {
  return (
    <div className="container mx-auto p-6" role="status" aria-label="Loading assignment details">
      <AssignmentSkeleton />
    </div>
  );
}
