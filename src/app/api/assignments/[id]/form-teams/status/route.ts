import { NextResponse } from "next/server";
import { withRole } from "@/lib/api-utils";
import prisma from "@/lib/prisma";
import { getLatestTeamFormationRequestForAssignment } from "@/lib/team-formation/request-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withRole<{ id: string }>("TEACHER", async (_req, ctx) => {
  const params = await ctx.params;
  const assignmentId = params.id;

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      course: {
        select: { dosenId: true },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (assignment.course.dosenId !== ctx.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const latestRequest = await getLatestTeamFormationRequestForAssignment(assignmentId);

  if (!latestRequest) {
    return NextResponse.json({
      status: null,
      errorMessage: null,
    });
  }

  return NextResponse.json({
    status: latestRequest.status,
    errorMessage: latestRequest.errorMessage,
  });
});
