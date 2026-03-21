import type { NextRequest } from "next/server";
import { z } from "zod";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { canStartTeacherOnboarding } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";
// Prisma requires Node.js runtime
export const runtime = "nodejs";

const roleSchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]),
});

export const POST = withAuth(
  withValidation<z.infer<typeof roleSchema>, { user: ExtendedUser }>(
    (data: unknown) => roleSchema.parse(data),
    async (
      _request: NextRequest,
      { user, validatedData }: { user: ExtendedUser; validatedData: z.infer<typeof roleSchema> },
    ) => {
      const { role } = validatedData;

      if (role === "TEACHER" && !canStartTeacherOnboarding(user)) {
        return createErrorResponse("Institutional email required for teacher role", 403);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });

      return createApiResponse({ success: true });
    },
  ),
);
