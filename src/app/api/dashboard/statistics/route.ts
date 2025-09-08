import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';
import type { ExtendedUser } from '@/lib/types';

// Prisma requires Node.js runtime
export const runtime = 'nodejs';

// GET /api/dashboard/statistics
export const GET = withAuth(
  async (_request: NextRequest, { user }: { user: ExtendedUser }) => {
    try {
      const isDosen = canAccessDosenFeatures(user);

      if (!isDosen) {
        return createErrorResponse('Access denied', 403);
      }

      // Count total assignments created by this dosen across all their courses
      const totalAssignments = await prisma.assignment.count({
        where: {
          createdById: user.id,
        },
      });

      // Count total teams formed (for future use)
      const totalTeams = await prisma.team.count({
        where: {
          teamFormationRequest: {
            ownerId: user.id,
          },
        },
      });

      // Calculate average team quality (for future use)
      const avgTeamQuality = await prisma.team.aggregate({
        where: {
          teamFormationRequest: {
            ownerId: user.id,
          },
          quality: {
            not: null,
          },
        },
        _avg: {
          quality: true,
        },
      });

      const statistics = {
        totalAssignments,
        totalTeams,
        avgTeamQuality: avgTeamQuality._avg.quality ?? 0,
      };

      return createApiResponse(statistics);
    } catch (error) {
      return handleApiError(error);
    }
  }
);
