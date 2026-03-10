import { callEdu2comBackgroundTeamFormation } from '@/lib/edu2com/api';
import {
  getEdu2comBackgroundTimeoutMs,
  normalizeWeights,
} from '@/lib/edu2com/config';
import { buildEdu2comReplyPostUrl } from '@/lib/edu2com/webhook';
import { HttpError } from '@/lib/utils/errors';
import {
  assertEdu2comProviderConfiguration,
  getRequiredEdu2comWebhookBaseUrl,
  getRequiredEdu2comWebhookSecret,
} from '../config';
import { failTeamFormationRequest } from '../complete-request';
import { markTeamFormationRequestProcessing } from '../request-store';
import type { TeamFormationProvider } from './provider';

function isAbortError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    error.message?.toLowerCase?.().includes('aborted')
  );
}

const RETRYABLE_EDU2COM_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_EDU2COM_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRY_MAX_DELAY_MS = 30_000;

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

function shouldRetryEdu2comError(error: unknown) {
  if (error instanceof HttpError) {
    return RETRYABLE_EDU2COM_STATUSES.has(error.status);
  }
  return isAbortError(error);
}

async function callEdu2comWithRetry(
  payload: Parameters<typeof callEdu2comBackgroundTeamFormation>[0],
  opts: { timeoutMs: number }
) {
  for (let attempt = 1; attempt <= MAX_EDU2COM_ATTEMPTS; attempt += 1) {
    try {
      await callEdu2comBackgroundTeamFormation(payload, opts);
      return;
    } catch (error) {
      if (!shouldRetryEdu2comError(error) || attempt === MAX_EDU2COM_ATTEMPTS) {
        throw error;
      }

      const delayMs = Math.min(
        RETRY_MAX_DELAY_MS,
        RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
      );
      await sleep(delayMs);
    }
  }
}

function toFailedRequestMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error);
  if (isAbortError(error)) {
    return `Timeout contacting Edu2com: ${text}`;
  }
  return text || 'Failed to enqueue team formation';
}

function toUserFacingError(error: unknown) {
  if (isAbortError(error)) {
    return new HttpError(
      504,
      'Permintaan ke Edu2com melebihi batas waktu. Silakan coba lagi.'
    );
  }

  if (error instanceof HttpError) {
    return new HttpError(error.status, error.message, error.code);
  }

  return new HttpError(
    400,
    'Gagal mengirim permintaan pembentukan kelompok'
  );
}

export const edu2comTeamFormationProvider: TeamFormationProvider = {
  name: 'edu2com',
  async launch(request, builtPayload) {
    assertEdu2comProviderConfiguration();

    const replyPostUrl = buildEdu2comReplyPostUrl({
      requestId: request.id,
      baseUrl: getRequiredEdu2comWebhookBaseUrl(),
      secret: getRequiredEdu2comWebhookSecret(),
    });
    const backgroundTimeoutMs = getEdu2comBackgroundTimeoutMs({
      studentCount: builtPayload.counts.eligibleStudents,
      taskCount: builtPayload.counts.taskCount,
    });

    try {
      const requestRecord = await markTeamFormationRequestProcessing(request.id, {
        replyPostUrl,
      });

      await callEdu2comWithRetry(
        {
          ...builtPayload.requestData,
          ...normalizeWeights(builtPayload.weights),
          replyPostUrl,
        },
        { timeoutMs: backgroundTimeoutMs }
      );

      return {
        requestId: request.id,
        provider: 'edu2com',
        mode: 'async',
        status:
          requestRecord.status === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING',
      };
    } catch (error) {
      await failTeamFormationRequest(request.id, toFailedRequestMessage(error));
      throw toUserFacingError(error);
    }
  },
};
