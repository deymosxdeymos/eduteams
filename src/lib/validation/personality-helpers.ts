import { ZodError } from 'zod';
import {
  type AnswerRecord,
  AnswerRecordSchema,
  MBTI_TYPES,
  type MBTIType,
  MBTITypeSchema,
  type PersonalityData,
  PersonalityDataSchema,
  type PersonalityScores,
  PersonalityScoresSchema,
  UserPersonalityUpdateSchema,
} from './personality';

export class PersonalityValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PersonalityValidationError';
  }
}

export class DatabaseConstraintError extends Error {
  constructor(
    message: string,
    public readonly constraintName: string,
    public readonly table: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'DatabaseConstraintError';
  }
}

export function validatePersonalityScores(scores: unknown): PersonalityScores {
  try {
    return PersonalityScoresSchema.parse(scores);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      throw new PersonalityValidationError(
        `Invalid personality scores: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code,
        firstError
      );
    }
    throw error;
  }
}

export function validateMBTIType(mbtiType: unknown): MBTIType {
  try {
    return MBTITypeSchema.parse(mbtiType);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      throw new PersonalityValidationError(
        `Invalid MBTI type: ${firstError.message}`,
        'mbtiType',
        firstError.code,
        firstError
      );
    }
    throw error;
  }
}

export function validateAnswerRecord(answers: unknown): AnswerRecord {
  try {
    return AnswerRecordSchema.parse(answers);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      throw new PersonalityValidationError(
        `Invalid answer record: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code,
        firstError
      );
    }
    throw error;
  }
}

export function validatePersonalityData(data: unknown): PersonalityData {
  try {
    return PersonalityDataSchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      throw new PersonalityValidationError(
        `Invalid personality data: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code,
        firstError
      );
    }
    throw error;
  }
}

export function validateUserPersonalityUpdate(update: unknown) {
  try {
    return UserPersonalityUpdateSchema.parse(update);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      throw new PersonalityValidationError(
        `Invalid user personality update: ${firstError.message}`,
        firstError.path.join('.'),
        firstError.code,
        firstError
      );
    }
    throw error;
  }
}

export function calculateMBTIFromScores(scores: PersonalityScores): MBTIType {
  const { ei, sn, tf, pj } = scores;

  const dimensions = [
    ei < 0 ? 'E' : 'I',
    sn < 0 ? 'S' : 'N',
    tf < 0 ? 'T' : 'F',
    pj < 0 ? 'J' : 'P',
  ];

  const mbtiType = dimensions.join('') as MBTIType;

  if (!MBTI_TYPES.includes(mbtiType)) {
    throw new PersonalityValidationError(
      `Calculated MBTI type '${mbtiType}' is not valid`,
      'mbtiType',
      'invalid_enum',
      { scores, calculated: mbtiType }
    );
  }

  return mbtiType;
}

export function validateMBTIScoreConsistency(
  scores: PersonalityScores,
  mbtiType: MBTIType
): boolean {
  const calculatedType = calculateMBTIFromScores(scores);
  return calculatedType === mbtiType;
}

export function isCompletePersonalityData(data: {
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
}): boolean {
  return (
    data.ei !== null &&
    data.ei !== undefined &&
    data.sn !== null &&
    data.sn !== undefined &&
    data.tf !== null &&
    data.tf !== undefined &&
    data.pj !== null &&
    data.pj !== undefined
  );
}

export function validatePersonalityCompleteness(data: {
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
  mbtiType?: string | null;
}): void {
  const hasAnyScore =
    data.ei !== null ||
    data.sn !== null ||
    data.tf !== null ||
    data.pj !== null;
  const hasAllScores = isCompletePersonalityData(data);

  if (hasAnyScore && !hasAllScores) {
    throw new PersonalityValidationError(
      'If any personality score is provided, all dimensions (ei, sn, tf, pj) must be provided',
      'personality_scores',
      'incomplete_data',
      { provided: data }
    );
  }

  if (data.mbtiType && !hasAllScores) {
    throw new PersonalityValidationError(
      'MBTI type requires all personality scores to be provided',
      'mbtiType',
      'missing_scores',
      { mbtiType: data.mbtiType, scores: data }
    );
  }

  if (hasAllScores && data.mbtiType) {
    const scores = {
      ei: data.ei as number,
      sn: data.sn as number,
      tf: data.tf as number,
      pj: data.pj as number,
    };

    if (!validateMBTIScoreConsistency(scores, data.mbtiType as MBTIType)) {
      throw new PersonalityValidationError(
        'MBTI type is inconsistent with personality scores',
        'mbtiType',
        'inconsistent_data',
        {
          provided: data.mbtiType,
          calculated: calculateMBTIFromScores(scores),
          scores,
        }
      );
    }
  }
}

export function sanitizePersonalityScores(
  scores: PersonalityScores
): PersonalityScores {
  return {
    ei: Math.max(-1, Math.min(1, Number(scores.ei.toFixed(6)))),
    sn: Math.max(-1, Math.min(1, Number(scores.sn.toFixed(6)))),
    tf: Math.max(-1, Math.min(1, Number(scores.tf.toFixed(6)))),
    pj: Math.max(-1, Math.min(1, Number(scores.pj.toFixed(6)))),
  };
}

export function parseConstraintError(
  error: unknown
): DatabaseConstraintError | null {
  if (!error || typeof error !== 'object') return null;

  const errorObj = error as { message?: string; code?: string };
  const message = errorObj.message || '';
  const code = errorObj.code || '';

  if (code === '23514' || message.includes('check constraint')) {
    const constraintMatch = message.match(/constraint "([^"]+)"/);
    const tableMatch = message.match(/relation "([^"]+)"/);

    if (constraintMatch && tableMatch) {
      const constraintName = constraintMatch[1];
      const table = tableMatch[1];

      let field = '';
      let userMessage = '';

      if (constraintName.includes('_ei_range_check')) {
        field = 'ei';
        userMessage = 'EI personality score must be between -1.0 and 1.0';
      } else if (constraintName.includes('_sn_range_check')) {
        field = 'sn';
        userMessage = 'SN personality score must be between -1.0 and 1.0';
      } else if (constraintName.includes('_tf_range_check')) {
        field = 'tf';
        userMessage = 'TF personality score must be between -1.0 and 1.0';
      } else if (constraintName.includes('_pj_range_check')) {
        field = 'pj';
        userMessage = 'PJ personality score must be between -1.0 and 1.0';
      } else if (constraintName.includes('_personality_completeness_check')) {
        field = 'personality_scores';
        userMessage =
          'All personality dimensions (ei, sn, tf, pj) must be provided together or all must be null';
      } else if (constraintName.includes('_mbti_consistency_check')) {
        field = 'mbtiType';
        userMessage = 'MBTI type must be consistent with personality scores';
      } else if (constraintName.includes('_personality_data_schema_check')) {
        field = 'personalityData';
        userMessage =
          'Personality data must be a valid JSON object with answers, scores, or metadata';
      } else if (constraintName.includes('_no_self_preference_check')) {
        field = 'preference';
        userMessage = 'A person cannot have a preference for themselves';
      } else {
        userMessage = `Database constraint violation: ${constraintName}`;
      }

      return new DatabaseConstraintError(
        userMessage,
        constraintName,
        table,
        field
      );
    }
  }

  return null;
}

export function formatValidationError(
  error: PersonalityValidationError | DatabaseConstraintError
): {
  message: string;
  field: string;
  code: string;
  details?: unknown;
} {
  return {
    message: error.message,
    field:
      error instanceof PersonalityValidationError
        ? error.field
        : error.field || 'unknown',
    code:
      error instanceof PersonalityValidationError
        ? error.code
        : 'database_constraint',
    details:
      error instanceof PersonalityValidationError
        ? error.details
        : {
            constraintName: error.constraintName,
            table: error.table,
          },
  };
}

export function isPersonalityValidationError(
  error: unknown
): error is PersonalityValidationError {
  return error instanceof PersonalityValidationError;
}

export function isDatabaseConstraintError(
  error: unknown
): error is DatabaseConstraintError {
  return error instanceof DatabaseConstraintError;
}

export function handlePersonalityError(error: unknown): never {
  const constraintError = parseConstraintError(error);

  if (constraintError) {
    throw constraintError;
  }

  if (isPersonalityValidationError(error) || isDatabaseConstraintError(error)) {
    throw error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Unexpected error: ${errorMessage}`);
}
