import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient({
  datasourceUrl: process.env.PRISMA_POSTGRES_URL,
});

async function main() {
  const requests = await prisma.teamFormationRequest.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      ownerId: true,
      assignmentId: true,
      alpha: true,
      beta: true,
      gamma: true,
      delta: true,
      initRandom: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      errorMessage: true,
      requestData: true,
      responseData: true,
    },
  });

  console.log(`Found ${requests.length} team formation requests:`);
  console.log(JSON.stringify(requests, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
