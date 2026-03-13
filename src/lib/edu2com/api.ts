// Minimal Edu2com API client used to call the official endpoint
// Based on summerschool implementation but simplified (no retries/upstash)

import { HttpError } from "@/lib/utils/errors";
import {
  type Edu2comBackgroundParameters,
  type Edu2comParameters,
  type Edu2comTeamsResponse,
  edu2comTeamsResponseSchema,
} from "./contract";

const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.EDU2COM_TIMEOUT_MS ?? "", 10);

type UnknownRecord = Record<string, unknown>;

function clampQualityValue(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeTeamsResponse(data: unknown): {
  normalized: unknown;
  clamped: boolean;
} {
  if (typeof data !== "object" || data === null) {
    return { normalized: data, clamped: false };
  }

  const record = data as UnknownRecord;
  if (!Array.isArray(record.teams)) {
    return { normalized: data, clamped: false };
  }

  let clamped = false;
  const normalizedTeams = (record.teams as unknown[]).map((team) => {
    if (typeof team !== "object" || team === null) {
      return team;
    }

    const teamRecord = { ...(team as UnknownRecord) };
    const currentQuality = teamRecord.quality;

    if (typeof currentQuality === "number" && Number.isFinite(currentQuality)) {
      const normalizedQuality = clampQualityValue(currentQuality);
      if (normalizedQuality !== currentQuality) {
        clamped = true;
      }
      teamRecord.quality = normalizedQuality;
    }

    return teamRecord;
  });

  return {
    normalized: {
      ...record,
      teams: normalizedTeams,
    },
    clamped,
  };
}

async function withTimeout<T>(
  timeoutMs: number,
  code: string,
  message: string,
  execute: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new HttpError(408, message, code));
    }, timeoutMs);
  });

  const operationPromise = execute(controller.signal);

  try {
    return await Promise.race([operationPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HttpError(408, message, code);
    }
    throw error;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function callEdu2comTeamFormation(
  payload: Edu2comParameters,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<Edu2comTeamsResponse> {
  const timeoutMs =
    Number.isFinite(opts.timeoutMs) && (opts.timeoutMs as number) > 0
      ? (opts.timeoutMs as number)
      : Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0
        ? DEFAULT_TIMEOUT_MS
        : 120_000;
  const { headers = {} } = opts;

  const endpoint = "https://ardid.iiia.csic.es/eduteams/edu2com/v1/teamFormation";

  return withTimeout(
    timeoutMs,
    "EDU2COM_TIMEOUT",
    `Edu2com request timed out after ${timeoutMs}ms`,
    async (signal) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
        signal,
      });

      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        // If response is not JSON, throw
        throw new HttpError(
          res.status,
          text || "Invalid response from Edu2com",
          "EDU2COM_INVALID_RESPONSE",
        );
      }

      if (!res.ok) {
        const message =
          typeof data === "object" && data !== null ? JSON.stringify(data) : String(data);
        throw new HttpError(
          res.status,
          message || "Cannot form the teams with the provided data.",
          "EDU2COM_ERROR",
        );
      }

      const { normalized, clamped } = normalizeTeamsResponse(data);
      if (clamped) {
        console.warn(
          "[Edu2com API] Received quality scores outside [0,1]; clamping to maintain contract.",
        );
      }

      const parsed = edu2comTeamsResponseSchema.safeParse(normalized);
      if (!parsed.success) {
        throw new HttpError(
          502,
          `Invalid response from Edu2com: ${parsed.error.message}`,
          "EDU2COM_SCHEMA_MISMATCH",
        );
      }

      return parsed.data;
    },
  );
}

export async function callEdu2comBackgroundTeamFormation(
  payload: Edu2comBackgroundParameters,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<void> {
  const timeoutMs =
    Number.isFinite(opts.timeoutMs) && (opts.timeoutMs as number) > 0
      ? (opts.timeoutMs as number)
      : Number.isFinite(DEFAULT_TIMEOUT_MS) && DEFAULT_TIMEOUT_MS > 0
        ? DEFAULT_TIMEOUT_MS
        : 120_000;
  const { headers = {} } = opts;

  const startTime = performance.now();
  const endpoint = "https://ardid.iiia.csic.es/eduteams/edu2com/v1/backgroundTeamFormation";

  console.log(
    `[Edu2com API] Calling background team formation for ${payload.people.length} people, ${payload.tasks.length} tasks (timeout: ${timeoutMs}ms)`,
  );

  try {
    await withTimeout(
      timeoutMs,
      "EDU2COM_BACKGROUND_TIMEOUT",
      `Edu2com background request timed out after ${timeoutMs}ms`,
      async (signal) => {
        const fetchStart = performance.now();
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(payload),
          signal,
        });
        const fetchTime = performance.now() - fetchStart;
        console.log(
          `[Edu2com API] Fetch completed in ${fetchTime.toFixed(2)}ms, status: ${res.status}`,
        );

        if (res.status === 202) {
          const totalTime = performance.now() - startTime;
          console.log(
            `[Edu2com API] Request accepted (202) - processing in background. Total time: ${totalTime.toFixed(2)}ms`,
          );
          return;
        }

        const text = await res.text();
        console.error(
          `[Edu2com API] Background team formation failed with status ${res.status}:`,
          text,
        );
        throw new HttpError(
          res.status,
          text || "Cannot form the teams with the provided data.",
          "EDU2COM_BACKGROUND_ERROR",
        );
      },
    );
  } catch (error) {
    if (error instanceof HttpError) throw error;

    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Edu2com API] Request failed:", errorMsg);
    throw error;
  }
}
