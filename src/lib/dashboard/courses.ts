import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache-tags';
import prisma from '@/lib/prisma';

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

async function fetchCoursesForDosen(
  userId: string
): Promise<DosenCourseSummary[]> {
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
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(row => ({
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
  userId: string
): Promise<DosenCourseSummary[]> {
  const fetcher = unstable_cache(
    () => fetchCoursesForDosen(userId),
    ['courses:dosen', userId],
    {
      tags: [CACHE_TAGS.coursesByDosen(userId)],
    }
  );

  return fetcher();
}
