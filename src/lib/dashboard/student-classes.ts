import { getCurrentUser } from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export async function getStudentClasses() {
  const user = await getCurrentUser();

  if (!user || !canAccessMahasiswaFeatures(user)) {
    return [];
  }

  try {
    // Fetch enrolled courses for student
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: user.id,
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

    const courses = enrollments.map(enrollment => ({
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

    return courses;
  } catch {
    return [];
  }
}
