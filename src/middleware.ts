import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getBetterAuthSessionToken } from "@/lib/better-auth-cookies";
import { routing } from "./i18n/routing";

const isDev = process.env.NODE_ENV === "development";

export function buildCsp(nonce: string, options?: { isDevelopment?: boolean }) {
  const isDevelopment = options?.isDevelopment ?? isDev;
  const scriptSrc = isDevelopment
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDevelopment
    ? "connect-src 'self' https: http: ws:"
    : "connect-src 'self' https:";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    connectSrc,
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "object-src 'none'",
  ].join("; ");
}

function applyRequestHeaderOverrides(response: NextResponse, requestHeaderOverrides: Headers) {
  const forwardedResponse = NextResponse.next({
    request: {
      headers: requestHeaderOverrides,
    },
  });

  const overrideHeaders = new Set(
    response.headers
      .get("x-middleware-override-headers")
      ?.split(",")
      .map((header) => header.trim())
      .filter(Boolean) ?? [],
  );

  for (const [key, value] of forwardedResponse.headers) {
    if (key === "x-middleware-override-headers") {
      for (const header of value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)) {
        overrideHeaders.add(header);
      }
      continue;
    }

    if (key.startsWith("x-middleware-request-")) {
      response.headers.set(key, value);
    }
  }

  if (overrideHeaders.size > 0) {
    response.headers.set("x-middleware-override-headers", Array.from(overrideHeaders).join(","));
  }
}

function applyBaseSecurityHeaders(response: NextResponse) {
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
}

function applySecurityHeaders(response: NextResponse) {
  applyBaseSecurityHeaders(response);

  if (response.headers.has("location")) {
    return response;
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);
  const requestHeaderOverrides = new Headers();

  requestHeaderOverrides.set("x-nonce", nonce);

  // Next.js only forwards request header changes into the render pipeline
  // when they are attached as middleware request overrides.
  applyRequestHeaderOverrides(response, requestHeaderOverrides);

  // Browser enforces the CSP from response headers
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  return response;
}

const STATIC_EXT_RE = /\.(ico|png|jpg|jpeg|svg|gif|webp)$/;
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

  return Boolean(getBetterAuthSessionToken(request));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, auth endpoints, and static files
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasRouteSession = hasBetterAuthSessionToken(request);

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
