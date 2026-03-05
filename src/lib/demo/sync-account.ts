import 'server-only';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache-tags';
import { getDemoAccount } from '@/lib/demo/auth';
import type { DemoRole } from '@/lib/demo/config';
import prisma, {
  type PrismaClientInstance,
  type TransactionClient,
} from '@/lib/prisma';

const DEMO_STUDENT_PERSONALITY_PROFILE = {
  ei: -0.7,
  sn: -0.6,
  tf: 0.5,
  pj: 0.7,
  mbtiType: 'INFJ',
} as const;

type DemoBootstrapClient = PrismaClientInstance | TransactionClient;

type DemoStudentBootstrapResult = {
  demoTeacherId: string | null;
  enrollmentCount: number;
};

type DemoCourseEnrollmentResult = {
  studentId: string | null;
  enrollmentCount: number;
};

export async function enrollPairedDemoStudentInCourse(
  courseId: string,
  visitorId: string,
  options: {
    db?: DemoBootstrapClient;
    revalidate?: boolean;
  } = { revalidate: false }
): Promise<DemoCourseEnrollmentResult> {
  const db = options.db ?? prisma;
  const demoStudent = await db.user.findUnique({
    where: { email: getDemoAccount('STUDENT', visitorId).email },
    select: { id: true },
  });

  if (!demoStudent) {
    return {
      studentId: null,
      enrollmentCount: 0,
    };
  }

  const enrollmentResult = await db.courseEnrollment.createMany({
    data: [
      {
        courseId,
        studentId: demoStudent.id,
        enrolledAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  if (options.revalidate === true && enrollmentResult.count > 0) {
    revalidateTag(CACHE_TAGS.studentClasses(demoStudent.id));
  }

  return {
    studentId: demoStudent.id,
    enrollmentCount: enrollmentResult.count,
  };
}

export async function bootstrapDemoStudentAccount(
  userId: string,
  visitorId: string,
  options: {
    db?: DemoBootstrapClient;
    revalidate?: boolean;
  } = { revalidate: false }
): Promise<DemoStudentBootstrapResult> {
  const db = options.db ?? prisma;

  await db.personalityProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...DEMO_STUDENT_PERSONALITY_PROFILE,
    },
    update: {},
  });

  const demoTeacher = await db.user.findUnique({
    where: { email: getDemoAccount('TEACHER', visitorId).email },
    select: { id: true },
  });

  if (!demoTeacher) {
    return {
      demoTeacherId: null,
      enrollmentCount: 0,
    };
  }

  const courses = await db.course.findMany({
    where: { dosenId: demoTeacher.id, archivedAt: null },
    select: { id: true },
  });

  if (courses.length === 0) {
    return {
      demoTeacherId: demoTeacher.id,
      enrollmentCount: 0,
    };
  }

  const enrollmentResult = await db.courseEnrollment.createMany({
    data: courses.map((course: { id: string }) => ({
      courseId: course.id,
      studentId: userId,
      enrolledAt: new Date(),
    })),
    skipDuplicates: true,
  });

  if (options.revalidate === true && enrollmentResult.count > 0) {
    revalidateTag(CACHE_TAGS.studentClasses(userId));
    revalidateTag(CACHE_TAGS.coursesByDosen(demoTeacher.id));
  }

  return {
    demoTeacherId: demoTeacher.id,
    enrollmentCount: enrollmentResult.count,
  };
}

export async function syncDemoAccount(
  userId: string,
  role: DemoRole,
  visitorId: string
) {
  const account = getDemoAccount(role, visitorId);

  const bootstrapResult = await prisma.$transaction(
    async (tx: TransactionClient) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          role,
          isOnboarded: true,
          hasSeenWelcomeSplash: true,
          onboardingStep: null,
          name: account.name,
          gender: account.gender,
          nim: account.nim,
        },
      });

      if (role !== 'STUDENT') {
        return null;
      }

      return bootstrapDemoStudentAccount(userId, visitorId, {
        db: tx,
        revalidate: false,
      });
    }
  );

  if (
    bootstrapResult &&
    bootstrapResult.demoTeacherId &&
    bootstrapResult.enrollmentCount > 0
  ) {
    revalidateTag(CACHE_TAGS.studentClasses(userId));
    revalidateTag(CACHE_TAGS.coursesByDosen(bootstrapResult.demoTeacherId));
  }
}
