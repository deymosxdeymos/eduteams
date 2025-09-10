import prisma from '../src/lib/prisma';
import { refreshQuestionsCache } from '../src/lib/mbti-questions';
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
  { text: 'You prefer groups to individuals.', dimension: 'ei', order: 1 },
  { text: 'You are sociable.', dimension: 'ei', order: 2 },
  { text: 'You are expressive.', dimension: 'ei', order: 3 },
  { text: 'You learn better by listening.', dimension: 'ei', order: 4, reversed: true },
  { text: 'You are talkative.', dimension: 'ei', order: 5 },
  { text: 'You enjoy meeting new people.', dimension: 'ei', order: 6 },
  // SN 7-12
  { text: 'You prefer theoretical subjects.', dimension: 'sn', order: 7 },
  { text: 'You prefer novel over traditional.', dimension: 'sn', order: 8 },
  { text: 'You prefer being curious.', dimension: 'sn', order: 9, reversed: true },
  { text: 'You prefer abstract over specific.', dimension: 'sn', order: 10 },
  { text: 'You notice patterns more than details.', dimension: 'sn', order: 11, reversed: true },
  { text: 'You prefer conceptual tasks.', dimension: 'sn', order: 12 },
  // TF 13-18
  { text: 'You think judges should be merciful.', dimension: 'tf', order: 13 },
  { text: 'You tend to be diplomatic.', dimension: 'tf', order: 14, reversed: true },
  { text: 'You rely on empathy when deciding.', dimension: 'tf', order: 15, reversed: true },
  { text: 'You prioritize fairness over harmony.', dimension: 'tf', order: 16 },
  { text: 'You value logic over emotions.', dimension: 'tf', order: 17, reversed: true },
  { text: 'You consider others’ feelings when judging.', dimension: 'tf', order: 18 },
  // PJ 19-24
  { text: 'You are systematic in your routines.', dimension: 'pj', order: 19 },
  { text: 'You prefer routine over variety.', dimension: 'pj', order: 20, reversed: true },
  { text: 'You work better under pressure.', dimension: 'pj', order: 21 },
  { text: 'You are methodical.', dimension: 'pj', order: 22, reversed: true },
  { text: 'You prefer open-ended activities.', dimension: 'pj', order: 23, reversed: true },
  { text: 'You like to plan ahead.', dimension: 'pj', order: 24 },
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

    await prisma.$transaction(async tx => {
      // Clear existing MBTI questions from the dedicated table
      await (tx as unknown as Record<string, any>).personalityQuestion?.deleteMany?.({});

      console.log('✅ Cleared existing MBTI questions (personality_questions)');

      // Seed into PersonalityQuestion table (not Skills)
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

    // Invalidate and refresh MBTI questions cache so UI picks up immediately
    try {
      await refreshQuestionsCache();
      console.log('🔄 MBTI questions cache refreshed');
    } catch (e) {
      console.warn('⚠️ Failed to refresh MBTI cache (will fall back to runtime refresh):', e);
    }

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    console.log(`   • ${mbtiQuestions.length} MBTI questions created`);
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
if (require.main === module) {
  main();
}

export { seedMBTIQuestions, seedDosenTokens };
