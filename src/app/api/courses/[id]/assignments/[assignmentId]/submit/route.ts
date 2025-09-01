import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export const POST = withAuth<{ id: string; assignmentId: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: courseId, assignmentId } = await params;

      const isMahasiswa = canAccessMahasiswaFeatures(user);
      if (!isMahasiswa) {
        return createErrorResponse('Access denied', 403);
      }

      // Check if user is enrolled in the course
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: { courseId, studentId: user.id },
        },
      });

      if (!enrollment) {
        return createErrorResponse('Not enrolled in this course', 403);
      }

      // Check if assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId, courseId },
      });

      if (!assignment) {
        return createErrorResponse('Assignment not found', 404);
      }

      // Check if user has already submitted
      const existingSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: { assignmentId, studentId: user.id },
        },
      });

      if (existingSubmission) {
        return createErrorResponse('Already submitted', 400);
      }

      const body = await request.json();
      const { skillsAnswers, topicsAnswers } = body;

      // Validate the answers
      if (!skillsAnswers || !topicsAnswers) {
        return createErrorResponse('Missing answers', 400);
      }

      // Create the submission
      const submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: user.id,
        },
      });

      // For now, we'll just create the submission record
      // In a real implementation, you might want to store answers in separate tables

      return createApiResponse({
        success: true,
        submissionId: submission.id,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
