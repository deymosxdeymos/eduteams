import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { isSameOrigin } from "@/lib/csrf";
import { isActiveDemoAccountEmail, isDemoAccountEmail } from "@/lib/demo/auth";
import prisma from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";

export const runtime = "nodejs";

const joinClassSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

async function joinClass(
  request: NextRequest,
  { user, validatedData }: { user?: ExtendedUser; validatedData: { token: string } },
) {
  if (!user || !canAccessMahasiswaFeatures(user)) {
    return createErrorResponse("Access denied", 403);
  }

  if (isActiveDemoAccountEmail(user.email)) {
    return createErrorResponse("Demo accounts cannot join shared classes.", 403);
  }

  if (!isSameOrigin(request)) {
    return createErrorResponse("Invalid origin", 403);
  }

  const { token } = validatedData;

  const course = await prisma.course.findUnique({
    where: {
      shareToken: token.trim(),
    },
    include: {
      dosen: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!course) {
    return createErrorResponse("Invalid token. Class not found.", 404);
  }

  if (isDemoAccountEmail(course.dosen.email)) {
    return createErrorResponse("Demo classes cannot be joined from shared invites.", 403);
  }

  const existingEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: course.id,
        studentId: user.id,
      },
    },
  });

  if (existingEnrollment) {
    return createErrorResponse("You are already enrolled in this class.", 409);
  }

  await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      studentId: user.id,
    },
  });

  revalidateTag(CACHE_TAGS.coursesByDosen(course.dosenId));

  return createApiResponse({
    message: `Successfully joined ${course.namaMataKuliah} - ${course.kelas}`,
    course: {
      id: course.id,
      namaMataKuliah: course.namaMataKuliah,
      kelas: course.kelas,
      tahunAwalPeriode: course.tahunAwalPeriode,
      tahunAkhirPeriode: course.tahunAkhirPeriode,
      dosen: course.dosen,
    },
  });
}

export const POST = withAuth(
  withValidation((data: unknown) => joinClassSchema.parse(data), joinClass),
);
