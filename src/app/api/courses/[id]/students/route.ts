import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser, handleApiError } from "@/lib/api-utils";
import { canAccessDosenFeatures, canAccessMahasiswaFeatures } from "@/lib/authorization";
import { getAuthorizedStudentsData } from "@/lib/data/course-data";
import prisma from "@/lib/prisma";
import { HttpError } from "@/lib/types";

// Cache for 10 minutes since student lists don't change frequently
export const revalidate = 600;
// Prisma requires Node.js runtime
export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    const isDosen = canAccessDosenFeatures(user);
    const isMahasiswa = canAccessMahasiswaFeatures(user);

    if (!isDosen && !isMahasiswa) {
      throw new HttpError(403, "Access denied");
    }

    const { id: courseId } = await params;

    // Verify access first before fetching student data
    const [courseAccess, enrollmentAccess] = await Promise.all([
      // Dosen access check
      isDosen
        ? prisma.course.findUnique({
            where: { id: courseId, dosenId: user.id },
            select: { id: true },
          })
        : null,
      // Mahasiswa access check
      isMahasiswa
        ? prisma.courseEnrollment.findUnique({
            where: {
              courseId_studentId: { courseId, studentId: user.id },
            },
            select: { courseId: true },
          })
        : null,
    ]);

    const hasAccess = isDosen ? !!courseAccess : !!enrollmentAccess;
    if (!hasAccess) {
      throw new HttpError(404, "Course not found or access denied");
    }

    const students = await getAuthorizedStudentsData(courseId, user);

    return NextResponse.json({
      success: true,
      data: students,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
