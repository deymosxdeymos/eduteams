import prisma from '@/lib/prisma';
import type { ManageCourseRow } from '@/types/manage';
import {
  formatAcademicPeriodLabel,
  getCurrentAcademicPeriod,
} from '../utils/period';

interface BaseCoursePeriod {
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
}

type AcademicSemester = 'ganjil' | 'genap';

function resolveSemester(value: string): AcademicSemester {
  const lower = value.toLowerCase();
  return lower === 'genap' ? 'genap' : 'ganjil';
}

function normalizePeriodLabel({
  tahunAwalPeriode,
  tahunAkhirPeriode,
  periode,
}: BaseCoursePeriod) {
  const semester = resolveSemester(periode);
  const formatted = formatAcademicPeriodLabel(
    tahunAwalPeriode,
    tahunAkhirPeriode,
    semester
  );
  return formatted.replace(' ', '/');
}

function isArchivedCourse(
  course: BaseCoursePeriod,
  currentPeriod: ReturnType<typeof getCurrentAcademicPeriod>
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
  if (currentPeriod.periode === 'genap' && semester === 'ganjil') {
    return true;
  }

  return false;
}

export async function getManageCoursesForDosen(
  dosenId: string
): Promise<ManageCourseRow[]> {
  const currentPeriod = getCurrentAcademicPeriod();

  const courses = await prisma.course.findMany({
    where: { dosenId },
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
    orderBy: [
      { tahunAwalPeriode: 'desc' },
      { periode: 'desc' },
      { namaMataKuliah: 'asc' },
    ],
  });

  return courses.map(course => ({
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
    isArchived:
      Boolean(course.archivedAt) || isArchivedCourse(course, currentPeriod),
    updatedAt: course.updatedAt.toISOString(),
  }));
}
