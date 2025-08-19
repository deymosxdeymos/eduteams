import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClassPageLayout } from '@/components/dashboard/class-page-layout';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { StudentClassPageLayout } from '@/components/dashboard/student-class-page-layout';
import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import { protectDashboard } from '@/lib/server-auth';
import type { ExtendedUser } from '@/lib/types';

type CourseResult = {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  periode: string;
  dosenId: string;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  dosen?: {
    id: string;
    name: string;
    email: string;
  };
};

type StudentData = {
  id: string;
  name: string;
  nim: string;
  email: string;
  mbtiType?: string | null;
  enrolledAt: Date;
};

export const dynamic = 'force-dynamic';

// Cache course data to avoid duplicate queries
async function getCourseData(id: string, user: ExtendedUser) {
  const isDosen = canAccessDosenFeatures(user);

  if (isDosen) {
    return await prisma.course.findFirst({
      where: { id, dosenId: user.id },
      include: {
        dosen: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
  return null;
}

// Optimized single query for mahasiswa to get course + enrollment in one go
async function getCourseDataForMahasiswa(id: string, userId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: { courseId: id, studentId: userId },
    },
    include: {
      course: {
        include: {
          dosen: {
            select: { id: true, name: true, email: true },
          },
          enrollments: {
            select: {
              enrolledAt: true,
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  nimNpm: true,
                  mbtiType: true,
                },
              },
            },
            orderBy: { student: { name: 'asc' } },
          },
        },
      },
    },
  });

  if (!enrollment) return { course: null, students: [] };

  const students = enrollment.course.enrollments.map(enroll => ({
    id: enroll.student.id,
    name: enroll.student.name || 'Unknown',
    nim: enroll.student.nimNpm || 'N/A',
    email: enroll.student.email || 'N/A',
    mbtiType: enroll.student.mbtiType,
    enrolledAt: enroll.enrolledAt,
  }));

  // Remove enrollments from course object to match CourseResult type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { enrollments: _, ...course } = enrollment.course;

  return { course, students };
}

// Parallel fetch students data
async function getStudentsData(courseId: string): Promise<StudentData[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    select: {
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          nimNpm: true,
          mbtiType: true,
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });

  return enrollments.map(enrollment => ({
    id: enrollment.student.id,
    name: enrollment.student.name || 'Unknown',
    nim: enrollment.student.nimNpm || 'N/A',
    email: enrollment.student.email || 'N/A',
    mbtiType: enrollment.student.mbtiType,
    enrolledAt: enrollment.enrolledAt,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  // Lightweight query for metadata only
  const course = await prisma.course.findFirst({
    where: { id },
    select: { namaMataKuliah: true, kelas: true },
  });

  const title = course
    ? `${course.namaMataKuliah} - ${course.kelas} | EduTeams`
    : 'Kelas - EduTeams';

  const description = course
    ? `Kelola kelas ${course.namaMataKuliah} - ${course.kelas}`
    : 'Halaman detail kelas';

  return { title, description };
}

interface ClassPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassPage({ params }: ClassPageProps) {
  const user = await protectDashboard();
  const { id } = await params;

  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) {
    notFound();
  }

  // Optimized data fetching based on user role
  let course: CourseResult | null = null;
  let studentsData: StudentData[] = [];

  if (isDosen) {
    // For dosen: fetch both course and students in parallel
    [course, studentsData] = await Promise.all([
      getCourseData(id, user),
      getStudentsData(id),
    ]);
  } else if (isMahasiswa) {
    // For mahasiswa: single optimized query gets both course and students
    const result = await getCourseDataForMahasiswa(id, user.id);
    course = result.course;
    studentsData = result.students;
  }

  if (!course) {
    notFound();
  }

  return (
    <DashboardClient user={user} shouldShowSplash={false} isFirstVisit={false}>
      {isDosen && (
        <ClassPageLayout
          classId={id}
          dosenId={user.id}
          user={user}
          course={course}
          studentsData={studentsData}
        />
      )}
      {isMahasiswa && (
        <StudentClassPageLayout
          classId={id}
          user={user}
          course={course}
          studentsData={studentsData} // Pass server-side data
        />
      )}
    </DashboardClient>
  );
}
