import { randomUUID } from 'node:crypto';
import type { Prisma } from '@/generated/prisma';
import prisma from '../src/lib/prisma';

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

const _ACTIVE_BANK_VERSION = 2;
const SUPPORTED_LOCALES = ['id-ID', 'en-US'] as const;

type BasePersonalityQuestion = Omit<PersonalityQuestionSeed, 'text' | 'locale'>;

const BASE_PERSONALITY_ITEMS: ReadonlyArray<BasePersonalityQuestion> = [
  { dimension: 'pj', orderHint: 1 },
  { dimension: 'tf', orderHint: 2 },
  { dimension: 'ei', orderHint: 3, reversed: true },
  { dimension: 'sn', orderHint: 4 },
  { dimension: 'pj', orderHint: 5 },
  { dimension: 'tf', orderHint: 6, reversed: true },
  { dimension: 'ei', orderHint: 7, reversed: true },
  { dimension: 'sn', orderHint: 8 },
  { dimension: 'pj', orderHint: 9, reversed: true },
  { dimension: 'tf', orderHint: 10, reversed: true },
  { dimension: 'ei', orderHint: 11, reversed: true },
  { dimension: 'sn', orderHint: 12 },
  { dimension: 'pj', orderHint: 13 },
  { dimension: 'tf', orderHint: 14 },
  { dimension: 'ei', orderHint: 15 },
  { dimension: 'sn', orderHint: 16 },
  { dimension: 'pj', orderHint: 17, reversed: true },
  { dimension: 'tf', orderHint: 18 },
  { dimension: 'ei', orderHint: 19, reversed: true },
  { dimension: 'sn', orderHint: 20 },
  { dimension: 'pj', orderHint: 21 },
  { dimension: 'tf', orderHint: 22, reversed: true },
  { dimension: 'ei', orderHint: 23 },
  { dimension: 'sn', orderHint: 24, reversed: true },
  { dimension: 'pj', orderHint: 25, reversed: true },
  { dimension: 'tf', orderHint: 26 },
  { dimension: 'ei', orderHint: 27 },
  { dimension: 'sn', orderHint: 28, reversed: true },
  { dimension: 'pj', orderHint: 29 },
  { dimension: 'tf', orderHint: 30 },
  { dimension: 'ei', orderHint: 31, reversed: true },
  { dimension: 'sn', orderHint: 32 },
  { dimension: 'ei', orderHint: 33, isAttentionCheck: true },
];

const PERSONALITY_TRANSLATIONS: Record<string, readonly string[]> = {
  'en-US': [
    'I rely on memory instead of making lists.',
    'I want to believe what people tell me.',
    'I need time alone to recharge.',
    'I feel unsatisfied with the way things are.',
    'I tend to put things wherever instead of keeping a tidy room.',
    'I strive to have a mechanical, logical mind.',
    'I am more mellow than energetic.',
    'I prefer essay questions over multiple choice tests.',
    'I keep things organized rather than chaotic.',
    'I am thick-skinned.',
    'I work best alone.',
    'I focus on the future more than the present.',
    'I plan at the last minute.',
    'I care more about being loved than being respected.',
    'Parties energize me.',
    'I like to stand out rather than fit in.',
    'I commit quickly instead of keeping my options open.',
    'I want to be good at fixing people more than fixing things.',
    'I listen more than I talk.',
    'When I describe an event, I explain what it meant to me.',
    'I tend to procrastinate.',
    'I follow my head more than my heart.',
    'I enjoy going out on the town.',
    'I want the details more than the big picture.',
    'I prefer to prepare rather than improvise.',
    'I base morality on compassion.',
    'Calling out to people from far away comes naturally to me.',
    'I am more empirical than theoretical.',
    'I like to play hard when the work is done.',
    'I value emotions, even when they are intense.',
    'I avoid speaking in front of large groups.',
    'I want to know why things happen.',
    'For quality control, please choose "Agree" for this statement.',
  ],
  'id-ID': [
    'Saya mengandalkan ingatan daripada bikin daftar.',
    'Saya percaya apa yang orang bilang ke saya.',
    'Saya butuh waktu sendiri untuk isi ulang energi.',
    'Saya gak puas dengan keadaan yang ada.',
    'Saya sering sembarangan letakin barang daripada jaga kamar tetap rapi.',
    'Saya lebih berpikir logis dan mekanis.',
    'Saya lebih santai daripada energik.',
    'Saya lebih suka soal esai daripada tes pilihan ganda.',
    'Saya selalu jaga barang tetap rapi daripada berantakan.',
    'Saya gak mudah tersinggung.',
    'Saya kerja paling baik pas sendirian.',
    'Saya lebih fokus ke masa depan daripada sekarang.',
    'Saya cenderung merencanakan di menit terakhir.',
    'Saya lebih pengen dicintai daripada dihormati.',
    'Pesta bikin saya excited.',
    'Saya lebih suka menonjol daripada menyesuaikan diri.',
    'Saya cepat berkomitmen daripada biarkan pilihan tetap terbuka.',
    'Saya lebih pengen mahir bantu orang daripada perbaiki barang.',
    'Saya lebih banyak dengarkan daripada bicara.',
    'Waktu cerita kejadian, saya jelasin maknanya buat saya.',
    'Saya cenderung menunda-nunda pekerjaan.',
    'Saya lebih ikut logika daripada perasaan.',
    'Saya suka keluar malam dan bergaul.',
    'Saya lebih pengen detail daripada gambaran besarnya.',
    'Saya lebih suka siap-siap daripada improvisasi.',
    'Saya dasarkan moralitas dari rasa kasih sayang.',
    'Saya gampang manggil orang dari jauh.',
    'Saya lebih empiris daripada teoretis.',
    'Saya kerja keras dan main keras setelah selesai.',
    'Saya hargai emosi, bahkan kalo dia intense.',
    'Saya hindari bicara depan kelompok besar.',
    'Saya pengen tahu kenapa sesuatu terjadi.',
    'Untuk kontrol kualitas, pilih "Setuju" untuk pernyataan ini ya.',
  ],
};

type OJTSPersonalityQuestion = Omit<PersonalityQuestionSeed, 'text' | 'locale'>;

const OJTS_V21_ITEMS: ReadonlyArray<OJTSPersonalityQuestion> = [
  { dimension: 'i', orderHint: 1 },
  { dimension: 'i', orderHint: 2 },
  { dimension: 'i', orderHint: 3 },
  { dimension: 'i', orderHint: 4 },
  { dimension: 'i', orderHint: 5 },
  { dimension: 'i', orderHint: 6 },
  { dimension: 's', orderHint: 7 },
  { dimension: 's', orderHint: 8 },
  { dimension: 's', orderHint: 9 },
  { dimension: 's', orderHint: 10 },
  { dimension: 's', orderHint: 11 },
  { dimension: 's', orderHint: 12 },
  { dimension: 'f', orderHint: 13 },
  { dimension: 'f', orderHint: 14 },
  { dimension: 'f', orderHint: 15 },
  { dimension: 'f', orderHint: 16 },
  { dimension: 'f', orderHint: 17 },
  { dimension: 'f', orderHint: 18 },
  { dimension: 'j', orderHint: 19 },
  { dimension: 'j', orderHint: 20 },
  { dimension: 'j', orderHint: 21 },
  { dimension: 'j', orderHint: 22 },
  { dimension: 'j', orderHint: 23 },
  { dimension: 'j', orderHint: 24 },
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
    'I enjoy large social events',
    'I am the first to act',
    'I express my views with confidence',
    'I want a huge social circle',
    'I am the life of the party',
    'I make lots of noise',
    'I focus on the here-and-now',
    'I am a concrete thinker',
    'I focus on the details',
    'I am a down-to-earth person',
    'I prefer routine to variety',
    'I am a practical person',
    'I sympathize with the homeless',
    'I believe that people are good',
    'I am a romantic',
    'I value feelings over logic',
    'I cry during movies',
    'I avoid stepping on bugs',
    'I like order',
    'I follow a schedule',
    'I am always prepared',
    'I get things done right away',
    'I make plans and stick to them',
    'I like things settled',
    'I think about the future',
    'I like to set long-term goals',
    'I see the big picture',
    'I think anything is possible',
    'I like established ways of doing things',
    'I respect traditions',
    'I enjoy the moment',
    'I am spontaneous',
    'I have a big heart',
    'I show my feelings',
    'I am assertive',
    'I take charge',
    'I listen to my conscience',
    "I think about others' feelings",
    'I analyze problems',
    'I think before I speak',
    'For quality control, please choose "Agree" for this statement.',
  ],
  'id-ID': [
    'Saya suka acara kumpul-kumpul yang ramai',
    'Saya orang yang pertama bertindak',
    'Saya ungkapkan pendapat dengan percaya diri',
    'Saya ingin punya banyak teman',
    'Saya adalah pusat perhatian di acara kumpul-kumpul',
    'Saya orangnya ramai',
    'Saya fokus pada saat ini',
    'Saya berpikir secara konkret',
    'Saya fokus pada detailnya',
    'Saya orang yang realistis',
    'Saya lebih suka rutinitas daripada variasi',
    'Saya orang yang praktis',
    'Saya simpatik dengan tunawisma',
    'Saya percaya bahwa orang itu baik',
    'Saya orang yang romantis',
    'Saya lebih menghargai perasaan daripada logika',
    'Saya menangis saat nonton film',
    'Saya hindari menginjak serangga',
    'Saya suka keteraturan',
    'Saya ikuti jadwal',
    'Saya selalu siap',
    'Saya langsung selesaikan sesuatu',
    'Saya buat rencana dan patuhi rencana itu',
    'Saya suka hal yang sudah jelas',
    'Saya berpikir tentang masa depan',
    'Saya suka membuat tujuan jangka panjang',
    'Saya lihat gambaran besarnya',
    'Saya pikir semuanya mungkin terjadi',
    'Saya suka cara yang sudah mapan',
    'Saya menghormati tradisi',
    'Saya nikmati momen saat ini',
    'Saya spontan',
    'Saya punya hati yang besar',
    'Saya tunjukkan perasaan saya',
    'Saya tegas',
    'Saya ambil kendali',
    'Saya dengarkan hati nurani',
    'Saya pikirkan perasaan orang lain',
    'Saya analisis masalah',
    'Saya berpikir sebelum bicara',
    'Untuk kontrol kualitas, pilih "Setuju" untuk pernyataan ini ya.',
  ],
};

const EXPECTED_REVERSED_COUNTS: Partial<
  Record<PersonalityQuestionSeed['dimension'], number>
> = {
  ei: 5,
  sn: 2,
  tf: 3,
  pj: 3,
};

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

function validatePersonalityBankStructure(
  items: ReadonlyArray<BasePersonalityQuestion>
): void {
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
    if (item.dimension in perAxis) {
      const bucket = perAxis[item.dimension as keyof typeof perAxis];
      bucket.total += 1;
      if (item.reversed) bucket.reversed += 1;
    }
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

function buildLocalizedBank(locale: string): PersonalityQuestionSeed[] {
  const texts = PERSONALITY_TRANSLATIONS[locale];
  if (!texts) {
    throw new Error(`Missing translations for locale "${locale}"`);
  }

  if (texts.length !== BASE_PERSONALITY_ITEMS.length) {
    throw new Error(
      `Locale "${locale}" must provide ${BASE_PERSONALITY_ITEMS.length} translations, found ${texts.length}`
    );
  }

  return BASE_PERSONALITY_ITEMS.map((item, index) => ({
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

    validatePersonalityBankStructure(BASE_PERSONALITY_ITEMS);
    validateOJTSStructure(OJTS_V21_ITEMS);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.personalityQuestion.deleteMany({});

      console.log('✅ Cleared existing MBTI questions (personality_questions)');

      const v2Creations = SUPPORTED_LOCALES.flatMap(locale => {
        const localizedBank = buildLocalizedBank(locale);
        return localizedBank.map(q =>
          tx.personalityQuestion.create({
            data: withTimestamps({
              id: randomUUID(),
              bankVersion: 2,
              status: 'ACTIVE',
              text: q.text,
              dimension: DIMENSION_MAP[q.dimension],
              orderHint: q.orderHint,
              reversed: q.reversed ?? false,
              isAttentionCheck: q.isAttentionCheck ?? false,
              locale: q.locale,
            }),
            select: {
              id: true,
              text: true,
              orderHint: true,
              locale: true,
              isAttentionCheck: true,
            },
          })
        );
      });

      const v3Creations = SUPPORTED_LOCALES.flatMap(locale => {
        const ojtsBank = buildOJTSBank(locale);
        return ojtsBank.map(q =>
          tx.personalityQuestion.create({
            data: withTimestamps({
              id: randomUUID(),
              bankVersion: 3,
              status: 'ACTIVE',
              text: q.text,
              dimension: DIMENSION_MAP[q.dimension],
              orderHint: q.orderHint,
              reversed: q.reversed ?? false,
              isAttentionCheck: q.isAttentionCheck ?? false,
              locale: q.locale,
            }),
            select: {
              id: true,
              text: true,
              orderHint: true,
              locale: true,
              isAttentionCheck: true,
            },
          })
        );
      });

      const created = await Promise.all([...v2Creations, ...v3Creations]);
      console.log(
        `✅ Created ${created.length} MBTI questions across ${SUPPORTED_LOCALES.length} locales (v2 + v3)`
      );
    });

    console.log('🎉 MBTI questions seeding completed successfully!');
    console.log('\n📊 Seeding Summary:');
    for (const locale of SUPPORTED_LOCALES) {
      console.log(
        `   • ${locale}: ${BASE_PERSONALITY_ITEMS.length} items (bank v2), ${OJTS_V21_ITEMS.length} items (bank v3)`
      );
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
