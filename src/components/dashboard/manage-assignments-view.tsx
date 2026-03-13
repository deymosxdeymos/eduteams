"use client";

import { Calendar, ExternalLink, Eye, EyeOff, Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { parseAsBoolean, useQueryState } from "nuqs";
import { memo, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { EditAssignmentModal } from "@/components/dashboard/edit-assignment-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAssignmentStatusBadge } from "@/lib/utils/assignment-status";
import {
  buildDemoAssignmentHref,
  DEMO_ASSIGNMENT_ID,
  DEMO_COURSE_ID,
  DEMO_LOCAL_ASSIGNMENT_ID_PREFIX,
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
} from "@/lib/demo/sandbox";
import {
  getDemoAssignmentStatus,
  getDemoCreatedAssignments,
  mergeDemoAssignments,
} from "@/lib/demo/sandbox-client";
import type { ManageAssignmentRow } from "@/types/manage";

interface ManageAssignmentsViewProps {
  assignments: ManageAssignmentRow[];
  courseId: string;
  totalStudents: number;
  searchPlaceholder: string;
  emptyActiveMessage: string;
  emptyArchivedMessage: string;
  renderActions?: (assignment: ManageAssignmentRow) => ReactNode;
  onArchiveToggle?: (assignment: ManageAssignmentRow) => Promise<void> | void;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}

interface AssignmentOverlayState {
  serverSnapshotKey: string;
  optimisticAssignmentUpdates: Record<string, Partial<ManageAssignmentRow>>;
}

function getAssignmentOverlaySnapshotKey(assignments: ManageAssignmentRow[]) {
  return assignments
    .map((assignment) =>
      [
        assignment.id,
        assignment.title,
        assignment.description ?? "",
        assignment.status,
        assignment.startAt,
        assignment.createdAt,
        assignment.isArchived ? "1" : "0",
        assignment.submissionsCount,
        assignment.totalStudents,
      ].join(":"),
    )
    .join("|");
}

function createAssignmentOverlayState(serverSnapshotKey: string): AssignmentOverlayState {
  return {
    serverSnapshotKey,
    optimisticAssignmentUpdates: {},
  };
}

function getCurrentAssignmentOverlayState(
  state: AssignmentOverlayState,
  serverSnapshotKey: string,
) {
  if (state.serverSnapshotKey === serverSnapshotKey) {
    return state;
  }

  return createAssignmentOverlayState(serverSnapshotKey);
}

function ManageTable({
  rows,
  emptyMessage,
  renderActions,
}: {
  rows: ManageAssignmentRow[];
  emptyMessage: string;
  renderActions: (assignment: ManageAssignmentRow) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30">
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table className="min-w-[720px]">
      <TableHeader className="[&_tr]:border-b-0">
        <TableRow className="bg-muted overflow-hidden rounded-md">
          <TableHead className="rounded-md">Nama Tugas</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right rounded-md">Manage Control</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((assignment) => {
          const statusBadge = getAssignmentStatusBadge(
            assignment.status,
            assignment.submissionsCount,
            assignment.totalStudents,
          );

          return (
            <TableRow key={assignment.id} className="bg-white">
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{assignment.title}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span>{formatDate(assignment.startAt)}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn("rounded-full border", statusBadge.className)}>
                  {statusBadge.text}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{renderActions(assignment)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function DeleteAssignmentDialog(): ReactNode {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete assignment"
          disabled
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-medium">Hapus Tugas?</DialogTitle>
          <DialogDescription>Fitur hapus tugas akan segera hadir.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export const ManageAssignmentsView = memo(function ManageAssignmentsView({
  assignments,
  courseId,
  totalStudents,
  searchPlaceholder,
  emptyActiveMessage,
  emptyArchivedMessage,
  renderActions,
  onArchiveToggle,
}: ManageAssignmentsViewProps) {
  const [searchTerm, setSearchTerm] = useQueryState("search", {
    defaultValue: "",
    shallow: true,
  });
  const [showArchived, setShowArchived] = useQueryState("archived", {
    ...parseAsBoolean,
    defaultValue: false,
    shallow: true,
  });
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ManageAssignmentRow | null>(null);
  const [localAssignments, setLocalAssignments] = useState<ManageAssignmentRow[]>([]);
  const isDemoCourse = courseId === DEMO_COURSE_ID;
  const assignmentSnapshotKey = getAssignmentOverlaySnapshotKey(assignments);
  const [assignmentOverlayState, setAssignmentOverlayState] = useState<AssignmentOverlayState>(() =>
    createAssignmentOverlayState(assignmentSnapshotKey),
  );
  const [optimisticDeletedAssignmentIds] = useState<Set<string>>(() => new Set());
  const activeAssignmentOverlayState = getCurrentAssignmentOverlayState(
    assignmentOverlayState,
    assignmentSnapshotKey,
  );
  const optimisticAssignmentUpdates = activeAssignmentOverlayState.optimisticAssignmentUpdates;

  useEffect(() => {
    if (!isDemoCourse) {
      return;
    }

    const syncLocalAssignments = () => {
      setLocalAssignments(
        getDemoCreatedAssignments(courseId).map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description ?? null,
          status: getDemoAssignmentStatus(assignment.id),
          startAt: assignment.startAt,
          createdAt: assignment.createdAt,
          isArchived: false,
          submissionsCount: assignment.submissionsCount,
          totalStudents,
          skills: [...assignment.skills],
          topics: [...assignment.topics],
        })),
      );
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      if (
        event.key !== null &&
        event.key !== DEMO_SANDBOX_STORAGE_KEY &&
        !event.key.startsWith(`${DEMO_SANDBOX_STORAGE_KEY}:`)
      ) {
        return;
      }

      syncLocalAssignments();
    };

    syncLocalAssignments();
    window.addEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, syncLocalAssignments);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, syncLocalAssignments);
      window.removeEventListener("storage", handleStorage);
    };
  }, [courseId, isDemoCourse, totalStudents]);

  const assignmentRows = useMemo(
    () =>
      mergeDemoAssignments(assignments, localAssignments)
        .filter((assignment) => !optimisticDeletedAssignmentIds.has(assignment.id))
        .map((assignment) => {
          const optimisticUpdate = optimisticAssignmentUpdates[assignment.id];
          if (!optimisticUpdate) {
            return assignment;
          }

          return {
            ...assignment,
            ...optimisticUpdate,
          };
        }),
    [assignments, localAssignments, optimisticAssignmentUpdates, optimisticDeletedAssignmentIds],
  );

  const handleArchiveToggle = useCallback(
    (assignment: ManageAssignmentRow) => {
      if (!onArchiveToggle) {
        return;
      }

      const nextIsArchived = !assignment.isArchived;
      const previousOverlay = optimisticAssignmentUpdates[assignment.id];
      setPendingAssignmentId(assignment.id);
      setArchiveError(null);
      setAssignmentOverlayState((current) => {
        const next = getCurrentAssignmentOverlayState(current, assignmentSnapshotKey);

        return {
          ...next,
          optimisticAssignmentUpdates: {
            ...next.optimisticAssignmentUpdates,
            [assignment.id]: {
              ...(next.optimisticAssignmentUpdates[assignment.id] ?? {}),
              isArchived: nextIsArchived,
            },
          },
        };
      });
      void (async () => {
        try {
          await onArchiveToggle(assignment);
        } catch (error) {
          setAssignmentOverlayState((current) => {
            const next = getCurrentAssignmentOverlayState(current, assignmentSnapshotKey);
            const nextOptimisticAssignmentUpdates = {
              ...next.optimisticAssignmentUpdates,
            };

            if (previousOverlay) {
              nextOptimisticAssignmentUpdates[assignment.id] = previousOverlay;
            } else {
              delete nextOptimisticAssignmentUpdates[assignment.id];
            }

            return {
              ...next,
              optimisticAssignmentUpdates: nextOptimisticAssignmentUpdates,
            };
          });
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Gagal mengubah status tugas. Silakan coba lagi.";
          setArchiveError(errorMessage);
        } finally {
          setPendingAssignmentId((current) => (current === assignment.id ? null : current));
        }
      })();
    },
    [assignmentSnapshotKey, onArchiveToggle, optimisticAssignmentUpdates],
  );

  const defaultActions = useCallback(
    (assignment: ManageAssignmentRow) => {
      const isSyntheticDemoAssignment =
        assignment.id === DEMO_ASSIGNMENT_ID ||
        assignment.id.startsWith(DEMO_LOCAL_ASSIGNMENT_ID_PREFIX);
      const archiveLabel = assignment.isArchived ? "Tampilkan tugas" : "Sembunyikan tugas";
      const ArchiveIcon = assignment.isArchived ? Eye : EyeOff;
      const isPending = pendingAssignmentId === assignment.id;
      const assignmentHref = buildDemoAssignmentHref({
        classId: courseId,
        assignmentId: assignment.id,
        title: assignment.title,
        skills: assignment.skills,
        topics: assignment.topics,
      });

      return (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Lihat tugas">
            <Link href={assignmentHref}>
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={archiveLabel}
                disabled={isPending || isSyntheticDemoAssignment}
                aria-busy={isPending}
              >
                <ArchiveIcon className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-medium">
                  {assignment.isArchived ? "Munculkan Tugas?" : "Sembunyikan Tugas?"}
                </DialogTitle>
                <DialogDescription>
                  {assignment.isArchived
                    ? "Tampilkan tugas ini agar mahasiswa dapat melihatnya"
                    : "Tugas yang disembunyikan tidak akan bisa diakses oleh mahasiswa"}
                </DialogDescription>
              </DialogHeader>
              {archiveError && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-sm text-red-600">{archiveError}</p>
                </div>
              )}
              <DialogFooter className="flex-col-reverse sm:flex-col-reverse">
                <DialogClose asChild>
                  <Button variant="ghost" className="rounded-full">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="onboarding"
                  className="h-12 text-sm rounded-full"
                  aria-label={archiveLabel}
                  disabled={isPending || isSyntheticDemoAssignment}
                  aria-busy={isPending}
                  onClick={() => handleArchiveToggle(assignment)}
                >
                  {isPending && <LoadingSpinner size="sm" color="white" className="mr-2" />}
                  {assignment.isArchived ? "Munculkan" : "Sembunyikan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit assignment"
            disabled={isSyntheticDemoAssignment}
            onClick={() => setEditingAssignment(assignment)}
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteAssignmentDialog />
        </div>
      );
    },
    [handleArchiveToggle, pendingAssignmentId, archiveError, courseId],
  );

  const renderRowActions = renderActions ?? defaultActions;

  const filteredAssignments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return assignmentRows;

    return assignmentRows.filter((assignment) => {
      const tokens = assignment.title.toLowerCase();
      return tokens.includes(term);
    });
  }, [assignmentRows, searchTerm]);

  const activeAssignments = filteredAssignments.filter((a) => !a.isArchived);
  const archivedAssignments = filteredAssignments.filter((a) => a.isArchived);

  return (
    <section className="flex h-full flex-col gap-6 rounded-3xl rounded-r-none bg-white p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1">
          <Input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 rounded-full pl-4 pr-11"
            autoFocus
          />
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <ManageTable
          rows={activeAssignments}
          emptyMessage={emptyActiveMessage}
          renderActions={renderRowActions}
        />
      </div>

      <Separator className="my-6 data-[orientation=horizontal]:h-1 rounded-full bg-neutral-200" />

      <div>
        <button
          type="button"
          onClick={() => setShowArchived((value) => !value)}
          className={cn(
            "flex w-full max-w-fit cursor-pointer items-center gap-2 px-0 py-0 text-left text-sm font-semibold transition-colors",
            showArchived ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          aria-expanded={showArchived}
        >
          <span>Tugas yang Diarsipkan</span>
          <svg
            className={cn(
              "size-4 text-current transition-transform",
              showArchived ? "rotate-90" : "",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {showArchived && (
          <div className="mt-4">
            <ManageTable
              rows={archivedAssignments}
              emptyMessage={emptyArchivedMessage}
              renderActions={renderRowActions}
            />
          </div>
        )}
      </div>

      {editingAssignment && (
        <EditAssignmentModal
          open={Boolean(editingAssignment)}
          onOpenChange={(open) => {
            if (!open) setEditingAssignment(null);
          }}
          assignment={editingAssignment}
          courseId={courseId}
          onUpdatedAction={(updated) => {
            const currentAssignment = assignmentRows.find((row) => row.id === updated.id);
            if (!currentAssignment) {
              return;
            }

            setAssignmentOverlayState((current) => {
              const next = getCurrentAssignmentOverlayState(current, assignmentSnapshotKey);

              return {
                ...next,
                optimisticAssignmentUpdates: {
                  ...next.optimisticAssignmentUpdates,
                  [updated.id]: {
                    ...(next.optimisticAssignmentUpdates[updated.id] ?? {}),
                    ...updated,
                    description:
                      updated.description === undefined
                        ? currentAssignment.description
                        : updated.description,
                  },
                },
              };
            });
          }}
        />
      )}
    </section>
  );
});
