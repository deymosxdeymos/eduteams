// Minimal Edu2com API client used to call the official endpoint
// Based on summerschool implementation but simplified (no retries/upstash)

import { HttpError } from '@/lib/utils/errors';
import {
  type Edu2comParameters,
  type Edu2comTeamsResponse,
  edu2comTeamsResponseSchema,
} from './contract';

export async function callEdu2comTeamFormation(
  payload: Edu2comParameters,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<Edu2comTeamsResponse> {
  const { timeoutMs = 15000, headers = {} } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const endpoint =
      'https://ardid.iiia.csic.es/eduteams/edu2com/v1/teamFormation';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // If response is not JSON, throw
      throw new HttpError(
        res.status,
        text || 'Invalid response from Edu2com',
        'EDU2COM_INVALID_RESPONSE'
      );
    }

    if (!res.ok) {
      const message =
        typeof data === 'object' && data !== null
          ? JSON.stringify(data)
          : String(data);
      throw new HttpError(
        res.status,
        message || 'Cannot form the teams with the provided data.',
        'EDU2COM_ERROR'
      );
    }

    const parsed = edu2comTeamsResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new HttpError(
        502,
        `Invalid response from Edu2com: ${parsed.error.message}`,
        'EDU2COM_SCHEMA_MISMATCH'
      );
    }

    return parsed.data;
  } finally {
    clearTimeout(timer);
  }
}
