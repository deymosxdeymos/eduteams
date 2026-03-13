import { type NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/csrf";
import { deleteAuthSessionCookies, deleteDemoVisitorCookies } from "@/lib/demo/auth";
import { deleteDemoVisitorData } from "@/lib/demo/cleanup";
import { DEMO_SANDBOX_COOKIE_NAME, isDemoModeEnabled } from "@/lib/demo/sandbox";
import { clearDemoSandboxRosterCookie } from "@/lib/demo/sandbox-roster";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await deleteDemoVisitorData(request);

  const response = NextResponse.json({ success: true });
  deleteAuthSessionCookies(response);
  deleteDemoVisitorCookies(response);
  response.cookies.delete(DEMO_SANDBOX_COOKIE_NAME);
  clearDemoSandboxRosterCookie(response);
  return response;
}
