import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

type MBTIQuestionData = {
  text: string;
  dimension: string;
  order: number;
};

const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mbtiQuestions: MBTIQuestionData[] = [
  {
    text: 'You think judges should be merciful.',
    dimension: 'tf',
    order: 0,
  },
  {
    text: 'You prefer open-ended activities.',
    dimension: 'pj',
    order: 1,
  },
  {
    text: 'You prefer novel over traditional.',
    dimension: 'sn',
    order: 2,
  },
  {
    text: 'You prefer groups to individuals.',
    dimension: 'ei',
    order: 3,
  },
  {
    text: 'You tend to be tolerant.',
    dimension: 'tf',
    order: 4,
  },
  {
    text: 'You work better under pressure.',
    dimension: 'pj',
    order: 5,
  },
  {
    text: 'You are methodical.',
    dimension: 'pj',
    order: 6,
  },
  {
    text: 'You prefer theoretical subjects.',
    dimension: 'sn',
    order: 7,
  },
  {
    text: 'You are sociable.',
    dimension: 'ei',
    order: 8,
  },
  {
    text: 'You prefer being curious.',
    dimension: 'sn',
    order: 9,
  },
  {
    text: 'You are expressive.',
    dimension: 'ei',
    order: 10,
  },
  {
    text: 'You tend to be diplomatic.',
    dimension: 'tf',
    order: 11,
  },
  {
    text: 'You prefer abstract over specific.',
    dimension: 'sn',
    order: 12,
  },
  {
    text: 'You are talkative.',
    dimension: 'ei',
    order: 13,
  },
  {
    text: 'You learn better by listening.',
    dimension: 'ei',
    order: 14,
  },
  {
    text: 'You prefer conceptual tasks.',
    dimension: 'sn',
    order: 15,
  },
  {
    text: 'You rely on empathy when deciding.',
    dimension: 'tf',
    order: 16,
  },
  {
    text: 'You prefer investigating over speculating.',
    dimension: 'sn',
    order: 17,
  },
  {
    text: 'You are systematic in your routines.',
    dimension: 'pj',
    order: 18,
  },
  {
    text: 'You prefer routine over variety.',
    dimension: 'pj',
    order: 19,
  },
];

async function seedMBTIQuestions() {
  console.log('🌱 Starting MBTI questions seeding...');

  try {
    await prisma.$transaction(async tx => {
      // Clear existing MBTI questions first
      await tx.skill.deleteMany({
        where: { name: { startsWith: 'MBTI' } },
      });
      console.log('✅ Cleared existing MBTI questions');

      // Create MBTI skills for the questions
      const skillCreationPromises = mbtiQuestions.map(questionData =>
        tx.skill.create({
          data: withTimestamps({
            id: randomUUID(),
            name: `MBTI Question ${questionData.order}`,
            description: `${questionData.text} (${questionData.dimension.toUpperCase()} dimension)`,
          }),
          select: {
            id: true,
            name: true,
            description: true,
          },
        })
      );

      const mbtiSkills = await Promise.all(skillCreationPromises);
      console.log(`✅ Created ${mbtiSkills.length} MBTI question skills`);
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   • ${mbtiQuestions.length} MBTI question skills created`);
    console.log(
      '\n💡 You can now use these MBTI questions in your personality test!'
    );
  } catch (error) {
    console.error('❌ Error seeding MBTI questions:', error);
    throw error;
  }
}

async function seedDosenTokens() {
  console.log('🌱 Starting dosen token seeding...');

  try {
    await prisma.$transaction(async tx => {
      // Clear existing dosen tokens and usage records
      try {
        await tx.dosenTokenUsage.deleteMany({});
        await tx.dosenToken.deleteMany({});
        console.log('✅ Cleared existing dosen tokens and usage records');
      } catch (error) {
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
    await seedDosenTokens();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedMBTIQuestions, seedDosenTokens };
