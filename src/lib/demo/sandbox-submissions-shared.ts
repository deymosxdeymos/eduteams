import { isDemoSandboxAssignmentId } from "@/lib/demo/sandbox-shared";

export const DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME = "eduteams-demo-sandbox-submissions";

const DEMO_SANDBOX_SUBMISSIONS_VERSION = 1 as const;

export type DemoSandboxSubmissionsState = {
  version: typeof DEMO_SANDBOX_SUBMISSIONS_VERSION;
  assignmentIds: string[];
};

const DEFAULT_DEMO_SANDBOX_SUBMISSIONS_STATE: DemoSandboxSubmissionsState = {
  version: DEMO_SANDBOX_SUBMISSIONS_VERSION,
  assignmentIds: [],
};

export function normalizeDemoSandboxSubmittedAssignmentIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (assignmentId): assignmentId is string =>
          typeof assignmentId === "string" && isDemoSandboxAssignmentId(assignmentId),
      ),
    ),
  );
}

export function parseDemoSandboxSubmissionsCookieValue(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_DEMO_SANDBOX_SUBMISSIONS_STATE;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DemoSandboxSubmissionsState>;
    if (parsed.version !== DEMO_SANDBOX_SUBMISSIONS_VERSION) {
      return DEFAULT_DEMO_SANDBOX_SUBMISSIONS_STATE;
    }

    return {
      version: DEMO_SANDBOX_SUBMISSIONS_VERSION,
      assignmentIds: normalizeDemoSandboxSubmittedAssignmentIds(parsed.assignmentIds),
    } satisfies DemoSandboxSubmissionsState;
  } catch {
    return DEFAULT_DEMO_SANDBOX_SUBMISSIONS_STATE;
  }
}

export function serializeDemoSandboxSubmissionsCookieValue(assignmentIds: readonly string[]) {
  return JSON.stringify({
    version: DEMO_SANDBOX_SUBMISSIONS_VERSION,
    assignmentIds: normalizeDemoSandboxSubmittedAssignmentIds(assignmentIds),
  } satisfies DemoSandboxSubmissionsState);
}
