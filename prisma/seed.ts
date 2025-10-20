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

const ACTIVE_BANK_VERSION = 1;
const DEFAULT_LOCALE = 'id-ID';

const personalityBank: PersonalityQuestionSeed[] = [
  // EI (positive toward E; reversed items favor I)
  {
    text: 'Saya berenergi saat berada di keramaian.',
    dimension: 'ei',
    orderHint: 1,
  },
  {
    text: 'Saya cepat akrab dengan orang baru.',
    dimension: 'ei',
    orderHint: 2,
  },
  {
    text: 'Saya nyaman memimpin diskusi.',
    dimension: 'ei',
    orderHint: 3,
  },
  {
    text: 'Saya sering berpikir sambil berbicara.',
    dimension: 'ei',
    orderHint: 4,
  },
  {
    text: 'Saya butuh waktu sendiri untuk mengisi ulang.',
    dimension: 'ei',
    orderHint: 5,
    reversed: true,
  },
  {
    text: 'Saya lebih suka percakapan satu lawan satu.',
    dimension: 'ei',
    orderHint: 6,
    reversed: true,
  },
  {
    text: 'Saya menulis dulu sebelum bicara dalam rapat.',
    dimension: 'ei',
    orderHint: 7,
    reversed: true,
  },
  {
    text: 'Saya memilih mengamati sebelum ikut terlibat.',
    dimension: 'ei',
    orderHint: 8,
    reversed: true,
  },
  // SN (positive toward S; reversed favor N)
  {
    text: 'Saya fokus pada fakta yang bisa diamati.',
    dimension: 'sn',
    orderHint: 9,
  },
  {
    text: 'Instruksi langkah demi langkah membantu saya.',
    dimension: 'sn',
    orderHint: 10,
  },
  {
    text: 'Saya mempercayai pengalaman langsung.',
    dimension: 'sn',
    orderHint: 11,
  },
  {
    text: 'Saya teliti pada detail teknis.',
    dimension: 'sn',
    orderHint: 12,
  },
  {
    text: 'Saya melihat pola besar lebih dari detail.',
    dimension: 'sn',
    orderHint: 13,
    reversed: true,
  },
  {
    text: 'Saya menikmati ide dan kemungkinan.',
    dimension: 'sn',
    orderHint: 14,
    reversed: true,
  },
  {
    text: 'Saya tertarik pada teori dibanding contoh konkret.',
    dimension: 'sn',
    orderHint: 15,
    reversed: true,
  },
  {
    text: 'Saya suka membayangkan seperti apa masa depan.',
    dimension: 'sn',
    orderHint: 16,
    reversed: true,
  },
  // TF (positive toward T; reversed favor F)
  {
    text: 'Saya mengutamakan logika saat mengambil keputusan.',
    dimension: 'tf',
    orderHint: 17,
  },
  {
    text: 'Kritik langsung itu bermanfaat.',
    dimension: 'tf',
    orderHint: 18,
  },
  {
    text: 'Aturan membantu keputusan menjadi adil.',
    dimension: 'tf',
    orderHint: 19,
  },
  {
    text: 'Saya memisahkan fakta dari perasaan ketika menilai.',
    dimension: 'tf',
    orderHint: 20,
  },
  {
    text: 'Saya mempertimbangkan dampak pada orang lain.',
    dimension: 'tf',
    orderHint: 21,
    reversed: true,
  },
  {
    text: 'Keharmonisan tim lebih penting daripada “siapa benar”.',
    dimension: 'tf',
    orderHint: 22,
    reversed: true,
  },
  {
    text: 'Keputusan terasa salah jika melukai seseorang.',
    dimension: 'tf',
    orderHint: 23,
    reversed: true,
  },
  {
    text: 'Saya peka terhadap emosi orang di sekitar.',
    dimension: 'tf',
    orderHint: 24,
    reversed: true,
  },
  // PJ (positive toward P; reversed favor J)
  {
    text: 'Saya fleksibel terhadap rencana.',
    dimension: 'pj',
    orderHint: 25,
  },
  {
    text: 'Saya nyaman dengan perubahan mendadak.',
    dimension: 'pj',
    orderHint: 26,
  },
  {
    text: 'Saya menunda keputusan sampai informasi cukup.',
    dimension: 'pj',
    orderHint: 27,
  },
  {
    text: 'Saya mengeksplor beberapa opsi sebelum memilih.',
    dimension: 'pj',
    orderHint: 28,
  },
  {
    text: 'Saya suka jadwal yang jelas.',
    dimension: 'pj',
    orderHint: 29,
    reversed: true,
  },
  {
    text: 'Saya menutup tugas jauh sebelum tenggat.',
    dimension: 'pj',
    orderHint: 30,
    reversed: true,
  },
  {
    text: 'Saya membuat daftar tugas dan mengikutinya.',
    dimension: 'pj',
    orderHint: 31,
    reversed: true,
  },
  {
    text: 'Saya tidak nyaman ketika rencana berubah.',
    dimension: 'pj',
    orderHint: 32,
    reversed: true,
  },
  // Attention check (excluded from scoring; instructs respondent to choose "Setuju")
  {
    text: 'Untuk kualitas data, pilih jawaban "Setuju" untuk pernyataan ini.',
    dimension: 'ei',
    orderHint: 33,
    isAttentionCheck: true,
  },
];

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
    if (bucket.reversed !== 4) {
      throw new Error(
        `Axis ${axis.toUpperCase()} must have 4 reversed items; found ${bucket.reversed}`
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

      // Seed into PersonalityQuestion table (not Skills) - using Indonesian questions
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
      `   • ${personalityBank.length} personality items created (Indonesian, bank v${ACTIVE_BANK_VERSION})`
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
