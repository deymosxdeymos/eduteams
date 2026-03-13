import "server-only";
import { cookies as nextCookies } from "next/headers";
import type { NextResponse } from "next/server";
import { parseDemoRoleFromEmail } from "@/lib/demo/identity";
import {
  buildDemoSandboxSession,
  DEMO_SANDBOX_COOKIE_NAME,
  type DemoSandboxSession,
  stringifyDemoSandboxCookieValue,
} from "@/lib/demo/sandbox";
import type { ExtendedUser } from "@/lib/types";

const DEMO_SANDBOX_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type DemoSandboxCookieUser = Pick<ExtendedUser, "id" | "email">;

async function buildDemoSandboxCookieAttributes(session: DemoSandboxSession) {
  const value = await stringifyDemoSandboxCookieValue(session);

  return {
    name: DEMO_SANDBOX_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_SANDBOX_COOKIE_MAX_AGE,
  };
}

export async function setDemoSandboxSessionCookie(
  response: NextResponse,
  session: DemoSandboxSession,
) {
  response.cookies.set(await buildDemoSandboxCookieAttributes(session));
}

export async function refreshDemoSandboxSessionCookie(
  user: DemoSandboxCookieUser,
  session: Pick<DemoSandboxSession, "role" | "onboarded">,
) {
  if (parseDemoRoleFromEmail(user.email) !== session.role) {
    return false;
  }

  try {
    const cookieStore = await nextCookies();
    cookieStore.set(
      await buildDemoSandboxCookieAttributes(
        buildDemoSandboxSession(session.role, {
          onboarded: session.onboarded,
          userId: user.id,
          email: user.email,
        }),
      ),
    );

    return true;
  } catch {
    return false;
  }
}
