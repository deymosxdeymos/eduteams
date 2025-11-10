import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { handleApiError } from '@/lib/api-utils';
import { DASHBOARD_STATISTICS_TAG } from '@/lib/dashboard/statistics';
import { edu2comTeamsResponseSchema } from '@/lib/edu2com/contract';
import { verifyEdu2comWebhookToken } from '@/lib/edu2com/webhook';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const token = url.searchParams.get('token');

    if (!requestId || !verifyEdu2comWebhookToken(requestId, token)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload harus berupa JSON' },
        { status: 400 }
      );
    }

    const parsed = edu2comTeamsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      await prisma.teamFormationRequest
        .update({
          where: { id: requestId },
          data: {
            status: 'FAILED',
            errorMessage:
              `Invalid Edu2com payload: ${parsed.error.message}`.slice(0, 250),
          },
        })
        .catch(() => {});

      return NextResponse.json(
        { success: false, error: 'Payload tidak sesuai skema Edu2com' },
        { status: 400 }
      );
    }

    const requestRecord = await prisma.teamFormationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, assignmentId: true },
    });

    if (!requestRecord) {
      return NextResponse.json(
        { success: false, error: 'Team formation request not found' },
        { status: 404 }
      );
    }

    const teamsPayload = parsed.data;

    try {
      await prisma.$transaction([
        prisma.team.deleteMany({
          where: { teamFormationRequestId: requestId },
        }),
        prisma.teamFormationRequest.update({
          where: { id: requestId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            responseData: teamsPayload as unknown as Prisma.InputJsonValue,
            errorMessage: null,
            teams: {
              create: teamsPayload.teams.map((team, index) => ({
                taskId: null, // Set to null since Edu2com's taskId doesn't map to Task table
                name: `Kelompok ${index + 1} (${team.taskId})`,
                quality: team.quality ?? null,
                members: {
                  create: team.people.map(member => ({
                    userId: member.id,
                    assignedSkillIds: member.skillIds ?? [],
                  })),
                },
              })),
            },
          },
        }),
      ]);

      console.log(
        `[Edu2com Webhook] Successfully processed ${teamsPayload.teams.length} teams for request ${requestId}`
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        `[Edu2com Webhook] Failed to save teams for request ${requestId}:`,
        errorMsg
      );

      await prisma.teamFormationRequest
        .update({
          where: { id: requestId },
          data: {
            status: 'FAILED',
            errorMessage: `Failed to save teams: ${errorMsg}`.slice(0, 250),
            completedAt: new Date(),
          },
        })
        .catch(e => {
          console.error(
            `[Edu2com Webhook] Failed to mark request ${requestId} as FAILED:`,
            e
          );
        });

      return NextResponse.json(
        { success: false, error: 'Failed to save team formation results' },
        { status: 500 }
      );
    }

    if (requestRecord.assignmentId) {
      await prisma.assignment
        .update({
          where: { id: requestRecord.assignmentId },
          data: { status: 'BERHASIL_PEMBAGIAN_GRUP' },
        })
        .catch(() => {});
    }

    revalidateTag(DASHBOARD_STATISTICS_TAG);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
