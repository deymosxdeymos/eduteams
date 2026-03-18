import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { getLocalizedApiMessage, getRequestLocale } from "@/lib/api-i18n";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCoursesForDosen } from "@/lib/dashboard/courses";
import { parseDemoVisitorIdFromEmail } from "@/lib/demo/auth";
import { isDemoModeEnabled } from "@/lib/demo/config";
import { seedDemoStudentsForCourse } from "@/lib/demo/seed-students";
import { enrollPairedDemoStudentInCourse } from "@/lib/demo/sync-account";
import prisma, { type TransactionClient } from "@/lib/prisma";
import { buildVisibleCourseFilter } from "@/lib/utils/course-archive";
import { getCurrentAcademicYear } from "@/lib/utils/period";
import {
  type CourseCreateInput,
  type CourseCreateUserInput,
  buildCourseCreateInputSchema,
} from "@/lib/validation/course";

// Prisma requires Node.js runtime
export const runtime = "nodejs";

export const POST = withAuth(
  withValidation(
    (data: unknown, request: NextRequest) => {
      const locale = getRequestLocale(request);
      const localizedSchema = buildCourseCreateInputSchema({
        courseNameRequired: getLocalizedApiMessage(
          locale,
          "dashboard.modals.createClass.validation.courseNameRequired",
        ),
        classRequired: getLocalizedApiMessage(
          locale,
          "dashboard.modals.createClass.validation.classRequired",
        ),
        periodInvalid: getLocalizedApiMessage(
          locale,
          "dashboard.modals.createClass.validation.periodInvalid",
        ),
      });
      return localizedSchema.parse(data);
    },
    async (_request: NextRequest, { user, validatedData }) => {
      const userInput = validatedData as CourseCreateUserInput;

      // Only dosen can create courses
      if (user?.role !== "TEACHER") {
        return createErrorResponse("Only dosen can create courses", 403);
      }

      // Auto-detect current academic year
      const academicYear = getCurrentAcademicYear();

      // Merge user input with auto-detected academic year
      const courseData: CourseCreateInput = {
        ...userInput,
        tahunAwalPeriode: academicYear.tahunAwalPeriode,
        tahunAkhirPeriode: academicYear.tahunAkhirPeriode,
      };

      // Check for duplicate course (same name, class, year, period for same dosen)
      const existingCourse = await prisma.course.findFirst({
        where: {
          dosenId: user?.id,
          namaMataKuliah: courseData.namaMataKuliah,
          kelas: courseData.kelas,
          tahunAwalPeriode: courseData.tahunAwalPeriode,
          tahunAkhirPeriode: courseData.tahunAkhirPeriode,
          periode: courseData.periode,
          ...buildVisibleCourseFilter(),
        },
      });

      if (existingCourse) {
        const locale = getRequestLocale(_request);
        const errorMessage = getLocalizedApiMessage(
          locale,
          "dashboard.modals.createClass.duplicateError",
        );
        return createErrorResponse(errorMessage, 409);
      }

      const demoVisitorId = isDemoModeEnabled() ? parseDemoVisitorIdFromEmail(user.email) : null;

      const { course, pairedDemoStudentId, pairedDemoEnrollmentCount } = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const createdCourse = await tx.course.create({
            data: {
              ...courseData,
              dosenId: user?.id,
            },
            include: {
              dosen: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          if (demoVisitorId) {
            await seedDemoStudentsForCourse(createdCourse.id, demoVisitorId, tx);

            const pairedDemoEnrollment = await enrollPairedDemoStudentInCourse(
              createdCourse.id,
              demoVisitorId,
              { db: tx, revalidate: false },
            );

            return {
              course: createdCourse,
              pairedDemoStudentId: pairedDemoEnrollment.studentId,
              pairedDemoEnrollmentCount: pairedDemoEnrollment.enrollmentCount,
            };
          }

          return {
            course: createdCourse,
            pairedDemoStudentId: null,
            pairedDemoEnrollmentCount: 0,
          };
        },
      );

      revalidateTag(CACHE_TAGS.coursesByDosen(user?.id || ""));
      if (pairedDemoStudentId && pairedDemoEnrollmentCount > 0) {
        revalidateTag(CACHE_TAGS.studentClasses(pairedDemoStudentId));
      }

      return createApiResponse(course);
    },
  ),
  { allowDemoSandbox: true },
);

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  // Only dosen can view their courses
  if (user?.role !== "TEACHER") {
    return createErrorResponse("Only dosen can view courses", 403);
  }

  const courses = await getCoursesForDosen(user);

  return createApiResponse(courses);
});
