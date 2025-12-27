import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, withRole } from '@/lib/api-utils';
import prisma from '@/lib/prisma';
import { HttpError } from '@/lib/utils/errors';

const AddMemberSchema = z.object({
  studentId: z.string(),
});

const RemoveMemberSchema = z.object({
  studentId: z.string(),
});

export const POST = withRole<{ id: string; teamId: string }>(
  'TEACHER',
  async (req, ctx) => {
    try {
      const { id: assignmentId, teamId } = await ctx.params;

      const body = await req.json();
      const { studentId } = AddMemberSchema.parse(body);

      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          course: { select: { dosenId: true } },
        },
      });

      if (!assignment) {
        throw new HttpError(404, 'Assignment not found');
      }

      if (assignment.course.dosenId !== ctx.user.id) {
        throw new HttpError(403, 'Unauthorized');
      }

      const teamFormationRequest = await prisma.teamFormationRequest.findFirst({
        where: {
          assignmentId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!teamFormationRequest) {
        throw new HttpError(404, 'No completed team formation found');
      }

      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          teamFormationRequestId: teamFormationRequest.id,
        },
      });

      if (!team) {
        throw new HttpError(404, 'Team not found');
      }

      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: assignment.courseId,
            studentId,
          },
        },
      });

      if (!enrollment) {
        throw new HttpError(400, 'Student is not enrolled in this course');
      }

      const existingMember = await prisma.teamMember.findFirst({
        where: {
          userId: studentId,
          team: {
            teamFormationRequestId: teamFormationRequest.id,
          },
        },
      });

      if (existingMember) {
        throw new HttpError(400, 'Student is already in a team');
      }

      await prisma.teamMember.create({
        data: {
          teamId,
          userId: studentId,
          assignedSkillIds: [],
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

export const DELETE = withRole<{ id: string; teamId: string }>(
  'TEACHER',
  async (req, ctx) => {
    try {
      const { id: assignmentId, teamId } = await ctx.params;

      const body = await req.json();
      const { studentId } = RemoveMemberSchema.parse(body);

      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        select: {
          id: true,
          courseId: true,
          course: { select: { dosenId: true } },
        },
      });

      if (!assignment) {
        throw new HttpError(404, 'Assignment not found');
      }

      if (assignment.course.dosenId !== ctx.user.id) {
        throw new HttpError(403, 'Unauthorized');
      }

      const teamFormationRequest = await prisma.teamFormationRequest.findFirst({
        where: {
          assignmentId,
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (!teamFormationRequest) {
        throw new HttpError(404, 'No completed team formation found');
      }

      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          teamFormationRequestId: teamFormationRequest.id,
        },
      });

      if (!team) {
        throw new HttpError(404, 'Team not found');
      }

      const member = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: studentId,
        },
      });

      if (!member) {
        throw new HttpError(404, 'Student is not a member of this team');
      }

      await prisma.teamMember.delete({
        where: { id: member.id },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
