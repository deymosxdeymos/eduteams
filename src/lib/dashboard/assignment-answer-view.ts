import prisma from "@/lib/prisma";
import { parseAssignmentDescription } from "@/lib/assignment-description";

export interface AssignmentAnswerView {
  title: string;
  skills: Array<{ name: string; level: number | null }>;
  topics: Array<{ name: string; preference: number | null }>;
}

export async function getAssignmentAnswerView(
  assignmentId: string,
  studentId: string,
): Promise<AssignmentAnswerView | null> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      title: true,
      description: true,
      AssignmentTopic: {
        select: {
          name: true,
          preferences: {
            where: { personId: studentId },
            select: { preference: true },
          },
        },
      },
    },
  });

  if (!assignment) {
    return null;
  }

  const { skills } = parseAssignmentDescription(assignment.description);
  const skillRows = skills.length
    ? await prisma.skill.findMany({
        where: { name: { in: skills } },
        select: {
          name: true,
          personSkills: {
            where: { personId: studentId },
            select: { level: true },
          },
        },
      })
    : [];

  const levelBySkillName = new Map<string, number | null>(
    skillRows.map((skill: (typeof skillRows)[number]) => [
      skill.name,
      skill.personSkills[0]?.level ?? null,
    ]),
  );

  return {
    title: assignment.title,
    skills: skills.map((name) => ({
      name,
      level: levelBySkillName.get(name) ?? null,
    })),
    topics: assignment.AssignmentTopic.map(
      (topic: (typeof assignment.AssignmentTopic)[number]) => ({
        name: topic.name,
        preference: topic.preferences[0]?.preference ?? null,
      }),
    ),
  };
}
