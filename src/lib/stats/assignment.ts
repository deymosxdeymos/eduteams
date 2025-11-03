import type { Gender, MBTIType } from '@/generated/prisma';
import prisma from '@/lib/prisma';

type MbtiStat = { kategori: MBTIType; jumlah: number };
type SkillStat = { label: string; value: number };
type NamedValue = { name: string; value: number };

export interface AssignmentStats {
  mbti: MbtiStat[];
  gender: NamedValue[]; // names: 'laki' | 'perempuan'
  skills: SkillStat[];
  topicPreferences: NamedValue[]; // assignment-topic names
  teamsFormed: boolean;
  quizSubmissions: number;
  chartReady: boolean;
  skillsReady: boolean;
}

export async function getAssignmentStats(
  assignmentId: string,
  courseId: string
): Promise<AssignmentStats> {
  // Load enrollments with minimal selects
  const [enrollments, assignmentMeta, quizSubmissionCount] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { courseId },
      select: {
        studentId: true,
        student: { select: { mbtiType: true, gender: true } },
      },
    }),
    prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        description: true,
        startAt: true,
        course: { select: { dosenId: true } },
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
    const t = e.student.mbtiType as MBTIType | null;
    if (!t) continue;
    mbtiCountsMap.set(t, (mbtiCountsMap.get(t) ?? 0) + 1);
  }
  const mbtiOrder: MBTIType[] = [
    'INTJ',
    'INTP',
    'ENTJ',
    'ENTP',
    'INFJ',
    'INFP',
    'ENFJ',
    'ENFP',
    'ISTJ',
    'ISFJ',
    'ESTJ',
    'ESFJ',
    'ISTP',
    'ISFP',
    'ESTP',
    'ESFP',
  ];
  const mbti: MbtiStat[] = mbtiOrder.map(k => ({
    kategori: k,
    jumlah: mbtiCountsMap.get(k) ?? 0,
  }));

  // Gender distribution (normalized to 0..100 based on counts)
  let male = 0;
  let female = 0;
  for (const e of enrollments) {
    const g = e.student.gender as Gender | null;
    if (g === 'MALE') male += 1;
    else if (g === 'FEMALE') female += 1;
  }
  const gender: NamedValue[] = [
    { name: 'laki', value: male },
    { name: 'perempuan', value: female },
  ];

  // Determine assignment-specific skills and topics from assignment.description JSON
  let skillNames: string[] = [];
  let topicNames: string[] = [];
  try {
    const parsed = assignmentMeta?.description
      ? JSON.parse(assignmentMeta.description)
      : null;
    if (Array.isArray(parsed?.skills)) {
      skillNames = parsed.skills as string[];
    }
    if (Array.isArray(parsed?.topics)) {
      topicNames = parsed.topics as string[];
    }
  } catch {
    // ignore
  }
  if (skillNames.length === 0) {
    // Fallback to the same defaults used in the quiz page
    skillNames = [
      'UI/UX Design',
      'Frontend Development',
      'Backend Development',
    ];
  }
  // Fetch only declared skills
  const skillRecords = skillNames.length
    ? await prisma.skill.findMany({
        where: { name: { in: skillNames } },
        select: { id: true, name: true },
      })
    : [];
  const skillIdByName = new Map<string, string>(
    skillRecords.map(s => [s.name, s.id])
  );
  const studentIds = enrollments.map(e => e.studentId);

  const personSkills = studentIds.length
    ? await prisma.personSkill.findMany({
        where: {
          personId: { in: studentIds },
          skillId: { in: skillRecords.map(s => s.id) },
        },
        select: { personId: true, skillId: true, level: true },
      })
    : [];

  const levelSums = new Map<string, { sum: number; count: number }>();
  for (const s of personSkills) {
    const cur = levelSums.get(s.skillId) ?? { sum: 0, count: 0 };
    cur.sum += s.level;
    cur.count += 1;
    levelSums.set(s.skillId, cur);
  }

  const skills: SkillStat[] = skillNames.map(label => {
    const id = skillIdByName.get(label);
    if (!id) return { label, value: 0 };
    const agg = levelSums.get(id);
    if (!agg || agg.count === 0) return { label, value: 0 };
    // level is 0..1, convert to percent 0..100
    return { label, value: Math.round((agg.sum / agg.count) * 100) };
  });

  const skillsReady = skills.some(s => s.value > 0);

  // Assignment topics preference distribution
  // Prefer labels from description if present; fallback to DB topics
  const topicRows = await prisma.assignmentTopic.findMany({
    where: topicNames.length
      ? { assignmentId, name: { in: topicNames } }
      : { assignmentId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  const topicIds = topicRows.map(t => t.id);
  const topicPrefs = topicIds.length
    ? await prisma.assignmentTopicPreference.findMany({
        where: { assignmentTopicId: { in: topicIds } },
        select: { assignmentTopicId: true, preference: true },
      })
    : [];

  const prefSumsById = new Map<string, { sum: number; count: number }>();
  for (const p of topicPrefs) {
    const cur = prefSumsById.get(p.assignmentTopicId) ?? { sum: 0, count: 0 };
    cur.sum += p.preference;
    cur.count += 1;
    prefSumsById.set(p.assignmentTopicId, cur);
  }
  const idToName = new Map(topicRows.map(t => [t.id, t.name] as const));
  const avgByName = new Map<string, number>();
  for (const [id, agg] of prefSumsById) {
    const name = idToName.get(id);
    if (!name) continue;
    avgByName.set(name, Math.round((agg.sum / agg.count) * 100));
  }
  const topicLabelList = topicNames.length
    ? topicNames
    : topicRows.map(t => t.name);
  const topicPreferences: NamedValue[] = topicLabelList.map(name => ({
    name,
    value: avgByName.get(name) ?? 0,
  }));

  // Teams formed heuristic: any team formation by course's dosen after assignment start
  let teamsFormed = false;
  if (assignmentMeta?.course?.dosenId && assignmentMeta.startAt) {
    const tfCount = await prisma.teamFormationRequest.count({
      where: {
        ownerId: assignmentMeta.course.dosenId,
        createdAt: { gte: assignmentMeta.startAt },
        status: { in: ['PROCESSING', 'COMPLETED'] },
      },
    });
    teamsFormed = tfCount > 0;
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
  };
}
