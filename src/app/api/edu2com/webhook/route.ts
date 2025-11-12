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
  const startTime = performance.now();
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get('requestId');
    const token = url.searchParams.get('token');
    console.log(`[Webhook] Received callback for request: ${requestId}`);

    if (!requestId || !verifyEdu2comWebhookToken(requestId, token)) {
      console.log('[Webhook] Unauthorized: Invalid requestId or token');
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

    const parseStart = performance.now();
    const parsed = edu2comTeamsResponseSchema.safeParse(payload);
    const parseTime = performance.now() - parseStart;
    console.log(
      `[Webhook] Payload parsing took ${parseTime.toFixed(2)}ms, valid: ${parsed.success}`
    );

    if (!parsed.success) {
      console.error('[Webhook] Invalid payload:', parsed.error.message);
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

    const requestQueryStart = performance.now();
    const requestRecord = await prisma.teamFormationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, assignmentId: true, requestData: true },
    });
    const requestQueryTime = performance.now() - requestQueryStart;
    console.log(
      `[Webhook] Request record query took ${requestQueryTime.toFixed(2)}ms`
    );

    if (!requestRecord) {
      console.log('[Webhook] Team formation request not found');
      return NextResponse.json(
        { success: false, error: 'Team formation request not found' },
        { status: 404 }
      );
    }

    const teamsPayload = parsed.data;
    console.log(
      `[Webhook] Received ${teamsPayload.teams.length} teams from Edu2com`
    );

    // Ensure all input people are assigned: append any unassigned to smallest teams
    // Validate requestData structure
    if (
      !requestRecord.requestData ||
      typeof requestRecord.requestData !== 'object' ||
      !('people' in requestRecord.requestData) ||
      !Array.isArray((requestRecord.requestData as { people?: unknown }).people)
    ) {
      console.error(
        '[Webhook] Invalid requestData structure - missing people array'
      );
      await prisma.teamFormationRequest
        .update({
          where: { id: requestId },
          data: {
            status: 'FAILED',
            errorMessage: 'Invalid request data structure',
          },
        })
        .catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Invalid request data structure' },
        { status: 500 }
      );
    }

    // Validate that all people elements have valid id fields
    const peopleArray = (requestRecord.requestData as { people: unknown[] })
      .people;
    if (
      !peopleArray.every(
        p => p && typeof p === 'object' && 'id' in p && typeof p.id === 'string'
      )
    ) {
      console.error(
        '[Webhook] Invalid requestData structure - people array contains invalid elements'
      );
      await prisma.teamFormationRequest
        .update({
          where: { id: requestId },
          data: {
            status: 'FAILED',
            errorMessage: 'Invalid people data structure',
          },
        })
        .catch(() => {});
      return NextResponse.json(
        { success: false, error: 'Invalid people data structure' },
        { status: 500 }
      );
    }

    const requestData = requestRecord.requestData as {
      people: { id: string }[];
    };
    const inputPeopleIds = new Set(requestData.people.map(p => p.id));
    const assignedPeopleIds = new Set(
      teamsPayload.teams.flatMap(t => t.people.map(m => m.id))
    );
    const unassignedIds = Array.from(inputPeopleIds).filter(
      id => !assignedPeopleIds.has(id)
    );
    if (unassignedIds.length > 0) {
      console.log(
        `[Webhook] Found ${unassignedIds.length} unassigned students`
      );

      // Fail if no teams exist to assign students to
      if (teamsPayload.teams.length === 0) {
        const errorMsg = `Cannot assign ${unassignedIds.length} students to zero teams`;
        console.error(`[Webhook] ${errorMsg}`);
        await prisma.teamFormationRequest
          .update({
            where: { id: requestId },
            data: {
              status: 'FAILED',
              errorMessage: errorMsg,
            },
          })
          .catch(() => {});
        return NextResponse.json(
          { success: false, error: errorMsg },
          { status: 400 }
        );
      }

      console.log(
        `[Webhook] Appending ${unassignedIds.length} unassigned students to smallest teams`
      );
      // Sort teams by current size ascending
      const sortedTeams = [...teamsPayload.teams].sort(
        (a, b) => a.people.length - b.people.length
      );
      unassignedIds.forEach((id, idx) => {
        const targetTeam = sortedTeams[idx % sortedTeams.length];
        targetTeam.people.push({ id, skillIds: [] });
      });
    }

    const transactionStart = performance.now();
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
      const transactionTime = performance.now() - transactionStart;
      console.log(
        `[Webhook] Database transaction took ${transactionTime.toFixed(2)}ms`
      );

      console.log(
        `[Webhook] Successfully processed ${teamsPayload.teams.length} teams for request ${requestId}`
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
      const assignmentUpdateStart = performance.now();
      await prisma.assignment
        .update({
          where: { id: requestRecord.assignmentId },
          data: { status: 'BERHASIL_PEMBAGIAN_GRUP' },
        })
        .catch(() => {});
      const assignmentUpdateTime = performance.now() - assignmentUpdateStart;
      console.log(
        `[Webhook] Assignment status update took ${assignmentUpdateTime.toFixed(2)}ms`
      );
    }

    revalidateTag(DASHBOARD_STATISTICS_TAG);

    const totalTime = performance.now() - startTime;
    console.log(
      `[Webhook] Total webhook processing time: ${totalTime.toFixed(2)}ms`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
