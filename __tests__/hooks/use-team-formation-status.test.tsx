import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { SWRConfig } from 'swr';
import { useTeamFormationStatus } from '@/hooks/use-team-formation-status';

type MockStatusResponse = {
  errorMessage: string | null;
  status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'PROCESSING' | null;
};

interface HarnessProps {
  assignmentId?: string;
  enabled?: boolean;
  onComplete?: () => void;
  onFailed?: (error: string | null) => void;
  pollInterval?: number;
  shouldPoll?: boolean;
}

const originalFetch = global.fetch;

function createFetchResponse(response: MockStatusResponse): Response {
  return {
    ok: true,
    status: 200,
    json: async () => response,
  } as Response;
}

function HookHarness({
  assignmentId = 'assignment-1',
  enabled = true,
  onComplete,
  onFailed,
  pollInterval = 20,
  shouldPoll = true,
}: HarnessProps) {
  const result = useTeamFormationStatus({
    assignmentId,
    enabled,
    shouldPoll,
    onComplete,
    onFailed,
    pollInterval,
  });

  return (
    <div>
      <span data-testid='status'>{result.status ?? 'null'}</span>
      <span data-testid='polling'>{result.isPolling ? 'yes' : 'no'}</span>
      <span data-testid='error'>{result.errorMessage ?? 'null'}</span>
    </div>
  );
}

function renderHookHarness(
  props: HarnessProps,
  cache = new Map()
) {
  const renderTree = (nextProps: HarnessProps) => (
    <SWRConfig value={{ provider: () => cache }}>
      <HookHarness {...nextProps} />
    </SWRConfig>
  );
  const view = render(renderTree(props));

  return {
    ...view,
    rerenderHarness: (nextProps: HarnessProps) => {
      view.rerender(renderTree(nextProps));
    },
  };
}

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  global.fetch = originalFetch;
});

describe('useTeamFormationStatus', () => {
  it('revalidates when polling restarts from a cached completed status', async () => {
    let callIndex = 0;
    const fetchMock = mock(async () =>
      createFetchResponse({
        status: callIndex++ === 0 ? 'COMPLETED' : 'PENDING',
        errorMessage: null,
      })
    );
    global.fetch = fetchMock as typeof fetch;

    const view = renderHookHarness({ shouldPoll: false });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');
    });
    expect(fetchMock.mock.calls.length).toBe(1);

    view.rerenderHarness({ shouldPoll: true });

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(2);
    });
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('PENDING');
      expect(screen.getByTestId('polling')).toHaveTextContent('yes');
    });
  });

  it('fires onComplete after a restarted run finishes', async () => {
    const onComplete = mock(() => {});
    const responses: MockStatusResponse[] = [
      { status: 'COMPLETED', errorMessage: null },
      { status: 'PENDING', errorMessage: null },
      { status: 'COMPLETED', errorMessage: null },
    ];
    let callIndex = 0;
    const fetchMock = mock(async () =>
      createFetchResponse(responses[callIndex++] ?? responses[responses.length - 1]!)
    );
    global.fetch = fetchMock as typeof fetch;

    const view = renderHookHarness({
      shouldPoll: false,
      onComplete,
      pollInterval: 10,
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');
    });

    view.rerenderHarness({
      shouldPoll: true,
      onComplete,
      pollInterval: 10,
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('PENDING');
    });
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');
      expect(onComplete.mock.calls.length).toBe(1);
    });
  });

  it('ignores cached completed data until a fresh polling response arrives', async () => {
    const cache = new Map();
    const onComplete = mock(() => {});
    const responses: MockStatusResponse[] = [
      { status: 'COMPLETED', errorMessage: null },
      { status: 'PENDING', errorMessage: null },
      { status: 'COMPLETED', errorMessage: null },
    ];
    let callIndex = 0;
    const fetchMock = mock(async () =>
      createFetchResponse(responses[callIndex++] ?? responses[responses.length - 1]!)
    );
    global.fetch = fetchMock as typeof fetch;

    const initialView = renderHookHarness(
      {
        shouldPoll: false,
        pollInterval: 10,
      },
      cache
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');
    });

    initialView.unmount();

    renderHookHarness(
      {
        shouldPoll: true,
        onComplete,
        pollInterval: 10,
      },
      cache
    );

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('PENDING');
    });
    expect(onComplete.mock.calls.length).toBe(0);

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('COMPLETED');
      expect(onComplete.mock.calls.length).toBe(1);
    });
  });
});
