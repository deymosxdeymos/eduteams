import { Redis } from '@upstash/redis';
import NodeCache from 'node-cache';
import prisma from '@/lib/prisma';

export interface MBTIQuestion {
  id: string;
  text: string;
  dimension: string;
  order: number;
  reversed?: boolean;
}

export interface MBTIQuestionValidated extends MBTIQuestion {
  validated: true;
  validatedAt: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  lastUpdated: number;
  totalRequests: number;
}

export interface DatabaseMetrics {
  queries: number;
  errors: number;
  avgResponseTime: number;
  connectionFailures: number;
  lastQuery: number;
}

export interface SystemMetrics {
  cache: CacheMetrics;
  database: DatabaseMetrics;
  memory: {
    usage: number;
    maxUsage: number;
    gcCount: number;
  };
}

export interface MBTISystemConfig {
  redis: {
    enabled: boolean;
    url?: string;
    token?: string;
    ttl: number;
    maxRetries: number;
    retryDelay: number;
  };
  memory: {
    enabled: boolean;
    ttl: number;
    maxKeys: number;
    checkPeriod: number;
  };
  database: {
    maxRetries: number;
    retryDelay: number;
    timeout: number;
    connectionPoolSize: number;
  };
  fallback: {
    enabled: boolean;
    maxAge: number;
  };
  monitoring: {
    enabled: boolean;
    metricsInterval: number;
  };
}

export interface FallbackData {
  questions: MBTIQuestion[];
  timestamp: number;
  source: 'database' | 'static';
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: 'database' | 'cache' | 'static';
}

export class MBTIQuestionsError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MBTIQuestionsError';
  }
}

export class CacheError extends MBTIQuestionsError {
  constructor(
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, 'CACHE_ERROR', cause, context);
  }
}

export class DatabaseError extends MBTIQuestionsError {
  constructor(
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', cause, context);
  }
}

export class ValidationError extends MBTIQuestionsError {
  constructor(
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', cause, context);
  }
}

const DEFAULT_CONFIG: MBTISystemConfig = {
  redis: {
    enabled: !!process.env.UPSTASH_REDIS_REST_URL,
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    ttl: 30 * 60, // 30 minutes
    maxRetries: 3,
    retryDelay: 1000,
  },
  memory: {
    enabled: true,
    ttl: 10 * 60, // 10 minutes
    maxKeys: 1000,
    checkPeriod: 60, // 1 minute
  },
  database: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000, // 10 seconds
    connectionPoolSize: 10,
  },
  fallback: {
    enabled: true,
    maxAge: 60 * 60 * 1000, // 1 hour
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    metricsInterval: 60000, // 1 minute
  },
};

export class MBTIQuestionsManager {
  private redis: Redis | null = null;
  private memoryCache: NodeCache | null = null;
  private config: MBTISystemConfig;
  private metrics: SystemMetrics;
  private fallbackData: FallbackData | null = null;
  private isInitialized = false;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MBTISystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  private initializeMetrics(): SystemMetrics {
    return {
      cache: {
        hits: 0,
        misses: 0,
        errors: 0,
        lastUpdated: Date.now(),
        totalRequests: 0,
      },
      database: {
        queries: 0,
        errors: 0,
        avgResponseTime: 0,
        connectionFailures: 0,
        lastQuery: 0,
      },
      memory: {
        usage: 0,
        maxUsage: 0,
        gcCount: 0,
      },
    };
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set initialized flag early to prevent recursive calls
      this.isInitialized = true;

      if (
        this.config.redis.enabled &&
        this.config.redis.url &&
        this.config.redis.token
      ) {
        this.redis = new Redis({
          url: this.config.redis.url,
          token: this.config.redis.token,
        });

        await this.testRedisConnection();
      }

      if (this.config.memory.enabled) {
        this.memoryCache = new NodeCache({
          stdTTL: this.config.memory.ttl,
          checkperiod: this.config.memory.checkPeriod,
          maxKeys: this.config.memory.maxKeys,
          useClones: false,
        });
      }

      if (this.config.monitoring.enabled) {
        this.startMetricsCollection();
      }

      // Warm cache in background without blocking initialization
      setImmediate(() => this.warmCache());
    } catch (error) {
      console.error('Failed to initialize MBTI Questions Manager:', error);
      this.isInitialized = true;
    }
  }

  private async testRedisConnection(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.ping();
    } catch (error) {
      console.warn('Redis connection test failed:', error);
      this.redis = null;
    }
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.updateMemoryMetrics();
      this.persistMetrics();
    }, this.config.monitoring.metricsInterval);
  }

  private updateMemoryMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memory.usage = memUsage.heapUsed;
    this.metrics.memory.maxUsage = Math.max(
      this.metrics.memory.maxUsage,
      memUsage.heapUsed
    );
  }

  private async persistMetrics(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.set('mbti:metrics', JSON.stringify(this.metrics), {
        ex: this.config.redis.ttl,
      });
    } catch (error) {
      console.error('Failed to persist metrics:', error);
    }
  }

  private async warmCache(): Promise<void> {
    try {
      await this.getMBTIQuestions();
      console.log('Cache warmed successfully');
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  }

  private validateQuestion(question: unknown): MBTIQuestionValidated {
    if (!question || typeof question !== 'object') {
      throw new ValidationError('Question must be an object', undefined, {
        question,
      });
    }

    const q = question as Record<string, unknown>;

    if (!q.id || typeof q.id !== 'string') {
      throw new ValidationError('Question must have a valid id', undefined, {
        question,
      });
    }

    if (!q.text || typeof q.text !== 'string') {
      throw new ValidationError('Question must have valid text', undefined, {
        question,
      });
    }

    if (!q.dimension || typeof q.dimension !== 'string') {
      throw new ValidationError(
        'Question must have a valid dimension',
        undefined,
        { question }
      );
    }

    if (typeof q.order !== 'number') {
      throw new ValidationError('Question must have a valid order', undefined, {
        question,
      });
    }

    const validDimensions = ['ei', 'sn', 'tf', 'pj'];
    if (!validDimensions.includes(q.dimension.toLowerCase())) {
      throw new ValidationError('Invalid dimension', undefined, {
        question,
        validDimensions,
      });
    }

    return {
      id: q.id,
      text: q.text,
      dimension: q.dimension,
      order: q.order,
      reversed: q.reversed as boolean | undefined,
      validated: true,
      validatedAt: Date.now(),
    };
  }

  private async getFromRedis(key: string): Promise<any> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);
      if (data) {
        this.metrics.cache.hits++;
        return JSON.parse(data as string);
      }
      this.metrics.cache.misses++;
      return null;
    } catch (error) {
      this.metrics.cache.errors++;
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis(
    key: string,
    value: any,
    ttl?: number
  ): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.set(key, JSON.stringify(value), {
        ex: ttl || this.config.redis.ttl,
      });
    } catch (error) {
      this.metrics.cache.errors++;
      console.error('Redis set error:', error);
    }
  }

  private getFromMemory(key: string): any {
    if (!this.memoryCache) return null;

    try {
      const data = this.memoryCache.get(key);
      if (data) {
        this.metrics.cache.hits++;
        return data;
      }
      this.metrics.cache.misses++;
      return null;
    } catch (error) {
      this.metrics.cache.errors++;
      console.error('Memory cache get error:', error);
      return null;
    }
  }

  private setInMemory(key: string, value: any, ttl?: number): void {
    if (!this.memoryCache) return;

    try {
      this.memoryCache.set(key, value, ttl || this.config.memory.ttl);
    } catch (error) {
      this.metrics.cache.errors++;
      console.error('Memory cache set error:', error);
    }
  }

  private async getFromDatabase(): Promise<MBTIQuestion[]> {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < this.config.database.maxRetries) {
      try {
        this.metrics.database.queries++;
        this.metrics.database.lastQuery = Date.now();

        const skills = (await Promise.race([
          prisma.skill.findMany({
            where: {
              name: {
                startsWith: 'MBTI Question',
              },
            },
            orderBy: {
              name: 'asc',
            },
            select: {
              id: true,
              name: true,
              description: true,
            },
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Database timeout')),
              this.config.database.timeout
            )
          ),
        ])) as any[];

        const questions = skills
          .map(skill => this.parseQuestionData(skill))
          .map(question => this.validateQuestion(question))
          .sort((a, b) => a.order - b.order);

        const responseTime = Date.now() - startTime;
        this.metrics.database.avgResponseTime =
          (this.metrics.database.avgResponseTime + responseTime) / 2;

        return questions;
      } catch (error) {
        attempts++;
        this.metrics.database.errors++;

        if (attempts >= this.config.database.maxRetries) {
          this.metrics.database.connectionFailures++;
          throw new DatabaseError(
            `Database query failed after ${attempts} attempts`,
            error as Error,
            { attempts, maxRetries: this.config.database.maxRetries }
          );
        }

        await new Promise(resolve =>
          setTimeout(resolve, this.config.database.retryDelay * attempts)
        );
      }
    }

    throw new DatabaseError('Unexpected database error');
  }

  private parseQuestionData(skill: {
    id: string;
    name: string;
    description: string | null;
  }): MBTIQuestion {
    const ORDER_REGEX = /MBTI Question (\d+)/;
    const DIMENSION_REGEX = /^(.+?)\s+\(([^)]+)\s+dimension/;

    const orderMatch = skill.name.match(ORDER_REGEX);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 0;

    if (!skill.description) {
      throw new ValidationError(
        `Missing description for question ${skill.id}`,
        undefined,
        { skill }
      );
    }

    const dimensionMatch = skill.description.match(DIMENSION_REGEX);
    if (!dimensionMatch) {
      throw new ValidationError(
        `Invalid description format for question ${skill.id}`,
        undefined,
        { skill }
      );
    }

    const [, text, dimensionPart] = dimensionMatch;
    const dimension = dimensionPart.toLowerCase();
    const reversed = skill.description.includes('reversed');

    return {
      id: skill.id,
      text: text.trim(),
      dimension,
      order,
      reversed,
    };
  }

  private getStaticQuestions(): MBTIQuestion[] {
    return [
      {
        id: 'static-0',
        text: 'You think judges should be merciful.',
        dimension: 'tf',
        order: 0,
      },
      {
        id: 'static-1',
        text: 'You prefer open-ended activities.',
        dimension: 'pj',
        order: 1,
      },
      {
        id: 'static-2',
        text: 'You prefer novel over traditional.',
        dimension: 'sn',
        order: 2,
      },
      {
        id: 'static-3',
        text: 'You prefer groups to individuals.',
        dimension: 'ei',
        order: 3,
      },
      {
        id: 'static-4',
        text: 'You tend to be tolerant.',
        dimension: 'tf',
        order: 4,
      },
      {
        id: 'static-5',
        text: 'You work better under pressure.',
        dimension: 'pj',
        order: 5,
      },
      {
        id: 'static-6',
        text: 'You are methodical.',
        dimension: 'pj',
        order: 6,
      },
      {
        id: 'static-7',
        text: 'You prefer theoretical subjects.',
        dimension: 'sn',
        order: 7,
      },
      {
        id: 'static-8',
        text: 'You are sociable.',
        dimension: 'ei',
        order: 8,
      },
      {
        id: 'static-9',
        text: 'You prefer being curious.',
        dimension: 'sn',
        order: 9,
      },
      {
        id: 'static-10',
        text: 'You are expressive.',
        dimension: 'ei',
        order: 10,
      },
      {
        id: 'static-11',
        text: 'You tend to be diplomatic.',
        dimension: 'tf',
        order: 11,
      },
      {
        id: 'static-12',
        text: 'You prefer abstract over specific.',
        dimension: 'sn',
        order: 12,
      },
      {
        id: 'static-13',
        text: 'You are talkative.',
        dimension: 'ei',
        order: 13,
      },
      {
        id: 'static-14',
        text: 'You learn better by listening.',
        dimension: 'ei',
        order: 14,
      },
      {
        id: 'static-15',
        text: 'You prefer conceptual tasks.',
        dimension: 'sn',
        order: 15,
      },
      {
        id: 'static-16',
        text: 'You rely on empathy when deciding.',
        dimension: 'tf',
        order: 16,
      },
      {
        id: 'static-17',
        text: 'You prefer investigating over speculating.',
        dimension: 'sn',
        order: 17,
      },
      {
        id: 'static-18',
        text: 'You are systematic in your routines.',
        dimension: 'pj',
        order: 18,
      },
      {
        id: 'static-19',
        text: 'You prefer routine over variety.',
        dimension: 'pj',
        order: 19,
      },
    ];
  }

  private async getFallbackData(): Promise<MBTIQuestion[]> {
    if (
      this.fallbackData &&
      Date.now() - this.fallbackData.timestamp < this.config.fallback.maxAge
    ) {
      return this.fallbackData.questions;
    }

    const questions = this.getStaticQuestions();
    this.fallbackData = {
      questions,
      timestamp: Date.now(),
      source: 'static',
    };

    return questions;
  }

  async getMBTIQuestions(): Promise<MBTIQuestion[]> {
    await this.initialize();

    this.metrics.cache.totalRequests++;
    const cacheKey = 'mbti:questions';

    let questions = this.getFromMemory(cacheKey);
    if (questions) {
      return questions;
    }

    questions = await this.getFromRedis(cacheKey);
    if (questions) {
      this.setInMemory(cacheKey, questions);
      return questions;
    }

    try {
      questions = await this.getFromDatabase();

      this.setInMemory(cacheKey, questions);
      await this.setInRedis(cacheKey, questions);

      return questions;
    } catch (error) {
      console.error('Database fallback triggered:', error);

      if (this.config.fallback.enabled) {
        questions = await this.getFallbackData();
        this.setInMemory(cacheKey, questions, 60); // Short TTL for fallback
        return questions;
      }

      throw error;
    }
  }

  async getQuestionsForPage(page: number): Promise<MBTIQuestion[]> {
    const PAGE_SIZE = 6;
    const cacheKey = `mbti:page:${page}`;

    let pageQuestions = this.getFromMemory(cacheKey);
    if (pageQuestions) {
      return pageQuestions;
    }

    pageQuestions = await this.getFromRedis(cacheKey);
    if (pageQuestions) {
      this.setInMemory(cacheKey, pageQuestions);
      return pageQuestions;
    }

    const questions = await this.getMBTIQuestions();
    const startIndex = (page - 1) * PAGE_SIZE;
    pageQuestions = questions.slice(startIndex, startIndex + PAGE_SIZE);

    this.setInMemory(cacheKey, pageQuestions);
    await this.setInRedis(cacheKey, pageQuestions);

    return pageQuestions;
  }

  async getTotalPages(): Promise<number> {
    const cacheKey = 'mbti:total-pages';

    let totalPages = this.getFromMemory(cacheKey);
    if (totalPages) {
      return totalPages;
    }

    totalPages = await this.getFromRedis(cacheKey);
    if (totalPages) {
      this.setInMemory(cacheKey, totalPages);
      return totalPages;
    }

    const questions = await this.getMBTIQuestions();
    totalPages = Math.ceil(questions.length / 6);

    this.setInMemory(cacheKey, totalPages);
    await this.setInRedis(cacheKey, totalPages);

    return totalPages;
  }

  async invalidateCache(): Promise<void> {
    if (this.memoryCache) {
      this.memoryCache.flushAll();
    }

    if (this.redis) {
      try {
        const keys = await this.redis.keys('mbti:*');
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.error('Failed to invalidate Redis cache:', error);
      }
    }

    this.fallbackData = null;
  }

  async refreshCache(): Promise<void> {
    await this.invalidateCache();
    await this.warmCache();
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: boolean;
    memory: boolean;
    database: boolean;
    fallback: boolean;
  } {
    const redisHealthy =
      !this.config.redis.enabled ||
      (this.redis !== null && this.metrics.cache.errors < 10);

    const memoryHealthy =
      !this.config.memory.enabled ||
      (this.memoryCache !== null &&
        this.metrics.memory.usage < 500 * 1024 * 1024); // 500MB

    const databaseHealthy = this.metrics.database.connectionFailures < 5;

    const fallbackHealthy =
      this.fallbackData !== null || this.config.fallback.enabled;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!databaseHealthy) {
      status = 'unhealthy';
    } else if (!redisHealthy || !memoryHealthy) {
      status = 'degraded';
    }

    return {
      status,
      redis: redisHealthy,
      memory: memoryHealthy,
      database: databaseHealthy,
      fallback: fallbackHealthy,
    };
  }

  async dispose(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.memoryCache) {
      this.memoryCache.close();
      this.memoryCache = null;
    }

    this.redis = null;
    this.isInitialized = false;
  }
}

// Global instance
let globalManager: MBTIQuestionsManager | null = null;

export function getMBTIManager(): MBTIQuestionsManager {
  if (!globalManager) {
    globalManager = new MBTIQuestionsManager();
  }
  return globalManager;
}

// Public API functions
export async function getMBTIQuestions(): Promise<MBTIQuestion[]> {
  return getMBTIManager().getMBTIQuestions();
}

export async function getQuestionsForPage(
  page: number
): Promise<MBTIQuestion[]> {
  return getMBTIManager().getQuestionsForPage(page);
}

export async function getTotalPages(): Promise<number> {
  return getMBTIManager().getTotalPages();
}

export async function clearQuestionsCache(): Promise<void> {
  return getMBTIManager().invalidateCache();
}

export async function refreshQuestionsCache(): Promise<void> {
  return getMBTIManager().refreshCache();
}

export function getSystemMetrics(): SystemMetrics {
  return getMBTIManager().getMetrics();
}

export function getHealthStatus() {
  return getMBTIManager().getHealthStatus();
}

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    if (globalManager) {
      await globalManager.dispose();
    }
  });

  process.on('SIGINT', async () => {
    if (globalManager) {
      await globalManager.dispose();
    }
  });
}
