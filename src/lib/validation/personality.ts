import { z } from 'zod';

const MBTI_TYPES = [
  'ENFJ',
  'ENFP',
  'ENTJ',
  'ENTP',
  'ESFJ',
  'ESFP',
  'ESTJ',
  'ESTP',
  'INFJ',
  'INFP',
  'INTJ',
  'INTP',
  'ISFJ',
  'ISFP',
  'ISTJ',
  'ISTP',
] as const;

const _PERSONALITY_DIMENSIONS = ['ei', 'sn', 'tf', 'pj'] as const;

const PersonalityScoreSchema = z
  .number()
  .min(-1.0, 'Personality score must be between -1.0 and 1.0')
  .max(1.0, 'Personality score must be between -1.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Personality score must be a valid number')
  .refine(val => Number.isFinite(val), 'Personality score must be finite');

export const MBTITypeSchema = z.enum(MBTI_TYPES, {
  message: 'Invalid MBTI type. Must be one of the 16 valid types.',
});

export const PersonalityScoresSchema = z
  .object({
    ei: PersonalityScoreSchema,
    sn: PersonalityScoreSchema,
    tf: PersonalityScoreSchema,
    pj: PersonalityScoreSchema,
  })
  .strict();

const PartialPersonalityScoresSchema = z
  .object({
    ei: PersonalityScoreSchema.optional(),
    sn: PersonalityScoreSchema.optional(),
    tf: PersonalityScoreSchema.optional(),
    pj: PersonalityScoreSchema.optional(),
  })
  .strict();

const AnswerRecordSchema = z
  .record(
    z.string().regex(/^\d+$/, 'Question ID must be a number'),
    z
      .number()
      .int('Answer must be an integer')
      .min(1, 'Answer must be between 1 and 5')
      .max(5, 'Answer must be between 1 and 5')
  )
  .refine(answers => {
    const questionIds = Object.keys(answers);
    return questionIds.every(id => {
      const num = parseInt(id, 10);
      return num >= 1 && num <= 24;
    });
  }, 'All question IDs must be between 1 and 24');

const PersonalityMetadataSchema = z
  .object({
    testVersion: z.string().optional(),
    completedAt: z.string().datetime().optional(),
    duration: z.number().min(0).optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    sessionId: z.string().optional(),
  })
  .strict();

const PersonalityDataSchema = z
  .object({
    answers: AnswerRecordSchema.optional(),
    scores: PersonalityScoresSchema.optional(),
    metadata: PersonalityMetadataSchema.optional(),
  })
  .strict()
  .refine(data => {
    return Object.keys(data).length > 0;
  }, 'PersonalityData must contain at least one field (answers, scores, or metadata)');

const CompletePersonalityDataSchema = z
  .object({
    answers: AnswerRecordSchema,
    scores: PersonalityScoresSchema,
    metadata: PersonalityMetadataSchema.optional(),
  })
  .strict();

export const UserPersonalityUpdateSchema = z
  .object({
    ei: PersonalityScoreSchema.optional(),
    sn: PersonalityScoreSchema.optional(),
    tf: PersonalityScoreSchema.optional(),
    pj: PersonalityScoreSchema.optional(),
    mbtiType: MBTITypeSchema.optional(),
    personalityData: PersonalityDataSchema.optional(),
  })
  .strict()
  .refine(data => {
    const { ei, sn, tf, pj, mbtiType } = data;
    const hasAnyScore =
      ei !== undefined ||
      sn !== undefined ||
      tf !== undefined ||
      pj !== undefined;
    const hasAllScores =
      ei !== undefined &&
      sn !== undefined &&
      tf !== undefined &&
      pj !== undefined;

    if (hasAnyScore && !hasAllScores) {
      return false;
    }

    if (mbtiType && !hasAllScores) {
      return false;
    }

    return true;
  }, 'If any personality score is provided, all scores (ei, sn, tf, pj) must be provided. MBTI type requires all scores.');

const SkillLevelSchema = z
  .number()
  .min(0.0, 'Skill level must be between 0.0 and 10.0')
  .max(10.0, 'Skill level must be between 0.0 and 10.0')
  .refine(val => !Number.isNaN(val), 'Skill level must be a valid number')
  .refine(val => Number.isFinite(val), 'Skill level must be finite');

const PreferenceSchema = z
  .number()
  .min(-1.0, 'Preference must be between -1.0 and 1.0')
  .max(1.0, 'Preference must be between -1.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Preference must be a valid number')
  .refine(val => Number.isFinite(val), 'Preference must be finite');

const SimilaritySchema = z
  .number()
  .min(0.0, 'Similarity must be between 0.0 and 1.0')
  .max(1.0, 'Similarity must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Similarity must be a valid number')
  .refine(val => Number.isFinite(val), 'Similarity must be finite');

const ImportanceSchema = z
  .number()
  .min(0.0, 'Importance must be between 0.0 and 1.0')
  .max(1.0, 'Importance must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Importance must be a valid number')
  .refine(val => Number.isFinite(val), 'Importance must be finite');

const QualitySchema = z
  .number()
  .min(0.0, 'Quality must be between 0.0 and 1.0')
  .max(1.0, 'Quality must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Quality must be a valid number')
  .refine(val => Number.isFinite(val), 'Quality must be finite');

const AlphaSchema = z
  .number()
  .min(0.0, 'Alpha must be between 0.0 and 1.0')
  .max(1.0, 'Alpha must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Alpha must be a valid number')
  .refine(val => Number.isFinite(val), 'Alpha must be finite');

const BetaSchema = z
  .number()
  .min(0.0, 'Beta must be between 0.0 and 1.0')
  .max(1.0, 'Beta must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Beta must be a valid number')
  .refine(val => Number.isFinite(val), 'Beta must be finite');

const GammaSchema = z
  .number()
  .min(0.0, 'Gamma must be between 0.0 and 1.0')
  .max(1.0, 'Gamma must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Gamma must be a valid number')
  .refine(val => Number.isFinite(val), 'Gamma must be finite');

const DeltaSchema = z
  .number()
  .min(0.0, 'Delta must be between 0.0 and 1.0')
  .max(1.0, 'Delta must be between 0.0 and 1.0')
  .refine(val => !Number.isNaN(val), 'Delta must be a valid number')
  .refine(val => Number.isFinite(val), 'Delta must be finite');

const TeamSizeSchema = z
  .number()
  .int('Team size must be an integer')
  .min(1, 'Team size must be at least 1')
  .max(100, 'Team size must not exceed 100');

const PersonSkillCreateSchema = z
  .object({
    personId: z.string().uuid('Person ID must be a valid UUID'),
    skillId: z.string().uuid('Skill ID must be a valid UUID'),
    level: SkillLevelSchema,
  })
  .strict();

const PersonPreferenceCreateSchema = z
  .object({
    personId: z.string().uuid('Person ID must be a valid UUID'),
    preferredPersonId: z
      .string()
      .uuid('Preferred person ID must be a valid UUID'),
    preference: PreferenceSchema,
  })
  .strict()
  .refine(data => {
    return data.personId !== data.preferredPersonId;
  }, 'A person cannot have a preference for themselves');

const TaskPreferenceCreateSchema = z
  .object({
    taskId: z.string().uuid('Task ID must be a valid UUID'),
    personId: z.string().uuid('Person ID must be a valid UUID'),
    preference: PreferenceSchema,
  })
  .strict();

const SkillSimilarityCreateSchema = z
  .object({
    sourceId: z.string().uuid('Source skill ID must be a valid UUID'),
    targetId: z.string().uuid('Target skill ID must be a valid UUID'),
    similarity: SimilaritySchema,
  })
  .strict()
  .refine(data => {
    return data.sourceId !== data.targetId;
  }, 'A skill cannot have similarity with itself');

const TaskSkillCreateSchema = z
  .object({
    taskId: z.string().uuid('Task ID must be a valid UUID'),
    skillId: z.string().uuid('Skill ID must be a valid UUID'),
    level: SkillLevelSchema,
    importance: ImportanceSchema,
  })
  .strict();

const TeamFormationRequestCreateSchema = z
  .object({
    ownerId: z.string().uuid('Owner ID must be a valid UUID'),
    alpha: AlphaSchema.optional(),
    beta: BetaSchema.optional(),
    gamma: GammaSchema.optional(),
    delta: DeltaSchema.optional(),
    initRandom: z.boolean().default(false),
    requestData: z.any().optional(),
    replyPostUrl: z.string().url().optional(),
  })
  .strict();

const TeamCreateSchema = z
  .object({
    teamFormationRequestId: z
      .string()
      .uuid('Team formation request ID must be a valid UUID'),
    taskId: z.string().uuid('Task ID must be a valid UUID').optional(),
    name: z.string().min(1, 'Team name must not be empty').optional(),
    quality: QualitySchema.optional(),
  })
  .strict();

const TaskCreateSchema = z
  .object({
    name: z.string().min(1, 'Task name must not be empty'),
    description: z.string().optional(),
    teamSize: TeamSizeSchema,
  })
  .strict();

type _PersonalityScores = z.infer<typeof PersonalityScoresSchema>;
type _PartialPersonalityScores = z.infer<typeof PartialPersonalityScoresSchema>;
export type MBTIType = z.infer<typeof MBTITypeSchema>;
type _AnswerRecord = z.infer<typeof AnswerRecordSchema>;
type _PersonalityMetadata = z.infer<typeof PersonalityMetadataSchema>;
type _PersonalityData = z.infer<typeof PersonalityDataSchema>;
type _CompletePersonalityData = z.infer<typeof CompletePersonalityDataSchema>;
type _UserPersonalityUpdate = z.infer<typeof UserPersonalityUpdateSchema>;
type _PersonSkillCreate = z.infer<typeof PersonSkillCreateSchema>;
type _PersonPreferenceCreate = z.infer<typeof PersonPreferenceCreateSchema>;
type _TaskPreferenceCreate = z.infer<typeof TaskPreferenceCreateSchema>;
type _SkillSimilarityCreate = z.infer<typeof SkillSimilarityCreateSchema>;
type _TaskSkillCreate = z.infer<typeof TaskSkillCreateSchema>;
type _TeamFormationRequestCreate = z.infer<
  typeof TeamFormationRequestCreateSchema
>;
type _TeamCreate = z.infer<typeof TeamCreateSchema>;
type _TaskCreate = z.infer<typeof TaskCreateSchema>;
