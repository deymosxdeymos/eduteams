import prisma from '@/lib/prisma';
import type { Course, CourseEnrollment } from '@/lib/types';

export async function getCoursesByLecturer(dosenId: string): Promise<Course[]> {
  // Disable cache temporarily to test
  const courses = await prisma.course.findMany({
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

  console.log(
    `[NO CACHE] Fetched ${courses.length} courses for dosen ${dosenId}`
  );
  courses.forEach(course => {
    console.log(
      `[NO CACHE] Course "${course.namaMataKuliah}" (${course.kelas}): ${course.enrollments.length} enrollments`
    );
  });

  return courses;
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
