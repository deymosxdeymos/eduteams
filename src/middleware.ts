import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import {
  DEMO_SANDBOX_COOKIE_NAME,
  hasDemoSandboxAuthenticatedSession,
  isDemoModeEnabled,
  parseDemoSandboxCookieValue,
} from "@/lib/demo/sandbox";
import { routing } from "./i18n/routing";

function applySecurityHeaders(response: NextResponse) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "connect-src 'self' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy-Report-Only", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Permissions-Policy",
    [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "interest-cohort=()",
      "fullscreen=(self)",
    ].join(", "),
  );
  return response;
}

const intlMiddleware = createMiddleware(routing);

function hasBetterAuthSessionToken(request: NextRequest) {
  try {
    const tokenFromHeader = getSessionCookie(request.headers);
    if (tokenFromHeader) {
      return true;
    }
  } catch {
    // ignore and fallback
  }

  const token = request.cookies.get("better-auth.session_token")?.value;
  return Boolean(token);
}

async function hasDemoSandboxSession(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return false;
  }

  const demoSession = await parseDemoSandboxCookieValue(
    request.cookies.get(DEMO_SANDBOX_COOKIE_NAME)?.value,
  );

  return hasDemoSandboxAuthenticatedSession(demoSession);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, auth endpoints, and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  const hasBetterAuthSession = hasBetterAuthSessionToken(request);
  const hasRouteSession = hasBetterAuthSession || (await hasDemoSandboxSession(request));

  const protectedPathnameRegex = /^\/(en\/)?(dashboard|onboarding|profile|settings)/;
  const isProtectedRoute = protectedPathnameRegex.test(pathname);

  function detectLocale(_request: NextRequest): "id" | "en" {
    if (pathname.startsWith("/en")) {
      return "en";
    }

    return (routing.defaultLocale ?? "id") as "id" | "en";
  }

  // Redirect logged-in users from homepage to dashboard
  if ((pathname === "/" || pathname === "/en") && hasRouteSession) {
    const locale = detectLocale(request);
    const target = locale === "en" ? "/en/dashboard" : "/dashboard";
    const res = NextResponse.redirect(new URL(target, request.url));
    return applySecurityHeaders(res);
  }

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/en/login") ||
    pathname.startsWith("/en/register")
  ) {
    if (hasRouteSession) {
      const locale = detectLocale(request);
      const target = locale === "en" ? "/en/dashboard" : "/dashboard";
      const res = NextResponse.redirect(new URL(target, request.url));
      return applySecurityHeaders(res);
    }
  }

  if (isProtectedRoute && !hasRouteSession) {
    const locale = detectLocale(request);
    const url = new URL(locale === "en" ? "/en" : "/", request.url);
    const res = NextResponse.redirect(url);
    return applySecurityHeaders(res);
  }

  const response = intlMiddleware(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
