#!/usr/bin/env bun

import { mkdirSync } from 'node:fs';

type PersonalityAxisKey = 'ei' | 'sn' | 'tf' | 'pj';

interface SessionRecord {
  id: string;
  userId: string;
  bankVersion: number;
  locale?: string;
  attentionPassed: boolean;
  durationMs: number;
  submittedAt: string | null;
}

interface ResponseRecord {
  sessionId: string;
  questionId: string;
  rawValue: number | null;
  scoredValue: number | null;
}

interface QuestionRecord {
  id: string;
  text?: string;
  dimension: PersonalityAxisKey;
  isAttentionCheck: boolean;
  reversed: boolean;
  orderHint?: number;
}

interface CLIOptions {
  sessionsPath: string;
  responsesPath: string;
  questionsPath: string;
  bankVersion?: number;
  locale?: string;
  minDurationMs: number;
  outputPath?: string;
  jsonOnly: boolean;
  computeTestRetest: boolean;
}

interface AxisItemStat {
  questionId: string;
  text?: string;
  orderHint?: number;
  mean: number;
  stdDev: number;
  correctedItemTotalCorrelation: number | null;
}

interface AxisReliabilitySummary {
  axis: PersonalityAxisKey;
  alpha: number | null;
  itemCount: number;
  sessionCount: number;
  items: AxisItemStat[];
  flaggedItems: AxisItemStat[];
}

interface TestRetestSummary {
  axis: PersonalityAxisKey;
  correlation: number | null;
  sampleSize: number;
}

interface AnalysisResult {
  summary: {
    bankVersion?: number;
    locale?: string;
    includedSessions: number;
    excludedSessions: number;
    minDurationMs: number;
  };
  reliability: AxisReliabilitySummary[];
  testRetest?: TestRetestSummary[];
  generatedAt: string;
}

function printUsage(): void {
  console.log(`Usage: bun scripts/psychometrics/analyze.ts \
  --sessions <path> \
  --responses <path> \
  --questions <path> [options]\n\nOptions:\n  --bank-version <number>   Filter to a specific bank version\n  --locale <locale>         Filter to a specific locale\n  --min-duration <ms>       Minimum duration threshold (default 60000)\n  --compute-test-retest     Compute test-retest correlations when possible\n  --output <path>           Write JSON report to a file\n  --json                    Output JSON only (no human summary)\n  --help                    Show this help message\n\nAccepted formats: JSON (.json) or CSV (.csv).\n`);
}

function parseArgs(argv: string[]): CLIOptions | null {
  const options: Partial<CLIOptions> = {
    minDurationMs: 60_000,
    jsonOnly: false,
    computeTestRetest: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--sessions':
        options.sessionsPath = argv[++i];
        break;
      case '--responses':
        options.responsesPath = argv[++i];
        break;
      case '--questions':
        options.questionsPath = argv[++i];
        break;
      case '--bank-version':
        options.bankVersion = Number(argv[++i]);
        break;
      case '--locale':
        options.locale = argv[++i];
        break;
      case '--min-duration':
        options.minDurationMs = Number(argv[++i]);
        break;
      case '--output':
        options.outputPath = argv[++i];
        break;
      case '--json':
        options.jsonOnly = true;
        break;
      case '--compute-test-retest':
        options.computeTestRetest = true;
        break;
      case '--help':
      case '-h':
        printUsage();
        return null;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
    }
  }

  if (
    !options.sessionsPath ||
    !options.responsesPath ||
    !options.questionsPath
  ) {
    throw new Error('Missing required arguments. Use --help for usage.');
  }

  return options as CLIOptions;
}

async function loadRecords(path: string): Promise<Record<string, unknown>[]> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    throw new Error(`File not found: ${path}`);
  }

  if (path.endsWith('.json')) {
    const data = await file.json();
    if (!Array.isArray(data)) {
      throw new Error(`Expected array in JSON file: ${path}`);
    }
    return data as Record<string, unknown>[];
  }

  if (path.endsWith('.csv')) {
    const text = await file.text();
    return parseCsv(text);
  }

  throw new Error(`Unsupported file format for ${path}. Use .json or .csv.`);
}

function parseCsv(content: string): Record<string, unknown>[] {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const records: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = coerceValue(values[index] ?? '');
    });
    records.push(record);
  }

  return records;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === ',') {
        result.push(current.trim());
        current = '';
      } else if (char === '"') {
        inQuotes = true;
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

function coerceValue(value: string): unknown {
  if (value === '') return null;
  const lower = value.toLowerCase();
  if (lower === 'true' || lower === 'false') {
    return lower === 'true';
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  return value;
}

function valueByKeys<T = unknown>(
  record: Record<string, unknown>,
  keys: string[]
): T | undefined {
  for (const key of keys) {
    const candidate = record[key];
    if (candidate !== undefined) return candidate as T;
    const normalizedKey = key.toLowerCase();
    for (const recordKey of Object.keys(record)) {
      const simple = recordKey.replace(/[_\s]/g, '').toLowerCase();
      if (simple === normalizedKey.replace(/[_\s]/g, '')) {
        return record[recordKey] as T;
      }
    }
  }
  return undefined;
}

function toBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 't', 'yes', 'y', '1'].includes(normalized)) return true;
    if (['false', 'f', 'no', 'n', '0'].includes(normalized)) return false;
  }
  return fallback;
}

function toNumber(
  value: unknown,
  fallback: number | null = null
): number | null {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const numeric = Number(value.trim());
    return Number.isFinite(numeric) ? numeric : fallback;
  }
  return fallback;
}

function normalizeSessions(
  records: Record<string, unknown>[]
): SessionRecord[] {
  return records
    .map(record => {
      const id = valueByKeys<string>(record, ['id', 'sessionId']);
      const userId = valueByKeys<string>(record, ['userId']);
      const bankVersion = toNumber(valueByKeys(record, ['bankVersion']), null);
      const locale = valueByKeys<string>(record, ['locale']);
      const attentionPassed = toBoolean(
        valueByKeys(record, ['attentionPassed', 'attention_passed']),
        false
      );
      const durationMs = toNumber(
        valueByKeys(record, ['durationMs', 'duration_ms']),
        null
      );
      const submittedAtRaw = valueByKeys<string | number | Date>(record, [
        'submittedAt',
        'submitted_at',
      ]);

      if (!id || !userId || bankVersion === null || durationMs === null) {
        return null;
      }

      const submittedAt = submittedAtRaw
        ? new Date(submittedAtRaw).toISOString()
        : null;

      const session: SessionRecord = {
        id,
        userId,
        bankVersion,
        attentionPassed,
        durationMs,
        submittedAt,
      };

      if (locale) {
        session.locale = locale;
      }

      return session;
    })
    .filter((session): session is SessionRecord => session !== null);
}

function normalizeResponses(
  records: Record<string, unknown>[]
): ResponseRecord[] {
  return records
    .map(record => {
      const sessionId = valueByKeys<string>(record, ['sessionId']);
      const questionId = valueByKeys<string>(record, ['questionId']);
      const rawValue = toNumber(
        valueByKeys(record, ['rawValue', 'raw_value']),
        null
      );
      const scoredValue = toNumber(
        valueByKeys(record, ['scoredValue', 'scored_value']),
        null
      );

      if (!sessionId || !questionId) {
        return null;
      }

      return {
        sessionId,
        questionId,
        rawValue,
        scoredValue,
      } satisfies ResponseRecord;
    })
    .filter((response): response is ResponseRecord => response !== null);
}

function normalizeQuestions(
  records: Record<string, unknown>[]
): QuestionRecord[] {
  const normalized: QuestionRecord[] = [];

  for (const record of records) {
    const id = valueByKeys<string>(record, ['id', 'questionId']);
    const dimensionRaw = valueByKeys<string>(record, ['dimension']);
    const dimension = dimensionRaw?.toLowerCase() as
      | PersonalityAxisKey
      | undefined;
    const isAttentionCheck = toBoolean(
      valueByKeys(record, ['isAttentionCheck', 'attention', 'attentionCheck']),
      false
    );
    const reversed = toBoolean(
      valueByKeys(record, ['reversed', 'isReversed']),
      false
    );
    const orderHint =
      toNumber(valueByKeys(record, ['orderHint', 'order_hint']), null) ??
      undefined;
    const text = valueByKeys<string>(record, ['text', 'prompt']);

    if (!id || !dimension || !['ei', 'sn', 'tf', 'pj'].includes(dimension)) {
      continue;
    }

    normalized.push({
      id,
      text,
      dimension,
      isAttentionCheck,
      reversed,
      orderHint,
    });
  }

  return normalized;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  const sumSq = values.reduce((total, value) => total + (value - avg) ** 2, 0);
  return sumSq / (values.length - 1);
}

function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

function covariance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Covariance requires vectors of equal length');
  }
  if (a.length <= 1) return 0;
  const meanA = mean(a);
  const meanB = mean(b);
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    total += (a[i] - meanA) * (b[i] - meanB);
  }
  return total / (a.length - 1);
}

function pearsonCorrelation(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 2) return null;
  const varianceA = variance(a);
  const varianceB = variance(b);
  if (varianceA === 0 || varianceB === 0) return null;
  return covariance(a, b) / Math.sqrt(varianceA * varianceB);
}

function cronbachAlpha(itemScores: number[][]): number | null {
  const k = itemScores.length;
  if (k < 2) return null;

  const sessionCount = itemScores[0]?.length ?? 0;
  if (sessionCount < 2) return null;

  // Ensure equal lengths
  for (const scores of itemScores) {
    if (scores.length !== sessionCount) {
      throw new Error('All item score arrays must have the same length');
    }
  }

  const itemVariances = itemScores.map(values => variance(values));
  const totals: number[] = [];
  for (let i = 0; i < sessionCount; i++) {
    let sessionTotal = 0;
    for (const scores of itemScores) {
      sessionTotal += scores[i];
    }
    totals.push(sessionTotal);
  }

  const totalVariance = variance(totals);
  if (totalVariance === 0) return null;

  const sumItemVariances = itemVariances.reduce(
    (total, value) => total + value,
    0
  );
  return (k / (k - 1)) * (1 - sumItemVariances / totalVariance);
}

function buildAnalysis(
  sessions: SessionRecord[],
  responses: ResponseRecord[],
  questions: QuestionRecord[],
  options: CLIOptions
): AnalysisResult {
  const questionMap = new Map(
    questions.map(question => [question.id, question] as const)
  );

  const filteredSessions = sessions.filter(session => {
    if (
      options.bankVersion !== undefined &&
      session.bankVersion !== options.bankVersion
    ) {
      return false;
    }
    if (options.locale && session.locale && session.locale !== options.locale) {
      return false;
    }
    if (!session.attentionPassed) {
      return false;
    }
    if (session.durationMs < options.minDurationMs) {
      return false;
    }
    if (!session.submittedAt) {
      return false;
    }
    return true;
  });

  const validSessionIds = new Set(filteredSessions.map(session => session.id));
  const responsesBySession = new Map<string, Map<string, number>>();

  for (const response of responses) {
    if (!validSessionIds.has(response.sessionId)) continue;
    const question = questionMap.get(response.questionId);
    if (!question || question.isAttentionCheck) continue;

    const score = resolveScore(response, question);
    if (score === null) continue;

    if (!responsesBySession.has(response.sessionId)) {
      responsesBySession.set(response.sessionId, new Map());
    }

    responsesBySession.get(response.sessionId)!.set(response.questionId, score);
  }

  const itemsByAxis: Record<PersonalityAxisKey, QuestionRecord[]> = {
    ei: [],
    sn: [],
    tf: [],
    pj: [],
  };

  for (const question of questions) {
    if (question.isAttentionCheck) continue;
    itemsByAxis[question.dimension].push(question);
  }

  const axisItemScores: Record<PersonalityAxisKey, number[][]> = {
    ei: [],
    sn: [],
    tf: [],
    pj: [],
  };
  const axisItemStats: Record<PersonalityAxisKey, AxisItemStat[]> = {
    ei: [],
    sn: [],
    tf: [],
    pj: [],
  };

  const axisTotalsBySession = new Map<
    string,
    Record<PersonalityAxisKey, number>
  >();
  const includedSessionIds: string[] = [];

  for (const session of filteredSessions) {
    const sessionResponses = responsesBySession.get(session.id);
    if (!sessionResponses) continue;

    const axisTotals: Record<PersonalityAxisKey, number> = {
      ei: 0,
      sn: 0,
      tf: 0,
      pj: 0,
    };

    let sessionHasAllItems = true;

    for (const axis of Object.keys(itemsByAxis) as PersonalityAxisKey[]) {
      const items = itemsByAxis[axis];
      const scoresForAxis: number[] = [];
      for (const item of items) {
        const score = sessionResponses.get(item.id);
        if (score === undefined) {
          sessionHasAllItems = false;
          break;
        }
        scoresForAxis.push(score);
      }

      if (!sessionHasAllItems) break;

      axisTotals[axis] = scoresForAxis.reduce(
        (total, value) => total + value,
        0
      );

      if (axisItemScores[axis].length === 0) {
        axisItemScores[axis] = items.map(() => []);
      }

      scoresForAxis.forEach((score, index) => {
        axisItemScores[axis][index].push(score);
      });
    }

    if (!sessionHasAllItems) continue;

    includedSessionIds.push(session.id);
    axisTotalsBySession.set(session.id, axisTotals);
  }

  const reliabilitySummaries: AxisReliabilitySummary[] = [];

  for (const axis of Object.keys(itemsByAxis) as PersonalityAxisKey[]) {
    const questionsForAxis = itemsByAxis[axis];
    if (questionsForAxis.length === 0) {
      reliabilitySummaries.push({
        axis,
        alpha: null,
        itemCount: 0,
        sessionCount: 0,
        items: [],
        flaggedItems: [],
      });
      continue;
    }

    const itemScores = axisItemScores[axis];
    const alpha = itemScores.length > 0 ? cronbachAlpha(itemScores) : null;

    const itemStats: AxisItemStat[] = questionsForAxis.map(
      (question, index) => {
        const scores = itemScores[index] ?? [];
        const itemMean = mean(scores);
        const itemStdDev = standardDeviation(scores);

        const totals: number[] = [];
        const totalsWithoutItem: number[] = [];

        if (scores.length > 0) {
          for (let i = 0; i < scores.length; i++) {
            const sessionId = includedSessionIds[i];
            const totalsForSession = axisTotalsBySession.get(sessionId);
            if (!totalsForSession) continue;
            const totalScore = totalsForSession[axis];
            totals.push(totalScore);
            totalsWithoutItem.push(totalScore - scores[i]);
          }
        }

        const correlation =
          scores.length > 0
            ? pearsonCorrelation(scores, totalsWithoutItem)
            : null;

        return {
          questionId: question.id,
          text: question.text,
          orderHint: question.orderHint,
          mean: Number(itemMean.toFixed(4)),
          stdDev: Number(itemStdDev.toFixed(4)),
          correctedItemTotalCorrelation:
            correlation === null ? null : Number(correlation.toFixed(4)),
        } satisfies AxisItemStat;
      }
    );

    const flaggedItems = itemStats.filter(stat => {
      return (
        stat.correctedItemTotalCorrelation !== null &&
        stat.correctedItemTotalCorrelation < 0.2
      );
    });

    reliabilitySummaries.push({
      axis,
      alpha: alpha === null ? null : Number(alpha.toFixed(4)),
      itemCount: questionsForAxis.length,
      sessionCount: itemScores[0]?.length ?? 0,
      items: itemStats,
      flaggedItems,
    });
  }

  let testRetest: TestRetestSummary[] | undefined;

  if (options.computeTestRetest) {
    testRetest = computeTestRetest(axisTotalsBySession, filteredSessions);
  }

  return {
    summary: {
      bankVersion: options.bankVersion,
      locale: options.locale,
      includedSessions: includedSessionIds.length,
      excludedSessions:
        sessions.length -
        filteredSessions.length +
        (filteredSessions.length - includedSessionIds.length),
      minDurationMs: options.minDurationMs,
    },
    reliability: reliabilitySummaries,
    testRetest,
    generatedAt: new Date().toISOString(),
  } satisfies AnalysisResult;
}

function computeTestRetest(
  axisTotalsBySession: Map<string, Record<PersonalityAxisKey, number>>,
  sessions: SessionRecord[]
): TestRetestSummary[] {
  const sessionsByUser = new Map<string, SessionRecord[]>();
  for (const session of sessions) {
    if (!axisTotalsBySession.has(session.id)) continue;
    if (!sessionsByUser.has(session.userId)) {
      sessionsByUser.set(session.userId, []);
    }
    sessionsByUser.get(session.userId)!.push(session);
  }

  const pairedScores: Record<
    PersonalityAxisKey,
    { first: number[]; second: number[] }
  > = {
    ei: { first: [], second: [] },
    sn: { first: [], second: [] },
    tf: { first: [], second: [] },
    pj: { first: [], second: [] },
  };

  for (const userSessions of sessionsByUser.values()) {
    if (userSessions.length < 2) continue;
    const sorted = [...userSessions].sort((a, b) => {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return timeA - timeB;
    });

    const firstSession = sorted[0];
    const secondSession = sorted[1];

    const firstTotals = axisTotalsBySession.get(firstSession.id);
    const secondTotals = axisTotalsBySession.get(secondSession.id);
    if (!firstTotals || !secondTotals) continue;

    for (const axis of Object.keys(pairedScores) as PersonalityAxisKey[]) {
      pairedScores[axis].first.push(firstTotals[axis]);
      pairedScores[axis].second.push(secondTotals[axis]);
    }
  }

  const summaries: TestRetestSummary[] = [];

  for (const axis of Object.keys(pairedScores) as PersonalityAxisKey[]) {
    const { first, second } = pairedScores[axis];
    const correlation = pearsonCorrelation(first, second);
    summaries.push({
      axis,
      correlation: correlation === null ? null : Number(correlation.toFixed(4)),
      sampleSize: Math.min(first.length, second.length),
    });
  }

  return summaries;
}

function resolveScore(
  response: ResponseRecord,
  question: QuestionRecord
): number | null {
  if (typeof response.scoredValue === 'number') return response.scoredValue;
  if (typeof response.rawValue === 'number') {
    return question.reversed ? 6 - response.rawValue : response.rawValue;
  }
  return null;
}

function formatNumber(value: number | null | undefined, decimals = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toFixed(decimals);
}

function printSummary(result: AnalysisResult): void {
  console.log('MBTI Bank Reliability Summary');
  console.log('==============================');
  console.log(
    `Sessions analyzed: ${result.summary.includedSessions} (excluded: ${result.summary.excludedSessions})`
  );
  if (result.summary.bankVersion !== undefined) {
    console.log(`Bank version: v${result.summary.bankVersion}`);
  }
  if (result.summary.locale) {
    console.log(`Locale: ${result.summary.locale}`);
  }
  console.log(`Minimum duration: ${result.summary.minDurationMs} ms`);
  console.log('');

  for (const axisSummary of result.reliability) {
    console.log(
      `Axis ${axisSummary.axis.toUpperCase()} (items=${axisSummary.itemCount})`
    );
    console.log(`  Cronbach's alpha: ${formatNumber(axisSummary.alpha)}`);
    console.log(`  Sessions: ${axisSummary.sessionCount}`);
    if (axisSummary.flaggedItems.length > 0) {
      console.log('  Flagged items (corrected item-total < 0.20):');
      for (const item of axisSummary.flaggedItems) {
        console.log(
          `   - ${item.questionId} (corr=${formatNumber(item.correctedItemTotalCorrelation)})`
        );
      }
    }
    console.log('');
  }

  if (result.testRetest) {
    console.log('Test-Retest Correlations');
    console.log('-----------------------');
    for (const summary of result.testRetest) {
      console.log(
        `  ${summary.axis.toUpperCase()}: correlation=${formatNumber(summary.correlation)} (pairs=${summary.sampleSize})`
      );
    }
    console.log('');
  }

  console.log(`Generated at: ${result.generatedAt}`);
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const options = parseArgs(args);
    if (!options) return;

    const [sessionRecords, responseRecords, questionRecords] =
      await Promise.all([
        loadRecords(options.sessionsPath),
        loadRecords(options.responsesPath),
        loadRecords(options.questionsPath),
      ]);

    const sessions = normalizeSessions(sessionRecords);
    const responses = normalizeResponses(responseRecords);
    const questions = normalizeQuestions(questionRecords);

    const result = buildAnalysis(sessions, responses, questions, options);

    if (options.outputPath) {
      const dir = options.outputPath.includes('/')
        ? options.outputPath.slice(0, options.outputPath.lastIndexOf('/'))
        : '';
      if (dir) {
        mkdirSync(dir, { recursive: true });
      }
      await Bun.write(options.outputPath, JSON.stringify(result, null, 2));
    }

    if (options.jsonOnly) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printSummary(result);
    }
  } catch (error) {
    console.error(
      'Error running analysis:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

await main();
