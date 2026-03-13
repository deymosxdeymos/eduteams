import "server-only";
import type { NextRequest } from "next/server";
import {
  getDemoAccount,
  getDemoVisitorIdFromRequest,
  parseDemoVisitorIdFromEmail,
} from "@/lib/demo/auth";
import prisma from "@/lib/prisma";
import { getDemoStudentVisitorEmailPrefix } from "./seed-students";
import { DEMO_SANDBOX_COOKIE_NAME, parseDemoSandboxCookieValue } from "./sandbox";

type DemoCleanupRequest = Pick<NextRequest, "cookies"> | { cookies?: NextRequest["cookies"] };

function getCookieValue(request: DemoCleanupRequest, name: string) {
  return request.cookies?.get(name)?.value;
}

export async function resolveDemoVisitorIdForCleanup(request: DemoCleanupRequest) {
  if (request.cookies) {
    const visitorId = getDemoVisitorIdFromRequest(request as Pick<NextRequest, "cookies">);

    if (visitorId) {
      return visitorId;
    }
  }

  const demoSession = await parseDemoSandboxCookieValue(
    getCookieValue(request, DEMO_SANDBOX_COOKIE_NAME),
  );

  if (!demoSession?.email) {
    return null;
  }

  return parseDemoVisitorIdFromEmail(demoSession.email);
}

export async function deleteDemoVisitorData(request: DemoCleanupRequest) {
  const visitorId = await resolveDemoVisitorIdForCleanup(request);

  if (!visitorId) {
    return { visitorId: null, deletedUserCount: 0 };
  }

  const teacherAccount = getDemoAccount("TEACHER", visitorId);
  const studentAccount = getDemoAccount("STUDENT", visitorId);
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: teacherAccount.email },
        { email: studentAccount.email },
        {
          email: {
            startsWith: getDemoStudentVisitorEmailPrefix(visitorId),
          },
        },
      ],
    },
  });

  return {
    visitorId,
    deletedUserCount: deletedUsers.count,
  };
}
