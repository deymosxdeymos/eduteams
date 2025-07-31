import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import type { Course, CourseEnrollment } from '@/lib/types';

export async function getCoursesByLecturer(dosenId: string): Promise<Course[]> {
  return await unstable_cache(
    async () => {
      return prisma.course.findMany({
        where: {
          dosenId,
        },
        include: {
          enrollments: true,
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

export function transformCourseToClassCard(
  course: Course & { enrollments?: CourseEnrollment[] }
) {
  return {
    id: course.id,
    title: course.namaMataKuliah,
    academicYear: `T.A ${course.tahunAwalPeriode}/${course.tahunAkhirPeriode}`,
    studentCount: course.enrollments?.length || 0,
    classCode: course.kelas,
  };
}
