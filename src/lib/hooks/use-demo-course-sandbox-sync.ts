"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getDemoSandboxClientSnapshot, type DemoLocalAssignment } from "@/lib/demo/sandbox-client";
import { useDemoSandboxStorageListener } from "@/lib/hooks/use-demo-sandbox-storage-listener";

type DemoCourseSandboxSyncState = {
  syncKey: string | null;
  createdAssignments: DemoLocalAssignment[];
  submittedAssignmentIds: Set<string>;
};

interface UseDemoCourseSandboxSyncOptions {
  courseId: string;
  enabled: boolean;
  seededSubmittedAssignmentIds?: readonly string[];
}

const EMPTY_SUBMITTED_ASSIGNMENT_IDS: readonly string[] = [];

function createInitialState(courseId: string, enabled: boolean): DemoCourseSandboxSyncState {
  return {
    syncKey: enabled ? null : courseId,
    createdAssignments: [],
    submittedAssignmentIds: new Set<string>(),
  };
}

function getCreatedAssignmentsForCourse(
  createdAssignments: readonly DemoLocalAssignment[],
  courseId: string,
) {
  return createdAssignments.filter((assignment) => assignment.courseId === courseId);
}

function haveSameCreatedAssignments(
  previousAssignments: readonly DemoLocalAssignment[],
  nextAssignments: readonly DemoLocalAssignment[],
) {
  return (
    previousAssignments.length === nextAssignments.length &&
    nextAssignments.every((assignment, index) => assignment === previousAssignments[index])
  );
}

function haveSameSubmittedAssignmentIds(
  previousIds: ReadonlySet<string>,
  nextIds: readonly string[],
) {
  return nextIds.length === previousIds.size && nextIds.every((id) => previousIds.has(id));
}

export function useDemoCourseSandboxSync({
  courseId,
  enabled,
  seededSubmittedAssignmentIds,
}: UseDemoCourseSandboxSyncOptions) {
  const resolvedSeededSubmittedAssignmentIds =
    seededSubmittedAssignmentIds ?? EMPTY_SUBMITTED_ASSIGNMENT_IDS;
  const [state, setState] = useState<DemoCourseSandboxSyncState>(() =>
    createInitialState(courseId, enabled),
  );

  const sync = useCallback(() => {
    if (!enabled) {
      setState((prev) => {
        const nextState = createInitialState(courseId, false);

        return prev.syncKey === nextState.syncKey &&
          prev.createdAssignments.length === 0 &&
          prev.submittedAssignmentIds.size === 0
          ? prev
          : nextState;
      });
      return;
    }

    const sandboxSnapshot = getDemoSandboxClientSnapshot();
    const createdAssignments = getCreatedAssignmentsForCourse(
      sandboxSnapshot.state.createdAssignments,
      courseId,
    );
    const submittedAssignmentIds = sandboxSnapshot.exists
      ? sandboxSnapshot.state.submittedAssignments
      : [
          ...new Set([
            ...resolvedSeededSubmittedAssignmentIds,
            ...createdAssignments.map((assignment) => assignment.id),
          ]),
        ];

    setState((prev) => {
      if (
        prev.syncKey === courseId &&
        haveSameCreatedAssignments(prev.createdAssignments, createdAssignments) &&
        haveSameSubmittedAssignmentIds(prev.submittedAssignmentIds, submittedAssignmentIds)
      ) {
        return prev;
      }

      return {
        syncKey: courseId,
        createdAssignments,
        submittedAssignmentIds: new Set(submittedAssignmentIds),
      };
    });
  }, [courseId, enabled, resolvedSeededSubmittedAssignmentIds]);

  useEffect(() => {
    sync();
  }, [sync]);

  useDemoSandboxStorageListener(enabled, sync);

  return useMemo(
    () => ({
      createdAssignments: state.createdAssignments,
      submittedAssignmentIds: state.submittedAssignmentIds,
      isReady: !enabled || state.syncKey === courseId,
    }),
    [courseId, enabled, state.createdAssignments, state.submittedAssignmentIds, state.syncKey],
  );
}
