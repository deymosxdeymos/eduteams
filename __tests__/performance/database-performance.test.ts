import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { performance } from 'perf_hooks';
import prisma from '../../src/lib/prisma';
import { performanceMonitor } from './utils/performance-monitor';

interface DatabaseQueryMetrics {
  queryType: string;
  totalQueries: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  throughput: number;
  errors: number;
  connectionPoolUsage: number;
  slowQueries: number;
}

interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  poolUsage: number;
  maxPoolSize: number;
  waitingRequests: number;
  connectionErrors: number;
}

interface DatabaseStressTestResult {
  testName: string;
  duration: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  avgResponseTime: number;
  throughput: number;
  connectionPoolMetrics: ConnectionPoolMetrics;
  queryMetrics: DatabaseQueryMetrics[];
  bottlenecks: string[];
  recommendations: string[];
}

class DatabasePerformanceMonitor {
  private queryMetrics: Map<string, number[]> = new Map();
  private connectionMetrics: ConnectionPoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    poolUsage: 0,
    maxPoolSize: 10,
    waitingRequests: 0,
    connectionErrors: 0,
  };
  private queryErrors: number = 0;
  private startTime: number = 0;

  startMonitoring(): void {
    this.queryMetrics.clear();
    this.queryErrors = 0;
    this.startTime = performance.now();
  }

  recordQuery(queryType: string, duration: number, error?: Error): void {
    if (!this.queryMetrics.has(queryType)) {
      this.queryMetrics.set(queryType, []);
    }

    if (error) {
      this.queryErrors++;
    } else {
      this.queryMetrics.get(queryType)!.push(duration);
    }
  }

  getQueryMetrics(): DatabaseQueryMetrics[] {
    return Array.from(this.queryMetrics.entries()).map(([queryType, times]) => {
      times.sort((a, b) => a - b);
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const avgTime = totalTime / times.length;
      const slowQueries = times.filter(time => time > 1000).length; // Queries > 1s

      return {
        queryType,
        totalQueries: times.length,
        totalTime,
        avgTime,
        minTime: times[0] || 0,
        maxTime: times[times.length - 1] || 0,
        p50: times[Math.floor(times.length * 0.5)] || 0,
        p90: times[Math.floor(times.length * 0.9)] || 0,
        p95: times[Math.floor(times.length * 0.95)] || 0,
        p99: times[Math.floor(times.length * 0.99)] || 0,
        throughput:
          times.length / ((performance.now() - this.startTime) / 1000),
        errors: this.queryErrors,
        connectionPoolUsage: this.connectionMetrics.poolUsage,
        slowQueries,
      };
    });
  }

  updateConnectionMetrics(metrics: Partial<ConnectionPoolMetrics>): void {
    this.connectionMetrics = { ...this.connectionMetrics, ...metrics };
  }

  reset(): void {
    this.queryMetrics.clear();
    this.queryErrors = 0;
    this.startTime = 0;
  }
}

async function measureQuery<T>(
  monitor: DatabasePerformanceMonitor,
  queryType: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  let error: Error | undefined;
  let result: T;

  try {
    result = await queryFn();
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
    throw error;
  } finally {
    const duration = performance.now() - start;
    monitor.recordQuery(queryType, duration, error);
  }

  return result;
}

async function createTestUsers(count: number): Promise<string[]> {
  const users: string[] = [];

  for (let i = 0; i < count; i++) {
    const user = await prisma.user.create({
      data: {
        id: `test-user-${i}-${Date.now()}`,
        name: `Test User ${i}`,
        email: `test-user-${i}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ei: Math.random() * 2 - 1, // Random value between -1 and 1
        sn: Math.random() * 2 - 1,
        tf: Math.random() * 2 - 1,
        pj: Math.random() * 2 - 1,
        mbtiType: ['INTJ', 'ENFP', 'ISTP', 'ESFJ'][
          Math.floor(Math.random() * 4)
        ] as any,
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        role: Math.random() > 0.5 ? 'STUDENT' : 'TEACHER',
        isOnboarded: Math.random() > 0.3,
        onboardingStep: Math.random() > 0.5 ? 'kepribadian' : 'role',
      },
    });
    users.push(user.id);
  }

  return users;
}

async function cleanupTestUsers(userIds: string[]): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });
}

async function createTestSkills(count: number): Promise<string[]> {
  const skills: string[] = [];

  for (let i = 0; i < count; i++) {
    const skill = await prisma.skill.create({
      data: {
        name: `Test Skill ${i}`,
        description: `Description for test skill ${i}`,
      },
    });
    skills.push(skill.id);
  }

  return skills;
}

async function cleanupTestSkills(skillIds: string[]): Promise<void> {
  await prisma.skill.deleteMany({
    where: {
      id: {
        in: skillIds,
      },
    },
  });
}

describe('Database Query Performance Tests', () => {
  let dbMonitor: DatabasePerformanceMonitor;
  let testUserIds: string[] = [];
  let testSkillIds: string[] = [];
  let isDatabaseAvailable = false;

  beforeEach(async () => {
    dbMonitor = new DatabasePerformanceMonitor();
    dbMonitor.startMonitoring();
    
    // Test database connectivity
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isDatabaseAvailable = true;
    } catch (error) {
      console.warn('Database not available for performance tests, skipping...');
      isDatabaseAvailable = false;
    }
  });

  afterEach(async () => {
    if (!isDatabaseAvailable) return;
    
    dbMonitor.reset();

    // Clean up test data
    if (testUserIds.length > 0) {
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    }

    if (testSkillIds.length > 0) {
      await cleanupTestSkills(testSkillIds);
      testSkillIds = [];
    }
  });

  describe('User Query Performance', () => {
    it('should handle single user queries efficiently', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      testUserIds = await createTestUsers(100);

      const result = await performanceMonitor.measureAsync(
        'Single user query performance',
        async () => {
          const userId =
            testUserIds[Math.floor(Math.random() * testUserIds.length)];
          await measureQuery(dbMonitor, 'findUnique', () =>
            prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                mbtiType: true,
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
            })
          );
        },
        1000
      );

      performanceMonitor.printBenchmarkResult(result);

      expect(result.avgDuration).toBeLessThan(50); // Less than 50ms
      expect(result.p95).toBeLessThan(100); // P95 less than 100ms
      expect(result.throughput).toBeGreaterThan(20); // At least 20 ops/sec
      expect(result.errors).toBe(0);
    });

    it('should handle bulk user queries efficiently', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      // Use smaller dataset in CI to avoid timeouts
      const testSize = process.env.CI ? 200 : 1000;
      testUserIds = await createTestUsers(testSize);

      const result = await performanceMonitor.measureAsync(
        'Bulk user query performance',
        async () => {
          await measureQuery(dbMonitor, 'findMany', () =>
            prisma.user.findMany({
              take: 50,
              select: {
                id: true,
                name: true,
                email: true,
                mbtiType: true,
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            })
          );
        },
        100
      );

      performanceMonitor.printBenchmarkResult(result);

      expect(result.avgDuration).toBeLessThan(100); // Less than 100ms
      expect(result.p95).toBeLessThan(200); // P95 less than 200ms
      expect(result.throughput).toBeGreaterThan(10); // At least 10 ops/sec
      expect(result.errors).toBe(0);
    });

    it('should handle complex user queries with joins', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      // Use smaller dataset in CI to avoid timeouts
      const testSize = process.env.CI ? 100 : 500;
      testUserIds = await createTestUsers(testSize);
      testSkillIds = await createTestSkills(100);

      // Create some person-skill relationships with unique (personId, skillId) pairs
      const usedPairs = new Set<string>();
      let created = 0;
      const maxPairs = Math.min(testUserIds.length * testSkillIds.length, 1000);
      while (created < maxPairs) {
        const userId =
          testUserIds[Math.floor(Math.random() * testUserIds.length)];
        const skillId =
          testSkillIds[Math.floor(Math.random() * testSkillIds.length)];
        const pairKey = `${userId}:${skillId}`;
        if (usedPairs.has(pairKey)) continue;
        usedPairs.add(pairKey);
        await prisma.personSkill.create({
          data: {
            personId: userId,
            skillId: skillId,
            level: Math.random() * 5,
          },
      },
      15000 // 15 second timeout for this heavy test
    );        created++;
      }

      // TypeScript: ensure testUserIds and testSkillIds are string[]
      testUserIds = testUserIds.map(String);
      testSkillIds = testSkillIds.map(String);

      const result = await performanceMonitor.measureAsync(
        'Complex user query with joins',
        async () => {
          await measureQuery(dbMonitor, 'findManyWithJoins', () =>
            prisma.user.findMany({
              take: 20,
              include: {
                personSkills: {
                  take: 5,
                  include: {
                    skill: true,
                  },
                },
              },
              where: {
                isOnboarded: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            })
          );
        },
        50
      );

      performanceMonitor.printBenchmarkResult(result);

      expect(result.avgDuration).toBeLessThan(500); // Less than 500ms
      expect(result.p95).toBeLessThan(1000); // P95 less than 1s
      expect(result.throughput).toBeGreaterThan(2); // At least 2 ops/sec
      expect(result.errors).toBe(0);
    });
  });

  describe('Skill Query Performance', () => {
    it('should handle skill search queries efficiently', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      testSkillIds = await createTestSkills(1000);

      const result = await performanceMonitor.measureAsync(
        'Skill search query performance',
        async () => {
          const searchTerm = `Test Skill ${Math.floor(Math.random() * 100)}`;
          await measureQuery(dbMonitor, 'skillSearch', () =>
            prisma.skill.findMany({
              where: {
                name: {
                  contains: searchTerm,
                },
              },
              take: 10,
              orderBy: {
                name: 'asc',
              },
            })
          );
        },
        200
      );

      performanceMonitor.printBenchmarkResult(result);

      expect(result.avgDuration).toBeLessThan(100); // Less than 100ms
      expect(result.p95).toBeLessThan(200); // P95 less than 200ms
      expect(result.throughput).toBeGreaterThan(10); // At least 10 ops/sec
      expect(result.errors).toBe(0);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should handle concurrent queries without pool exhaustion', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      testUserIds = await createTestUsers(100);

      const concurrentQueries = 50;
      const queriesPerWorker = 10;

      const result = await performanceMonitor.loadTest(
        'Connection pool stress test',
        async () => {
          const promises = [];
          for (let i = 0; i < queriesPerWorker; i++) {
            const userId =
              testUserIds[Math.floor(Math.random() * testUserIds.length)];
            promises.push(
              measureQuery(dbMonitor, 'concurrent', () =>
                prisma.user.findUnique({
                  where: { id: userId },
                  select: {
                    id: true,
                    name: true,
                    mbtiType: true,
                  },
                })
              )
            );
          }
          await Promise.all(promises);
        },
        {
          concurrency: concurrentQueries,
          duration: 30000, // 30 seconds
          maxRequests: 1000,
        }
      );

      performanceMonitor.printLoadTestResult(result);

      expect(result.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(result.avgResponseTime).toBeLessThan(1000); // Less than 1s average
      expect(result.p95).toBeLessThan(2000); // P95 less than 2s
      expect(result.throughput).toBeGreaterThan(10); // At least 10 req/sec
    });
  });

  describe('Database Stress Tests', () => {
    it('should handle high write load', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      const result = await performanceMonitor.loadTest(
        'High write load test',
        async () => {
          const userData = {
            id: `test-user-${Date.now()}-${Math.random()}`,
            name: `Test User ${Math.random()}`,
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ei: Math.random() * 2 - 1,
            sn: Math.random() * 2 - 1,
            tf: Math.random() * 2 - 1,
            pj: Math.random() * 2 - 1,
            mbtiType: ['INTJ', 'ENFP', 'ISTP', 'ESFJ'][
              Math.floor(Math.random() * 4)
            ] as any,
          };

          const user = await measureQuery(dbMonitor, 'create', () =>
            prisma.user.create({ data: userData })
          );

          testUserIds.push(user.id);
        },
        {
          concurrency: 10,
          duration: 20000, // 20 seconds
          maxRequests: 500,
        }
      );

      performanceMonitor.printLoadTestResult(result);

      expect(result.errorRate).toBeLessThan(0.1); // Less than 10% error rate
      expect(result.avgResponseTime).toBeLessThan(500); // Less than 500ms average
      expect(result.throughput).toBeGreaterThan(5); // At least 5 req/sec
    });

    it('should handle high read load', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      // Use smaller dataset in CI to avoid timeouts
      const testSize = process.env.CI ? 200 : 1000;
      testUserIds = await createTestUsers(testSize);

      const result = await performanceMonitor.loadTest(
        'High read load test',
        async () => {
          const userId =
            testUserIds[Math.floor(Math.random() * testUserIds.length)];
          await measureQuery(dbMonitor, 'read', () =>
            prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                mbtiType: true,
                ei: true,
                sn: true,
                tf: true,
                pj: true,
              },
            })
          );
        },
        {
          concurrency: 20,
          duration: 30000, // 30 seconds
          maxRequests: 2000,
        }
      );

      performanceMonitor.printLoadTestResult(result);

      expect(result.errorRate).toBeLessThan(0.02); // Less than 2% error rate
      expect(result.avgResponseTime).toBeLessThan(100); // Less than 100ms average
      expect(result.throughput).toBeGreaterThan(50); // At least 50 req/sec
    });

    it('should handle mixed read/write load', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      // Use smaller dataset in CI to avoid timeouts
      const testSize = process.env.CI ? 100 : 500;
      testUserIds = await createTestUsers(testSize);

      const result = await performanceMonitor.loadTest(
        'Mixed read/write load test',
        async () => {
          if (Math.random() > 0.7) {
            // 30% writes
            const userData = {
              id: `test-user-${Date.now()}-${Math.random()}`,
              name: `Test User ${Math.random()}`,
              email: `test-${Date.now()}-${Math.random()}@example.com`,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              ei: Math.random() * 2 - 1,
              sn: Math.random() * 2 - 1,
              tf: Math.random() * 2 - 1,
              pj: Math.random() * 2 - 1,
              mbtiType: ['INTJ', 'ENFP', 'ISTP', 'ESFJ'][
                Math.floor(Math.random() * 4)
              ] as any,
            };

            const user = await measureQuery(dbMonitor, 'write', () =>
              prisma.user.create({ data: userData })
            );

            testUserIds.push(user.id);
          } else {
            // 70% reads
            const userId =
              testUserIds[Math.floor(Math.random() * testUserIds.length)];
            await measureQuery(dbMonitor, 'read', () =>
              prisma.user.findUnique({
                where: { id: userId },
                select: {
                  id: true,
                  name: true,
                  mbtiType: true,
                },
              })
            );
          }
        },
        {
          concurrency: 15,
          duration: 25000, // 25 seconds
          maxRequests: 1000,
        }
      );

      performanceMonitor.printLoadTestResult(result);

      expect(result.errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(result.avgResponseTime).toBeLessThan(200); // Less than 200ms average
      expect(result.throughput).toBeGreaterThan(20); // At least 20 req/sec
    });
  });

  describe('Query Optimization Tests', () => {
    it(
      'should demonstrate index effectiveness', 
      async () => {
        if (!isDatabaseAvailable) {
          console.log('Skipping test: Database not available');
          return;
        }
        
        // Use smaller dataset in CI to avoid timeouts
        const testSize = process.env.CI ? 1000 : 5000;
        testUserIds = await createTestUsers(testSize);

      // Query with index (by id)
      const indexedResult = await performanceMonitor.measureAsync(
        'Indexed query performance',
        async () => {
          const userId =
            testUserIds[Math.floor(Math.random() * testUserIds.length)];
          await measureQuery(dbMonitor, 'indexed', () =>
            prisma.user.findUnique({
              where: { id: userId },
            })
          );
        },
        100
      );

      // Query without index (by name pattern)
      const nonIndexedResult = await performanceMonitor.measureAsync(
        'Non-indexed query performance',
        async () => {
          await measureQuery(dbMonitor, 'nonIndexed', () =>
            prisma.user.findMany({
              where: {
                name: {
                  contains: 'Test User',
                },
              },
              take: 10,
            })
          );
        },
        100
      );

      console.log('Index effectiveness comparison:');
      console.log(
        `Indexed query avg: ${indexedResult.avgDuration.toFixed(2)}ms`
      );
      console.log(
        `Non-indexed query avg: ${nonIndexedResult.avgDuration.toFixed(2)}ms`
      );
      console.log(
        `Performance improvement: ${(nonIndexedResult.avgDuration / indexedResult.avgDuration).toFixed(2)}x`
      );

      // Indexed queries should be significantly faster
      expect(indexedResult.avgDuration).toBeLessThan(
        nonIndexedResult.avgDuration * 0.5
      );
    },
    15000 // 15 second timeout for this heavy test
  );

    it('should handle pagination efficiently', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      // Use smaller dataset in CI to avoid timeouts
      const testSize = process.env.CI ? 500 : 2000;
      testUserIds = await createTestUsers(testSize);

      const pageSize = 50;
      const pages = [0, 10, 20, 30, 40]; // Test different offsets

      for (const page of pages) {
        const result = await performanceMonitor.measureAsync(
          `Pagination test - page ${page}`,
          async () => {
            await measureQuery(dbMonitor, `pagination-${page}`, () =>
              prisma.user.findMany({
                skip: page * pageSize,
                take: pageSize,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  mbtiType: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              })
            );
          },
          20
        );

        console.log(`Page ${page}: ${result.avgDuration.toFixed(2)}ms avg`);

        // Pagination should remain efficient even for later pages
        expect(result.avgDuration).toBeLessThan(200); // Less than 200ms
      }
    });
  });

  describe('Database Monitoring and Metrics', () => {
    it('should track query performance metrics', async () => {
      if (!isDatabaseAvailable) {
        console.log('Skipping test: Database not available');
        return;
      }
      
      testUserIds = await createTestUsers(100);

      // Execute various queries to generate metrics
      for (let i = 0; i < 50; i++) {
        const userId =
          testUserIds[Math.floor(Math.random() * testUserIds.length)];
        await measureQuery(dbMonitor, 'findUnique', () =>
          prisma.user.findUnique({ where: { id: userId } })
        );
      }

      for (let i = 0; i < 20; i++) {
        await measureQuery(dbMonitor, 'findMany', () =>
          prisma.user.findMany({ take: 10 })
        );
      }

      const metrics = dbMonitor.getQueryMetrics();

      console.log('Query performance metrics:');
      metrics.forEach(metric => {
        console.log(`${metric.queryType}:`);
        console.log(`  Total queries: ${metric.totalQueries}`);
        console.log(`  Avg time: ${metric.avgTime.toFixed(2)}ms`);
        console.log(`  P95 time: ${metric.p95.toFixed(2)}ms`);
        console.log(`  Throughput: ${metric.throughput.toFixed(2)} ops/sec`);
        console.log(`  Slow queries: ${metric.slowQueries}`);
      });

      expect(metrics.length).toBeGreaterThan(0);

      const findUniqueMetrics = metrics.find(m => m.queryType === 'findUnique');
      expect(findUniqueMetrics).toBeDefined();
      expect(findUniqueMetrics!.totalQueries).toBe(50);
      expect(findUniqueMetrics!.avgTime).toBeLessThan(100);

      const findManyMetrics = metrics.find(m => m.queryType === 'findMany');
      expect(findManyMetrics).toBeDefined();
      expect(findManyMetrics!.totalQueries).toBe(20);
    });
  });
});
