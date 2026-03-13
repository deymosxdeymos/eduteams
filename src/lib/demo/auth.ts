import "server-only";
import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { hashPassword } from "better-auth/crypto";
import type { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { DEMO_ACCOUNT_PROFILES, type DemoRole } from "@/lib/demo/config";
import {
  DEMO_VISITOR_COOKIE_MAX_AGE,
  DEMO_VISITOR_COOKIE_NAME,
  DEMO_VISITOR_PUBLIC_COOKIE_NAME,
} from "@/lib/demo/cookies";
import { getDemoRequiredSecret } from "@/lib/demo/env";
import { DEMO_EMAIL_DOMAIN, isDemoAccountEmail } from "@/lib/demo/identity";

export { DEMO_VISITOR_COOKIE_NAME, DEMO_VISITOR_PUBLIC_COOKIE_NAME } from "@/lib/demo/cookies";
export {
  isActiveDemoAccountEmail,
  isDemoAccountEmail,
  parseDemoRoleFromEmail,
  parseDemoVisitorIdFromEmail,
} from "@/lib/demo/identity";
const DEMO_VISITOR_ID_PATTERN = /^[a-z0-9_-]{8,64}$/i;
const BETTER_AUTH_STABLE_CODE_PATTERN = /^[A-Z0-9_]+$/;

export type DemoAuthRecoveryState =
  | { type: "missing-user" }
  | {
      type: "missing-credential";
      userId: string;
      credentialAccountId: string | null;
    }
  | {
      type: "stale-credential";
      userId: string;
      credentialAccountId: string;
    };

type RepairableDemoAuthRecoveryState = Exclude<DemoAuthRecoveryState, { type: "missing-user" }>;

function getDemoPasswordSecret() {
  return getDemoRequiredSecret();
}

function isValidDemoVisitorId(value: string | null | undefined): value is string {
  return Boolean(value && DEMO_VISITOR_ID_PATTERN.test(value));
}

function createDemoPassword(visitorId: string, role: DemoRole) {
  const digest = createHash("sha256")
    .update(`${getDemoPasswordSecret()}:${visitorId}:${role}`)
    .digest("base64url");

  return `Demo-${role}-${digest.slice(0, 32)}`;
}

export function createDemoVisitorId() {
  return createId();
}

export function getDemoVisitorIdFromRequest(request: Pick<NextRequest, "cookies">) {
  const value = request.cookies.get(DEMO_VISITOR_COOKIE_NAME)?.value?.trim();

  if (!isValidDemoVisitorId(value)) {
    return null;
  }

  return value;
}

export function resolveDemoVisitorId(request: Pick<NextRequest, "cookies">) {
  const visitorId = getDemoVisitorIdFromRequest(request);
  if (visitorId) {
    return { visitorId, shouldSetCookie: false };
  }

  return {
    visitorId: createDemoVisitorId(),
    shouldSetCookie: true,
  };
}

export function setDemoVisitorCookie(response: NextResponse, visitorId: string) {
  const cookieAttributes = {
    value: visitorId,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_VISITOR_COOKIE_MAX_AGE,
  };

  response.cookies.set({
    name: DEMO_VISITOR_COOKIE_NAME,
    httpOnly: true,
    ...cookieAttributes,
  });
  response.cookies.set({
    name: DEMO_VISITOR_PUBLIC_COOKIE_NAME,
    httpOnly: false,
    ...cookieAttributes,
  });
}

export function deleteDemoVisitorCookies(response: NextResponse) {
  response.cookies.delete(DEMO_VISITOR_COOKIE_NAME);
  response.cookies.delete(DEMO_VISITOR_PUBLIC_COOKIE_NAME);
}

const AUTH_SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth.session_data",
  "__Secure-better-auth.session_data",
  "better-auth.dont_remember",
  "__Secure-better-auth.dont_remember",
] as const;

export async function clearAuthSessionCookies() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  for (const cookieName of AUTH_SESSION_COOKIE_NAMES) {
    cookieStore.delete(cookieName);
  }
}

export function deleteAuthSessionCookies(response: NextResponse) {
  for (const cookieName of AUTH_SESSION_COOKIE_NAMES) {
    response.cookies.delete(cookieName);
  }
}

export function getDemoAccount(role: DemoRole, visitorId: string) {
  const profile = DEMO_ACCOUNT_PROFILES[role];
  const roleSlug = role.toLowerCase();

  return {
    ...profile,
    email: `demo.${roleSlug}.${visitorId}@${DEMO_EMAIL_DOMAIN}`,
    password: createDemoPassword(visitorId, role),
  };
}

export async function repairDemoAuthCredential(
  recoveryState: RepairableDemoAuthRecoveryState,
  password: string,
) {
  const passwordHash = await hashPassword(password);

  if (recoveryState.credentialAccountId) {
    await prisma.account.update({
      where: { id: recoveryState.credentialAccountId },
      data: { password: passwordHash },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: createId(),
      userId: recoveryState.userId,
      accountId: recoveryState.userId,
      providerId: "credential",
      password: passwordHash,
    },
  });
}

function getNormalizedBetterAuthField(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function getKnownBetterAuthErrorCode(value: unknown) {
  const normalizedValue = getNormalizedBetterAuthField(value);
  if (!normalizedValue) {
    return null;
  }

  return BETTER_AUTH_STABLE_CODE_PATTERN.test(normalizedValue) ? normalizedValue : null;
}

export function getBetterAuthErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const authError = error as {
    body?: { code?: unknown };
    code?: unknown;
  };
  const codeCandidates = [authError.body?.code, authError.code];

  for (const candidate of codeCandidates) {
    const errorCode = getKnownBetterAuthErrorCode(candidate);

    if (errorCode) {
      return errorCode;
    }
  }

  return null;
}

const RECOVERABLE_DEMO_SIGN_IN_ERRORS = new Set<string>([
  "INVALID_EMAIL_OR_PASSWORD",
  "USER_NOT_FOUND",
  "CREDENTIAL_ACCOUNT_NOT_FOUND",
]);

export async function getDemoAuthRecoveryState(
  email: string,
  error: unknown,
): Promise<DemoAuthRecoveryState | null> {
  const errorCode = getBetterAuthErrorCode(error);

  if (!isDemoAccountEmail(email) || !errorCode || !RECOVERABLE_DEMO_SIGN_IN_ERRORS.has(errorCode)) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      accounts: {
        where: { providerId: "credential" },
        select: {
          id: true,
          password: true,
        },
        take: 1,
      },
    },
  });

  if (!user) {
    return { type: "missing-user" };
  }

  const credentialAccount = user.accounts[0];
  if (!credentialAccount?.password) {
    return {
      type: "missing-credential",
      userId: user.id,
      credentialAccountId: credentialAccount?.id ?? null,
    };
  }

  if (errorCode === "INVALID_EMAIL_OR_PASSWORD") {
    return {
      type: "stale-credential",
      userId: user.id,
      credentialAccountId: credentialAccount.id,
    };
  }

  return null;
}
