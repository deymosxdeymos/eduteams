import prisma from '../src/lib/prisma';
import { randomUUID } from 'crypto';

type MBTIQuestionData = {
  text: string;
  dimension: 'ei' | 'sn' | 'tf' | 'pj';
  order: number;
  reversed?: boolean;
};

const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mbtiQuestions: MBTIQuestionData[] = [
  // EI 1-6
  {
    text: 'Kamu lebih suka kelompok daripada individu.',
    dimension: 'ei',
    order: 1,
  },
  { text: 'Kamu lebih suka bersosialisasi.', dimension: 'ei', order: 2 },
  { text: 'Kamu ekspresif.', dimension: 'ei', order: 3 },
  {
    text: 'Kamu belajar lebih baik dengan mendengarkan.',
    dimension: 'ei',
    order: 4,
    reversed: true,
  },
  { text: 'Kamu banyak bicara.', dimension: 'ei', order: 5 },
  { text: 'Kamu senang bertemu orang baru.', dimension: 'ei', order: 6 },
  // SN 7-12
  {
    text: 'Kamu lebih suka mata pelajaran teoritis.',
    dimension: 'sn',
    order: 7,
  },
  {
    text: 'Kamu lebih suka yang baru daripada yang tradisional.',
    dimension: 'sn',
    order: 8,
  },
  {
    text: 'Kamu lebih suka menjadi penasaran.',
    dimension: 'sn',
    order: 9,
    reversed: true,
  },
  {
    text: 'Kamu lebih suka abstrak daripada spesifik.',
    dimension: 'sn',
    order: 10,
  },
  {
    text: 'Kamu memperhatikan pola lebih daripada detail.',
    dimension: 'sn',
    order: 11,
    reversed: true,
  },
  { text: 'Kamu lebih suka tugas konseptual.', dimension: 'sn', order: 12 },
  // TF 13-18
  {
    text: 'Kamu berpikir hakim harus bermurah hati.',
    dimension: 'tf',
    order: 13,
  },
  {
    text: 'Kamu cenderung diplomatis.',
    dimension: 'tf',
    order: 14,
    reversed: true,
  },
  {
    text: 'Kamu mengandalkan empati saat memutuskan.',
    dimension: 'tf',
    order: 15,
    reversed: true,
  },
  {
    text: 'Kamu memprioritaskan keadilan daripada harmoni.',
    dimension: 'tf',
    order: 16,
  },
  {
    text: 'Kamu menghargai logika daripada emosi.',
    dimension: 'tf',
    order: 17,
    reversed: true,
  },
  {
    text: 'Kamu mempertimbangkan perasaan orang lain saat menghakimi.',
    dimension: 'tf',
    order: 18,
  },
  // PJ 19-24
  { text: 'Kamu sistematis dalam rutinitas.', dimension: 'pj', order: 19 },
  {
    text: 'Kamu lebih suka rutinitas daripada variasi.',
    dimension: 'pj',
    order: 20,
    reversed: true,
  },
  {
    text: 'Kamu bekerja lebih baik di bawah tekanan.',
    dimension: 'pj',
    order: 21,
  },
  { text: 'Kamu metodis.', dimension: 'pj', order: 22, reversed: true },
  {
    text: 'Kamu lebih suka aktivitas terbuka.',
    dimension: 'pj',
    order: 23,
    reversed: true,
  },
  { text: 'Kamu suka merencanakan ke depan.', dimension: 'pj', order: 24 },
];

async function seedMBTIQuestions() {
  console.log('🌱 Starting MBTI questions seeding...');

  try {
    // Verify the new model exists on the client (ensure you ran prisma generate after schema change)
    const hasPQ = Boolean(
      (prisma as unknown as Record<string, any>).personalityQuestion
    );
    if (!hasPQ) {
      console.error(
        '❌ prisma.personalityQuestion is undefined. Run `bun prisma generate` (and migrate) to update the client.'
      );
      throw new Error('Prisma client not generated for PersonalityQuestion');
    }

    await prisma.$transaction(async (tx: any) => {
      // Clear existing MBTI questions from the dedicated table
      await (
        tx as unknown as Record<string, any>
      ).personalityQuestion?.deleteMany?.({});

      console.log('✅ Cleared existing MBTI questions (personality_questions)');

      // Seed into PersonalityQuestion table (not Skills) - using Indonesian questions
      const creations = mbtiQuestions.map(q =>
        (tx as unknown as Record<string, any>).personalityQuestion.create({
          data: withTimestamps({
            id: randomUUID(),
            text: q.text,
            dimension: q.dimension,
            order: q.order,
            reversed: q.reversed ?? false,
          }),
          select: { id: true, text: true, order: true },
        })
      );

      const created = await Promise.all(creations);
      console.log(`✅ Created ${created.length} MBTI questions`);
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(
      `   • ${mbtiQuestions.length} MBTI questions created (Indonesian)`
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
    await prisma.$transaction(async (tx: any) => {
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
    // Dosen token seeding deprecated: replaced by institutional email domain verification
    // await seedDosenTokens();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if ((require as any).main === module) {
  main();
}

export { seedMBTIQuestions, seedDosenTokens };
