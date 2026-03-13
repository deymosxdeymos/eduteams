import { z } from "zod";
import { getEdu2comWeights } from "@/lib/edu2com/config";
import type { Edu2comParameters } from "@/lib/edu2com/contract";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import type { BuiltTeamFormationPayload, TeamFormationMethod } from "./types";

function normalizeGender(g: unknown): "MALE" | "FEMALE" | undefined {
  if (!g || typeof g !== "string") return undefined;
  const v = g.trim().toLowerCase();
  if (
    v === "male" ||
    v === "laki-laki" ||
    v === "laki laki" ||
    v === "pria" ||
    v === "m" ||
    v === "l"
  ) {
    return "MALE";
  }
  if (v === "female" || v === "perempuan" || v === "wanita" || v === "f" || v === "p") {
    return "FEMALE";
  }
  return undefined;
}

type TopicPreference = { personId: string; preference: number };
type TopicRecord = { id: string; name: string };
type TaskSkillRequirement = {
  id: string;
  level: number;
  importance: number;
};
type SubmissionRecord = { studentId: string };
type StudentSkillRecord = { skillId: string; level: number };
type EnrollmentStudent = {
  id: string;
  gender: string | null;
  personalityProfile: {
    ei: number | null;
    sn: number | null;
    tf: number | null;
    pj: number | null;
  } | null;
  personSkills: StudentSkillRecord[];
};
type EnrollmentRecord = { student: EnrollmentStudent };
type SubmittedStudent = {
  id: string;
  gender: string | null;
  ei: number | null;
  sn: number | null;
  tf: number | null;
  pj: number | null;
  personSkills: StudentSkillRecord[];
};
type EligibleStudent = {
  id: string;
  gender: string | null;
  ei: number;
  sn: number;
  tf: number;
  pj: number;
  personSkills: StudentSkillRecord[];
};
type SkillRecord = { id: string };
type TopicPreferenceRecord = {
  assignmentTopicId: string;
  personId: string;
  preference: number;
};

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

function buildTopicBuckets(topics: TopicRecord[], bucketCount: number) {
  if (bucketCount <= 0) return [];
  const buckets: string[][] = Array.from({ length: bucketCount }, () => []);
  topics.forEach((topic, index) => {
    buckets[index % bucketCount]?.push(topic.id);
  });
  return buckets;
}

function computeTopicAveragePreferences(
  topics: TopicRecord[],
  prefsByTopic: Map<string, TopicPreference[]>,
) {
  const averages = new Map<string, number>();

  for (const topic of topics) {
    const prefs = prefsByTopic.get(topic.id) ?? [];
    if (prefs.length === 0) {
      averages.set(topic.id, 0);
      continue;
    }

    averages.set(
      topic.id,
      prefs.reduce((sum, current) => sum + current.preference, 0) / prefs.length,
    );
  }

  return averages;
}

function aggregatePreferencesForBucket(
  topicIds: string[],
  prefsByTopic: Map<string, TopicPreference[]>,
): TopicPreference[] | undefined {
  if (topicIds.length === 0) {
    return undefined;
  }

  const preferenceByPerson = new Map<string, number[]>();
  for (const topicId of topicIds) {
    for (const pref of prefsByTopic.get(topicId) ?? []) {
      const current = preferenceByPerson.get(pref.personId) ?? [];
      current.push(pref.preference);
      preferenceByPerson.set(pref.personId, current);
    }
  }

  if (preferenceByPerson.size === 0) {
    return undefined;
  }

  return [...preferenceByPerson.entries()].map(([personId, values]) => ({
    personId,
    preference: values.reduce((sum, current) => sum + current, 0) / values.length,
  }));
}

function pickRepresentativeTopic(
  bucketTopicIds: string[],
  topicAveragePreferences: Map<string, number>,
  fallbackTopics: TopicRecord[],
  bucketIndex: number,
) {
  if (bucketTopicIds.length === 0) {
    return fallbackTopics[bucketIndex % fallbackTopics.length]?.id;
  }

  return [...bucketTopicIds].sort((left, right) => {
    const preferenceDiff =
      (topicAveragePreferences.get(right) ?? 0) - (topicAveragePreferences.get(left) ?? 0);
    if (preferenceDiff !== 0) {
      return preferenceDiff;
    }
    return left.localeCompare(right);
  })[0];
}

function buildTaskFromBucket(args: {
  bucketIndex: number;
  bucketTopicIds: string[];
  fallbackTopics: TopicRecord[];
  topicAveragePreferences: Map<string, number>;
  prefsByTopic: Map<string, TopicPreference[]>;
  defaultTaskSkills: TaskSkillRequirement[];
  teamSize: number;
}) {
  const representativeTopicId =
    pickRepresentativeTopic(
      args.bucketTopicIds,
      args.topicAveragePreferences,
      args.fallbackTopics,
      args.bucketIndex,
    ) ?? `bucket-${args.bucketIndex + 1}`;

  const preferences = aggregatePreferencesForBucket(args.bucketTopicIds, args.prefsByTopic);

  return {
    id: `${representativeTopicId}-${args.bucketIndex + 1}`,
    skills: args.defaultTaskSkills,
    teamSize: args.teamSize,
    preferences: preferences?.length ? preferences : undefined,
  };
}

function buildGroupSizes(method: TeamFormationMethod, value: number, studentCount: number) {
  const groupSizes: number[] = [];

  if (method === "JUMLAH_KELOMPOK") {
    const groupCount = Math.max(1, value);
    if (groupCount > Math.floor(studentCount / 2)) {
      throw new ValidationError(
        "Jumlah kelompok terlalu banyak. Minimal 2 mahasiswa per kelompok.",
      );
    }

    const baseSize = Math.floor(studentCount / groupCount);
    const remainder = studentCount % groupCount;
    for (let index = 0; index < groupCount; index += 1) {
      groupSizes.push(baseSize + (index < remainder ? 1 : 0));
    }
  } else {
    if (value < 2) {
      throw new ValidationError("Minimal 2 mahasiswa per kelompok.");
    }

    const groupSize = value;
    const groupCount = Math.floor(studentCount / groupSize);
    const remainder = studentCount % groupSize;

    if (groupCount === 0) {
      if (studentCount < 2) {
        throw new ValidationError("Minimal 2 mahasiswa untuk membentuk kelompok");
      }
      groupSizes.push(studentCount);
    } else {
      for (let index = 0; index < groupCount; index += 1) {
        groupSizes.push(groupSize);
      }
      for (let index = 0; index < remainder; index += 1) {
        groupSizes[index % groupSizes.length] += 1;
      }
    }
  }

  if (groupSizes.some((size) => size < 2)) {
    throw new ValidationError(
      "Konfigurasi kelompok tidak valid. Minimal 2 mahasiswa per kelompok.",
    );
  }

  return groupSizes;
}

export async function buildTeamFormationPayload(args: {
  assignmentId: string;
  ownerId: string;
  method: TeamFormationMethod;
  value: number;
  weights?: z.input<
    z.ZodObject<{
      alpha: z.ZodOptional<z.ZodNumber>;
      beta: z.ZodOptional<z.ZodNumber>;
      gamma: z.ZodOptional<z.ZodNumber>;
      delta: z.ZodOptional<z.ZodNumber>;
    }>
  >;
}): Promise<BuiltTeamFormationPayload> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: args.assignmentId },
    select: {
      id: true,
      courseId: true,
      description: true,
      course: { select: { dosenId: true } },
    },
  });

  if (!assignment) {
    throw new NotFoundError("Assignment not found");
  }

  if (assignment.course.dosenId !== args.ownerId) {
    throw new AuthorizationError("Unauthorized");
  }

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId: assignment.courseId },
    select: {
      student: {
        select: {
          id: true,
          gender: true,
          personalityProfile: {
            select: { ei: true, sn: true, tf: true, pj: true },
          },
          personSkills: { select: { skillId: true, level: true } },
        },
      },
    },
  });
  logger.info(
    `[Team Formation] Found ${enrollments.length} enrollments for assignment ${args.assignmentId}`,
  );

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: args.assignmentId },
    select: { studentId: true },
  });
  const submittedStudentIds = new Set(
    submissions.map((submission: SubmissionRecord) => submission.studentId),
  );
  const allStudents: SubmittedStudent[] = enrollments.map((enrollment: EnrollmentRecord) => {
    const student = enrollment.student;
    const profile = student.personalityProfile;
    return {
      id: student.id,
      gender: student.gender,
      ei: profile?.ei ?? null,
      sn: profile?.sn ?? null,
      tf: profile?.tf ?? null,
      pj: profile?.pj ?? null,
      personSkills: student.personSkills,
    };
  });

  const submittedStudents = allStudents.filter((student: SubmittedStudent) =>
    submittedStudentIds.has(student.id),
  );
  const eligibleStudents = submittedStudents.filter(
    (student: SubmittedStudent): student is EligibleStudent =>
      student.ei !== null &&
      student.sn !== null &&
      student.tf !== null &&
      student.pj !== null &&
      Number.isFinite(student.ei) &&
      Number.isFinite(student.sn) &&
      Number.isFinite(student.tf) &&
      Number.isFinite(student.pj),
  );

  if (submittedStudentIds.size === 0) {
    throw new ValidationError(
      "Tidak ada mahasiswa yang telah mengisi kuesioner tugas. Pembentukan kelompok memerlukan minimal 2 mahasiswa yang telah mengisi kuesioner.",
    );
  }

  if (eligibleStudents.length < 2) {
    throw new ValidationError(
      `Hanya ${eligibleStudents.length} mahasiswa yang telah mengisi kuesioner dan memiliki data kepribadian lengkap. Minimal 2 mahasiswa diperlukan untuk membentuk kelompok.`,
    );
  }

  let declaredSkillIds = Array.from(
    new Set(
      eligibleStudents.flatMap((student) => student.personSkills.map((skill) => skill.skillId)),
    ),
  );

  if (declaredSkillIds.length === 0) {
    const allSkills = await prisma.skill.findMany({ select: { id: true } });
    declaredSkillIds = allSkills.map((skill: SkillRecord) => skill.id);
  }

  if (declaredSkillIds.length === 0) {
    throw new ValidationError(
      "Tidak ada skill yang ditemukan di database. Tambahkan skill terlebih dahulu.",
    );
  }

  let fallbackSkillAssigned = 0;
  const people = eligibleStudents.map((student) => {
    const skills = student.personSkills
      .filter((skill: StudentSkillRecord) => declaredSkillIds.includes(skill.skillId))
      .map((skill: StudentSkillRecord) => ({
        id: skill.skillId,
        level: Math.max(0, Math.min(1, skill.level)),
      }));

    if (skills.length === 0) {
      skills.push({ id: declaredSkillIds[0], level: 0 });
      fallbackSkillAssigned += 1;
    }

    return {
      id: student.id,
      gender: normalizeGender(student.gender),
      personality: {
        ei: student.ei,
        sn: student.sn,
        tf: student.tf,
        pj: student.pj,
      },
      skills,
      preferences: [],
    };
  });

  if (fallbackSkillAssigned > 0) {
    logger.info(
      `[Team Formation] Added fallback skill to ${fallbackSkillAssigned} students lacking skill data`,
    );
  }

  const groupSizes = buildGroupSizes(args.method, args.value, eligibleStudents.length);

  const topics = await prisma.assignmentTopic.findMany({
    where: { assignmentId: args.assignmentId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const topicPreferences = topics.length
    ? await prisma.assignmentTopicPreference.findMany({
        where: {
          assignmentTopicId: {
            in: topics.map((topic: TopicRecord) => topic.id),
          },
        },
        select: { assignmentTopicId: true, personId: true, preference: true },
      })
    : [];

  const prefsByTopic = new Map<string, TopicPreference[]>();
  for (const preference of topicPreferences as TopicPreferenceRecord[]) {
    const current = prefsByTopic.get(preference.assignmentTopicId) ?? [];
    current.push({
      personId: preference.personId,
      preference: clamp01(preference.preference),
    });
    prefsByTopic.set(preference.assignmentTopicId, current);
  }

  const defaultTaskSkills: TaskSkillRequirement[] = declaredSkillIds.map((id) => ({
    id,
    level: 0.5,
    importance: 1,
  }));

  let tasks = groupSizes.map((teamSize, index) => ({
    id: `group-${index + 1}`,
    skills: defaultTaskSkills,
    teamSize,
  }));

  if (topics.length > 0 && topics.length === groupSizes.length) {
    tasks = topics.map((topic: TopicRecord, index: number) => ({
      id: topic.id,
      skills: defaultTaskSkills,
      teamSize: groupSizes[index],
      preferences: prefsByTopic.get(topic.id),
    }));
  } else if (topics.length > 0) {
    const topicBuckets = buildTopicBuckets(topics, groupSizes.length);
    const topicAveragePreferences = computeTopicAveragePreferences(topics, prefsByTopic);

    tasks = groupSizes.map((teamSize, index) =>
      buildTaskFromBucket({
        bucketIndex: index,
        bucketTopicIds: topicBuckets[index] ?? [],
        fallbackTopics: topics,
        topicAveragePreferences,
        prefsByTopic,
        defaultTaskSkills,
        teamSize,
      }),
    );
  }

  const weights = getEdu2comWeights(args.weights);
  const initRandom = false;
  const requestData: Edu2comParameters = {
    people,
    tasks,
    initRandom,
    ...weights,
  };

  return {
    assignment: {
      id: assignment.id,
      courseId: assignment.courseId,
      description: assignment.description,
      ownerId: assignment.course.dosenId,
    },
    owner: { id: args.ownerId },
    method: args.method,
    value: args.value,
    people,
    tasks,
    weights,
    initRandom,
    requestData,
    counts: {
      enrolledStudents: allStudents.length,
      submittedStudents: submittedStudents.length,
      eligibleStudents: eligibleStudents.length,
      excludedWithoutSubmission: allStudents.length - submittedStudentIds.size,
      excludedWithoutCompletePersonality: submittedStudents.length - eligibleStudents.length,
      taskCount: tasks.length,
      totalTeamCapacity: groupSizes.reduce((sum, size) => sum + size, 0),
    },
  };
}
