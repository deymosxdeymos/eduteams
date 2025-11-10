// Minimal Edu2com API client used to call the official endpoint
// Based on summerschool implementation but simplified (no retries/upstash)

import { HttpError } from '@/lib/utils/errors';
import {
  type Edu2comBackgroundParameters,
  type Edu2comParameters,
  type Edu2comTeamsResponse,
  edu2comTeamsResponseSchema,
} from './contract';

const DEFAULT_TIMEOUT_MS = Number.parseInt(
  process.env.EDU2COM_TIMEOUT_MS ?? '',
  10
);

export async function callEdu2comTeamFormation(
  payload: Edu2comParameters,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<Edu2comTeamsResponse> {
  const timeoutMs =
    Number.isFinite(opts.timeoutMs) && (opts.timeoutMs as number) > 0
      ? (opts.timeoutMs as number)
      : Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0
        ? DEFAULT_TIMEOUT_MS
        : 120_000;
  const { headers = {} } = opts;

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

export async function callEdu2comBackgroundTeamFormation(
  payload: Edu2comBackgroundParameters,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<void> {
  const timeoutMs =
    Number.isFinite(opts.timeoutMs) && (opts.timeoutMs as number) > 0
      ? (opts.timeoutMs as number)
      : Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0
        ? DEFAULT_TIMEOUT_MS
        : 120_000;
  const { headers = {} } = opts;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = performance.now();
  try {
    const endpoint =
      'https://ardid.iiia.csic.es/eduteams/edu2com/v1/backgroundTeamFormation';

    console.log(
      `[Edu2com API] Calling background team formation for ${payload.people.length} people, ${payload.tasks.length} tasks (timeout: ${timeoutMs}ms)`
    );

    const fetchStart = performance.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const fetchTime = performance.now() - fetchStart;
    console.log(
      `[Edu2com API] Fetch completed in ${fetchTime.toFixed(2)}ms, status: ${res.status}`
    );

    if (res.status === 202) {
      const totalTime = performance.now() - startTime;
      console.log(
        `[Edu2com API] Request accepted (202) - processing in background. Total time: ${totalTime.toFixed(2)}ms`
      );
      return;
    }

    const text = await res.text();
    console.error(
      `[Edu2com API] Background team formation failed with status ${res.status}:`,
      text
    );
    throw new HttpError(
      res.status,
      text || 'Cannot form the teams with the provided data.',
      'EDU2COM_BACKGROUND_ERROR'
    );
  } catch (error) {
    if (error instanceof HttpError) throw error;

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Edu2com API] Request failed:', errorMsg);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
