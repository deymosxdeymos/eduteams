import "server-only";
import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import type { Gender, MBTIType } from "@/generated/prisma/client";
import type { PrismaClientInstance } from "@/lib/prisma";
import { getMBTIType } from "@/lib/personality";

const DEMO_STUDENT_COUNT = 24;
const DEMO_STUDENT_EMAIL_DOMAIN = "eduteams.local";
const DEMO_STUDENT_EMAIL_PREFIX = "dcs";

const FIRST_NAMES = [
  "Alya",
  "Bagas",
  "Citra",
  "Danu",
  "Eka",
  "Farah",
  "Gilang",
  "Hana",
  "Intan",
  "Jovan",
  "Kayla",
  "Lutfi",
  "Mira",
  "Nabil",
  "Oki",
  "Putri",
  "Qori",
  "Rafi",
  "Salsa",
  "Teguh",
  "Ulfa",
  "Vino",
  "Wulan",
  "Yusuf",
] as const;

const SCORE_POOL = [
  { ei: -0.75, sn: 0.45, tf: -0.2, pj: 0.6 },
  { ei: 0.7, sn: -0.4, tf: 0.5, pj: -0.6 },
  { ei: -0.6, sn: -0.35, tf: 0.55, pj: 0.65 },
  { ei: 0.8, sn: 0.3, tf: -0.45, pj: -0.5 },
] as const;

const DEMO_SKILL_LEVEL_POOL = [0.35, 0.5, 0.65, 0.8] as const;
const DEMO_TOPIC_PREFERENCE_POOL = [0.2, 0.4, 0.6, 0.8] as const;

type DemoSeedClient = {
  user: Pick<PrismaClientInstance["user"], "createMany">;
  personalityProfile: Pick<PrismaClientInstance["personalityProfile"], "createMany">;
  courseEnrollment: Pick<PrismaClientInstance["courseEnrollment"], "createMany">;
};

type DemoAssignmentSubmissionSeedClient = {
  courseEnrollment: Pick<PrismaClientInstance["courseEnrollment"], "findMany">;
  assignmentSubmission: Pick<PrismaClientInstance["assignmentSubmission"], "createMany">;
  courseSkill: Pick<PrismaClientInstance["courseSkill"], "findMany">;
  assignmentTopic: Pick<PrismaClientInstance["assignmentTopic"], "findMany">;
  personSkill: Pick<PrismaClientInstance["personSkill"], "createMany">;
  assignmentTopicPreference: Pick<PrismaClientInstance["assignmentTopicPreference"], "createMany">;
};

function clampSeedValue(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function getDemoSkillLevel(studentIndex: number, skillIndex: number) {
  return clampSeedValue(
    DEMO_SKILL_LEVEL_POOL[(studentIndex + skillIndex) % DEMO_SKILL_LEVEL_POOL.length],
  );
}

function getDemoTopicPreference(studentIndex: number, topicIndex: number) {
  return clampSeedValue(
    DEMO_TOPIC_PREFERENCE_POOL[(studentIndex * 2 + topicIndex) % DEMO_TOPIC_PREFERENCE_POOL.length],
  );
}

function getStableSeedKey(scope: "visitor" | "course", value: string) {
  return createHash("sha256")
    .update(`${scope}:${value}`)
    .digest("base64url")
    .slice(0, 12)
    .toLowerCase();
}

function getSeededDemoStudentIndex(emailPrefix: string, email: string) {
  const suffix = email.slice(emailPrefix.length).split("@")[0]?.trim();

  if (!suffix) {
    return Number.POSITIVE_INFINITY;
  }

  const index = Number.parseInt(suffix, 10);

  return Number.isFinite(index) ? index : Number.POSITIVE_INFINITY;
}

function getDemoStudentEmailPrefix(visitorId: string, courseId: string) {
  return `${DEMO_STUDENT_EMAIL_PREFIX}.${getStableSeedKey("visitor", visitorId)}.${getStableSeedKey("course", courseId)}.`;
}

export function getDemoStudentVisitorEmailPrefix(visitorId: string) {
  return `${DEMO_STUDENT_EMAIL_PREFIX}.${getStableSeedKey("visitor", visitorId)}.`;
}

export function getDemoStudentCourseEmailPrefix(visitorId: string, courseId: string) {
  return getDemoStudentEmailPrefix(visitorId, courseId);
}

export async function seedDemoStudentsForCourse(
  courseId: string,
  visitorId: string,
  client: DemoSeedClient,
) {
  const emailPrefix = getDemoStudentEmailPrefix(visitorId, courseId);
  const now = new Date();

  const students = Array.from({ length: DEMO_STUDENT_COUNT }, (_, i) => {
    const scores = SCORE_POOL[i % SCORE_POOL.length];
    return {
      id: createId(),
      index: i,
      name: `${FIRST_NAMES[i % FIRST_NAMES.length]} Demo`,
      email: `${emailPrefix}${i + 1}@${DEMO_STUDENT_EMAIL_DOMAIN}`,
      nim: `${now.getFullYear()}${String(i + 1).padStart(4, "0")}`,
      gender: (i % 2 === 0 ? "FEMALE" : "MALE") as Gender,
      scores,
      mbtiType: getMBTIType(scores) as MBTIType,
    };
  });

  await client.user.createMany({
    data: students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      emailVerified: true,
      role: "STUDENT",
      nim: s.nim,
      gender: s.gender,
      isOnboarded: true,
      hasSeenWelcomeSplash: true,
    })),
    skipDuplicates: true,
  });

  await client.personalityProfile.createMany({
    data: students.map((s) => ({
      userId: s.id,
      ei: s.scores.ei,
      sn: s.scores.sn,
      tf: s.scores.tf,
      pj: s.scores.pj,
      mbtiType: s.mbtiType,
    })),
    skipDuplicates: true,
  });

  await client.courseEnrollment.createMany({
    data: students.map((s) => ({
      courseId,
      studentId: s.id,
      enrolledAt: now,
    })),
    skipDuplicates: true,
  });
}

export async function seedDemoAssignmentSubmissions(
  assignmentId: string,
  courseId: string,
  visitorId: string,
  client: DemoAssignmentSubmissionSeedClient,
  options: { structureVersion?: number } = {},
) {
  const emailPrefix = getDemoStudentEmailPrefix(visitorId, courseId);
  const enrollments = await client.courseEnrollment.findMany({
    where: {
      courseId,
      student: {
        email: {
          startsWith: emailPrefix,
        },
      },
    },
    select: {
      studentId: true,
      student: {
        select: {
          email: true,
        },
      },
    },
  });

  if (enrollments.length === 0) {
    return 0;
  }

  const orderedEnrollments = [...enrollments].sort((left, right) => {
    const leftIndex = getSeededDemoStudentIndex(emailPrefix, left.student.email);
    const rightIndex = getSeededDemoStudentIndex(emailPrefix, right.student.email);

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return (
      left.student.email.localeCompare(right.student.email) ||
      left.studentId.localeCompare(right.studentId)
    );
  });

  const [courseSkills, assignmentTopics] = await Promise.all([
    client.courseSkill.findMany({
      where: { courseId },
      orderBy: { skillId: "asc" },
      select: { skillId: true },
    }),
    client.assignmentTopic.findMany({
      where: { assignmentId },
      orderBy: { name: "asc" },
      select: { id: true },
    }),
  ]);

  const personSkills = orderedEnrollments.flatMap(
    (
      enrollment: {
        studentId: string;
        student: { email: string };
      },
      studentIndex: number,
    ) =>
      courseSkills.map((courseSkill: { skillId: string }, skillIndex: number) => ({
        personId: enrollment.studentId,
        skillId: courseSkill.skillId,
        level: getDemoSkillLevel(studentIndex, skillIndex),
      })),
  );

  const topicPreferences = orderedEnrollments.flatMap(
    (
      enrollment: {
        studentId: string;
        student: { email: string };
      },
      studentIndex: number,
    ) =>
      assignmentTopics.map((topic: { id: string }, topicIndex: number) => ({
        assignmentTopicId: topic.id,
        personId: enrollment.studentId,
        preference: getDemoTopicPreference(studentIndex, topicIndex),
      })),
  );

  const [result] = await Promise.all([
    client.assignmentSubmission.createMany({
      data: orderedEnrollments.map((enrollment: { studentId: string }) => ({
        assignmentId,
        studentId: enrollment.studentId,
        structureVersion: options.structureVersion ?? 1,
      })),
      skipDuplicates: true,
    }),
    personSkills.length > 0
      ? client.personSkill.createMany({
          data: personSkills,
          skipDuplicates: true,
        })
      : Promise.resolve({ count: 0 }),
    topicPreferences.length > 0
      ? client.assignmentTopicPreference.createMany({
          data: topicPreferences,
          skipDuplicates: true,
        })
      : Promise.resolve({ count: 0 }),
  ]);

  return result.count;
}
