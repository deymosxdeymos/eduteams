import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  CacheError,
  DatabaseError,
  getHealthStatus,
  getMBTIManager,
  getMBTIQuestions,
  getQuestionsForPage,
  getSystemMetrics,
  getTotalPages,
  type MBTIQuestion,
  MBTIQuestionsError,
  MBTIQuestionsManager,
  type MBTISystemConfig,
  ValidationError,
} from '@/lib/mbti-questions';

// Mock dependencies
const mockPrisma = {
  skill: {
    findMany: mock(() => Promise.resolve([])),
  },
};

// Mock modules
mock.module('@/lib/prisma', () => ({ default: mockPrisma }));



const mockQuestions: MBTIQuestion[] = [
  {
    id: 'test-1',
    text: 'You prefer working in groups.',
    dimension: 'ei',
    order: 1,
    reversed: false,
  },
  {
    id: 'test-2',
    text: 'You think with your heart.',
    dimension: 'tf',
    order: 2,
    reversed: false,
  },
  {
    id: 'test-3',
    text: 'You prefer concrete details.',
    dimension: 'sn',
    order: 3,
    reversed: true,
  },
  {
    id: 'test-4',
    text: 'You like planned activities.',
    dimension: 'pj',
    order: 4,
    reversed: false,
  },
  {
    id: 'test-5',
    text: 'You are outgoing.',
    dimension: 'ei',
    order: 5,
    reversed: false,
  },
  {
    id: 'test-6',
    text: 'You value logic over emotion.',
    dimension: 'tf',
    order: 6,
    reversed: true,
  },
];

const mockSkills = mockQuestions.map((q, index) => ({
  id: q.id,
  name: `MBTI Question ${q.order}`,
  description: `${q.text} (${q.dimension.toUpperCase()} dimension)${q.reversed ? ' reversed' : ''}`,
}));

describe('MBTIQuestionsManager', () => {
  let manager: MBTIQuestionsManager;
  let originalEnv: any;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'test-token',
      NODE_ENV: 'test',
    };

    // Reset all mocks
    mockPrisma.skill.findMany.mockReset();

    // Setup default mock behavior
    mockPrisma.skill.findMany.mockResolvedValue(mockSkills);

    manager = new MBTIQuestionsManager();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await manager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      const questions = await manager.getMBTIQuestions();
      expect(questions).toHaveLength(mockQuestions.length);
    });

    it('should initialize with custom config', async () => {
      const customConfig: Partial<MBTISystemConfig> = {
        redis: { enabled: false },
        memory: { ttl: 300 },
      };

      const customManager = new MBTIQuestionsManager(customConfig);
      const questions = await customManager.getMBTIQuestions();

      expect(questions).toHaveLength(mockQuestions.length);
      await customManager.dispose();
    });

    it.skip('should handle Redis connection failure gracefully', async () => {
      // Skipped: Redis not needed for now
      const manager = new MBTIQuestionsManager();
      const questions = await manager.getMBTIQuestions();

      expect(questions).toHaveLength(mockQuestions.length);
      await manager.dispose();
    });
  });

  describe('Question Retrieval', () => {
    it('should fetch questions from database', async () => {
      const questions = await manager.getMBTIQuestions();

      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { name: { startsWith: 'MBTI Question' } },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, description: true },
      });

      expect(questions).toHaveLength(mockQuestions.length);
      questions.forEach((question, index) => {
        expect(question).toMatchObject({
          id: mockQuestions[index].id,
          text: mockQuestions[index].text,
          dimension: mockQuestions[index].dimension,
          order: mockQuestions[index].order,
          reversed: mockQuestions[index].reversed,
          validated: true,
        });
        expect(question.validatedAt).toBeTypeOf('number');
        expect(question.validatedAt).toBeGreaterThan(0);
      });
    });

    it('should return cached questions on subsequent calls', async () => {
      await manager.getMBTIQuestions();
      await manager.getMBTIQuestions();

      expect(mockPrisma.skill.findMany).toHaveBeenCalledTimes(1);
    });

    it('should validate question format', async () => {
      const invalidSkill = {
        id: 'invalid',
        name: 'MBTI Question 1',
        description: 'Invalid format',
      };

      mockPrisma.skill.findMany.mockResolvedValue([invalidSkill]);

      await expect(manager.getMBTIQuestions()).rejects.toThrow(ValidationError);
    });

    it('should handle missing description', async () => {
      const invalidSkill = {
        id: 'no-desc',
        name: 'MBTI Question 1',
        description: null,
      };

      mockPrisma.skill.findMany.mockResolvedValue([invalidSkill]);

      await expect(manager.getMBTIQuestions()).rejects.toThrow(ValidationError);
    });

    it('should fallback to static questions on database error', async () => {
      mockPrisma.skill.findMany.mockRejectedValue(new Error('Database error'));

      const questions = await manager.getMBTIQuestions();

      expect(questions).toHaveLength(20); // Static questions count
      expect(questions[0].id).toBe('static-0');
    });
  });

  describe('Caching', () => {
    it('should cache questions in memory', async () => {
      await manager.getMBTIQuestions();

      // Clear database mock to ensure it's not called again
      mockPrisma.skill.findMany.mockClear();

      const questions = await manager.getMBTIQuestions();
      expect(mockPrisma.skill.findMany).not.toHaveBeenCalled();
      
      expect(questions).toHaveLength(mockQuestions.length);
      questions.forEach((question, index) => {
        expect(question).toMatchObject({
          id: mockQuestions[index].id,
          text: mockQuestions[index].text,
          dimension: mockQuestions[index].dimension,
          order: mockQuestions[index].order,
          reversed: mockQuestions[index].reversed,
          validated: true,
        });
        expect(question.validatedAt).toBeTypeOf('number');
        expect(question.validatedAt).toBeGreaterThan(0);
      });
    });

    it.skip('should cache questions in Redis', async () => {
      // Skipped: Redis not needed for now
    });

    it.skip('should retrieve from Redis cache', async () => {
      // Skipped: Redis not needed for now  
    });

    it.skip('should handle Redis errors gracefully', async () => {
      // Skipped: Redis not needed for now
    });
  });

  describe('Pagination', () => {
    it('should return questions for specific page', async () => {
      const page1 = await manager.getQuestionsForPage(1);
      const page2 = await manager.getQuestionsForPage(2);

      expect(page1).toHaveLength(6);
      expect(page2).toHaveLength(0); // Only 6 questions total
      expect(page1[0]).toEqual(mockQuestions[0]);
    });

    it('should calculate total pages correctly', async () => {
      const totalPages = await manager.getTotalPages();
      expect(totalPages).toBe(1); // 6 questions / 6 per page = 1 page
    });

    it('should cache paginated results', async () => {
      await manager.getQuestionsForPage(1);

      // Clear database mock
      mockPrisma.skill.findMany.mockClear();

      const page1Again = await manager.getQuestionsForPage(1);
      expect(mockPrisma.skill.findMany).not.toHaveBeenCalled();
      expect(page1Again).toHaveLength(6);
    });
  });

  describe('Cache Management', () => {
    it.skip('should invalidate all caches', async () => {
      // Skipped: Redis not needed for now
    });

    it.skip('should refresh cache', async () => {
      // Skipped: Redis not needed for now
    });
  });

  describe('Error Handling', () => {
    it('should handle database timeout', async () => {
      mockPrisma.skill.findMany.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database timeout')), 100)
          )
      );

      const questions = await manager.getMBTIQuestions();

      expect(questions).toHaveLength(20); // Fallback to static
    });

    it('should retry database operations', async () => {
      mockPrisma.skill.findMany
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue(mockSkills);

      const questions = await manager.getMBTIQuestions();

      expect(mockPrisma.skill.findMany).toHaveBeenCalledTimes(3);
      expect(questions).toEqual(mockQuestions);
    });

    it('should throw DatabaseError after max retries', async () => {
      mockPrisma.skill.findMany.mockRejectedValue(
        new Error('Persistent error')
      );

      const manager = new MBTIQuestionsManager({
        fallback: { enabled: false },
      });

      await expect(manager.getMBTIQuestions()).rejects.toThrow(DatabaseError);
      await manager.dispose();
    });

    it('should validate dimension values', async () => {
      const invalidSkill = {
        id: 'invalid-dim',
        name: 'MBTI Question 1',
        description: 'Test question (INVALID dimension)',
      };

      mockPrisma.skill.findMany.mockResolvedValue([invalidSkill]);

      await expect(manager.getMBTIQuestions()).rejects.toThrow(ValidationError);
    });
  });

  describe('Monitoring and Metrics', () => {
    it('should track cache metrics', async () => {
      await manager.getMBTIQuestions(); // Miss
      await manager.getMBTIQuestions(); // Hit

      const metrics = manager.getMetrics();

      expect(metrics.cache.hits).toBeGreaterThan(0);
      expect(metrics.cache.misses).toBeGreaterThan(0);
      expect(metrics.cache.totalRequests).toBeGreaterThan(0);
    });

    it('should track database metrics', async () => {
      await manager.getMBTIQuestions();

      const metrics = manager.getMetrics();

      expect(metrics.database.queries).toBeGreaterThan(0);
      expect(metrics.database.lastQuery).toBeGreaterThan(0);
    });

    it('should provide health status', async () => {
      const health = manager.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.redis).toBe(true);
      expect(health.memory).toBe(true);
      expect(health.database).toBe(true);
      expect(health.fallback).toBe(true);
    });

    it('should detect unhealthy database', async () => {
      // Simulate multiple database failures
      const manager = new MBTIQuestionsManager();

      for (let i = 0; i < 6; i++) {
        mockPrisma.skill.findMany.mockRejectedValue(new Error('DB Error'));
        try {
          await manager.getMBTIQuestions();
        } catch (e) {
          // Expected to fail and fallback
        }
      }

      const health = manager.getHealthStatus();
      expect(health.status).toBe('unhealthy');
      expect(health.database).toBe(false);

      await manager.dispose();
    });
  });

  describe('Performance', () => {
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        manager.getMBTIQuestions()
      );

      const results = await Promise.all(promises);

      results.forEach(questions => {
        expect(questions).toEqual(mockQuestions);
      });

      // Should only call database once due to caching
      expect(mockPrisma.skill.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle memory pressure', async () => {
      const manager = new MBTIQuestionsManager({
        memory: { maxKeys: 1 },
      });

      await manager.getMBTIQuestions();
      await manager.getQuestionsForPage(1);
      await manager.getQuestionsForPage(2);

      const metrics = manager.getMetrics();
      expect(metrics.cache.totalRequests).toBeGreaterThan(0);

      await manager.dispose();
    });
  });

  describe('Background Operations', () => {
    it('should warm cache on initialization', async () => {
      const manager = new MBTIQuestionsManager();

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockPrisma.skill.findMany).toHaveBeenCalled();
      await manager.dispose();
    });

    it.skip('should persist metrics to Redis', async () => {
      // Skipped: Redis functionality removed
    });
  });
});

describe('Public API Functions', () => {
  beforeEach(() => {
    mockPrisma.skill.findMany.mockResolvedValue(mockSkills);
  });

  afterEach(async () => {
    await getMBTIManager().dispose();
  });

  it('should export getMBTIQuestions function', async () => {
    const questions = await getMBTIQuestions();
    expect(questions).toEqual(mockQuestions);
  });

  it('should export getQuestionsForPage function', async () => {
    const page1 = await getQuestionsForPage(1);
    expect(page1).toHaveLength(6);
  });

  it('should export getTotalPages function', async () => {
    const totalPages = await getTotalPages();
    expect(totalPages).toBe(1);
  });

  it.skip('should export clearQuestionsCache function', async () => {
    // Skipped: Redis not needed for now
  });

  it.skip('should export refreshQuestionsCache function', async () => {
    // Skipped: Redis not needed for now
  });

  it('should export getSystemMetrics function', () => {
    const metrics = getSystemMetrics();
    expect(metrics).toHaveProperty('cache');
    expect(metrics).toHaveProperty('database');
    expect(metrics).toHaveProperty('memory');
  });

  it('should export getHealthStatus function', () => {
    const health = getHealthStatus();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('redis');
    expect(health).toHaveProperty('memory');
    expect(health).toHaveProperty('database');
    expect(health).toHaveProperty('fallback');
  });
});

describe('Error Classes', () => {
  it('should create MBTIQuestionsError with context', () => {
    const context = { key: 'value' };
    const error = new MBTIQuestionsError(
      'Test error',
      'TEST_CODE',
      undefined,
      context
    );

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.context).toEqual(context);
    expect(error.name).toBe('MBTIQuestionsError');
  });

  it('should create CacheError', () => {
    const cause = new Error('Cache failed');
    const error = new CacheError('Cache error', cause);

    expect(error.code).toBe('CACHE_ERROR');
    expect(error.cause).toBe(cause);
  });

  it('should create DatabaseError', () => {
    const cause = new Error('DB failed');
    const error = new DatabaseError('Database error', cause);

    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.cause).toBe(cause);
  });

  it('should create ValidationError', () => {
    const cause = new Error('Validation failed');
    const error = new ValidationError('Validation error', cause);

    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.cause).toBe(cause);
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    mockPrisma.skill.findMany.mockResolvedValue(mockSkills);
  });

  it('should handle empty database results', async () => {
    mockPrisma.skill.findMany.mockResolvedValue([]);

    const questions = await getMBTIQuestions();

    expect(questions).toHaveLength(20); // Fallback to static
  });

  it.skip('should handle malformed Redis data', async () => {
    // Skipped: Redis functionality removed
  });

  it('should handle page out of bounds', async () => {
    const pageQuestions = await getQuestionsForPage(999);
    expect(pageQuestions).toHaveLength(0);
  });

  it('should handle negative page numbers', async () => {
    const pageQuestions = await getQuestionsForPage(-1);
    expect(pageQuestions).toHaveLength(0);
  });

  it('should handle zero page number', async () => {
    const pageQuestions = await getQuestionsForPage(0);
    expect(pageQuestions).toHaveLength(0);
  });

  it('should handle process signals for cleanup', async () => {
    const manager = new MBTIQuestionsManager();

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Should not throw
    await new Promise(resolve => setTimeout(resolve, 100));

    await manager.dispose();
  });
});
