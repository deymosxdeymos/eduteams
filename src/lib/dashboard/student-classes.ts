import { unstable_cache } from 'next/cache';
import { getCurrentUser } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

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
      { course: { tahunAwalPeriode: 'desc' } },
      { course: { periode: 'desc' } },
      { course: { namaMataKuliah: 'asc' } },
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
  }));
}

// Cache per user - userId is included in the key array
function getCachedStudentClasses(userId: string) {
  return unstable_cache(
    () => fetchStudentClasses(userId),
    ['student-classes', userId],
    { revalidate: 60, tags: [`student-classes-${userId}`] }
  )();
}

export async function getStudentClasses() {
  const user = await getCurrentUser();

  if (!user || !canAccessMahasiswaFeatures(user)) {
    return [];
  }

  try {
    return await getCachedStudentClasses(user.id);
  } catch {
    return [];
  }
}
