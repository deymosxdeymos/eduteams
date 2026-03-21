import type { NextRequest } from "next/server";

export const BETTER_AUTH_SESSION_TOKEN_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

const BETTER_AUTH_BASE_COOKIES_TO_CLEAR = [
  ...BETTER_AUTH_SESSION_TOKEN_COOKIE_NAMES,
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
  "better-auth.dont_remember",
  "__Secure-better-auth.dont_remember",
] as const;

const BETTER_AUTH_SESSION_DATA_CHUNK_PREFIXES = [
  "better-auth.session_data.",
  "__Secure-better-auth.session_data.",
] as const;

export function getBetterAuthSessionToken(
  request: Pick<NextRequest, "cookies">,
): string | undefined {
  for (const cookieName of BETTER_AUTH_SESSION_TOKEN_COOKIE_NAMES) {
    const token = request.cookies.get(cookieName)?.value;
    if (token) {
      return token;
    }
  }

  return undefined;
}

export function getBetterAuthCookiesToClear(request: Pick<NextRequest, "cookies">) {
  const cookieNames = new Set<string>(BETTER_AUTH_BASE_COOKIES_TO_CLEAR);

  for (const { name } of request.cookies.getAll()) {
    if (BETTER_AUTH_SESSION_DATA_CHUNK_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      cookieNames.add(name);
    }
  }

  return cookieNames;
}

export function isSecureBetterAuthCookieName(cookieName: string) {
  return cookieName.startsWith("__Secure-");
}
