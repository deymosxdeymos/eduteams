import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { getLocalizedApiMessage, getRequestLocale } from "@/lib/api-i18n";
import { createApiResponse, createErrorResponse, withAuth, withValidation } from "@/lib/api-utils";
import { canAccessDosenFeatures } from "@/lib/authorization";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getCoursesForDosen } from "@/lib/dashboard/courses";
import { checkMutationRateLimit, createRateLimitResponse } from "@/lib/mutation-rate-limit";
import prisma, { type TransactionClient } from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";
import { buildVisibleCourseFilter } from "@/lib/utils/course-archive";
import { getCurrentAcademicYear } from "@/lib/utils/period";
import {
  type CourseCreateInput,
  type CourseCreateUserInput,
  buildCourseCreateInputSchema,
} from "@/lib/validation/course";

// Prisma requires Node.js runtime
export const runtime = "nodejs";

const COURSE_CREATION_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const COURSE_CREATION_RATE_LIMIT_PER_IP = 12;
const COURSE_CREATION_RATE_LIMIT_PER_USER = 6;

const createCourseWithValidatedBody = withValidation<CourseCreateUserInput, { user: ExtendedUser }>(
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
  async (
    request: NextRequest,
    { user, validatedData }: { user: ExtendedUser; validatedData: CourseCreateUserInput },
  ) => {
    // Auth already checked in POST handler before rate limiting

    // Auto-detect current academic year
    const academicYear = getCurrentAcademicYear();

    // Merge user input with auto-detected academic year
    const courseData: CourseCreateInput = {
      ...validatedData,
      tahunAwalPeriode: academicYear.tahunAwalPeriode,
      tahunAkhirPeriode: academicYear.tahunAkhirPeriode,
    };

    // Check for duplicate course (same name, class, year, period for same dosen)
    const existingCourse = await prisma.course.findFirst({
      where: {
        dosenId: user.id,
        namaMataKuliah: courseData.namaMataKuliah,
        kelas: courseData.kelas,
        tahunAwalPeriode: courseData.tahunAwalPeriode,
        tahunAkhirPeriode: courseData.tahunAkhirPeriode,
        periode: courseData.periode,
        ...buildVisibleCourseFilter(),
      },
    });

    if (existingCourse) {
      const locale = getRequestLocale(request);
      const errorMessage = getLocalizedApiMessage(
        locale,
        "dashboard.modals.createClass.duplicateError",
      );
      return createErrorResponse(errorMessage, 409);
    }

    const course = await prisma.$transaction(async (tx: TransactionClient) => {
      const createdCourse = await tx.course.create({
        data: {
          ...courseData,
          dosenId: user.id,
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

      return createdCourse;
    });

    revalidateTag(CACHE_TAGS.coursesByDosen(user.id));

    return createApiResponse(course);
  },
);

export const POST = withAuth(async (request: NextRequest, { user }) => {
  if (!canAccessDosenFeatures(user)) {
    return createErrorResponse("Only dosen can create courses", 403);
  }

  const rateLimit = await checkMutationRateLimit(request, {
    keyPrefix: "course-create",
    userId: user.id,
    windowMs: COURSE_CREATION_RATE_LIMIT_WINDOW_MS,
    perIp: COURSE_CREATION_RATE_LIMIT_PER_IP,
    perUser: COURSE_CREATION_RATE_LIMIT_PER_USER,
  });

  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit, {
      ip: `Too many course creation requests. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
      user: "Course creation limit reached. Please try again later.",
    });
  }

  return createCourseWithValidatedBody(request, { user });
});

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  if (!canAccessDosenFeatures(user)) {
    return createErrorResponse("Only dosen can view courses", 403);
  }

  const courses = await getCoursesForDosen(user);

  return createApiResponse(courses);
});
