"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DosenCourseSummary } from "@/lib/dashboard/courses";
import type { DashboardStatistics } from "@/lib/dashboard/statistics-types";
import { calculateDemoDashboardStatistics } from "@/lib/demo/dashboard-statistics";
import { getDemoSandboxClientState } from "@/lib/demo/sandbox-client";
import {
  DEMO_COURSE_ID,
  DEMO_SANDBOX_STORAGE_KEY,
  DEMO_TEAM_FORMATION_STORAGE_EVENT,
} from "@/lib/demo/sandbox-shared";
import { ClassGrid, type ClassSummary } from "./class-grid";
import { EmptyClassState } from "./empty-class-state";
import { SearchInput } from "./search-input";
import { StatisticsCards } from "./statistics-cards";

interface ContentProps {
  statistics: DashboardStatistics;
  courses: DosenCourseSummary[];
}

type RawCourse = Partial<DosenCourseSummary> & {
  enrollments?: unknown[];
  _count?: { enrollments?: number };
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeCourseSummary(course: unknown): DosenCourseSummary | null {
  if (!course || typeof course !== "object") {
    return null;
  }

  const data = course as RawCourse;
  if (typeof data.id !== "string") {
    return null;
  }

  const studentCount =
    typeof data.studentCount === "number"
      ? data.studentCount
      : Array.isArray(data.enrollments)
        ? data.enrollments.length
        : typeof data._count?.enrollments === "number"
          ? data._count.enrollments
          : 0;

  const createdAt =
    data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt ?? Date.now());
  const updatedAt =
    data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt ?? Date.now());

  return {
    id: data.id,
    namaMataKuliah: data.namaMataKuliah ?? "",
    kelas: data.kelas ?? "tanpa-kelas",
    tahunAwalPeriode: data.tahunAwalPeriode ?? 0,
    tahunAkhirPeriode: data.tahunAkhirPeriode ?? 0,
    periode: data.periode ?? null,
    dosenId: data.dosenId ?? data.dosen?.id ?? "",
    shareToken: data.shareToken ?? null,
    createdAt,
    updatedAt,
    studentCount,
    dosen: {
      id: data.dosen?.id ?? data.dosenId ?? "",
      name: data.dosen?.name ?? null,
      email: data.dosen?.email ?? null,
    },
  };
}

export default function Content({ statistics, courses }: ContentProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.classCard");
  const [demoStatisticsState, setDemoStatisticsState] = useState(() => getDemoSandboxClientState());
  const [optimisticCourses, setOptimisticCourses] = useState<DosenCourseSummary[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const courseList = useMemo(() => {
    if (optimisticCourses.length === 0) {
      return courses;
    }

    const serverCourseIds = new Set(courses.map((course) => course.id));
    const pendingOptimisticCourses = optimisticCourses.filter(
      (course) => !serverCourseIds.has(course.id),
    );

    return [...pendingOptimisticCourses, ...courses];
  }, [courses, optimisticCourses]);

  const hasDemoSandboxCourse = useMemo(
    () => courseList.some((course) => course.id === DEMO_COURSE_ID),
    [courseList],
  );

  useEffect(() => {
    if (!hasDemoSandboxCourse) {
      return;
    }

    const syncDemoStatisticsState = () => {
      setDemoStatisticsState(getDemoSandboxClientState());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) {
        return;
      }

      if (
        event.key !== null &&
        event.key !== DEMO_SANDBOX_STORAGE_KEY &&
        !event.key.startsWith(`${DEMO_SANDBOX_STORAGE_KEY}:`)
      ) {
        return;
      }

      syncDemoStatisticsState();
    };

    syncDemoStatisticsState();
    window.addEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, syncDemoStatisticsState);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(DEMO_TEAM_FORMATION_STORAGE_EVENT, syncDemoStatisticsState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [hasDemoSandboxCourse]);

  const resolvedStatistics = useMemo(() => {
    if (!hasDemoSandboxCourse) {
      return statistics;
    }

    return calculateDemoDashboardStatistics({
      createdAssignments: demoStatisticsState.createdAssignments,
      formedTeams: demoStatisticsState.formedTeams,
    });
  }, [
    demoStatisticsState.createdAssignments,
    demoStatisticsState.formedTeams,
    hasDemoSandboxCourse,
    statistics,
  ]);

  const classes: ClassSummary[] = useMemo(
    () =>
      courseList.map((course) => ({
        id: course.id,
        title: course.namaMataKuliah,
        academicYear: t("academicYear", {
          start: course.tahunAwalPeriode,
          end: course.tahunAkhirPeriode,
        }),
        studentCount: course.studentCount,
        classCode: course.kelas,
      })),
    [courseList, t],
  );

  const filteredClasses = useMemo(() => {
    if (!searchValue) {
      return classes;
    }

    const query = searchValue.toLowerCase();
    return classes.filter(
      (classItem) =>
        classItem.title.toLowerCase().includes(query) ||
        classItem.classCode.toLowerCase().includes(query),
    );
  }, [classes, searchValue]);

  const handleClassCreated = useCallback(
    (course?: unknown) => {
      if (course) {
        const normalized = normalizeCourseSummary(course);
        if (normalized) {
          setOptimisticCourses((prev) => {
            const next = prev.filter((item) => item.id !== normalized.id);
            return [normalized, ...next];
          });
        }
      }
      router.refresh();
    },
    [router],
  );

  const hasClasses = courseList.length > 0;
  const showNoResults = searchValue.length > 0 && filteredClasses.length === 0;

  return (
    <div className="h-full flex flex-col gap-4">
      <StatisticsCards statistics={resolvedStatistics} />
      <div className="bg-white rounded-3xl flex flex-col flex-1 min-h-0 overflow-hidden">
        {hasClasses ? (
          <div className="p-6 pb-0">
            <SearchInput
              onClassCreated={handleClassCreated}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
            />
          </div>
        ) : null}
        <div className="flex-1 px-6 min-h-0 overflow-hidden">
          {hasClasses ? (
            <ClassGrid classes={filteredClasses} showNoResults={showNoResults} />
          ) : (
            <EmptyClassState onClassCreated={handleClassCreated} />
          )}
        </div>
      </div>
    </div>
  );
}
