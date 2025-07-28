import prisma from '@/lib/prisma';
import { Course } from '@/lib/types';
import { unstable_cache } from 'next/cache';

export async function getCoursesByLecturer(dosenId: string): Promise<Course[]> {
  return await unstable_cache(
    async () => {
      return prisma.course.findMany({
        where: {
          dosenId,
        },
        orderBy: [
          { tahunAwalPeriode: 'desc' },
          { periode: 'desc' },
          { namaMataKuliah: 'asc' },
        ],
      });
    },
    [`courses-${dosenId}`],
    {
      tags: [`courses-${dosenId}`],
      revalidate: 3600, // Cache for 1 hour
    }
  )();
}

export function transformCourseToClassCard(course: Course) {
  return {
    id: course.id,
    title: course.namaMataKuliah,
    academicYear: `T.A ${course.tahunAwalPeriode}/${course.tahunAkhirPeriode}`,
    studentCount: 0, // TODO: Add student count from enrollment table when available
    classCode: course.kelas,
  };
}
