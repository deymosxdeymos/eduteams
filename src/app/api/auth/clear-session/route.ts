import { type NextRequest, NextResponse } from "next/server";
import {
  getBetterAuthCookiesToClear,
  isSecureBetterAuthCookieName,
} from "@/lib/better-auth-cookies";
import { isSameOrigin } from "@/lib/csrf";

function getRedirectTarget(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirect");

  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  return redirectTo;
}

function clearSessionAndRedirect(request: NextRequest) {
  const response = NextResponse.redirect(new URL(getRedirectTarget(request), request.url));

  for (const cookieName of getBetterAuthCookiesToClear(request)) {
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      maxAge: 0,
      path: "/",
      secure: isSecureBetterAuthCookieName(cookieName),
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  return clearSessionAndRedirect(request);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return clearSessionAndRedirect(request);
}
