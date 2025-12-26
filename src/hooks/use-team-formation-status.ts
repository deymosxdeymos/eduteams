'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

export function useTeamFormationStatus({
  assignmentId,
  enabled,
  shouldPoll = true,
  onComplete,
  onFailed,
  pollInterval = 3000,
}: UseTeamFormationStatusOptions): TeamFormationStatusResult {
  const [status, setStatus] = useState<TeamFormationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const previousStatusRef = useRef<TeamFormationStatus | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);
  const shouldPollRef = useRef(shouldPoll);
  const reset = useCallback(() => {
    previousStatusRef.current = null;
    setStatus(null);
    setErrorMessage(null);
    setIsPolling(false);
  }, []);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onFailedRef.current = onFailed;
  }, [onFailed]);

  useEffect(() => {
    reset();
  }, [assignmentId, reset]);

  useEffect(() => {
    const wasPolling = shouldPollRef.current;
    shouldPollRef.current = shouldPoll;

    if (shouldPoll && !wasPolling) {
      reset();
    }
  }, [shouldPoll, reset]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/assignments/${assignmentId}/form-teams/status`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!res.ok) {
        console.error('Failed to fetch team formation status:', res.status);
        return;
      }

      const data = await res.json();
      setStatus(data.status);
      setErrorMessage(data.errorMessage);

      const previousStatus = previousStatusRef.current;
      previousStatusRef.current = data.status;

      // Trigger callbacks only on meaningful transitions
      const wasInProgress =
        previousStatus === 'PENDING' ||
        previousStatus === 'PROCESSING' ||
        (previousStatus === null && shouldPollRef.current);

      if (data.status === 'COMPLETED' && wasInProgress) {
        onCompleteRef.current?.();
      } else if (data.status === 'FAILED') {
        onFailedRef.current?.(data.errorMessage);
      }
    } catch (error) {
      console.error('Error fetching team formation status:', error);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (!enabled) {
      setIsPolling(false);
      return;
    }

    fetchStatus();
  }, [enabled, fetchStatus]);

  useEffect(() => {
    if (!enabled || !shouldPoll) {
      setIsPolling(false);
      return;
    }

    const shouldContinuePolling =
      status === 'PENDING' || status === 'PROCESSING' || status === null;

    if (!shouldContinuePolling) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(fetchStatus, pollInterval);
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [enabled, shouldPoll, status, pollInterval, fetchStatus]);

  return {
    status,
    errorMessage,
    isPolling,
    refetch: fetchStatus,
    reset,
  };
}
