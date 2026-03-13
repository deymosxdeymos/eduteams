import { headers as nextHeaders } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { isSameOrigin } from "@/lib/csrf";
import {
  clearAuthSessionCookies,
  deleteAuthSessionCookies,
  getDemoAccount,
  getDemoAuthRecoveryState,
  getDemoVisitorIdFromRequest,
  parseDemoVisitorIdFromEmail,
  repairDemoAuthCredential,
  setDemoVisitorCookie,
} from "@/lib/demo/auth";
import { isDemoModeEnabled } from "@/lib/demo/config";
import { buildDemoSandboxSession } from "@/lib/demo/sandbox";
import { setDemoSandboxSessionCookie } from "@/lib/demo/sandbox-cookie";
import { syncDemoAccount } from "@/lib/demo/sync-account";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

export const runtime = "nodejs";

const switchRoleSchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]),
});

async function getDemoSessionVisitor(request: NextRequest) {
  const currentUser = await getCurrentUser();
  const visitorId = currentUser?.email ? parseDemoVisitorIdFromEmail(currentUser.email) : null;

  if (!visitorId) {
    return null;
  }

  const visitorIdFromCookie = getDemoVisitorIdFromRequest(request);

  return {
    visitorId,
    shouldSetCookie: visitorIdFromCookie !== visitorId,
  };
}

async function getRequestedRole(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody) {
    return { success: false as const };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return { success: false as const };
  }

  const parsedBody = switchRoleSchema.safeParse(parsedJson);
  if (!parsedBody.success) {
    return { success: false as const };
  }

  return {
    success: true as const,
    role: parsedBody.data.role,
  };
}

async function rollbackCreatedDemoAuthState(userId: string) {
  let deleteError: unknown = null;

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    deleteError = error;
  }

  await clearAuthSessionCookies();

  if (deleteError) {
    throw deleteError;
  }
}

export async function POST(request: NextRequest) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const demoVisitor = await getDemoSessionVisitor(request);
  if (!demoVisitor) {
    return NextResponse.json({ success: false, error: "Demo session required" }, { status: 403 });
  }

  const createResponse = (body: Record<string, unknown>, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    setDemoVisitorCookie(response, demoVisitor.visitorId);
    return response;
  };

  const clientId = getClientIdentifier(request);
  const rateLimit = await checkRateLimit({
    key: clientId ? `demo-switch:ip:${clientId}` : `demo-switch:visitor:${demoVisitor.visitorId}`,
    limit: 20,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createResponse(
      {
        success: false,
        error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.`,
      },
      { status: 429 },
    );
  }

  const requestedRole = await getRequestedRole(request);
  if (!requestedRole.success) {
    return createResponse({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const account = getDemoAccount(requestedRole.role, demoVisitor.visitorId);
  const reqHeaders = await nextHeaders();
  let shouldDeleteAuthCookies = false;
  const signInToDemoAccount = () =>
    auth.api.signInEmail({
      body: { email: account.email, password: account.password },
      headers: reqHeaders,
    });

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
      select: { id: true },
    });

    if (existingUser) {
      await syncDemoAccount(existingUser.id, requestedRole.role, demoVisitor.visitorId);

      try {
        await signInToDemoAccount();

        const response = createResponse({ success: true });
        await setDemoSandboxSessionCookie(
          response,
          buildDemoSandboxSession(requestedRole.role, {
            userId: existingUser.id,
            email: account.email,
            onboarded: true,
          }),
        );
        return response;
      } catch (error) {
        const recoveryState = await getDemoAuthRecoveryState(account.email, error);
        if (!recoveryState) {
          throw error;
        }

        if (recoveryState.type !== "missing-user") {
          await repairDemoAuthCredential(recoveryState, account.password);
          await signInToDemoAccount();
          const response = createResponse({ success: true });
          await setDemoSandboxSessionCookie(
            response,
            buildDemoSandboxSession(requestedRole.role, {
              userId: recoveryState.userId,
              email: account.email,
              onboarded: true,
            }),
          );
          return response;
        }
      }
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: account.password,
      },
      headers: reqHeaders,
    });

    if (!result?.user) {
      return createResponse({ success: false, error: "Failed to create user" }, { status: 500 });
    }

    try {
      await syncDemoAccount(result.user.id, requestedRole.role, demoVisitor.visitorId);
    } catch (error) {
      shouldDeleteAuthCookies = true;
      await rollbackCreatedDemoAuthState(result.user.id);
      throw error;
    }

    const response = createResponse({ success: true });
    await setDemoSandboxSessionCookie(
      response,
      buildDemoSandboxSession(requestedRole.role, {
        userId: result.user.id,
        email: account.email,
        onboarded: true,
      }),
    );
    return response;
  } catch (error) {
    console.error("Demo switch-role error:", error);
    const response = createResponse(
      { success: false, error: "Failed to switch role" },
      { status: 500 },
    );

    if (shouldDeleteAuthCookies) {
      deleteAuthSessionCookies(response);
    }

    return response;
  }
}
