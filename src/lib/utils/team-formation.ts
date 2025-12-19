import prisma from '@/lib/prisma';

export async function getTeamFormationForAssignment(
  assignmentId: string,
  ownerId: string,
  assignmentStartAt?: Date | null
) {
  // First try to find team formation with assignmentId (new data)
  const teamFormation = await prisma.teamFormationRequest.findFirst({
    where: {
      assignmentId,
      ownerId,
      status: 'COMPLETED',
    },
    select: {
      id: true,
      responseData: true,
      teams: {
        select: {
          id: true,
          name: true,
          quality: true,
          members: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  personalityProfile: {
                    select: {
                      mbtiType: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (teamFormation) {
    return teamFormation;
  }

  // Fallback for legacy data: find the most recent completed team formation
  // for this user that doesn't have an assignmentId
  const legacyTeamFormation = await prisma.teamFormationRequest.findFirst({
    where: {
      ownerId,
      assignmentId: null,
      status: 'COMPLETED',
      createdAt: assignmentStartAt ? { gte: assignmentStartAt } : undefined,
    },
    select: {
      id: true,
      responseData: true,
      teams: {
        select: {
          id: true,
          name: true,
          quality: true,
          members: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  personalityProfile: {
                    select: {
                      mbtiType: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return legacyTeamFormation || null;
}
