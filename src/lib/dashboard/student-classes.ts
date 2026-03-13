import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/api-utils";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import {
  DEMO_STUDENT_ID,
  getDemoSandboxPrincipalId,
  getDemoStudentClasses,
} from "@/lib/demo/sandbox";
import { getRemovedDemoStudentIdsFromCookieStore } from "@/lib/demo/sandbox-roster";
import prisma from "@/lib/prisma";

async function fetchStudentClasses(studentId: string) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      studentId,
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

  return enrollments.map((enrollment: (typeof enrollments)[number]) => ({
    id: enrollment.course.id,
    namaMataKuliah: enrollment.course.namaMataKuliah,
    kelas: enrollment.course.kelas,
    tahunAwalPeriode: enrollment.course.tahunAwalPeriode,
    tahunAkhirPeriode: enrollment.course.tahunAkhirPeriode,
    periode: enrollment.course.periode,
    dosen: enrollment.course.dosen,
    enrolledAt: enrollment.enrolledAt,
    studentCount: enrollment.course._count.enrollments,
    canLeave: true,
  }));
}

type StudentClassSummary = Awaited<ReturnType<typeof fetchStudentClasses>>[number];

function mergeDemoStudentClasses(
  persistedClasses: StudentClassSummary[],
  excludedStudentIds?: Iterable<string>,
) {
  const demoClasses = getDemoStudentClasses({ excludedStudentIds });
  const demoCourseIds = new Set(demoClasses.map((course) => course.id));
  const mergedClasses = [
    ...persistedClasses.filter((course) => !demoCourseIds.has(course.id)),
    ...demoClasses,
  ];

  return mergedClasses.toSorted((left, right) => {
    const enrolledAtDelta = right.enrolledAt.getTime() - left.enrolledAt.getTime();
    if (enrolledAtDelta !== 0) {
      return enrolledAtDelta;
    }

    return left.namaMataKuliah.localeCompare(right.namaMataKuliah, "id");
  });
}

// Cache per user - userId is included in the key array
function getCachedStudentClasses(userId: string) {
  return unstable_cache(() => fetchStudentClasses(userId), ["student-classes", userId], {
    revalidate: 60,
    tags: [`student-classes-${userId}`],
  })();
}

export async function getStudentClasses() {
  const user = await getCurrentUser();

  if (!user || !canAccessMahasiswaFeatures(user)) {
    return [];
  }

  try {
    const persistedClasses = await getCachedStudentClasses(user.id);

    if (getDemoSandboxPrincipalId(user) === DEMO_STUDENT_ID) {
      const removedStudentIds = await getRemovedDemoStudentIdsFromCookieStore();
      return mergeDemoStudentClasses(persistedClasses, removedStudentIds);
    }

    return persistedClasses;
  } catch {
    return [];
  }
}
