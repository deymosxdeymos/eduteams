import { CompetencyKind } from '@/generated/prisma/client';
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

interface SkillRecord {
  id: string;
  name: string;
}

interface SkillProfileRecord {
  id: string;
  skillId: string | null;
  value: number;
  updatedAt: Date;
  sourceAssignmentId: string | null;
}

interface PersonSkillRecord {
  skillId: string;
  level: number;
  updatedAt: Date;
}

interface TopicProfileRecord {
  id: string;
  topicKey: string | null;
  value: number;
  updatedAt: Date;
  sourceAssignmentId: string | null;
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

  let skills: SkillRecord[] = [];
  if (uniqueSkillNames.length) {
    skills = await prisma.skill.findMany({
      where: { name: { in: uniqueSkillNames } },
      select: { id: true, name: true },
    });
  }

  const skillIdByName = new Map(skills.map(skill => [skill.name, skill.id]));
  const skillIds = skills.map(skill => skill.id);

  let skillProfiles: SkillProfileRecord[] = [];
  if (skillIds.length) {
    skillProfiles = await prisma.studentCompetencyProfile.findMany({
      where: {
        studentId,
        competencyKind: CompetencyKind.SKILL,
        skillId: { in: skillIds },
      },
      select: {
        id: true,
        skillId: true,
        value: true,
        updatedAt: true,
        sourceAssignmentId: true,
      },
    });
  }

  let personSkills: PersonSkillRecord[] = [];
  if (skillIds.length) {
    personSkills = await prisma.personSkill.findMany({
      where: {
        personId: studentId,
        skillId: { in: skillIds },
      },
      select: { skillId: true, level: true, updatedAt: true },
    });
  }

  const profileBySkillId = new Map(
    skillProfiles.map(profile => [profile.skillId ?? '', profile])
  );
  const personSkillBySkillId = new Map(
    personSkills.map(record => [record.skillId, record])
  );

  const skillPrefills: SkillPrefill[] = uniqueSkillNames.map(name => {
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

  let topicProfiles: TopicProfileRecord[] = [];
  if (uniqueTopicKeys.length) {
    topicProfiles = await prisma.studentCompetencyProfile.findMany({
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
    });
  }

  const topicProfileByKey = new Map(
    topicProfiles.map(profile => [profile.topicKey ?? '', profile])
  );

  const seenTopicKeys = new Set<string>();
  const uniqueTopicEntries = normalizedTopicEntries.filter(entry => {
    if (seenTopicKeys.has(entry.key)) return false;
    seenTopicKeys.add(entry.key);
    return true;
  });

  const topicPrefills: TopicPrefill[] = uniqueTopicEntries.map(entry => {
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
