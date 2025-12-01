import { createId } from '@paralleldrive/cuid2';
import type { PrismaClient, User, Course, Assignment, AssignmentSubmission } from '@/generated/prisma';
import { createPrismaClient } from '@/lib/create-prisma-client';

const prisma: PrismaClient = createPrismaClient();

export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const timestamp = new Date();
  const uniqueSuffix = createId();

  const { onboardingData, personalityData, ...safeOverrides } = overrides;

  return await prisma.user.create({
    data: {
      id: createId(),
      name: `Test User ${uniqueSuffix}`,
      email: `test-${uniqueSuffix}@example.com`,
      emailVerified: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...safeOverrides,
    },
  });
}

export async function createTestCourse(
  overrides: Partial<Course> & { dosenId?: string } = {}
): Promise<Course> {
  const timestamp = new Date();
  const uniqueSuffix = createId();
  let dosenId = overrides.dosenId;
  if (!dosenId) {
    const dosen = await createTestUser({
      name: `Test Dosen ${uniqueSuffix}`,
      email: `dosen-${uniqueSuffix}@example.com`,
    });
    dosenId = dosen.id;
  }

  return await prisma.course.create({
    data: {
      id: createId(),
      namaMataKuliah: `Test Course ${uniqueSuffix}`,
      kelas: 'A',
      tahunAwalPeriode: 2024,
      tahunAkhirPeriode: 2025,
      periode: 'GENAP',
      dosenId,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...overrides,
    },
  });
}

export async function createTestAssignment(
  overrides: Partial<Assignment> & {
    courseId?: string;
    createdById?: string;
  } = {}
): Promise<Assignment> {
  const timestamp = new Date();
  const uniqueSuffix = createId();
  let courseId = overrides.courseId;
  let createdById = overrides.createdById;

  if (!courseId || !createdById) {
    const dosen = await createTestUser({
      name: `Test Dosen ${uniqueSuffix}`,
      email: `dosen-${uniqueSuffix}@example.com`,
    });
    createdById = createdById || dosen.id;

    const course = await createTestCourse({
      dosenId: dosen.id,
    });
    courseId = courseId || course.id;
  }

  return await prisma.assignment.create({
    data: {
      id: createId(),
      courseId,
      createdById,
      title: `Test Assignment ${uniqueSuffix}`,
      description: 'Test assignment description',
      startAt: timestamp,
      structureVersion: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...overrides,
    },
  });
}

export async function createTestSubmission(
  overrides: Partial<AssignmentSubmission> & {
    assignmentId?: string;
    studentId?: string;
  } = {}
): Promise<AssignmentSubmission> {
  const timestamp = new Date();
  const uniqueSuffix = createId();
  let assignmentId = overrides.assignmentId;
  let studentId = overrides.studentId;

  if (!assignmentId) {
    const assignment = await createTestAssignment();
    assignmentId = assignment.id;
  }

  if (!studentId) {
    const student = await createTestUser({
      name: `Test Student ${uniqueSuffix}`,
      email: `student-${uniqueSuffix}@example.com`,
    });
    studentId = student.id;
  }

  return await prisma.assignmentSubmission.create({
    data: {
      id: createId(),
      assignmentId,
      studentId,
      structureVersion: 1,
      needsUpdate: false,
      createdAt: timestamp,
      ...overrides,
    },
  });
}

export async function createTestSubmissions(
  assignmentId: string,
  count: number,
  overrides: Partial<AssignmentSubmission> = {}
): Promise<AssignmentSubmission[]> {
  const submissions: AssignmentSubmission[] = [];

  for (let i = 0; i < count; i++) {
    const student = await createTestUser({
      name: `Test Student ${i}`,
      email: `student-${i}-${createId()}@example.com`,
    });

    const submission = await createTestSubmission({
      assignmentId,
      studentId: student.id,
      ...overrides,
    });

    submissions.push(submission);
  }

  return submissions;
}
