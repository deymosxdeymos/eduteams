import "server-only";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME,
  parseDemoSandboxSubmissionsCookieValue,
  serializeDemoSandboxSubmissionsCookieValue,
} from "@/lib/demo/sandbox-submissions-shared";

const DEMO_SANDBOX_SUBMISSIONS_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function buildDemoSandboxSubmissionsCookieAttributes(assignmentIds: readonly string[]) {
  return {
    name: DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME,
    value: serializeDemoSandboxSubmissionsCookieValue(assignmentIds),
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SANDBOX_SUBMISSIONS_COOKIE_MAX_AGE,
  };
}

export function getDemoSubmittedAssignmentIdsFromRequest(request?: Pick<NextRequest, "cookies">) {
  return parseDemoSandboxSubmissionsCookieValue(
    request?.cookies.get(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME)?.value,
  ).assignmentIds;
}

export async function getDemoSubmittedAssignmentIdsFromCookieStore() {
  try {
    const cookieStore = await nextCookies();
    return parseDemoSandboxSubmissionsCookieValue(
      cookieStore.get(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME)?.value,
    ).assignmentIds;
  } catch {
    return [];
  }
}

export function setDemoSandboxSubmissionsCookie(
  response: NextResponse,
  assignmentIds: readonly string[],
) {
  response.cookies.set(buildDemoSandboxSubmissionsCookieAttributes(assignmentIds));
}

export function clearDemoSandboxSubmissionsCookie(response: NextResponse) {
  response.cookies.delete(DEMO_SANDBOX_SUBMISSIONS_COOKIE_NAME);
}
