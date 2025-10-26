import type { PersonalityQuestionRecord } from '@/lib/mbti-questions-simple';

export interface PersonalityScores {
  ei: number;
  sn: number;
  tf: number;
  pj: number;
}

export interface AnswerRecord {
  [questionId: string]: number;
}

const MBTI_LETTERS = [
  ['I', 'E'] as const,
  ['S', 'N'] as const,
  ['T', 'F'] as const,
  ['J', 'P'] as const,
] as const;

const AXES: Array<keyof PersonalityScores> = ['ei', 'sn', 'tf', 'pj'];

export function isValidAnswerRecord(obj: unknown): obj is AnswerRecord {
  if (typeof obj !== 'object' || obj === null) return false;

  const record = obj as Record<string, unknown>;
  const entries = Object.entries(record);

  // Allow empty answers object
  if (entries.length === 0) return true;

  for (const [key, value] of entries) {
    if (typeof key !== 'string' || typeof value !== 'number') return false;
    if (value < 1 || value > 5 || !Number.isInteger(value)) return false;
  }

  return true;
}

export function isValidPersonalityScores(
  obj: unknown
): obj is PersonalityScores {
  if (typeof obj !== 'object' || obj === null) return false;

  const scores = obj as Record<keyof PersonalityScores, unknown>;

  for (const key of AXES) {
    if (!(key in scores)) return false;
    const value = scores[key];
    if (typeof value !== 'number' || value < -1 || value > 1) return false;
  }

  return true;
}

export function calculatePersonalityScores(
  answers: AnswerRecord,
  questions: Array<
    Pick<
      PersonalityQuestionRecord,
      'id' | 'dimension' | 'reversed' | 'isAttentionCheck'
    >
  >
): PersonalityScores {
  if (!isValidAnswerRecord(answers)) {
    throw new Error('Invalid answer record format');
  }
  const scores = calculatePersonalityScoresFromQuestions(answers, questions);
  if (!isValidPersonalityScores(scores)) {
    throw new Error('Calculated scores are invalid');
  }
  return scores;
}

export function getMBTIType(scores: PersonalityScores): string {
  if (!isValidPersonalityScores(scores)) {
    throw new Error('Invalid personality scores');
  }

  const values = [scores.ei, scores.sn, scores.tf, scores.pj];

  return values
    .map((value, index) => MBTI_LETTERS[index][value < 0 ? 0 : 1])
    .join('');
}

export function calculatePersonalityScoresFromQuestions(
  answersById: Record<string, number>,
  questions: Array<
    Pick<
      PersonalityQuestionRecord,
      'id' | 'dimension' | 'reversed' | 'isAttentionCheck'
    >
  >
): PersonalityScores {
  const totals: Record<
    'ei' | 'sn' | 'tf' | 'pj',
    { sum: number; count: number }
  > = {
    ei: { sum: 0, count: 0 },
    sn: { sum: 0, count: 0 },
    tf: { sum: 0, count: 0 },
    pj: { sum: 0, count: 0 },
  };

  const INTERACTION_WEIGHT = 0.35;

  for (const q of questions) {
    const dim = q.dimension.toLowerCase();
    if (q.isAttentionCheck) continue;

    let raw: number | undefined = answersById[q.id];
    if (raw === undefined) {
      const index = questions.indexOf(q);
      const ordinalKey = (index + 1).toString();
      raw = answersById[ordinalKey];
    }
    if (raw === undefined) continue;

    const answer = q.reversed ? 6 - raw : raw;
    const norm = (answer - 3) / 2;

    if (dim === 'ei' || dim === 'sn' || dim === 'tf' || dim === 'pj') {
      totals[dim].sum += norm;
      totals[dim].count += 1;
    } else if (dim === 'i') {
      totals.ei.sum -= norm;
      totals.ei.count += 1;
    } else if (dim === 'e') {
      totals.ei.sum += norm;
      totals.ei.count += 1;
    } else if (dim === 's') {
      totals.sn.sum -= norm;
      totals.sn.count += 1;
    } else if (dim === 'n') {
      totals.sn.sum += norm;
      totals.sn.count += 1;
    } else if (dim === 'f') {
      totals.tf.sum += norm;
      totals.tf.count += 1;
    } else if (dim === 't') {
      totals.tf.sum -= norm;
      totals.tf.count += 1;
    } else if (dim === 'j') {
      totals.pj.sum -= norm;
      totals.pj.count += 1;
    } else if (dim === 'p') {
      totals.pj.sum += norm;
      totals.pj.count += 1;
    } else if (dim === 'nj') {
      totals.sn.sum += INTERACTION_WEIGHT * norm;
      totals.pj.sum += -INTERACTION_WEIGHT * norm;
    } else if (dim === 'np') {
      totals.sn.sum += INTERACTION_WEIGHT * norm;
      totals.pj.sum += INTERACTION_WEIGHT * norm;
    } else if (dim === 'sj') {
      totals.sn.sum += -INTERACTION_WEIGHT * norm;
      totals.pj.sum += -INTERACTION_WEIGHT * norm;
    } else if (dim === 'sp') {
      totals.sn.sum += -INTERACTION_WEIGHT * norm;
      totals.pj.sum += INTERACTION_WEIGHT * norm;
    } else if (dim === 'ef') {
      totals.ei.sum += INTERACTION_WEIGHT * norm;
      totals.tf.sum += INTERACTION_WEIGHT * norm;
    } else if (dim === 'et') {
      totals.ei.sum += INTERACTION_WEIGHT * norm;
      totals.tf.sum += -INTERACTION_WEIGHT * norm;
    } else if (dim === 'if') {
      totals.ei.sum += -INTERACTION_WEIGHT * norm;
      totals.tf.sum += INTERACTION_WEIGHT * norm;
    } else if (dim === 'it') {
      totals.ei.sum += -INTERACTION_WEIGHT * norm;
      totals.tf.sum += -INTERACTION_WEIGHT * norm;
    }
  }

  const mk = (sum: number, count: number) =>
    count > 0 ? Math.max(-1, Math.min(1, sum / count)) : 0;

  const scores: PersonalityScores = {
    ei: mk(totals.ei.sum, totals.ei.count),
    sn: mk(totals.sn.sum, totals.sn.count),
    tf: mk(totals.tf.sum, totals.tf.count),
    pj: mk(totals.pj.sum, totals.pj.count),
  };

  return scores;
}
