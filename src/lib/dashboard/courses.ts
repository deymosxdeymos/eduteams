import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  DEMO_TEACHER_ID,
  getDemoCourseSummary,
  getDemoSandboxPrincipalId,
} from "@/lib/demo/sandbox";
import { getRemovedDemoStudentIdsFromCookieStore } from "@/lib/demo/sandbox-roster";
import prisma from "@/lib/prisma";
import type { ExtendedUser } from "@/lib/types";

export interface DosenCourseSummary {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string | null;
  dosenId: string;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  studentCount: number;
  dosen: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

function mergeDemoTeacherCourses(
  persistedCourses: DosenCourseSummary[],
  excludedStudentIds?: Iterable<string>,
) {
  const demoCourse = getDemoCourseSummary({ excludedStudentIds });
  const mergedCourses = [
    ...persistedCourses.filter((course) => course.id !== demoCourse.id),
    demoCourse,
  ];

  return mergedCourses.toSorted((left, right) => {
    const updatedAtDelta = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedAtDelta !== 0) {
      return updatedAtDelta;
    }

    const createdAtDelta = right.createdAt.getTime() - left.createdAt.getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.namaMataKuliah.localeCompare(right.namaMataKuliah, "id");
  });
}

async function fetchCoursesForDosen(userId: string): Promise<DosenCourseSummary[]> {
  const rows = await prisma.course.findMany({
    where: { dosenId: userId },
    select: {
      id: true,
      namaMataKuliah: true,
      kelas: true,
      tahunAwalPeriode: true,
      tahunAkhirPeriode: true,
      periode: true,
      dosenId: true,
      shareToken: true,
      createdAt: true,
      updatedAt: true,
      dosen: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row: (typeof rows)[number]) => ({
    id: row.id,
    namaMataKuliah: row.namaMataKuliah,
    kelas: row.kelas,
    tahunAwalPeriode: row.tahunAwalPeriode,
    tahunAkhirPeriode: row.tahunAkhirPeriode,
    periode: row.periode,
    dosenId: row.dosenId,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    studentCount: row._count.enrollments,
    dosen: row.dosen,
  }));
}

export async function getCoursesForDosen(
  user: Pick<ExtendedUser, "id"> & Partial<Pick<ExtendedUser, "email">>,
): Promise<DosenCourseSummary[]> {
  const fetcher = unstable_cache(() => fetchCoursesForDosen(user.id), ["courses:dosen", user.id], {
    tags: [CACHE_TAGS.coursesByDosen(user.id)],
  });

  const persistedCourses = await fetcher();

  if (getDemoSandboxPrincipalId(user) === DEMO_TEACHER_ID) {
    const removedStudentIds = await getRemovedDemoStudentIdsFromCookieStore();
    return mergeDemoTeacherCourses(persistedCourses, removedStudentIds);
  }

  return persistedCourses;
}
