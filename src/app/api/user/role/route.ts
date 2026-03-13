import type { NextRequest } from "next/server";
import { z } from "zod";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { isActiveDemoAccountEmail, parseDemoRoleFromEmail } from "@/lib/demo/auth";
import { isInstitutionalEmail } from "@/lib/email";
import prisma from "@/lib/prisma";
// Prisma requires Node.js runtime
export const runtime = "nodejs";

const roleSchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]),
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => roleSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      if (!user) {
        return createErrorResponse("Unauthorized", 401);
      }

      const { role } = validatedData;
      const demoRole = isActiveDemoAccountEmail(user.email)
        ? parseDemoRoleFromEmail(user.email)
        : null;
      const canChooseTeacher =
        role !== "TEACHER" || isInstitutionalEmail(user.email) || demoRole === "TEACHER";

      if (!canChooseTeacher) {
        return createErrorResponse("Only eligible accounts can choose TEACHER", 403);
      }

      if (demoRole && demoRole !== role) {
        return createErrorResponse("Demo accounts cannot switch role scope", 403);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });

      return createApiResponse({ success: true });
    },
  ),
  { allowDemoSandbox: true },
);
