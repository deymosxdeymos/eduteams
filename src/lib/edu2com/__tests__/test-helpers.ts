import type { Edu2comTeamsResponse } from '@/lib/edu2com/contract';
import { HttpError } from '@/lib/utils/errors';

const TRANSIENT_ERROR_CODES = new Set([
  'EDU2COM_TIMEOUT',
  'EDU2COM_INVALID_RESPONSE',
]);

export type NormalizedTeam = {
  taskId: string;
  peopleIds: string[];
};

export function normalizeTeamsForComparison(
  response: Edu2comTeamsResponse
): NormalizedTeam[] {
  return [...response.teams]
    .map(team => ({
      taskId: team.taskId,
      peopleIds: [...team.people.map(person => person.id)].sort(),
    }))
    .sort((a, b) => a.taskId.localeCompare(b.taskId));
}

export function normalizeTeamsByMembers(
  response: Edu2comTeamsResponse
): string[] {
  return [...response.teams]
    .map(team =>
      team.people
        .map(person => person.id)
        .sort()
        .join('|')
    )
    .sort((a, b) => a.localeCompare(b));
}

export type Edu2comCallResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: HttpError };

export function asTransientEdu2comError(error: unknown): HttpError | null {
  if (
    error instanceof HttpError &&
    error.code &&
    TRANSIENT_ERROR_CODES.has(error.code)
  ) {
    return error;
  }
  return null;
}

export async function runEdu2comCall<T>(
  fn: () => Promise<T>
): Promise<Edu2comCallResult<T>> {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    const transient = asTransientEdu2comError(error);
    if (transient) {
      return { ok: false, error: transient };
    }
    throw error;
  }
}
