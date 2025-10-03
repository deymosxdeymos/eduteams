import prisma from '@/lib/prisma';

export interface MBTIQuestion {
  id: string;
  text: string;
  dimension: string;
  order: number;
  reversed?: boolean;
}

export async function getMBTIQuestions(): Promise<MBTIQuestion[]> {
  const questions = await prisma.personalityQuestion.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      text: true,
      dimension: true,
      order: true,
      reversed: true,
    },
  });

  return questions;
}
