import { type NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/csrf";
import { deleteAuthSessionCookies, deleteDemoVisitorCookies } from "@/lib/demo/auth";
import { deleteDemoVisitorData } from "@/lib/demo/cleanup";
import { DEMO_SANDBOX_COOKIE_NAME } from "@/lib/demo/sandbox";
import { clearDemoSandboxRosterCookie } from "@/lib/demo/sandbox-roster";
import { clearDemoSandboxSubmissionsCookie } from "@/lib/demo/sandbox-submissions";

function getRedirectTarget(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirect");

  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  return redirectTo;
}

async function clearSessionAndRedirect(
  request: NextRequest,
  options?: { deleteDemoData?: boolean },
) {
  if (options?.deleteDemoData ?? true) {
    await deleteDemoVisitorData(request);
  }

  const response = NextResponse.redirect(new URL(getRedirectTarget(request), request.url));
  deleteAuthSessionCookies(response);
  response.cookies.delete(DEMO_SANDBOX_COOKIE_NAME);
  clearDemoSandboxRosterCookie(response);
  clearDemoSandboxSubmissionsCookie(response);
  if (options?.deleteDemoData ?? true) {
    deleteDemoVisitorCookies(response);
  }
  return response;
}

export async function GET(request: NextRequest) {
  return clearSessionAndRedirect(request, { deleteDemoData: isSameOrigin(request) });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return clearSessionAndRedirect(request);
}
