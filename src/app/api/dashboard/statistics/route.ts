import type { NextRequest } from 'next/server';
import {
  createApiResponse,
  createErrorResponse,
  withAuth,
} from '@/lib/api-utils';
import { canAccessDosenFeatures } from '@/lib/authorization';
import { getDashboardStatisticsForUser } from '@/lib/dashboard/statistics';
import type { ExtendedUser } from '@/lib/types';

export const runtime = 'nodejs';

export const GET = withAuth(
  async (_request: NextRequest, { user }: { user: ExtendedUser }) => {
    if (!canAccessDosenFeatures(user)) {
      return createErrorResponse('Access denied', 403);
    }

    const statistics = await getDashboardStatisticsForUser(user.id);
    return createApiResponse(statistics);
  }
);
