import { Redis } from '@upstash/redis';
import NodeCache from 'node-cache';
import { logger } from '@/lib/logger';
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
  private metricsInterval: Timeout | null = null;

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
      logger.error('Failed to initialize MBTI Questions Manager:', error);
      this.isInitialized = true;
    }
  }

  private async testRedisConnection(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.ping();
    } catch (error) {
      logger.warn('Redis connection test failed:', error);
      this.redis = null;
    }
  }

  private startMetricsCollection(): void {
    if (this.metricsInterval) return;

    this.metricsInterval = setInterval(() => {
      this.updateMemoryMetrics();
      this.persistMetrics();
    }, this.config.monitoring.metricsInterval) as unknown as Timeout;
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
      logger.error('Failed to persist metrics:', error);
    }
  }

  private async warmCache(): Promise<void> {
    try {
      await this.getMBTIQuestions();
      logger.info('Cache warmed successfully');
    } catch (error) {
      logger.error('Failed to warm cache:', error);
    }
  }

  private getStaticQuestions(): MBTIQuestion[] {
    // Static fallback set, mirrors prisma/seed.ts content and order
    // This ensures the UI works even if DB is not seeded or temporarily unavailable
    return [
      // EI 1-6
      {
        id: 'static-1',
        text: 'Kamu lebih suka kelompok daripada individu.',
        dimension: 'ei',
        order: 1,
        reversed: false,
      },
      {
        id: 'static-2',
        text: 'Kamu bersosialisasi.',
        dimension: 'ei',
        order: 2,
        reversed: false,
      },
      {
        id: 'static-3',
        text: 'Kamu ekspresif.',
        dimension: 'ei',
        order: 3,
        reversed: false,
      },
      {
        id: 'static-4',
        text: 'Kamu belajar lebih baik dengan mendengarkan.',
        dimension: 'ei',
        order: 4,
        reversed: true,
      },
      {
        id: 'static-5',
        text: 'Kamu banyak bicara.',
        dimension: 'ei',
        order: 5,
        reversed: false,
      },
      {
        id: 'static-6',
        text: 'Kamu senang bertemu orang baru.',
        dimension: 'ei',
        order: 6,
        reversed: false,
      },
      // SN 7-12
      {
        id: 'static-7',
        text: 'Kamu lebih suka mata pelajaran teoritis.',
        dimension: 'sn',
        order: 7,
        reversed: false,
      },
      {
        id: 'static-8',
        text: 'Kamu lebih suka yang baru daripada yang tradisional.',
        dimension: 'sn',
        order: 8,
        reversed: false,
      },
      {
        id: 'static-9',
        text: 'Kamu lebih suka menjadi penasaran.',
        dimension: 'sn',
        order: 9,
        reversed: true,
      },
      {
        id: 'static-10',
        text: 'Kamu lebih suka abstrak daripada spesifik.',
        dimension: 'sn',
        order: 10,
        reversed: false,
      },
      {
        id: 'static-11',
        text: 'Kamu memperhatikan pola lebih daripada detail.',
        dimension: 'sn',
        order: 11,
        reversed: true,
      },
      {
        id: 'static-12',
        text: 'Kamu lebih suka tugas konseptual.',
        dimension: 'sn',
        order: 12,
        reversed: false,
      },
      // TF 13-18
      {
        id: 'static-13',
        text: 'Kamu berpikir hakim harus bermurah hati.',
        dimension: 'tf',
        order: 13,
        reversed: false,
      },
      {
        id: 'static-14',
        text: 'Kamu cenderung diplomatis.',
        dimension: 'tf',
        order: 14,
        reversed: true,
      },
      {
        id: 'static-15',
        text: 'Kamu mengandalkan empati saat memutuskan.',
        dimension: 'tf',
        order: 15,
        reversed: true,
      },
      {
        id: 'static-16',
        text: 'Kamu memprioritaskan keadilan daripada harmoni.',
        dimension: 'tf',
        order: 16,
        reversed: false,
      },
      {
        id: 'static-17',
        text: 'Kamu menghargai logika daripada emosi.',
        dimension: 'tf',
        order: 17,
        reversed: true,
      },
      {
        id: 'static-18',
        text: 'Kamu mempertimbangkan perasaan orang lain saat menghakimi.',
        dimension: 'tf',
        order: 18,
        reversed: false,
      },
      // PJ 19-24
      {
        id: 'static-19',
        text: 'Kamu sistematis dalam rutinitas.',
        dimension: 'pj',
        order: 19,
        reversed: false,
      },
      {
        id: 'static-20',
        text: 'Kamu lebih suka rutinitas daripada variasi.',
        dimension: 'pj',
        order: 20,
        reversed: true,
      },
      {
        id: 'static-21',
        text: 'Kamu bekerja lebih baik di bawah tekanan.',
        dimension: 'pj',
        order: 21,
        reversed: false,
      },
      {
        id: 'static-22',
        text: 'Kamu metodis.',
        dimension: 'pj',
        order: 22,
        reversed: true,
      },
      {
        id: 'static-23',
        text: 'Kamu lebih suka aktivitas terbuka.',
        dimension: 'pj',
        order: 23,
        reversed: true,
      },
      {
        id: 'static-24',
        text: 'Kamu suka merencanakan ke depan.',
        dimension: 'pj',
        order: 24,
        reversed: false,
      },
    ];
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);
      if (data) {
        this.metrics.cache.hits++;
        return JSON.parse(data as string) as T;
      }
      this.metrics.cache.misses++;
      return null;
    } catch (error) {
      this.metrics.cache.errors++;
      logger.error('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.set(key, JSON.stringify(value), {
        ex: ttl || this.config.redis.ttl,
      });
    } catch (error) {
      this.metrics.cache.errors++;
      logger.error('Redis set error:', error);
    }
  }

  private getFromMemory<T>(key: string): T | null {
    if (!this.memoryCache) return null;

    try {
      const data = this.memoryCache.get(key);
      if (data !== undefined) {
        this.metrics.cache.hits++;
        return data as T;
      }
      this.metrics.cache.misses++;
      return null;
    } catch (error) {
      this.metrics.cache.errors++;
      logger.error('Memory cache get error:', error);
      return null;
    }
  }

  private setInMemory<T>(key: string, value: T, ttl?: number): void {
    if (!this.memoryCache) return;

    try {
      this.memoryCache.set(key, value, ttl || this.config.memory.ttl);
    } catch (error) {
      this.metrics.cache.errors++;
      logger.error('Memory cache set error:', error);
    }
  }

  private async getFromDatabase(): Promise<MBTIQuestion[]> {
    let attempts = 0;

    while (attempts < this.config.database.maxRetries) {
      attempts++;
      try {
        this.metrics.database.queries++;
        this.metrics.database.lastQuery = Date.now();

        // Prefer new dedicated table if available
        const pqClient = (
          prisma as unknown as Record<
            string,
            {
              findMany?: (args: {
                orderBy?: { order: 'asc' | 'desc' };
                select?: Record<string, boolean>;
              }) => Promise<
                Array<{
                  id: string;
                  text: string;
                  dimension: string;
                  order: number;
                  reversed: boolean;
                }>
              >;
            }
          >
        ).personalityQuestion;

        let questions: MBTIQuestion[] | null = null;

        if (pqClient && typeof pqClient.findMany === 'function') {
          const rows = (await Promise.race([
            pqClient.findMany({
              orderBy: { order: 'asc' },
              select: {
                id: true,
                text: true,
                dimension: true,
                order: true,
                reversed: true,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Database timeout')),
                this.config.database.timeout
              )
            ),
          ])) as Array<{
            id: string;
            text: string;
            dimension: string;
            order: number;
            reversed: boolean;
          }>;

          questions = rows.map(row => ({
            id: row.id,
            text: row.text,
            dimension: row.dimension,
            order: row.order,
            reversed: row.reversed,
          }));
        }

        if (questions) {
          return questions;
        }

        // Fallback to original table if dedicated table not available
        const rows = (await Promise.race([
          prisma.personalityQuestion.findMany({
            orderBy: { order: 'asc' },
            select: {
              id: true,
              text: true,
              dimension: true,
              order: true,
              reversed: true,
            },
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Database timeout')),
              this.config.database.timeout
            )
          ),
        ])) as Array<{
          id: string;
          text: string;
          dimension: string;
          order: number;
          reversed: boolean;
        }>;

        return rows.map(row => ({
          id: row.id,
          text: row.text,
          dimension: row.dimension,
          order: row.order,
          reversed: row.reversed,
        }));
      } catch (error) {
        this.metrics.database.errors++;
        if (attempts >= this.config.database.maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve =>
          setTimeout(resolve, this.config.database.retryDelay)
        );
      }
    }

    throw new Error('Database query failed after all retries');
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

    let questions = this.getFromMemory<MBTIQuestion[]>(cacheKey);
    if (questions) {
      return questions;
    }

    questions = await this.getFromRedis<MBTIQuestion[]>(cacheKey);
    if (questions) {
      this.setInMemory(cacheKey, questions);
      return questions;
    }

    try {
      questions = await this.getFromDatabase();

      // If database returned zero questions, provide a static fallback so UI keeps working.
      // Use short in-memory TTL and skip Redis so fresh seeds are picked up quickly.
      if (questions.length === 0) {
        const fallback = await this.getFallbackData();
        this.setInMemory(cacheKey, fallback, 60);
        return fallback;
      }

      this.setInMemory(cacheKey, questions);
      await this.setInRedis(cacheKey, questions);

      return questions;
    } catch (error) {
      // If it's a validation error, don't use fallback - throw immediately
      if (error instanceof ValidationError) {
        throw error;
      }

      logger.error('Database fallback triggered:', error);

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

    let pageQuestions = this.getFromMemory<MBTIQuestion[]>(cacheKey);
    if (pageQuestions) {
      return pageQuestions;
    }

    pageQuestions = await this.getFromRedis<MBTIQuestion[]>(cacheKey);
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

    let totalPages = this.getFromMemory<number>(cacheKey);
    if (totalPages) {
      return totalPages;
    }

    totalPages = await this.getFromRedis<number>(cacheKey);
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
        logger.error('Failed to invalidate Redis cache:', error);
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
      clearInterval(this.metricsInterval as any);
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
