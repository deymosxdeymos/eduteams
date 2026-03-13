import "server-only";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getDemoStudentsForCourse } from "@/lib/demo/sandbox";

export const DEMO_SANDBOX_ROSTER_COOKIE_NAME = "eduteams-demo-sandbox-roster";

const DEMO_SANDBOX_ROSTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const demoStudentIds = new Set(getDemoStudentsForCourse().map((student) => student.id));

type DemoSandboxRosterState = {
  version: 1;
  removedStudentIds: string[];
};

const DEFAULT_DEMO_SANDBOX_ROSTER_STATE: DemoSandboxRosterState = {
  version: 1,
  removedStudentIds: [],
};

function normalizeRemovedStudentIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (studentId): studentId is string =>
          typeof studentId === "string" && demoStudentIds.has(studentId),
      ),
    ),
  );
}

export function parseDemoSandboxRosterCookieValue(value: string | null | undefined) {
  if (!value) {
    return DEFAULT_DEMO_SANDBOX_ROSTER_STATE;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DemoSandboxRosterState>;
    if (parsed.version !== 1) {
      return DEFAULT_DEMO_SANDBOX_ROSTER_STATE;
    }

    return {
      version: 1,
      removedStudentIds: normalizeRemovedStudentIds(parsed.removedStudentIds),
    } satisfies DemoSandboxRosterState;
  } catch {
    return DEFAULT_DEMO_SANDBOX_ROSTER_STATE;
  }
}

function buildDemoSandboxRosterCookieAttributes(state: DemoSandboxRosterState) {
  return {
    name: DEMO_SANDBOX_ROSTER_COOKIE_NAME,
    value: JSON.stringify(state),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SANDBOX_ROSTER_COOKIE_MAX_AGE,
  };
}

export function getRemovedDemoStudentIdsFromRequest(request?: Pick<NextRequest, "cookies">) {
  return parseDemoSandboxRosterCookieValue(
    request?.cookies.get(DEMO_SANDBOX_ROSTER_COOKIE_NAME)?.value,
  ).removedStudentIds;
}

export async function getRemovedDemoStudentIdsFromCookieStore() {
  try {
    const cookieStore = await nextCookies();
    return parseDemoSandboxRosterCookieValue(
      cookieStore.get(DEMO_SANDBOX_ROSTER_COOKIE_NAME)?.value,
    ).removedStudentIds;
  } catch {
    return [];
  }
}

export function setDemoSandboxRosterCookie(response: NextResponse, state: DemoSandboxRosterState) {
  response.cookies.set(buildDemoSandboxRosterCookieAttributes(state));
}

export function removeDemoSandboxStudentFromRoster(
  response: NextResponse,
  request: Pick<NextRequest, "cookies">,
  studentId: string,
) {
  const removedStudentIds = new Set(getRemovedDemoStudentIdsFromRequest(request));
  removedStudentIds.add(studentId);

  setDemoSandboxRosterCookie(response, {
    version: 1,
    removedStudentIds: Array.from(removedStudentIds),
  });
}

export function clearDemoSandboxRosterCookie(response: NextResponse) {
  response.cookies.delete(DEMO_SANDBOX_ROSTER_COOKIE_NAME);
}
