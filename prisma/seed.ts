import { randomUUID } from 'node:crypto';
import type { Prisma } from '@/generated/prisma';
import prisma from '../src/lib/prisma';

type PersonalityQuestionSeed = {
  text: string;
  dimension: 'ei' | 'sn' | 'tf' | 'pj';
  orderHint: number;
  reversed?: boolean;
  isAttentionCheck?: boolean;
  locale?: string;
};

const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const ACTIVE_BANK_VERSION = 2;
const DEFAULT_LOCALE = 'en-US';

const personalityBank: PersonalityQuestionSeed[] = [
  // Questions adapted from the Open Extended Jungian Type Scales 1.2 (CC BY-NC-SA).
  {
    text: 'I rely on memory instead of making lists.',
    dimension: 'pj',
    orderHint: 1,
  },
  {
    text: 'I want to believe what people tell me.',
    dimension: 'tf',
    orderHint: 2,
    reversed: true,
  },
  {
    text: 'I need time alone to recharge.',
    dimension: 'ei',
    orderHint: 3,
    reversed: true,
  },
  {
    text: 'I feel unsatisfied with the way things are.',
    dimension: 'sn',
    orderHint: 4,
  },
  {
    text: 'I tend to put things wherever instead of keeping a tidy room.',
    dimension: 'pj',
    orderHint: 5,
  },
  {
    text: 'I strive to have a mechanical, logical mind.',
    dimension: 'tf',
    orderHint: 6,
  },
  {
    text: 'I am more mellow than energetic.',
    dimension: 'ei',
    orderHint: 7,
    reversed: true,
  },
  {
    text: 'I prefer essay questions over multiple choice tests.',
    dimension: 'sn',
    orderHint: 8,
  },
  {
    text: 'I keep things organized rather than chaotic.',
    dimension: 'pj',
    orderHint: 9,
    reversed: true,
  },
  {
    text: 'I am thick-skinned.',
    dimension: 'tf',
    orderHint: 10,
  },
  {
    text: 'I work best alone.',
    dimension: 'ei',
    orderHint: 11,
    reversed: true,
  },
  {
    text: 'I focus on the future more than the present.',
    dimension: 'sn',
    orderHint: 12,
  },
  {
    text: 'I plan at the last minute.',
    dimension: 'pj',
    orderHint: 13,
  },
  {
    text: 'I care more about being loved than being respected.',
    dimension: 'tf',
    orderHint: 14,
    reversed: true,
  },
  {
    text: 'Parties energize me.',
    dimension: 'ei',
    orderHint: 15,
  },
  {
    text: 'I like to stand out rather than fit in.',
    dimension: 'sn',
    orderHint: 16,
  },
  {
    text: 'I commit quickly instead of keeping my options open.',
    dimension: 'pj',
    orderHint: 17,
    reversed: true,
  },
  {
    text: 'I want to be good at fixing people more than fixing things.',
    dimension: 'tf',
    orderHint: 18,
    reversed: true,
  },
  {
    text: 'I listen more than I talk.',
    dimension: 'ei',
    orderHint: 19,
    reversed: true,
  },
  {
    text: 'When I describe an event, I explain what it meant to me.',
    dimension: 'sn',
    orderHint: 20,
  },
  {
    text: 'I tend to procrastinate.',
    dimension: 'pj',
    orderHint: 21,
  },
  {
    text: 'I follow my head more than my heart.',
    dimension: 'tf',
    orderHint: 22,
  },
  {
    text: 'I enjoy going out on the town.',
    dimension: 'ei',
    orderHint: 23,
  },
  {
    text: 'I want the details more than the big picture.',
    dimension: 'sn',
    orderHint: 24,
    reversed: true,
  },
  {
    text: 'I prefer to prepare rather than improvise.',
    dimension: 'pj',
    orderHint: 25,
    reversed: true,
  },
  {
    text: 'I base morality on compassion.',
    dimension: 'tf',
    orderHint: 26,
    reversed: true,
  },
  {
    text: 'Calling out to people from far away comes naturally to me.',
    dimension: 'ei',
    orderHint: 27,
  },
  {
    text: 'I am more empirical than theoretical.',
    dimension: 'sn',
    orderHint: 28,
    reversed: true,
  },
  {
    text: 'I like to play hard when the work is done.',
    dimension: 'pj',
    orderHint: 29,
  },
  {
    text: 'I value emotions, even when they are intense.',
    dimension: 'tf',
    orderHint: 30,
    reversed: true,
  },
  {
    text: 'I avoid speaking in front of large groups.',
    dimension: 'ei',
    orderHint: 31,
    reversed: true,
  },
  {
    text: 'I want to know why things happen.',
    dimension: 'sn',
    orderHint: 32,
  },
  // Attention check (excluded from scoring; instructs respondent to choose "Agree")
  {
    text: 'For quality control, please choose "Agree" for this statement.',
    dimension: 'ei',
    orderHint: 33,
    isAttentionCheck: true,
  },
];

const EXPECTED_REVERSED_COUNTS: Record<
  PersonalityQuestionSeed['dimension'],
  number
> = {
  ei: 5,
  sn: 2,
  tf: 5,
  pj: 3,
};

const DIMENSION_MAP: Record<
  PersonalityQuestionSeed['dimension'],
  'EI' | 'SN' | 'TF' | 'PJ'
> = {
  ei: 'EI',
  sn: 'SN',
  tf: 'TF',
  pj: 'PJ',
};

function validatePersonalityBank(items: PersonalityQuestionSeed[]): void {
  const perAxis: Record<
    'ei' | 'sn' | 'tf' | 'pj',
    { total: number; reversed: number }
  > = {
    ei: { total: 0, reversed: 0 },
    sn: { total: 0, reversed: 0 },
    tf: { total: 0, reversed: 0 },
    pj: { total: 0, reversed: 0 },
  };
  let attentionChecks = 0;

  for (const item of items) {
    if (item.isAttentionCheck) {
      attentionChecks += 1;
      continue;
    }
    const bucket = perAxis[item.dimension];
    bucket.total += 1;
    if (item.reversed) bucket.reversed += 1;
  }

  for (const [axis, bucket] of Object.entries(perAxis) as Array<
    [keyof typeof perAxis, { total: number; reversed: number }]
  >) {
    if (bucket.total !== 8) {
      throw new Error(
        `Axis ${axis.toUpperCase()} must have exactly 8 scored items; found ${bucket.total}`
      );
    }
    const expectedReversed = EXPECTED_REVERSED_COUNTS[axis];
    if (bucket.reversed !== expectedReversed) {
      throw new Error(
        `Axis ${axis.toUpperCase()} must have ${expectedReversed} reversed items; found ${bucket.reversed}`
      );
    }
  }

  if (attentionChecks !== 1) {
    throw new Error(
      `Expected exactly 1 attention check item, found ${attentionChecks}`
    );
  }
}

async function seedMBTIQuestions() {
  console.log('🌱 Starting MBTI questions seeding...');

  try {
    // Verify the new model exists on the client (ensure you ran prisma generate after schema change)
    const hasPQ = Boolean(prisma.personalityQuestion);
    if (!hasPQ) {
      console.error(
        '❌ prisma.personalityQuestion is undefined. Run `bun prisma generate` (and migrate) to update the client.'
      );
      throw new Error('Prisma client not generated for PersonalityQuestion');
    }

    validatePersonalityBank(personalityBank);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing MBTI questions from the dedicated table
      await tx.personalityQuestion.deleteMany({});

      console.log('✅ Cleared existing MBTI questions (personality_questions)');

      // Seed into PersonalityQuestion table (not Skills) - using OEJTS 1.2 English items
      const creations = personalityBank.map(q =>
        tx.personalityQuestion.create({
          data: withTimestamps({
            id: randomUUID(),
            bankVersion: ACTIVE_BANK_VERSION,
            status: 'ACTIVE',
            text: q.text,
            dimension: DIMENSION_MAP[q.dimension],
            orderHint: q.orderHint,
            reversed: q.reversed ?? false,
            isAttentionCheck: q.isAttentionCheck ?? false,
            locale: q.locale ?? DEFAULT_LOCALE,
          }),
          select: {
            id: true,
            text: true,
            orderHint: true,
            isAttentionCheck: true,
          },
        })
      );

      const created = await Promise.all(creations);
      console.log(`✅ Created ${created.length} MBTI questions`);
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(
      `   • ${personalityBank.length} personality items created (English, bank v${ACTIVE_BANK_VERSION})`
    );
    console.log(
      '\n💡 Questions are now stored in personality_questions, not skills.'
    );
  } catch (error) {
    console.error('❌ Error seeding MBTI questions:', error);
    throw error;
  }
}

async function seedDosenTokens() {
  console.log('🌱 Starting dosen token seeding...');

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clear existing dosen tokens and usage records
      try {
        await tx.dosenTokenUsage.deleteMany({});
        await tx.dosenToken.deleteMany({});
        console.log('✅ Cleared existing dosen tokens and usage records');
      } catch (_error) {
        // Tables might not exist yet, that's okay
        console.log('✅ No existing dosen tokens to clear (tables may be new)');
      }

      // Create single shared token for all dosen
      const sharedToken = `SONE-${Date.now()}`;

      const createdToken = await tx.dosenToken.create({
        data: withTimestamps({
          id: randomUUID(),
          token: sharedToken,
          description: 'Shared token for all dosen verification',
        }),
        select: {
          id: true,
          token: true,
          description: true,
        },
      });

      console.log(`✅ Created shared dosen token`);

      // Print token for admin reference
      console.log('\n🔐 Generated Dosen Token:');
      console.log(`   Token: ${createdToken.token}`);
      console.log('   (This token can be used by multiple dosen)');
    });

    console.log('🎉 Dosen token seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding dosen token:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedMBTIQuestions();
    // Dosen token seeding deprecated: replaced by institutional email domain verification
    // await seedDosenTokens();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution =
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module;

if (isDirectExecution) {
  void main();
}

export { seedMBTIQuestions, seedDosenTokens };
