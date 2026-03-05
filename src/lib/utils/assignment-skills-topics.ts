import type { Prisma } from '@/generated/prisma/client';
import prisma, {
  type PrismaClientInstance,
  type TransactionClient,
} from '@/lib/prisma';

type AssignmentSkillsTopicsClient = {
  skill: Pick<PrismaClientInstance['skill'], 'findMany' | 'createMany'>;
  courseSkill: Pick<PrismaClientInstance['courseSkill'], 'createMany'>;
  assignmentTopic: Pick<PrismaClientInstance['assignmentTopic'], 'createMany'>;
};

async function ensureSkillsForCourseWithClient(
  client: AssignmentSkillsTopicsClient,
  courseId: string,
  skillNames: string[]
): Promise<void> {
  // Step 1: Ensure all Skill records exist
  // Note: Skill.name has @unique constraint, so we handle case-insensitive matching manually
  const existing = await client.skill.findMany({
    select: { id: true, name: true },
  });

  const existingMap = new Map(
    existing.map((s: { id: string; name: string }) => [
      s.name.toLowerCase(),
      { id: s.id, name: s.name },
    ])
  );

  // Create missing skills
  const toCreate: Prisma.SkillCreateManyInput[] = [];
  for (const name of skillNames) {
    const lowerName = name.toLowerCase();
    if (!existingMap.has(lowerName)) {
      toCreate.push({ name });
      // Add to map to avoid duplicates in toCreate array
      existingMap.set(lowerName, { id: '', name });
    }
  }

  if (toCreate.length > 0) {
    await client.skill.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  // Step 2: Fetch all skill IDs (including newly created ones)
  const allSkills = await client.skill.findMany({
    select: { id: true, name: true },
  });

  const skillIdMap = new Map<string, string>(
    allSkills.map((s: { id: string; name: string }) => [
      s.name.toLowerCase(),
      s.id,
    ])
  );

  // Step 3: Create CourseSkill links (idempotent)
  const courseSkillsToCreate: Prisma.CourseSkillCreateManyInput[] = [];
  for (const name of skillNames) {
    const skillId = skillIdMap.get(name.toLowerCase());
    if (skillId) {
      courseSkillsToCreate.push({ courseId, skillId });
    }
  }

  if (courseSkillsToCreate.length > 0) {
    await client.courseSkill.createMany({
      data: courseSkillsToCreate,
      skipDuplicates: true,
    });
  }
}

/**
 * Ensure skills exist globally and are linked to the course.
 * Creates missing Skill records and CourseSkill links idempotently.
 * @param courseId - The course to link skills to
 * @param skillNames - Array of skill names (already normalized)
 */
export async function ensureSkillsForCourse(
  courseId: string,
  skillNames: string[],
  client?: AssignmentSkillsTopicsClient
): Promise<void> {
  if (skillNames.length === 0) return;

  if (client) {
    await ensureSkillsForCourseWithClient(client, courseId, skillNames);
    return;
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    await ensureSkillsForCourseWithClient(tx, courseId, skillNames);
  });
}

/**
 * Ensure assignment topics exist.
 * Creates missing AssignmentTopic records idempotently.
 * @param assignmentId - The assignment to link topics to
 * @param topicNames - Array of topic names (already normalized)
 */
export async function ensureTopicsForAssignment(
  assignmentId: string,
  topicNames: string[],
  client?: AssignmentSkillsTopicsClient
): Promise<void> {
  if (topicNames.length === 0) return;

  // AssignmentTopic model has (assignmentId, name) unique constraint
  const toCreate: Prisma.AssignmentTopicCreateManyInput[] = topicNames.map(
    name => ({
      assignmentId,
      name,
    })
  );

  await (client?.assignmentTopic ?? prisma.assignmentTopic).createMany({
    data: toCreate,
    skipDuplicates: true,
  });
}
