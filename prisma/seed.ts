import { randomUUID } from 'node:crypto';
import type { Prisma } from '@/generated/prisma';
import prisma from '@/lib/prisma';

type PersonalityQuestionSeed = {
  text: string;
  dimension:
    | 'ei'
    | 'sn'
    | 'tf'
    | 'pj'
    | 'i'
    | 'e'
    | 's'
    | 'n'
    | 'f'
    | 't'
    | 'j'
    | 'p'
    | 'nj'
    | 'np'
    | 'sj'
    | 'sp'
    | 'ef'
    | 'et'
    | 'if'
    | 'it';
  orderHint: number;
  reversed?: boolean;
  isAttentionCheck?: boolean;
  locale: string;
};

const withTimestamps = <T extends object>(data: T) => ({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const SUPPORTED_LOCALES = ['id-ID', 'en-US'] as const;

type OJTSPersonalityQuestion = Omit<PersonalityQuestionSeed, 'text' | 'locale'>;

const OJTS_V21_ITEMS: ReadonlyArray<OJTSPersonalityQuestion> = [
  { dimension: 'i', orderHint: 1 },
  { dimension: 'i', orderHint: 2 },
  { dimension: 'i', orderHint: 3 },
  { dimension: 'i', orderHint: 4, reversed: true },
  { dimension: 'i', orderHint: 5, reversed: true },
  { dimension: 'i', orderHint: 6, reversed: true },
  { dimension: 's', orderHint: 7 },
  { dimension: 's', orderHint: 8 },
  { dimension: 's', orderHint: 9 },
  { dimension: 's', orderHint: 10, reversed: true },
  { dimension: 's', orderHint: 11, reversed: true },
  { dimension: 's', orderHint: 12, reversed: true },
  { dimension: 'f', orderHint: 13 },
  { dimension: 'f', orderHint: 14 },
  { dimension: 'f', orderHint: 15 },
  { dimension: 'f', orderHint: 16, reversed: true },
  { dimension: 'f', orderHint: 17, reversed: true },
  { dimension: 'f', orderHint: 18, reversed: true },
  { dimension: 'j', orderHint: 19 },
  { dimension: 'j', orderHint: 20 },
  { dimension: 'j', orderHint: 21 },
  { dimension: 'j', orderHint: 22, reversed: true },
  { dimension: 'j', orderHint: 23, reversed: true },
  { dimension: 'j', orderHint: 24, reversed: true },
  { dimension: 'nj', orderHint: 25 },
  { dimension: 'nj', orderHint: 26 },
  { dimension: 'np', orderHint: 27 },
  { dimension: 'np', orderHint: 28 },
  { dimension: 'sj', orderHint: 29 },
  { dimension: 'sj', orderHint: 30 },
  { dimension: 'sp', orderHint: 31 },
  { dimension: 'sp', orderHint: 32 },
  { dimension: 'ef', orderHint: 33 },
  { dimension: 'ef', orderHint: 34 },
  { dimension: 'et', orderHint: 35 },
  { dimension: 'et', orderHint: 36 },
  { dimension: 'if', orderHint: 37 },
  { dimension: 'if', orderHint: 38 },
  { dimension: 'it', orderHint: 39 },
  { dimension: 'it', orderHint: 40 },
  { dimension: 'ei', orderHint: 41, isAttentionCheck: true },
];

const OJTS_V21_TRANSLATIONS: Record<string, readonly string[]> = {
  'en-US': [
    "I don't like to draw attention to myself",
    'I hate situations where people expect me to be funny',
    'I hold back my opinions',
    'I want a huge social circle',
    'I am the life of the party',
    'I make lots of noise',
    'I avoid philosophical discussions',
    "I don't like to analyze literature",
    'I am attached to conventional ways',
    'I love to read challenging material',
    'I look for hidden meanings in things',
    'I am curious about everything',
    'I want to experience passion and romance',
    "I am deeply moved by others' misfortunes",
    'I listen to my feelings when making important decisions',
    'I prize logic above all else',
    "I don't understand people who get emotional",
    "I'd rather be feared than loved",
    'I like order',
    'I do things according to a plan',
    'I am always prepared',
    'I often make last-minute plans',
    'I do things for no apparent reason',
    'It takes me days to do things that should take hours because I keep getting distracted',
    'I work on improving myself',
    'I always feel like I need to be doing something important',
    'I have unusual beliefs about the world',
    'I dislike routine',
    'I try my best to follow the rules',
    'I respect authority',
    'I like to take it easy',
    'I choose the easy way',
    'I tell other people my secrets',
    'I make big gestures of friendship to people',
    'I enjoy challenges and competition',
    'I have very high self-esteem',
    'I get embarrassed easily',
    'I become overwhelmed by events',
    'I have difficulty expressing my feelings',
    "I don't trust others easily",
    'For quality control, please choose "Agree" for this statement.',
  ],
  'id-ID': [
    'Saya tidak suka menjadi pusat perhatian',
    'Saya tidak suka situasi dimana orang berharap saya lucu',
    'Saya sering menahan pendapat saya',
    'Saya ingin memiliki banyak teman',
    'Saya sering menjadi pusat perhatian di pesta',
    'Saya sering membuat keributan',
    'Saya menghindari diskusi filosofis',
    'Saya tidak suka menganalisis karya sastra',
    'Saya lebih nyaman dengan cara-cara konvensional',
    'Saya suka membaca bacaan yang menantang',
    'Saya selalu mencari makna tersembunyi dari sesuatu',
    'Saya penasaran dengan segala hal',
    'Saya ingin merasakan gairah dan romansa',
    'Saya sangat tersentuh melihat kesulitan orang lain',
    'Saya mendengarkan perasaan saat mengambil keputusan penting',
    'Saya mengutamakan logika di segala hal',
    'Saya tidak mengerti orang yang mudah terbawa emosi',
    'Lebih baik ditakuti daripada dicintai',
    'Saya suka keadaan yang teratur',
    'Saya melakukan sesuatu sesuai rencana',
    'Saya selalu siap siaga',
    'Saya sering membuat rencana mendadak',
    'Saya kerap melakukan sesuatu tanpa alasan yang jelas',
    'Saya butuh berhari-hari untuk menyelesaikan pekerjaan yang seharusnya selesai dalam sejam karena mudah kehilangan fokus.',
    'Saya selalu berusaha untuk menjadi lebih baik',
    'Saya selalu merasa harus melakukan sesuatu yang penting',
    'Saya memiliki keyakinan yang tidak biasa tentang dunia',
    'Saya tidak suka rutinitas',
    'Saya berusaha sebaik mungkin untuk taat pada aturan',
    'Saya menghormati pihak berwenang',
    'Saya suka bersantai-santai',
    'Saya memilih jalan termudah',
    'Saya menceritakan rahasia saya pada orang lain',
    'Saya menunjukkan persahabatan secara berlebihan',
    'Saya menikmati tantangan dan persaingan',
    'Saya memiliki percaya diri yang sangat tinggi',
    'Saya mudah merasa malu',
    'Saya mudah kewalahan menghadapi situasi',
    'Saya kesulitan mengungkapkan perasaan',
    'Saya tidak mudah percaya pada orang lain',
    'Untuk kontrol kualitas, pilih "Setuju" untuk pernyataan ini.',
  ],
};

const OJTS_REQUIRED_REVERSED_ORDER_HINTS = new Set([
  4, 5, 6, 10, 11, 12, 16, 17, 18, 22, 23, 24,
]);
const DIMENSION_MAP: Record<
  PersonalityQuestionSeed['dimension'],
  | 'EI'
  | 'SN'
  | 'TF'
  | 'PJ'
  | 'I'
  | 'E'
  | 'S'
  | 'N'
  | 'F'
  | 'T'
  | 'J'
  | 'P'
  | 'NJ'
  | 'NP'
  | 'SJ'
  | 'SP'
  | 'EF'
  | 'ET'
  | 'IF'
  | 'IT'
> = {
  ei: 'EI',
  sn: 'SN',
  tf: 'TF',
  pj: 'PJ',
  i: 'I',
  e: 'E',
  s: 'S',
  n: 'N',
  f: 'F',
  t: 'T',
  j: 'J',
  p: 'P',
  nj: 'NJ',
  np: 'NP',
  sj: 'SJ',
  sp: 'SP',
  ef: 'EF',
  et: 'ET',
  if: 'IF',
  it: 'IT',
};
function validateOJTSStructure(
  items: ReadonlyArray<OJTSPersonalityQuestion>
): void {
  const perAxis: Partial<Record<string, number>> = {};
  let attentionChecks = 0;

  for (const item of items) {
    if (item.isAttentionCheck) {
      attentionChecks += 1;
      continue;
    }
    if (
      OJTS_REQUIRED_REVERSED_ORDER_HINTS.has(item.orderHint) &&
      !item.reversed
    ) {
      throw new Error(
        `OJTS item with orderHint ${item.orderHint} must be marked reversed`
      );
    }
    perAxis[item.dimension] = (perAxis[item.dimension] || 0) + 1;
  }

  if (attentionChecks !== 1) {
    throw new Error(
      `Expected exactly 1 attention check item, found ${attentionChecks}`
    );
  }
}

function buildOJTSBank(locale: string): PersonalityQuestionSeed[] {
  const texts = OJTS_V21_TRANSLATIONS[locale];
  if (!texts) {
    throw new Error(`Missing OJTS translations for locale "${locale}"`);
  }

  if (texts.length !== OJTS_V21_ITEMS.length) {
    throw new Error(
      `Locale "${locale}" must provide ${OJTS_V21_ITEMS.length} translations, found ${texts.length}`
    );
  }

  return OJTS_V21_ITEMS.map((item, index) => ({
    ...item,
    text: texts[index],
    locale,
  }));
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

    validateOJTSStructure(OJTS_V21_ITEMS);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const deleted = await tx.personalityQuestion.deleteMany({
        where: { bankVersion: 4 },
      });
      if (deleted > 0) {
        console.log(
          `ℹ️ Removed ${deleted} existing OJTS questions (bank v4) before reseeding`
        );
      }

      let createdCount = 0;
      for (const locale of SUPPORTED_LOCALES) {
        const ojtsBank = buildOJTSBank(locale);
        for (const q of ojtsBank) {
          await tx.personalityQuestion.create({
            data: withTimestamps({
              id: randomUUID(),
              bankVersion: 4,
              status: 'ACTIVE',
              text: q.text,
              dimension: DIMENSION_MAP[q.dimension],
              orderHint: q.orderHint,
              reversed: q.reversed ?? false,
              isAttentionCheck: q.isAttentionCheck ?? false,
              locale: q.locale,
            }),
          });
          createdCount += 1;
        }
      }

      console.log('✅ Seeded OJTS personality bank (v4)');
      console.log(
        `✅ Created ${createdCount} MBTI questions across ${SUPPORTED_LOCALES.length} locales (v4)`
      );
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    for (const locale of SUPPORTED_LOCALES) {
      console.log(`   • ${locale}: ${OJTS_V21_ITEMS.length} items (bank v4)`);
    }
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
  (typeof require !== 'undefined' &&
    typeof module !== 'undefined' &&
    require.main === module) ||
  (typeof import.meta !== 'undefined' && import.meta.main);

if (isDirectExecution) {
  void main();
}

export { seedMBTIQuestions, seedDosenTokens };
