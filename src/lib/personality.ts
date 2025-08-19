export interface PersonalityScores {
  ei: number;
  sn: number;
  tf: number;
  pj: number;
}

export interface AnswerRecord {
  [questionId: string]: number;
}

const REVERSED_QUESTIONS = new Set([4, 9, 11, 14, 15, 17, 20, 22, 24]);

const DIMENSION_RANGES = [
  { key: 'ei' as const, start: 1, end: 6 },
  { key: 'sn' as const, start: 7, end: 12 },
  { key: 'tf' as const, start: 13, end: 18 },
  { key: 'pj' as const, start: 19, end: 24 },
] as const;

const MBTI_LETTERS = [
  ['I', 'E'] as const,
  ['S', 'N'] as const,
  ['T', 'F'] as const,
  ['J', 'P'] as const,
] as const;

const scoresCache = new Map<string, PersonalityScores>();

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

  const scores = obj as Record<string, unknown>;

  for (const { key } of DIMENSION_RANGES) {
    if (!(key in scores)) return false;
    const value = scores[key];
    if (typeof value !== 'number' || value < -1 || value > 1) return false;
  }

  return true;
}

function validateAnswers(answers: AnswerRecord): void {
  if (!isValidAnswerRecord(answers)) {
    throw new Error('Invalid answer record format');
  }
}

function calculateDimensionScore(
  answers: AnswerRecord,
  start: number,
  end: number
): number {
  let total = 0;
  let count = 0;

  for (let i = start; i <= end; i++) {
    const key = i.toString();
    const answer = answers[key];

    if (answer !== undefined) {
      const score = REVERSED_QUESTIONS.has(i) ? 6 - answer : answer;
      total += (score - 3) / 2;
      count++;
    }
  }

  const average = count > 0 ? total / count : 0;
  return Math.max(-1, Math.min(1, average));
}

export function calculatePersonalityScores(
  answers: AnswerRecord
): PersonalityScores {
  validateAnswers(answers);

  const cacheKey = JSON.stringify(answers);
  const cached = scoresCache.get(cacheKey);
  if (cached) return cached;

  const scores: PersonalityScores = {} as PersonalityScores;

  for (const { key, start, end } of DIMENSION_RANGES) {
    scores[key] = calculateDimensionScore(answers, start, end);
  }

  if (!isValidPersonalityScores(scores)) {
    throw new Error('Calculated scores are invalid');
  }

  scoresCache.set(cacheKey, scores);
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
  scoresCache.clear();
}

export function calculatePersonalityScoresFromQuestions(
  answersById: Record<string, number>,
  questions: Array<{ id: string; dimension: string; reversed?: boolean }>
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
    const raw = answersById[q.id];
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
