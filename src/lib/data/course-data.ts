import {
  canAccessDosenFeatures,
  canAccessMahasiswaFeatures,
} from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';
import type { AssignmentResponse } from '@/lib/validation/assignments';
import type { StudentData } from '@/types/course';

/**
 * Fetches assignments for a course with role-based authorization
 * @param courseId - The course ID
 * @param user - The current user
 * @returns Array of assignment responses
 */
export async function getInitialAssignments(
  courseId: string,
  user: ExtendedUser
): Promise<AssignmentResponse[]> {
  const isDosen = canAccessDosenFeatures(user);
  const isMahasiswa = canAccessMahasiswaFeatures(user);

  if (!isDosen && !isMahasiswa) return [];

  const rows = await prisma.assignment.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      startAt: true,
      createdAt: true,
      status: true,
      _count: { select: { submissions: true } },
    },
  });

  return rows.map(r => ({
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
          nimNpm: true,
          mbtiType: true,
          ei: true,
          sn: true,
          tf: true,
          pj: true,
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
    ei: enrollment.student.ei,
    sn: enrollment.student.sn,
    tf: enrollment.student.tf,
    pj: enrollment.student.pj,
    enrolledAt: enrollment.enrolledAt,
  }));
}
