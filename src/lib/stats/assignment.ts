import type { Gender, MBTIType } from "@/generated/prisma/client";
import { parseAssignmentDescription } from "@/lib/assignment-description";
import prisma from "@/lib/prisma";

type MbtiStat = { kategori: MBTIType; jumlah: number };
type SkillStat = { label: string; value: number };
type NamedValue = { name: string; value: number };

export interface TeamQualityMetrics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  count: number;
}

export interface AssignmentStats {
  mbti: MbtiStat[];
  gender: NamedValue[]; // names: 'laki' | 'perempuan'
  skills: SkillStat[];
  topicPreferences: NamedValue[]; // assignment-topic names
  teamsFormed: boolean;
  quizSubmissions: number;
  chartReady: boolean;
  skillsReady: boolean;
  teamQuality?: TeamQualityMetrics;
}

export function calculateQualityMetrics(qualityScores: number[]): TeamQualityMetrics | null {
  if (qualityScores.length === 0) {
    return null;
  }

  const sorted = [...qualityScores].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = qualityScores.reduce((sum, val) => sum + val, 0) / qualityScores.length;

  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    qualityScores.reduce((sum, val) => sum + (val - mean) ** 2, 0) / qualityScores.length;
  const stdDev = Math.sqrt(variance);

  return {
    min,
    max,
    mean,
    median,
    stdDev,
    count: qualityScores.length,
  };
}

export async function getAssignmentStats(
  assignmentId: string,
  courseId: string,
): Promise<AssignmentStats> {
  // Load enrollments with minimal selects
  const [enrollments, assignmentMeta, quizSubmissionCount] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseId },
      select: {
        studentId: true,
        student: {
          select: {
            gender: true,
            personalityProfile: { select: { mbtiType: true } },
          },
        },
      },
    }),
    prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        description: true,
      },
    }),
    prisma.assignmentSubmission.count({
      where: { assignmentId },
    }),
  ]);

  const chartReady = quizSubmissionCount > 0;

  // MBTI distribution
  const mbtiCountsMap = new Map<MBTIType, number>();
  for (const e of enrollments) {
    const t = e.student.personalityProfile?.mbtiType as MBTIType | null;
    if (!t) continue;
    mbtiCountsMap.set(t, (mbtiCountsMap.get(t) ?? 0) + 1);
  }
  const mbtiOrder: MBTIType[] = [
    "INTJ",
    "INTP",
    "ENTJ",
    "ENTP",
    "INFJ",
    "INFP",
    "ENFJ",
    "ENFP",
    "ISTJ",
    "ISFJ",
    "ESTJ",
    "ESFJ",
    "ISTP",
    "ISFP",
    "ESTP",
    "ESFP",
  ];
  const mbti: MbtiStat[] = mbtiOrder.map((k) => ({
    kategori: k,
    jumlah: mbtiCountsMap.get(k) ?? 0,
  }));

  // Gender distribution (normalized to 0..100 based on counts)
  let male = 0;
  let female = 0;
  for (const e of enrollments) {
    const g = e.student.gender as Gender | null;
    if (g === "MALE") male += 1;
    else if (g === "FEMALE") female += 1;
  }
  const gender: NamedValue[] = [
    { name: "laki", value: male },
    { name: "perempuan", value: female },
  ];

  const { skills: skillNames, topics: topicNames } = parseAssignmentDescription(
    assignmentMeta?.description,
  );
  // Fetch skills and topics in parallel since they're independent
  const studentIds = enrollments.map((e: { studentId: string }) => e.studentId);
  const [skillRecords, topicRows]: [
    { id: string; name: string }[],
    { id: string; name: string }[],
  ] = await Promise.all([
    skillNames.length
      ? prisma.skill.findMany({
          where: { name: { in: skillNames } },
          select: { id: true, name: true },
        })
      : ([] as { id: string; name: string }[]),
    prisma.assignmentTopic.findMany({
      where: topicNames.length ? { assignmentId, name: { in: topicNames } } : { assignmentId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const skillIdByName = new Map<string, string>(
    skillRecords.map((s: { id: string; name: string }) => [s.name, s.id]),
  );

  // Fetch personSkills and topicPrefs in parallel since they're independent
  const topicIds = topicRows.map((t: { id: string }) => t.id);
  const [personSkills, topicPrefs] = await Promise.all([
    studentIds.length
      ? prisma.personSkill.findMany({
          where: {
            personId: { in: studentIds },
            skillId: { in: skillRecords.map((s: { id: string }) => s.id) },
          },
          select: { personId: true, skillId: true, level: true },
        })
      : ([] as { personId: string; skillId: string; level: number }[]),
    topicIds.length
      ? prisma.assignmentTopicPreference.findMany({
          where: { assignmentTopicId: { in: topicIds } },
          select: { assignmentTopicId: true, preference: true },
        })
      : ([] as { assignmentTopicId: string; preference: number }[]),
  ]);

  const levelSums = new Map<string, { sum: number; count: number }>();
  for (const s of personSkills) {
    const cur = levelSums.get(s.skillId) ?? { sum: 0, count: 0 };
    cur.sum += s.level;
    cur.count += 1;
    levelSums.set(s.skillId, cur);
  }

  const skills: SkillStat[] = skillNames.map((label) => {
    const id = skillIdByName.get(label);
    if (!id) return { label, value: 0 };
    const agg = levelSums.get(id);
    if (!agg || agg.count === 0) return { label, value: 0 };
    // level is 0..1, convert to percent 0..100
    return { label, value: Math.round((agg.sum / agg.count) * 100) };
  });

  const skillsReady = skills.some((s) => s.value > 0);

  const prefSumsById = new Map<string, { sum: number; count: number }>();
  for (const p of topicPrefs as {
    assignmentTopicId: string;
    preference: number;
  }[]) {
    const cur = prefSumsById.get(p.assignmentTopicId) ?? { sum: 0, count: 0 };
    cur.sum += p.preference;
    cur.count += 1;
    prefSumsById.set(p.assignmentTopicId, cur);
  }
  const idToName = new Map(
    topicRows.map((t: { id: string; name: string }) => [t.id, t.name] as const),
  );
  const avgByName = new Map<string, number>();
  for (const [id, agg] of prefSumsById) {
    const name = idToName.get(id);
    if (!name) continue;
    avgByName.set(name, Math.round((agg.sum / agg.count) * 100));
  }
  const topicLabelList: string[] = topicNames.length
    ? topicNames
    : topicRows.map((t: { name: string }) => t.name);
  const topicPreferences: NamedValue[] = topicLabelList.map((name: string) => ({
    name,
    value: avgByName.get(name) ?? 0,
  }));

  const teamsFormed =
    (await prisma.teamFormationRequest.count({
      where: {
        assignmentId,
        status: { in: ["PROCESSING", "COMPLETED"] },
      },
    })) > 0;

  // Calculate team quality metrics from latest completed team formation for THIS assignment only
  // Group by taskId and compute metrics from per-task averages
  let teamQuality: TeamQualityMetrics | undefined;
  if (teamsFormed) {
    const latestFormation = await prisma.teamFormationRequest.findFirst({
      where: {
        assignmentId,
        status: "COMPLETED",
      },
      select: {
        teams: {
          select: {
            taskId: true,
            quality: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (latestFormation) {
      type TeamRow = { taskId: string | null; quality: number | null };
      const teams = latestFormation.teams as TeamRow[];

      // Collect all team qualities
      const allQualities = teams
        .filter((team: TeamRow) => team.quality !== null)
        .map((team: TeamRow) => team.quality as number);

      // Check if ANY teams have non-null taskIds
      const hasAnyTaskIds = teams.some((t: TeamRow) => t.taskId !== null);

      if (hasAnyTaskIds) {
        // Group teams by taskId (null → 'unassigned') and calculate average per task
        const taskQualityMap = new Map<string, number[]>();
        for (const team of teams) {
          if (team.quality === null) continue;
          const taskKey = team.taskId ?? "unassigned";
          const existing = taskQualityMap.get(taskKey) ?? [];
          existing.push(team.quality);
          taskQualityMap.set(taskKey, existing);
        }

        // Calculate average quality per task
        const taskAverages: number[] = [];
        for (const [, qualities] of taskQualityMap) {
          if (qualities.length === 0) continue;
          const avg = qualities.reduce((sum, q) => sum + q, 0) / qualities.length;
          taskAverages.push(avg);
        }

        // Calculate metrics from task-level averages
        if (taskAverages.length > 0) {
          teamQuality = calculateQualityMetrics(taskAverages) ?? undefined;
        }
      } else {
        // ALL teams have null taskId: compute metrics across individual teams
        if (allQualities.length > 0) {
          teamQuality = calculateQualityMetrics(allQualities) ?? undefined;
        }
      }
    }
  }

  return {
    mbti,
    gender,
    skills,
    topicPreferences,
    teamsFormed,
    quizSubmissions: quizSubmissionCount,
    chartReady,
    skillsReady,
    teamQuality,
  };
}
