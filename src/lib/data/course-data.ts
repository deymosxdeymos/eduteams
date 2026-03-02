import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import type { MBTIType } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';
import type { AssignmentClient } from '@/lib/validation/assignments';
import type { StudentData } from '@/types/course';

type EnrollmentStudentRow = {
  enrolledAt: Date;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    nim: string | null;
    personalityProfile: {
      mbtiType: string | null;
      ei: number | null;
      sn: number | null;
      tf: number | null;
      pj: number | null;
    } | null;
  };
};

function mapStudentData(
  enrollment: EnrollmentStudentRow,
  sensitiveViewerId?: string
): StudentData {
  const canViewSensitiveData =
    !sensitiveViewerId || enrollment.student.id === sensitiveViewerId;

  return {
    id: enrollment.student.id,
    name: enrollment.student.name || 'Unknown',
    nim: enrollment.student.nim || 'N/A',
    email: canViewSensitiveData ? enrollment.student.email || 'N/A' : 'N/A',
    mbtiType: (
      canViewSensitiveData
        ? enrollment.student.personalityProfile?.mbtiType ?? null
        : null
    ) as MBTIType | null,
    ei: canViewSensitiveData
      ? enrollment.student.personalityProfile?.ei ?? null
      : null,
    sn: canViewSensitiveData
      ? enrollment.student.personalityProfile?.sn ?? null
      : null,
    tf: canViewSensitiveData
      ? enrollment.student.personalityProfile?.tf ?? null
      : null,
    pj: canViewSensitiveData
      ? enrollment.student.personalityProfile?.pj ?? null
      : null,
    enrolledAt: enrollment.enrolledAt,
  };
}

/**
 * Fetches assignments for a course with role-based authorization
 * @param courseId - The course ID
 * @param user - The current user
 * @returns Array of assignment responses
 */
export async function getInitialAssignments(
  courseId: string,
  user: ExtendedUser
): Promise<AssignmentClient[]> {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) return [];

  const rows = await prisma.assignment.findMany({
    where: { courseId, archivedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      startAt: true,
      createdAt: true,
      status: true,
      submissions: isMahasiswa
        ? {
            where: { studentId: user.id },
            select: { id: true, needsUpdate: true },
          }
        : false,
      _count: { select: { submissions: true } },
    },
  });

  return rows.map((r: (typeof rows)[number]) => ({
    id: r.id,
    courseId: r.courseId,
    title: r.title,
    description: r.description ?? undefined,
    startAt: r.startAt,
    createdAt: r.createdAt,
    status: r.status,
    skills: [],
    topics: [],
    submissionsCount: r._count.submissions,
    submittedByMe: Array.isArray(r.submissions)
      ? (r.submissions as Array<{ id: string; needsUpdate: boolean }>).length >
        0
      : undefined,
    needsUpdate: Array.isArray(r.submissions)
      ? ((r.submissions as Array<{ id: string; needsUpdate: boolean }>)[0]
          ?.needsUpdate ?? false)
      : false,
  }));
}

/**
 * Fetches enrolled students for a course with their personality data
 * @param courseId - The course ID
 * @returns Array of student data with enrollment information
 */
export async function getStudentsData(
  courseId: string
): Promise<StudentData[]> {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    select: {
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          personalityProfile: {
            select: {
              mbtiType: true,
              ei: true,
              sn: true,
              tf: true,
              pj: true,
            },
          },
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });

  return enrollments.map((enrollment: (typeof enrollments)[number]) =>
    mapStudentData(enrollment as EnrollmentStudentRow)
  );
}

export async function getAuthorizedStudentsData(
  courseId: string,
  user: ExtendedUser
): Promise<StudentData[]> {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) return [];

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      courseId,
      course: isDosen
        ? { dosenId: user.id }
        : { enrollments: { some: { studentId: user.id } } },
    },
    select: {
      enrolledAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          nim: true,
          personalityProfile: {
            select: {
              mbtiType: true,
              ei: true,
              sn: true,
              tf: true,
              pj: true,
            },
          },
        },
      },
    },
    orderBy: { student: { name: 'asc' } },
  });

  return enrollments.map((enrollment: (typeof enrollments)[number]) =>
    mapStudentData(
      enrollment as EnrollmentStudentRow,
      isMahasiswa ? user.id : undefined
    )
  );
}
