import { revalidateTag } from 'next/cache';
import type { Prisma } from '@/generated/prisma/client';
import { DASHBOARD_STATISTICS_TAG } from '@/lib/dashboard/statistics';
import { edu2comTeamsResponseSchema } from '@/lib/edu2com/contract';
import prisma from '@/lib/prisma';
import { ValidationError } from '@/lib/utils/errors';
import { markTeamFormationRequestFailed } from './request-store';

const clampQualityValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

type UnknownRecord = Record<string, unknown>;

function normalizeTeamsPayload(data: unknown): {
  normalized: unknown;
  clamped: boolean;
  originalQualities: number[];
} {
  if (typeof data !== 'object' || data === null) {
    return { normalized: data, clamped: false, originalQualities: [] };
  }

  const record = data as UnknownRecord;
  if (!Array.isArray(record.teams)) {
    return { normalized: data, clamped: false, originalQualities: [] };
  }

  let clamped = false;
  const originalQualities: number[] = [];
  const normalizedTeams = record.teams.map(team => {
    if (typeof team !== 'object' || team === null) {
      return team;
    }

    const teamRecord = { ...(team as UnknownRecord) };
    const currentQuality = teamRecord.quality;

    if (typeof currentQuality === 'number' && Number.isFinite(currentQuality)) {
      originalQualities.push(currentQuality);
      const normalizedQuality = clampQualityValue(currentQuality);
      if (normalizedQuality !== currentQuality) {
        clamped = true;
      }
      teamRecord.quality = normalizedQuality;
    }

    return teamRecord;
  });

  return {
    normalized: { ...record, teams: normalizedTeams },
    clamped,
    originalQualities,
  };
}

function getInputPeopleIds(requestData: unknown): string[] {
  if (
    !requestData ||
    typeof requestData !== 'object' ||
    !('people' in requestData) ||
    !Array.isArray((requestData as { people?: unknown }).people)
  ) {
    throw new Error('Invalid request data structure');
  }

  const people = (requestData as { people: unknown[] }).people;
  if (
    !people.every(
      person =>
        person &&
        typeof person === 'object' &&
        'id' in person &&
        typeof person.id === 'string'
    )
  ) {
    throw new Error('Invalid people data structure');
  }

  return people.map(person => (person as { id: string }).id);
}

function appendUnassignedStudents(
  teamsPayload: { teams: Array<{ taskId: string; quality: number | null; people: Array<{ id: string; skillIds: string[] }> }> },
  inputPeopleIds: string[]
) {
  const nextTeams = teamsPayload.teams.map(team => ({
    ...team,
    people: team.people.map(person => ({
      ...person,
      skillIds: [...person.skillIds],
    })),
  }));

  const assignedPeopleIds = new Set(
    nextTeams.flatMap(team => team.people.map(member => member.id))
  );
  const unassignedIds = inputPeopleIds.filter(id => !assignedPeopleIds.has(id));

  if (unassignedIds.length === 0) {
    return { teams: nextTeams };
  }

  if (nextTeams.length === 0) {
    throw new ValidationError(
      `Cannot assign ${unassignedIds.length} students to zero teams`
    );
  }

  const sortedTeams = [...nextTeams].sort((a, b) => {
    if (a.people.length !== b.people.length) {
      return a.people.length - b.people.length;
    }
    return a.taskId.localeCompare(b.taskId);
  });

  unassignedIds.forEach((id, index) => {
    const targetTeam = sortedTeams[index % sortedTeams.length];
    targetTeam?.people.push({ id, skillIds: [] });
  });

  return { teams: nextTeams };
}

export async function completeTeamFormationRequest(
  requestId: string,
  teamsPayload: unknown
) {
  const requestRecord = await prisma.teamFormationRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      assignmentId: true,
      requestData: true,
    },
  });

  if (!requestRecord) {
    throw new ValidationError('Team formation request not found');
  }

  if (requestRecord.status === 'COMPLETED') {
    return { didComplete: false as const };
  }

  const parsed = normalizeAndValidateTeamFormationCompletionPayload(teamsPayload);
  const inputPeopleIds = getInputPeopleIds(requestRecord.requestData);
  const finalPayload = appendUnassignedStudents(parsed, inputPeopleIds);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.team.deleteMany({
      where: { teamFormationRequestId: requestId },
    });

    await tx.teamFormationRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        responseData: finalPayload as unknown as Prisma.InputJsonValue,
        errorMessage: null,
        teams: {
          create: finalPayload.teams.map((team, index) => ({
            taskId: null,
            name: `Kelompok ${index + 1} (${team.taskId})`,
            quality: clampQualityValue(team.quality),
            members: {
              create: team.people.map(member => ({
                userId: member.id,
                assignedSkillIds: member.skillIds ?? [],
              })),
            },
          })),
        },
      },
    });

    if (requestRecord.assignmentId) {
      await tx.assignment.update({
        where: { id: requestRecord.assignmentId },
        data: { status: 'BERHASIL_PEMBAGIAN_GRUP' },
      });
    }
  });

  revalidateTag(DASHBOARD_STATISTICS_TAG);

  return {
    didComplete: true as const,
    teamsPayload: finalPayload,
  };
}

export async function failTeamFormationRequest(
  requestId: string,
  errorMessage: string
) {
  await markTeamFormationRequestFailed(requestId, errorMessage);
}

export function normalizeAndValidateTeamFormationCompletionPayload(
  teamsPayload: unknown
) {
  const { normalized } = normalizeTeamsPayload(teamsPayload);
  const parsed = edu2comTeamsResponseSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new ValidationError(`Invalid Edu2com payload: ${parsed.error.message}`);
  }

  return parsed.data;
}
