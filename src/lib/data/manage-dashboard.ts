import prisma from "@/lib/prisma";
import {
  DEMO_TEACHER_ID,
  getDemoCourse,
  getDemoManageCourses,
  getDemoSandboxPrincipalId,
} from "@/lib/demo/sandbox";
import { getRemovedDemoStudentIdsFromCookieStore } from "@/lib/demo/sandbox-roster";
import { formatAcademicPeriodLabel, getCurrentAcademicPeriod } from "@/lib/utils/period";
import type { ExtendedUser } from "@/lib/types";
import type { ManageCourseRow } from "@/types/manage";

interface BaseCoursePeriod {
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
}

type AcademicSemester = "ganjil" | "genap" | "pendek";

function resolveSemester(value: string): AcademicSemester {
  const lower = value.toLowerCase();
  if (lower === "genap") return "genap";
  if (lower === "pendek") return "pendek";
  return "ganjil";
}

function normalizePeriodLabel({ tahunAwalPeriode, tahunAkhirPeriode, periode }: BaseCoursePeriod) {
  const semester = resolveSemester(periode);
  const formatted = formatAcademicPeriodLabel(tahunAwalPeriode, tahunAkhirPeriode, semester);
  return formatted.replace(" ", "/");
}

function isArchivedCourse(
  course: BaseCoursePeriod,
  currentPeriod: ReturnType<typeof getCurrentAcademicPeriod>,
) {
  if (course.tahunAkhirPeriode < currentPeriod.tahunAkhirPeriode) {
    return true;
  }

  if (course.tahunAkhirPeriode > currentPeriod.tahunAkhirPeriode) {
    return false;
  }

  const semester = resolveSemester(course.periode);

  if (semester === currentPeriod.periode) {
    return false;
  }

  // Same academic year, current semester is Genap so Ganjil is archived.
  if (currentPeriod.periode === "genap" && semester === "ganjil") {
    return true;
  }

  return false;
}

function mergeDemoManageCourses(
  persistedCourses: ManageCourseRow[],
  excludedStudentIds?: Iterable<string>,
) {
  const demoCourse = getDemoCourse();
  const demoCourses = getDemoManageCourses({ excludedStudentIds });
  const mergedCourses = [
    ...persistedCourses.filter((course) => course.id !== demoCourse.id),
    ...demoCourses,
  ];

  return mergedCourses.toSorted((left, right) => {
    const updatedAtDelta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    if (updatedAtDelta !== 0) {
      return updatedAtDelta;
    }

    return left.name.localeCompare(right.name, "id");
  });
}

export async function getManageCoursesForDosen(
  user: Pick<ExtendedUser, "id"> & Partial<Pick<ExtendedUser, "email">>,
): Promise<ManageCourseRow[]> {
  const currentPeriod = getCurrentAcademicPeriod();

  const courses = await prisma.course.findMany({
    where: { dosenId: user.id },
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { assignments: true, enrollments: true } },
    },
    orderBy: [{ tahunAwalPeriode: "desc" }, { periode: "desc" }, { namaMataKuliah: "asc" }],
  });

  const persistedCourses = courses.map((course: (typeof courses)[number]) => ({
    id: course.id,
    name: course.namaMataKuliah,
    classCode: course.kelas,
    periodLabel: normalizePeriodLabel(course),
    startYear: course.tahunAwalPeriode,
    endYear: course.tahunAkhirPeriode,
    semester: resolveSemester(course.periode),
    assignmentsCount: course._count.assignments,
    studentsCount: course._count.enrollments,
    isManuallyArchived: Boolean(course.archivedAt),
    isArchived: Boolean(course.archivedAt) || isArchivedCourse(course, currentPeriod),
    updatedAt: course.updatedAt.toISOString(),
  }));

  if (getDemoSandboxPrincipalId(user) === DEMO_TEACHER_ID) {
    const removedStudentIds = await getRemovedDemoStudentIdsFromCookieStore();
    return mergeDemoManageCourses(persistedCourses, removedStudentIds);
  }

  return persistedCourses;
}
