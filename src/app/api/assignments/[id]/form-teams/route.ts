import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiResponse, handleApiError, withRole } from "@/lib/api-utils";
import { isSameOrigin } from "@/lib/csrf";
import { isTruthyEnv } from "@/lib/utils/environment";
import { checkMutationRateLimit, createRateLimitResponse } from "@/lib/mutation-rate-limit";
import prisma from "@/lib/prisma";
import { AuthorizationError, ValidationError } from "@/lib/utils/errors";
import { buildTeamFormationPayload } from "@/lib/team-formation/build-payload";
import {
  assertEdu2comProviderConfiguration,
  resolveTeamFormationProvider,
} from "@/lib/team-formation/config";
import { getTeamFormationProvider } from "@/lib/team-formation/providers";
import {
  cleanupStaleTeamFormationRequests,
  createTeamFormationRequest,
  getInFlightTeamFormationRequestForAssignment,
} from "@/lib/team-formation/request-store";

const BODY_SCHEMA = z
  .object({
    method: z.enum(["JUMLAH_KELOMPOK", "JUMLAH_MHS_PER_KELOMPOK"]),
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

export const runtime = "nodejs";
const TEAM_FORMATION_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const TEAM_FORMATION_RATE_LIMIT_PER_IP = 15;
const TEAM_FORMATION_RATE_LIMIT_PER_USER = 8;

async function assertAssignmentOwnership(assignmentId: string, ownerId: string): Promise<void> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      course: { select: { dosenId: true } },
    },
  });

  if (!assignment) {
    throw new ValidationError("Assignment not found");
  }

  if (assignment.course.dosenId !== ownerId) {
    throw new AuthorizationError("Unauthorized");
  }
}

export const POST = withRole<{ id: string }>("TEACHER", async (req, ctx) => {
  try {
    const { id: assignmentId } = await ctx.params;

    const enforceSameOrigin = isTruthyEnv(process.env.ENFORCE_SAME_ORIGIN_MUTATIONS);
    if (enforceSameOrigin && !isSameOrigin(req)) {
      return NextResponse.json({ success: false, error: "Forbidden origin" }, { status: 403 });
    }

    const rateLimit = await checkMutationRateLimit(req, {
      keyPrefix: "form-teams",
      userId: ctx.user.id,
      windowMs: TEAM_FORMATION_RATE_LIMIT_WINDOW_MS,
      perIp: TEAM_FORMATION_RATE_LIMIT_PER_IP,
      perUser: TEAM_FORMATION_RATE_LIMIT_PER_USER,
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, {
        ip: `Terlalu banyak permintaan. Coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
        user: "Batas permintaan pembentukan kelompok tercapai. Tunggu beberapa menit lalu coba lagi.",
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    let parsedBody: z.infer<typeof BODY_SCHEMA>;
    try {
      parsedBody = BODY_SCHEMA.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed: ${error.issues.map((issue) => issue.message).join(", ")}`,
        );
      }
      throw error;
    }

    await assertAssignmentOwnership(assignmentId, ctx.user.id);

    await cleanupStaleTeamFormationRequests(assignmentId);

    const inFlight = await getInFlightTeamFormationRequestForAssignment(assignmentId);
    if (inFlight) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Masih ada proses pembentukan kelompok yang berjalan. Silakan tunggu hingga selesai sebelum menjalankan lagi.",
        },
        { status: 409 },
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
    if (providerName === "edu2com") {
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

    if (launchResult.mode === "async" && launchResult.status !== "COMPLETED") {
      return createApiResponse(
        {
          requestId: launchResult.requestId,
          status: launchResult.status,
          provider: launchResult.provider,
          mode: launchResult.mode,
        },
        "Permintaan pembentukan kelompok sedang diproses di latar belakang. Hasil akan muncul setelah Edu2com selesai.",
        202,
      );
    }

    return createApiResponse(
      {
        requestId: launchResult.requestId,
        status: launchResult.status,
        provider: launchResult.provider,
        mode: launchResult.mode,
      },
      "Pembentukan kelompok selesai.",
      200,
    );
  } catch (error) {
    return handleApiError(error);
  }
});
