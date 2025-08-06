import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { performance } from 'perf_hooks';
import {
  type AnswerRecord,
  calculatePersonalityScores,
  clearPersonalityCache,
  type PersonalityScores,
} from '@/lib/personality';
import { performanceMonitor } from './utils/performance-monitor';

interface TestDataset {
  size: number;
  answers: AnswerRecord[];
  description: string;
}

interface PerformanceThreshold {
  maxAvgDuration: number;
  maxP95Duration: number;
  maxMemoryGrowth: number;
  minThroughput: number;
  maxErrors: number;
}

const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThreshold> = {
  small: {
    maxAvgDuration: 10, // 10ms
    maxP95Duration: 50, // 50ms
    maxMemoryGrowth: 1024 * 1024, // 1MB
    minThroughput: 100, // 100 ops/sec
    maxErrors: 0,
  },
  medium: {
    maxAvgDuration: 50, // 50ms
    maxP95Duration: 200, // 200ms
    maxMemoryGrowth: 5 * 1024 * 1024, // 5MB
    minThroughput: 20, // 20 ops/sec
    maxErrors: 0,
  },
  large: {
    maxAvgDuration: 100, // 100ms
    maxP95Duration: 500, // 500ms
    maxMemoryGrowth: 10 * 1024 * 1024, // 10MB
    minThroughput: 10, // 10 ops/sec
    maxErrors: 0,
  },
  massive: {
    maxAvgDuration: 500, // 500ms
    maxP95Duration: 2000, // 2s
    maxMemoryGrowth: 50 * 1024 * 1024, // 50MB
    minThroughput: 2, // 2 ops/sec
    maxErrors: 0,
  },
};

function generateAnswerRecord(questionCount: number = 24): AnswerRecord {
  const answers: AnswerRecord = {};
  for (let i = 1; i <= questionCount; i++) {
    answers[i.toString()] = Math.floor(Math.random() * 5) + 1;
  }
  return answers;
}

function generateRealisticAnswerPatterns(): AnswerRecord[] {
  const patterns = [
    // Extroverted pattern
    { base: 4, ei: 5, sn: 3, tf: 3, pj: 4 },
    // Introverted pattern
    { base: 3, ei: 2, sn: 4, tf: 4, pj: 3 },
    // Sensing pattern
    { base: 3, ei: 3, sn: 2, tf: 3, pj: 5 },
    // Intuitive pattern
    { base: 4, ei: 4, sn: 5, tf: 4, pj: 2 },
    // Thinking pattern
    { base: 3, ei: 4, sn: 3, tf: 2, pj: 4 },
    // Feeling pattern
    { base: 4, ei: 3, sn: 4, tf: 5, pj: 3 },
    // Judging pattern
    { base: 4, ei: 3, sn: 3, tf: 3, pj: 5 },
    // Perceiving pattern
    { base: 3, ei: 4, sn: 4, tf: 4, pj: 1 },
  ];

  return patterns.map(pattern => {
    const answers: AnswerRecord = {};
    for (let i = 1; i <= 24; i++) {
      let value = pattern.base;

      // Apply dimension-specific biases
      if (i >= 1 && i <= 6) value = pattern.ei;
      else if (i >= 7 && i <= 12) value = pattern.sn;
      else if (i >= 13 && i <= 18) value = pattern.tf;
      else if (i >= 19 && i <= 24) value = pattern.pj;

      // Add some randomness
      value += Math.floor(Math.random() * 3) - 1;
      value = Math.max(1, Math.min(5, value));

      answers[i.toString()] = value;
    }
    return answers;
  });
}

function generateLargeDataset(
  size: number,
  useRealisticPatterns: boolean = true
): TestDataset {
  const answers: AnswerRecord[] = [];

  if (useRealisticPatterns && size <= 10000) {
    const patterns = generateRealisticAnswerPatterns();
    for (let i = 0; i < size; i++) {
      answers.push({ ...patterns[i % patterns.length] });
    }
  } else {
    for (let i = 0; i < size; i++) {
      answers.push(generateAnswerRecord());
    }
  }

  return {
    size,
    answers,
    description: `${size} ${useRealisticPatterns ? 'realistic' : 'random'} answer records`,
  };
}

function validatePerformanceResult(
  result: any,
  threshold: PerformanceThreshold,
  testName: string
): void {
  expect(result.avgDuration).toBeLessThan(threshold.maxAvgDuration);
  expect(result.p95).toBeLessThan(threshold.maxP95Duration);
  expect(result.metrics.memoryDelta.heapUsed).toBeLessThan(
    threshold.maxMemoryGrowth
  );
  expect(result.throughput).toBeGreaterThan(threshold.minThroughput);
  expect(result.errors).toBeLessThanOrEqual(threshold.maxErrors);

  if (result.memoryLeakDetected) {
    throw new Error(`Memory leak detected in ${testName}`);
  }
}

function validatePersonalityScores(scores: PersonalityScores): void {
  expect(scores).toHaveProperty('ei');
  expect(scores).toHaveProperty('sn');
  expect(scores).toHaveProperty('tf');
  expect(scores).toHaveProperty('pj');

  expect(scores.ei).toBeGreaterThanOrEqual(-1);
  expect(scores.ei).toBeLessThanOrEqual(1);
  expect(scores.sn).toBeGreaterThanOrEqual(-1);
  expect(scores.sn).toBeLessThanOrEqual(1);
  expect(scores.tf).toBeGreaterThanOrEqual(-1);
  expect(scores.tf).toBeLessThanOrEqual(1);
  expect(scores.pj).toBeGreaterThanOrEqual(-1);
  expect(scores.pj).toBeLessThanOrEqual(1);
}

function calculateMemoryEfficiency(
  inputSize: number,
  memoryUsed: number
): number {
  // Calculate bytes per input item
  return memoryUsed / inputSize;
}

describe('MBTI Calculation Performance Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPersonalityCache();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    // Clean up after each test
    clearPersonalityCache();
  });

  describe('Single Calculation Performance', () => {
    it('should calculate personality scores within performance thresholds - small dataset', async () => {
      const testData = generateLargeDataset(100);
      const threshold = PERFORMANCE_THRESHOLDS.small;

      console.log(`Testing ${testData.description}`);

      let processedCount = 0;
      const result = await performanceMonitor.measureSync(
        'Single calculation - small dataset',
        () => {
          const answers = testData.answers[processedCount % testData.size];
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
          processedCount++;
        },
        100
      );

      performanceMonitor.printBenchmarkResult(result);
      validatePerformanceResult(result, threshold, 'small dataset');

      const memoryEfficiency = calculateMemoryEfficiency(
        testData.size,
        result.metrics.memoryDelta.heapUsed
      );
      console.log(
        `Memory efficiency: ${memoryEfficiency.toFixed(2)} bytes per calculation`
      );
      expect(memoryEfficiency).toBeLessThan(10000); // Less than 10KB per calculation
    });

    it('should calculate personality scores within performance thresholds - medium dataset', async () => {
      const testData = generateLargeDataset(1000);
      const threshold = PERFORMANCE_THRESHOLDS.medium;

      console.log(`Testing ${testData.description}`);

      let processedCount = 0;
      const result = await performanceMonitor.measureSync(
        'Single calculation - medium dataset',
        () => {
          const answers = testData.answers[processedCount % testData.size];
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
          processedCount++;
        },
        1000
      );

      performanceMonitor.printBenchmarkResult(result);
      validatePerformanceResult(result, threshold, 'medium dataset');

      const memoryEfficiency = calculateMemoryEfficiency(
        testData.size,
        result.metrics.memoryDelta.heapUsed
      );
      console.log(
        `Memory efficiency: ${memoryEfficiency.toFixed(2)} bytes per calculation`
      );
      expect(memoryEfficiency).toBeLessThan(15000); // Less than 15KB per calculation
    });

    it('should calculate personality scores within performance thresholds - large dataset', async () => {
      const testData = generateLargeDataset(5000);
      const threshold = PERFORMANCE_THRESHOLDS.large;

      console.log(`Testing ${testData.description}`);

      let processedCount = 0;
      const result = await performanceMonitor.measureSync(
        'Single calculation - large dataset',
        () => {
          const answers = testData.answers[processedCount % testData.size];
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
          processedCount++;
        },
        5000
      );

      performanceMonitor.printBenchmarkResult(result);
      validatePerformanceResult(result, threshold, 'large dataset');

      const memoryEfficiency = calculateMemoryEfficiency(
        testData.size,
        result.metrics.memoryDelta.heapUsed
      );
      console.log(
        `Memory efficiency: ${memoryEfficiency.toFixed(2)} bytes per calculation`
      );
      expect(memoryEfficiency).toBeLessThan(20000); // Less than 20KB per calculation
    });

    it('should handle massive dataset calculations', async () => {
      const testData = generateLargeDataset(10000);
      const threshold = PERFORMANCE_THRESHOLDS.massive;

      console.log(`Testing ${testData.description}`);

      let processedCount = 0;
      const result = await performanceMonitor.measureSync(
        'Single calculation - massive dataset',
        () => {
          const answers = testData.answers[processedCount % testData.size];
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
          processedCount++;
        },
        10000
      );

      performanceMonitor.printBenchmarkResult(result);
      validatePerformanceResult(result, threshold, 'massive dataset');

      const memoryEfficiency = calculateMemoryEfficiency(
        testData.size,
        result.metrics.memoryDelta.heapUsed
      );
      console.log(
        `Memory efficiency: ${memoryEfficiency.toFixed(2)} bytes per calculation`
      );
      expect(memoryEfficiency).toBeLessThan(25000); // Less than 25KB per calculation
    });
  });

  describe('Batch Processing Performance', () => {
    it('should process batches efficiently', async () => {
      const batchSizes = [10, 50, 100, 500, 1000];

      for (const batchSize of batchSizes) {
        console.log(`Testing batch size: ${batchSize}`);

        const testData = generateLargeDataset(batchSize);
        const startTime = performance.now();
        const startMemory = process.memoryUsage().heapUsed;

        const results: PersonalityScores[] = [];
        for (const answers of testData.answers) {
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
          results.push(scores);
        }

        const endTime = performance.now();
        const endMemory = process.memoryUsage().heapUsed;

        const duration = endTime - startTime;
        const memoryUsed = endMemory - startMemory;
        const throughput = batchSize / (duration / 1000);

        console.log(
          `Batch size ${batchSize}: ${duration.toFixed(2)}ms, ${throughput.toFixed(2)} ops/sec, ${performanceMonitor.formatBytes(memoryUsed)}`
        );

        expect(results).toHaveLength(batchSize);
        expect(duration).toBeLessThan(batchSize * 10); // Less than 10ms per calculation
        expect(throughput).toBeGreaterThan(10); // At least 10 ops/sec
        expect(memoryUsed).toBeLessThan(batchSize * 50000); // Less than 50KB per calculation
      }
    });
  });

  describe('Cache Performance', () => {
    it('should demonstrate cache effectiveness', async () => {
      const testData = generateLargeDataset(100);

      // First run - populate cache
      console.log('First run - populating cache');
      const firstRun = await performanceMonitor.measureSync(
        'Cache population',
        () => {
          for (const answers of testData.answers) {
            calculatePersonalityScores(answers);
          }
        },
        1
      );

      // Second run - use cache
      console.log('Second run - using cache');
      const secondRun = await performanceMonitor.measureSync(
        'Cache utilization',
        () => {
          for (const answers of testData.answers) {
            calculatePersonalityScores(answers);
          }
        },
        1
      );

      console.log(
        `Cache improvement: ${(((firstRun.avgDuration - secondRun.avgDuration) / firstRun.avgDuration) * 100).toFixed(1)}%`
      );

      // Cache should improve performance or be roughly the same
      // Allow for minor overhead since cache effectiveness depends on the dataset size
      expect(secondRun.avgDuration).toBeLessThan(firstRun.avgDuration * 1.2); // Allow 20% overhead for small datasets
    });

    it('should handle cache invalidation gracefully', async () => {
      const testData = generateLargeDataset(50);

      // Populate cache
      for (const answers of testData.answers) {
        calculatePersonalityScores(answers);
      }

      // Clear cache and measure performance
      clearPersonalityCache();

      const result = await performanceMonitor.measureSync(
        'Post-cache-clear performance',
        () => {
          for (const answers of testData.answers) {
            const scores = calculatePersonalityScores(answers);
            validatePersonalityScores(scores);
          }
        },
        1
      );

      // Should still meet performance thresholds
      expect(result.avgDuration).toBeLessThan(
        PERFORMANCE_THRESHOLDS.medium.maxAvgDuration
      );
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during extensive calculations', async () => {
      const testData = generateLargeDataset(1000);

      const memoryTest = await performanceMonitor.detectMemoryLeaks(
        'MBTI calculation memory leak test',
        async () => {
          const answers =
            testData.answers[Math.floor(Math.random() * testData.size)];
          const scores = calculatePersonalityScores(answers);
          validatePersonalityScores(scores);
        },
        200
      );

      console.log(`Memory leak test results:`);
      console.log(
        `  Initial memory: ${performanceMonitor.formatBytes(memoryTest.initialMemory)}`
      );
      console.log(
        `  Final memory: ${performanceMonitor.formatBytes(memoryTest.finalMemory)}`
      );
      console.log(
        `  Memory growth: ${performanceMonitor.formatBytes(memoryTest.memoryGrowth)}`
      );
      console.log(`  GC count: ${memoryTest.gcCount}`);

      expect(memoryTest.hasLeak).toBe(false);
      expect(memoryTest.memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const invalidInputs = [
        {}, // Empty object
        { '1': 6 }, // Invalid value
        { invalid: 3 }, // Invalid key
        { '1': '3' }, // String value
        null,
        undefined,
      ];

      for (const input of invalidInputs) {
        const result = await performanceMonitor.measureSync(
          'Invalid input handling',
          () => {
            try {
              calculatePersonalityScores(input as any);
            } catch (error) {
              // Expected to throw
              expect(error).toBeInstanceOf(Error);
            }
          },
          1
        );

        // Should handle errors quickly
        expect(result.avgDuration).toBeLessThan(10);
      }
    });

    it('should handle incomplete answers', async () => {
      const incompleteAnswers = [
        { '1': 3, '2': 4 }, // Only 2 answers
        { '1': 3, '7': 4, '13': 5, '19': 2 }, // One from each dimension
        generateAnswerRecord(12), // Half the questions
      ];

      for (const answers of incompleteAnswers) {
        const result = await performanceMonitor.measureSync(
          'Incomplete answers handling',
          () => {
            const scores = calculatePersonalityScores(answers);
            validatePersonalityScores(scores);
          },
          10
        );

        expect(result.avgDuration).toBeLessThan(50);
        expect(result.errors).toBe(0);
      }
    });
  });

  describe('Statistical Analysis', () => {
    it('should produce consistent results across multiple runs', async () => {
      const testData = generateLargeDataset(100);
      const runs = 5;
      const results: any[] = [];

      for (let i = 0; i < runs; i++) {
        const result = await performanceMonitor.measureSync(
          `Consistency test run ${i + 1}`,
          () => {
            for (const answers of testData.answers) {
              calculatePersonalityScores(answers);
            }
          },
          1
        );
        results.push(result);
      }

      // Calculate coefficient of variation for performance
      const durations = results.map(r => r.avgDuration);
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance =
        durations.reduce((a, b) => a + (b - mean) ** 2, 0) / durations.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;

      console.log(`Performance consistency: CV = ${(cv * 100).toFixed(2)}%`);

      // Performance should be consistent (CV < 20%)
      expect(cv).toBeLessThan(0.2);
    });
  });
});
