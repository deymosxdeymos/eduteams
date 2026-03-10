import type {
  Prisma,
  TeamFormationProvider as PrismaTeamFormationProvider,
} from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type {
  BuiltTeamFormationPayload,
  PersistedTeamFormationRequest,
  TeamFormationProviderName,
} from './types';

export const STUCK_TEAM_FORMATION_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;

export function toPrismaTeamFormationProvider(
  provider: TeamFormationProviderName
): PrismaTeamFormationProvider {
  return provider === 'local' ? 'LOCAL' : 'EDU2COM';
}

function fromPrismaTeamFormationProvider(
  provider: PrismaTeamFormationProvider
): TeamFormationProviderName {
  return provider === 'LOCAL' ? 'local' : 'edu2com';
}

function toPersistedRequest(record: {
  id: string;
  ownerId: string;
  assignmentId: string | null;
  provider: PrismaTeamFormationProvider;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  replyPostUrl: string | null;
}): PersistedTeamFormationRequest {
  return {
    id: record.id,
    ownerId: record.ownerId,
    assignmentId: record.assignmentId,
    provider: fromPrismaTeamFormationProvider(record.provider),
    status: record.status,
    replyPostUrl: record.replyPostUrl,
  };
}

export async function createTeamFormationRequest(args: {
  id: string;
  ownerId: string;
  assignmentId: string;
  provider: TeamFormationProviderName;
  builtPayload: BuiltTeamFormationPayload;
  replyPostUrl?: string | null;
}): Promise<PersistedTeamFormationRequest> {
  const record = await prisma.teamFormationRequest.create({
    data: {
      id: args.id,
      ownerId: args.ownerId,
      assignmentId: args.assignmentId,
      provider: toPrismaTeamFormationProvider(args.provider),
      status: 'PENDING',
      alpha: args.builtPayload.weights.alpha,
      beta: args.builtPayload.weights.beta,
      gamma: args.builtPayload.weights.gamma,
      delta: args.builtPayload.weights.delta,
      initRandom: args.builtPayload.initRandom,
      requestData: args.builtPayload.requestData as unknown as Prisma.InputJsonValue,
      replyPostUrl: args.replyPostUrl ?? null,
    },
    select: {
      id: true,
      ownerId: true,
      assignmentId: true,
      provider: true,
      status: true,
      replyPostUrl: true,
    },
  });

  return toPersistedRequest(record);
}

export async function markTeamFormationRequestProcessing(
  requestId: string,
  options: { replyPostUrl?: string | null } = {}
): Promise<PersistedTeamFormationRequest> {
  const record = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedRequest = await tx.teamFormationRequest.update({
      where: { id: requestId },
      data: {
        status: 'PROCESSING',
        errorMessage: null,
        completedAt: null,
        replyPostUrl:
          options.replyPostUrl === undefined ? undefined : options.replyPostUrl,
      },
      select: {
        id: true,
        ownerId: true,
        assignmentId: true,
        provider: true,
        status: true,
        replyPostUrl: true,
      },
    });

    if (updatedRequest.assignmentId) {
      await tx.assignment.update({
        where: { id: updatedRequest.assignmentId },
        data: { status: 'MENUNGGU' },
      });
    }

    return updatedRequest;
  });

  return toPersistedRequest(record);
}

export async function markTeamFormationRequestFailed(
  requestId: string,
  errorMessage: string
): Promise<void> {
  const existing = await prisma.teamFormationRequest.findUnique({
    where: { id: requestId },
    select: { status: true },
  });

  if (!existing || existing.status === 'COMPLETED') {
    return;
  }

  await prisma.teamFormationRequest.update({
    where: { id: requestId },
    data: {
      status: 'FAILED',
      errorMessage: errorMessage.slice(0, 250),
      completedAt: new Date(),
    },
  });
}

export async function cleanupStaleTeamFormationRequests(
  assignmentId: string,
  errorMessage: string = 'Permintaan otomatis gagal karena tidak ada respons dari Edu2com dalam batas waktu.'
) {
  const now = new Date();
  const staleCutoff = new Date(
    now.getTime() - STUCK_TEAM_FORMATION_REQUEST_TIMEOUT_MS
  );

  return prisma.teamFormationRequest.updateMany({
    where: {
      assignmentId,
      status: { in: ['PENDING', 'PROCESSING'] },
      updatedAt: { lt: staleCutoff },
    },
    data: {
      status: 'FAILED',
      errorMessage,
      completedAt: now,
    },
  });
}

export async function getLatestTeamFormationRequestForAssignment(
  assignmentId: string
) {
  return prisma.teamFormationRequest.findFirst({
    where: { assignmentId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      errorMessage: true,
      provider: true,
    },
  });
}

export async function getInFlightTeamFormationRequestForAssignment(
  assignmentId: string
) {
  return prisma.teamFormationRequest.findFirst({
    where: {
      assignmentId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    select: { id: true },
  });
}
