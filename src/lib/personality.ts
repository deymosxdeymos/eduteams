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

export function clearPersonalityCache(): void {
  // no-op retained for backwards compatibility; cache removed with v1 bank
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

  for (const q of questions) {
    const dim = q.dimension.toLowerCase();
    if (!(dim === 'ei' || dim === 'sn' || dim === 'tf' || dim === 'pj'))
      continue;
    if (q.isAttentionCheck) continue;
    // Accept either question id keys or ordinal number keys ("1".."24")
    // Many clients submit numeric keys by display order rather than db id
    let raw: number | undefined = answersById[q.id];
    if (raw === undefined) {
      // Fallback: try by 1-based order derived from the question's position
      // We assume input keys are simple strings like "1", "2", ...
      const index = questions.indexOf(q);
      const ordinalKey = (index + 1).toString();
      raw = answersById[ordinalKey];
    }
    if (raw === undefined) continue;
    const answer = q.reversed ? 6 - raw : raw; // 1..5 Likert
    const normalized = (answer - 3) / 2; // -> [-1,1]
    totals[dim].sum += normalized;
    totals[dim].count += 1;
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
