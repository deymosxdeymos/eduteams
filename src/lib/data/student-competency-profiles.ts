import { CompetencyKind } from '@/generated/prisma';
import prisma from '@/lib/prisma';

export interface SkillPrefill {
  name: string;
  level: number | null;
  profileId?: string | null;
  profileUpdatedAt?: Date | null;
  sourceAssignmentId?: string | null;
}

export interface TopicPrefill {
  name: string;
  preference: number | null;
  profileId?: string | null;
  profileUpdatedAt?: Date | null;
  sourceAssignmentId?: string | null;
}

export interface StudentCompetencyPrefillResult {
  skills: SkillPrefill[];
  topics: TopicPrefill[];
}

export function normalizeTopicKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 256);
}

export async function getStudentCompetencyPrefills({
  studentId,
  skillNames,
  topicNames,
}: {
  studentId: string;
  skillNames: string[];
  topicNames: string[];
}): Promise<StudentCompetencyPrefillResult> {
  const normalizedSkillNames = skillNames
    .map(name => name.trim())
    .filter(Boolean);
  const normalizedTopicEntries = topicNames
    .map(name => ({ name, key: normalizeTopicKey(name) }))
    .filter(entry => entry.key.length > 0);

  const uniqueSkillNames = Array.from(new Set(normalizedSkillNames));
  const uniqueTopicKeys = Array.from(
    new Set(normalizedTopicEntries.map(entry => entry.key))
  );

  const skills = uniqueSkillNames.length
    ? await prisma.skill.findMany({
        where: { name: { in: uniqueSkillNames } },
        select: { id: true, name: true },
      })
    : [];

  const skillIdByName = new Map(skills.map(skill => [skill.name, skill.id]));

  const skillProfiles = skills.length
    ? await prisma.studentCompetencyProfile.findMany({
        where: {
          studentId,
          competencyKind: CompetencyKind.SKILL,
          skillId: { in: skills.map(skill => skill.id) },
        },
        select: {
          id: true,
          skillId: true,
          value: true,
          updatedAt: true,
          sourceAssignmentId: true,
        },
      })
    : [];

  const personSkills = skills.length
    ? await prisma.personSkill.findMany({
        where: {
          personId: studentId,
          skillId: { in: skills.map(skill => skill.id) },
        },
        select: { skillId: true, level: true, updatedAt: true },
      })
    : [];

  const profileBySkillId = new Map(
    skillProfiles.map(profile => [profile.skillId ?? '', profile])
  );
  const personSkillBySkillId = new Map(
    personSkills.map(record => [record.skillId, record])
  );

  const skillPrefills: SkillPrefill[] = normalizedSkillNames.map(name => {
    const skillId = skillIdByName.get(name);
    const profile = skillId ? profileBySkillId.get(skillId) : undefined;
    const fallback = skillId ? personSkillBySkillId.get(skillId) : undefined;
    const level = profile?.value ?? fallback?.level ?? null;
    const profileUpdatedAt = profile?.updatedAt ?? null;
    const sourceAssignmentId = profile?.sourceAssignmentId ?? null;
    return {
      name,
      level,
      profileId: profile?.id ?? null,
      profileUpdatedAt,
      sourceAssignmentId,
    };
  });

  const topicProfiles = uniqueTopicKeys.length
    ? await prisma.studentCompetencyProfile.findMany({
        where: {
          studentId,
          competencyKind: CompetencyKind.TOPIC,
          topicKey: { in: uniqueTopicKeys },
        },
        select: {
          id: true,
          topicKey: true,
          value: true,
          updatedAt: true,
          sourceAssignmentId: true,
        },
      })
    : [];

  const topicProfileByKey = new Map(
    topicProfiles.map(profile => [profile.topicKey ?? '', profile])
  );

  const topicPrefills: TopicPrefill[] = normalizedTopicEntries.map(entry => {
    const profile = topicProfileByKey.get(entry.key);
    return {
      name: entry.name,
      preference: profile?.value ?? null,
      profileId: profile?.id ?? null,
      profileUpdatedAt: profile?.updatedAt ?? null,
      sourceAssignmentId: profile?.sourceAssignmentId ?? null,
    };
  });

  return {
    skills: skillPrefills,
    topics: topicPrefills,
  };
}
