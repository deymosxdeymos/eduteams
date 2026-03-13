import type { NextRequest } from "next/server";
import { z } from "zod";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { isActiveDemoAccountEmail, parseDemoRoleFromEmail } from "@/lib/demo/auth";
import prisma from "@/lib/prisma";
import { genderToLabel, labelToGender } from "@/lib/utils/gender";
// Prisma requires Node.js runtime
export const runtime = "nodejs";

const dataDiriSchema = z.object({
  namaLengkap: z.string().min(1, "Nama lengkap is required"),
  nim: z.string().optional(),
  jenisKelamin: z.enum(["laki-laki", "perempuan"]),
});

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: user?.id },
    select: {
      name: true,
      nim: true,
      role: true,
      gender: true,
    },
  });

  if (!currentUser) {
    return createErrorResponse("User not found", 404);
  }

  const jenisKelamin = genderToLabel(currentUser.gender);

  return createApiResponse({
    namaLengkap: currentUser.name || "",
    nim: currentUser.nim || "",
    jenisKelamin,
    role: currentUser.role || "",
  });
});

export const POST = withAuth(
  withValidation(
    (data: unknown) => dataDiriSchema.parse(data),
    async (_request: NextRequest, { user, validatedData }) => {
      if (!user) {
        return createErrorResponse("Unauthorized", 401);
      }

      const { namaLengkap, nim, jenisKelamin } = validatedData;
      const currentRole = user.role;
      const demoRole = isActiveDemoAccountEmail(user.email)
        ? parseDemoRoleFromEmail(user.email)
        : null;

      if (!currentRole) {
        return createErrorResponse("Role must be selected before updating profile", 400);
      }

      if (demoRole && demoRole !== currentRole) {
        return createErrorResponse("Demo accounts cannot switch role scope", 403);
      }

      if (currentRole === "STUDENT" && !nim) {
        return createErrorResponse("NIM is required for mahasiswa", 400);
      }

      const gender = labelToGender(jenisKelamin);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: namaLengkap,
          nim: currentRole === "STUDENT" ? nim : null,
          gender,
        },
      });

      return createApiResponse({ success: true });
    },
  ),
  { allowDemoSandbox: true },
);
