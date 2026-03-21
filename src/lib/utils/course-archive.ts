import { getCurrentAcademicPeriod, isArchivedAcademicPeriod } from "@/lib/utils/period";

const COURSE_FORCE_VISIBLE_ARCHIVED_AT_DATE = new Date("1970-01-01T00:00:00.000Z");
const COURSE_FORCE_VISIBLE_ARCHIVED_AT_TIME = COURSE_FORCE_VISIBLE_ARCHIVED_AT_DATE.getTime();

interface CourseArchivePeriodInput {
  tahunAkhirPeriode: number;
  periode: string;
}

interface CourseArchiveStateInput extends CourseArchivePeriodInput {
  archivedAt?: Date | string | null;
}

function getArchivedAtTime(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function getCourseForceVisibleArchivedAt() {
  return new Date(COURSE_FORCE_VISIBLE_ARCHIVED_AT_TIME);
}

export function isCourseForceVisible(archivedAt: Date | string | null | undefined) {
  return getArchivedAtTime(archivedAt) === COURSE_FORCE_VISIBLE_ARCHIVED_AT_TIME;
}

export function isCourseManuallyArchived(archivedAt: Date | string | null | undefined) {
  const archivedAtTime = getArchivedAtTime(archivedAt);
  return archivedAtTime !== null && archivedAtTime !== COURSE_FORCE_VISIBLE_ARCHIVED_AT_TIME;
}

export function resolveCourseArchivedState(
  course: CourseArchiveStateInput,
  currentPeriod = getCurrentAcademicPeriod(),
) {
  const archivedAtTime = getArchivedAtTime(course.archivedAt);

  if (archivedAtTime === COURSE_FORCE_VISIBLE_ARCHIVED_AT_TIME) {
    return false;
  }

  if (archivedAtTime !== null) {
    return true;
  }

  return isArchivedAcademicPeriod(course, currentPeriod);
}

export function getNextCourseArchivedAt(
  input: CourseArchivePeriodInput & { archive: boolean },
  currentPeriod = getCurrentAcademicPeriod(),
) {
  if (input.archive) {
    return new Date();
  }

  return isArchivedAcademicPeriod(input, currentPeriod) ? getCourseForceVisibleArchivedAt() : null;
}

export function buildVisibleCourseFilter() {
  return {
    OR: [{ archivedAt: null }, { archivedAt: getCourseForceVisibleArchivedAt() }],
  };
}
