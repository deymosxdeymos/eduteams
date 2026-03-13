import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { verifyEdu2comWebhookToken } from "@/lib/edu2com/webhook";
import prisma from "@/lib/prisma";
import { getRequiredEdu2comWebhookSecret } from "@/lib/team-formation/config";
import {
  completeTeamFormationRequest,
  failTeamFormationRequest,
  normalizeAndValidateTeamFormationCompletionPayload,
} from "@/lib/team-formation/complete-request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    const token = url.searchParams.get("token");

    if (
      !requestId ||
      !verifyEdu2comWebhookToken({
        requestId,
        token,
        secret: getRequiredEdu2comWebhookSecret(),
      })
    ) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const requestRecord = await prisma.teamFormationRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!requestRecord) {
      return NextResponse.json(
        { success: false, error: "Team formation request not found" },
        { status: 404 },
      );
    }

    if (requestRecord.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        data: { requestId, status: "COMPLETED", noOp: true },
      });
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      await failTeamFormationRequest(requestId, "Payload harus berupa JSON");
      return NextResponse.json(
        { success: false, error: "Payload harus berupa JSON" },
        { status: 400 },
      );
    }

    try {
      const parsedPayload = normalizeAndValidateTeamFormationCompletionPayload(payload);
      const result = await completeTeamFormationRequest(requestId, parsedPayload);

      return NextResponse.json({
        success: true,
        data: {
          requestId,
          status: "COMPLETED",
          noOp: !result.didComplete,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await failTeamFormationRequest(requestId, message);
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
