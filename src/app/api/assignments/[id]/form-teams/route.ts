import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiResponse, handleApiError, withRole } from '@/lib/api-utils';
import { isSameOrigin } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { ValidationError } from '@/lib/utils/errors';
import { buildTeamFormationPayload } from '@/lib/team-formation/build-payload';
import {
  assertEdu2comProviderConfiguration,
  resolveTeamFormationProvider,
} from '@/lib/team-formation/config';
import { getTeamFormationProvider } from '@/lib/team-formation/providers';
import {
  cleanupStaleTeamFormationRequests,
  createTeamFormationRequest,
  getInFlightTeamFormationRequestForAssignment,
} from '@/lib/team-formation/request-store';

const BODY_SCHEMA = z
  .object({
    method: z.enum(['JUMLAH_KELOMPOK', 'JUMLAH_MHS_PER_KELOMPOK']),
    value: z.number().int().min(1),
    weights: z
      .object({
        alpha: z.number().min(0).max(1).optional(),
        beta: z.number().min(0).max(1).optional(),
        gamma: z.number().min(0).max(1).optional(),
        delta: z.number().min(0).max(1).optional(),
      })
      .optional(),
  })
  .strict();

export const runtime = 'nodejs';
const TEAM_FORMATION_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const TEAM_FORMATION_RATE_LIMIT_PER_IP = 15;
const TEAM_FORMATION_RATE_LIMIT_PER_USER = 8;

export const POST = withRole<{ id: string }>('TEACHER', async (req, ctx) => {
  try {
    const { id: assignmentId } = await ctx.params;

    const enforceSameOrigin =
      process.env.ENFORCE_SAME_ORIGIN_MUTATIONS === '1' ||
      process.env.DEMO_MODE === '1';
    if (enforceSameOrigin && !isSameOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden origin' },
        { status: 403 }
      );
    }

    const clientIdentifier = getClientIdentifier(req);
    if (!clientIdentifier && process.env.NODE_ENV === 'production') {
      logger.warn(
        '[Team Formation] Missing trusted client identifier in production. Configure TRUSTED_CLIENT_IP_HEADERS to enable IP-based throttling and set TRUSTED_PROXY_HOPS when using multi-proxy x-forwarded-for chains; falling back to the per-user rate limit.'
      );
    }

    if (clientIdentifier) {
      const ipRateLimit = await checkRateLimit({
        key: `form-teams:ip:${clientIdentifier}`,
        limit: TEAM_FORMATION_RATE_LIMIT_PER_IP,
        windowMs: TEAM_FORMATION_RATE_LIMIT_WINDOW_MS,
      });

      if (!ipRateLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Terlalu banyak permintaan. Coba lagi dalam ${ipRateLimit.retryAfterSeconds} detik.`,
          },
          { status: 429 }
        );
      }
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    let parsedBody: z.infer<typeof BODY_SCHEMA>;
    try {
      parsedBody = BODY_SCHEMA.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed: ${error.issues.map(issue => issue.message).join(', ')}`
        );
      }
      throw error;
    }

    const userRateLimit = await checkRateLimit({
      key: `form-teams:user:${ctx.user.id}`,
      limit: TEAM_FORMATION_RATE_LIMIT_PER_USER,
      windowMs: TEAM_FORMATION_RATE_LIMIT_WINDOW_MS,
    });

    if (!userRateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Batas permintaan pembentukan kelompok tercapai. Tunggu beberapa menit lalu coba lagi.',
        },
        { status: 429 }
      );
    }

    await cleanupStaleTeamFormationRequests(assignmentId);

    const inFlight = await getInFlightTeamFormationRequestForAssignment(
      assignmentId
    );
    if (inFlight) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Masih ada proses pembentukan kelompok yang berjalan. Silakan tunggu hingga selesai sebelum menjalankan lagi.',
        },
        { status: 409 }
      );
    }

    const builtPayload = await buildTeamFormationPayload({
      assignmentId,
      ownerId: ctx.user.id,
      method: parsedBody.method,
      value: parsedBody.value,
      weights: parsedBody.weights,
    });

    const providerName = resolveTeamFormationProvider();
    if (providerName === 'edu2com') {
      assertEdu2comProviderConfiguration();
    }

    const requestRecord = await createTeamFormationRequest({
      id: randomUUID(),
      ownerId: ctx.user.id,
      assignmentId,
      provider: providerName,
      builtPayload,
    });

    const provider = getTeamFormationProvider(providerName);
    const launchResult = await provider.launch(requestRecord, builtPayload);

    if (launchResult.mode === 'async') {
      return createApiResponse(
        {
          requestId: launchResult.requestId,
          status: launchResult.status,
          provider: launchResult.provider,
          mode: launchResult.mode,
        },
        'Permintaan pembentukan kelompok sedang diproses di latar belakang. Hasil akan muncul setelah Edu2com selesai.',
        202
      );
    }

    return createApiResponse(
      {
        requestId: launchResult.requestId,
        status: launchResult.status,
        provider: launchResult.provider,
        mode: launchResult.mode,
      },
      'Pembentukan kelompok selesai.',
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
});
