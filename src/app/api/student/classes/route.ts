import type { NextRequest } from "next/server";
import { createApiResponse, createErrorResponse, withAuth } from "@/lib/api-utils";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import prisma from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";

export const runtime = "nodejs";

async function getStudentClasses(_request: NextRequest, { user }: { user: ExtendedUser }) {
  if (!canAccessMahasiswaFeatures(user)) {
    return createErrorResponse("Access denied", 403);
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      studentId: user.id,
    },
    select: {
      enrolledAt: true,
      course: {
        select: {
          id: true,
          namaMataKuliah: true,
          kelas: true,
          tahunAwalPeriode: true,
          tahunAkhirPeriode: true,
          periode: true,
          dosen: {
            select: {
              name: true,
            },
          },
          _count: { select: { enrollments: true } },
        },
      },
    },
    orderBy: [
      { course: { tahunAwalPeriode: "desc" } },
      { course: { periode: "desc" } },
      { course: { namaMataKuliah: "asc" } },
    ],
  });

  const courses = enrollments.map((enrollment: (typeof enrollments)[number]) => ({
    id: enrollment.course.id,
    namaMataKuliah: enrollment.course.namaMataKuliah,
    kelas: enrollment.course.kelas,
    tahunAwalPeriode: enrollment.course.tahunAwalPeriode,
    tahunAkhirPeriode: enrollment.course.tahunAkhirPeriode,
    periode: enrollment.course.periode,
    dosen: enrollment.course.dosen,
    enrolledAt: enrollment.enrolledAt,
    studentCount: enrollment.course._count.enrollments,
  }));

  return createApiResponse(courses);
}

export const GET = withAuth(getStudentClasses);
