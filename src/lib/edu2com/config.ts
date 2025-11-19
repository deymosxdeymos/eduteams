type Edu2comWeights = {
  alpha: number;
  beta: number;
  gamma: number;
  delta: number;
};

const DEFAULT_WEIGHTS: Edu2comWeights = {
  alpha: 0.4,
  beta: 0.3,
  gamma: 0.2,
  delta: 0.1,
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function parseWeightFromEnv(envKey: string, fallback: number): number {
  const raw = process.env[envKey];
  if (raw === undefined) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp01(parsed);
}

export function getEdu2comWeights(
  overrides: Partial<Edu2comWeights> = {}
): Edu2comWeights {
  const envBackedWeights: Edu2comWeights = {
    alpha: parseWeightFromEnv('EDU2COM_ALPHA_WEIGHT', DEFAULT_WEIGHTS.alpha),
    beta: parseWeightFromEnv('EDU2COM_BETA_WEIGHT', DEFAULT_WEIGHTS.beta),
    gamma: parseWeightFromEnv('EDU2COM_GAMMA_WEIGHT', DEFAULT_WEIGHTS.gamma),
    delta: parseWeightFromEnv('EDU2COM_DELTA_WEIGHT', DEFAULT_WEIGHTS.delta),
  };

  const rawWeights = {
    alpha: overrides.alpha ?? envBackedWeights.alpha,
    beta: overrides.beta ?? envBackedWeights.beta,
    gamma: overrides.gamma ?? envBackedWeights.gamma,
    delta: overrides.delta ?? envBackedWeights.delta,
  };

  return rawWeights;
}

export function normalizeWeights(weights: Edu2comWeights): Edu2comWeights {
  const total = weights.alpha + weights.beta + weights.gamma + weights.delta;

  if (total <= 0) return weights;

  // Normalize weights so they sum to 1.0
  // This prevents quality scores > 1.0 when individual weights are high
  if (Math.abs(total - 1.0) > 0.001) {
    const normalized = {
      alpha: weights.alpha / total,
      beta: weights.beta / total,
      gamma: weights.gamma / total,
      delta: weights.delta / total,
    };
    console.warn(
      `[Edu2com Config] Weights sum to ${total.toFixed(2)} (not 1.0). Normalizing to maintain quality scaling:`,
      `[${weights.alpha}, ${weights.beta}, ${weights.gamma}, ${weights.delta}] ->`,
      `[${normalized.alpha.toFixed(3)}, ${normalized.beta.toFixed(3)}, ${normalized.gamma.toFixed(3)}, ${normalized.delta.toFixed(3)}]`
    );
    return normalized;
  }

  return weights;
}

const BASE_BACKGROUND_TIMEOUT_MS = 120_000;
const MAX_BACKGROUND_TIMEOUT_MS = 5 * 60 * 1000;
const PER_STUDENT_BUDGET_MS = 1_500;
const PER_TASK_BUDGET_MS = 500;

function parseTimeoutMs(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

export function getEdu2comBackgroundTimeoutMs(opts: {
  studentCount: number;
  taskCount: number;
  overrideTimeoutMs?: number;
}): number {
  const overrideTimeout = parseTimeoutMs(opts.overrideTimeoutMs);
  if (overrideTimeout) {
    return overrideTimeout;
  }

  const envTimeout = parseTimeoutMs(process.env.EDU2COM_BACKGROUND_TIMEOUT_MS);
  if (envTimeout) {
    return envTimeout;
  }

  const extraStudentBudget =
    Math.max(0, opts.studentCount - 40) * PER_STUDENT_BUDGET_MS;
  const extraTaskBudget = Math.max(0, opts.taskCount - 10) * PER_TASK_BUDGET_MS;
  const computed =
    BASE_BACKGROUND_TIMEOUT_MS + extraStudentBudget + extraTaskBudget;
  return Math.min(MAX_BACKGROUND_TIMEOUT_MS, computed);
}

export type { Edu2comWeights };
