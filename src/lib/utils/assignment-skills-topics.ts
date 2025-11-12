import type { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';

/**
 * Normalize input which can be string | { name: string }
 * Returns unique, trimmed, non-empty names (case-insensitive dedup)
 */
export function normalizeSkillsOrTopics(
  input: Array<string | { name: string }> | undefined
): string[] {
  if (!input || input.length === 0) return [];

  const names = input.map(item =>
    typeof item === 'string' ? item.trim() : item.name.trim()
  );

  // Case-insensitive deduplication
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    if (name.length === 0 || name.length > 100) continue;
    const lowerName = name.toLowerCase();
    if (!seen.has(lowerName)) {
      seen.add(lowerName);
      result.push(name);
    }
  }

  return result;
}

/**
 * Ensure skills exist globally and are linked to the course.
 * Creates missing Skill records and CourseSkill links idempotently.
 * @param courseId - The course to link skills to
 * @param skillNames - Array of skill names (already normalized)
 */
export async function ensureSkillsForCourse(
  courseId: string,
  skillNames: string[]
): Promise<void> {
  if (skillNames.length === 0) return;

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async tx => {
    // Step 1: Ensure all Skill records exist
    // Note: Skill.name has @unique constraint, so we handle case-insensitive matching manually
    const existing = await tx.skill.findMany({
      select: { id: true, name: true },
    });

    const existingMap = new Map(
      existing.map(s => [s.name.toLowerCase(), { id: s.id, name: s.name }])
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
      await tx.skill.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    // Step 2: Fetch all skill IDs (including newly created ones)
    const allSkills = await tx.skill.findMany({
      select: { id: true, name: true },
    });

    const skillIdMap = new Map(
      allSkills.map(s => [s.name.toLowerCase(), s.id])
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
      await tx.courseSkill.createMany({
        data: courseSkillsToCreate,
        skipDuplicates: true,
      });
    }
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
  topicNames: string[]
): Promise<void> {
  if (topicNames.length === 0) return;

  // AssignmentTopic model has (assignmentId, name) unique constraint
  const toCreate: Prisma.AssignmentTopicCreateManyInput[] = topicNames.map(
    name => ({
      assignmentId,
      name,
    })
  );

  await prisma.assignmentTopic.createMany({
    data: toCreate,
    skipDuplicates: true,
  });
}
