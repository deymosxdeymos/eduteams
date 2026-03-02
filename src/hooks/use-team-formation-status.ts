'use client';

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import type { TeamFormationStatus } from '@/generated/prisma/client';

interface UseTeamFormationStatusOptions {
  assignmentId: string;
  enabled: boolean;
  shouldPoll?: boolean;
  onComplete?: () => void;
  onFailed?: (error: string | null) => void;
  pollInterval?: number;
}

interface TeamFormationStatusResult {
  status: TeamFormationStatus | null;
  errorMessage: string | null;
  isPolling: boolean;
  refetch: () => Promise<void>;
  reset: () => void;
}

interface TeamFormationStatusResponse {
  status: TeamFormationStatus | null;
  errorMessage: string | null;
}

export function useTeamFormationStatus({
  assignmentId,
  enabled,
  shouldPoll = true,
  onComplete,
  onFailed,
  pollInterval = 3000,
}: UseTeamFormationStatusOptions): TeamFormationStatusResult {
  const key = enabled
    ? `/api/assignments/${assignmentId}/form-teams/status`
    : null;
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  const enabledRef = useRef(enabled);
  const previousShouldPollRef = useRef(shouldPoll);
  const shouldPollRef = useRef(shouldPoll);
  const hasStartedNetworkRequestRef = useRef<{
    assignmentId: string;
    hasStarted: boolean;
  }>({
    assignmentId,
    hasStarted: false,
  });
  const hasFreshStatusRef = useRef<{
    assignmentId: string;
    hasFreshStatus: boolean;
  }>({
    assignmentId,
    hasFreshStatus: false,
  });
  const lastHandledTerminalStatusRef = useRef<{
    assignmentId: string;
    status: TeamFormationStatus | null;
  }>({
    assignmentId,
    status: null,
  });
  const previousStatusRef = useRef<{
    assignmentId: string;
    status: TeamFormationStatus | null;
  }>({
    assignmentId,
    status: null,
  });

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    shouldPollRef.current = shouldPoll;
  }, [shouldPoll]);

  const fetcher = useCallback(
    async (url: string): Promise<TeamFormationStatusResponse> => {
      hasStartedNetworkRequestRef.current = {
        assignmentId,
        hasStarted: true,
      };

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch team formation status: ${res.status}`);
      }

      return res.json();
    },
    [assignmentId]
  );

  const { data, mutate } = useSWR<TeamFormationStatusResponse>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: pollInterval,
    refreshInterval: currentData => {
      if (!enabled || !shouldPoll) {
        return 0;
      }

      const currentStatus = currentData?.status ?? null;
      const shouldContinuePolling =
        currentStatus === null ||
        currentStatus === 'PENDING' ||
        currentStatus === 'PROCESSING';

      return shouldContinuePolling ? pollInterval : 0;
    },
    onSuccess: nextData => {
      const nextStatus = nextData.status ?? null;
      const currentAssignmentId = assignmentId;
      const previousStatus =
        previousStatusRef.current.assignmentId === currentAssignmentId
          ? previousStatusRef.current.status
          : null;
      const lastHandledTerminalStatus =
        lastHandledTerminalStatusRef.current.assignmentId === currentAssignmentId
          ? lastHandledTerminalStatusRef.current.status
          : null;
      const hasStartedNetworkRequest =
        hasStartedNetworkRequestRef.current.assignmentId === currentAssignmentId
          ? hasStartedNetworkRequestRef.current.hasStarted
          : false;

      const wasInProgress =
        previousStatus === 'PENDING' ||
        previousStatus === 'PROCESSING' ||
        (previousStatus === null &&
          enabledRef.current &&
          shouldPollRef.current &&
          hasStartedNetworkRequest);

      if (hasStartedNetworkRequest) {
        hasFreshStatusRef.current = {
          assignmentId: currentAssignmentId,
          hasFreshStatus: true,
        };
      }

      if (
        nextStatus === 'COMPLETED' &&
        wasInProgress &&
        lastHandledTerminalStatus !== 'COMPLETED'
      ) {
        onCompleteRef.current?.();
        lastHandledTerminalStatusRef.current = {
          assignmentId: currentAssignmentId,
          status: 'COMPLETED',
        };
      } else if (
        nextStatus === 'FAILED' &&
        wasInProgress &&
        lastHandledTerminalStatus !== 'FAILED'
      ) {
        onFailedRef.current?.(nextData.errorMessage ?? null);
        lastHandledTerminalStatusRef.current = {
          assignmentId: currentAssignmentId,
          status: 'FAILED',
        };
      } else if (
        nextStatus === null ||
        nextStatus === 'PENDING' ||
        nextStatus === 'PROCESSING'
      ) {
        lastHandledTerminalStatusRef.current = {
          assignmentId: currentAssignmentId,
          status: null,
        };
      }

      previousStatusRef.current = {
        assignmentId: currentAssignmentId,
        status: nextStatus,
      };
    },
  });

  const status = enabled ? data?.status ?? null : null;
  const errorMessage = enabled ? data?.errorMessage ?? null : null;
  const isPolling =
    enabled &&
    shouldPoll &&
    (status === null || status === 'PENDING' || status === 'PROCESSING');

  useEffect(() => {
    if (!enabled) {
      previousStatusRef.current = { assignmentId, status: null };
      hasStartedNetworkRequestRef.current = {
        assignmentId,
        hasStarted: false,
      };
      hasFreshStatusRef.current = { assignmentId, hasFreshStatus: false };
      lastHandledTerminalStatusRef.current = { assignmentId, status: null };
    }
  }, [assignmentId, enabled]);

  useEffect(() => {
    const hasFreshStatusForAssignment =
      hasFreshStatusRef.current.assignmentId === assignmentId &&
      hasFreshStatusRef.current.hasFreshStatus;
    const hasCachedTerminalStatus =
      status === 'COMPLETED' || status === 'FAILED';

    if (
      !enabled ||
      !shouldPoll ||
      !hasCachedTerminalStatus ||
      hasFreshStatusForAssignment
    ) {
      return;
    }

    previousStatusRef.current = { assignmentId, status: null };
    hasStartedNetworkRequestRef.current = {
      assignmentId,
      hasStarted: false,
    };
    lastHandledTerminalStatusRef.current = { assignmentId, status: null };
    void mutate(
      {
        status: null,
        errorMessage: null,
      },
      { revalidate: true }
    );
  }, [assignmentId, enabled, mutate, shouldPoll, status]);

  useEffect(() => {
    const wasPolling = previousShouldPollRef.current;
    previousShouldPollRef.current = shouldPoll;

    if (!enabled || !shouldPoll || wasPolling) {
      return;
    }

    previousStatusRef.current = { assignmentId, status: null };
    hasStartedNetworkRequestRef.current = {
      assignmentId,
      hasStarted: false,
    };
    hasFreshStatusRef.current = { assignmentId, hasFreshStatus: false };
    lastHandledTerminalStatusRef.current = { assignmentId, status: null };
    void mutate(
      {
        status: null,
        errorMessage: null,
      },
      { revalidate: true }
    );
  }, [assignmentId, enabled, mutate, shouldPoll]);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const reset = useCallback(() => {
    previousStatusRef.current = { assignmentId, status: null };
    hasStartedNetworkRequestRef.current = {
      assignmentId,
      hasStarted: false,
    };
    hasFreshStatusRef.current = { assignmentId, hasFreshStatus: false };
    lastHandledTerminalStatusRef.current = { assignmentId, status: null };
    void mutate(
      {
        status: null,
        errorMessage: null,
      },
      { revalidate: false }
    );
  }, [assignmentId, mutate]);

  return {
    status,
    errorMessage,
    isPolling,
    refetch,
    reset,
  };
}
