import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { performance } from 'perf_hooks';
import { getMBTIManager } from '@/lib/mbti-questions';
import {
  calculatePersonalityScores,
  clearPersonalityCache,
} from '@/lib/personality';
import { performanceMonitor } from '../utils/performance-monitor';

interface MemorySnapshot {
  timestamp: number;
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

interface MemoryLeakReport {
  testName: string;
  initialMemory: MemorySnapshot;
  finalMemory: MemorySnapshot;
  peakMemory: MemorySnapshot;
  memoryGrowth: number;
  leakRate: number; // bytes per iteration
  iterations: number;
  duration: number;
  hasLeak: boolean;
  leakSeverity: 'none' | 'minor' | 'moderate' | 'severe';
  gcEfficiency: number;
  recommendations: string[];
}

interface MemoryPressureTest {
  name: string;
  targetMemoryUsage: number;
  maxIterations: number;
  operation: () => Promise<void> | void;
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private gcCallbacks: (() => void)[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcCount = 0;
  private initialGCCount = 0;

  constructor() {
    this.setupGCMonitoring();
  }

  private setupGCMonitoring(): void {
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = (...args: any[]) => {
        this.gcCount++;
        const result = originalGC.apply(global, args);
        this.gcCallbacks.forEach(cb => cb());
        return result;
      };
    }
  }

  startMonitoring(intervalMs: number = 100): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.snapshots = [];
    this.initialGCCount = this.gcCount;

    this.takeSnapshot();

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.takeSnapshot(); // Final snapshot
  }

  private takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: performance.now(),
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  getPeakMemory(): MemorySnapshot {
    return this.snapshots.reduce((peak, current) =>
      current.heapUsed > peak.heapUsed ? current : peak
    );
  }

  getInitialMemory(): MemorySnapshot {
    return this.snapshots[0];
  }

  getFinalMemory(): MemorySnapshot {
    return this.snapshots[this.snapshots.length - 1];
  }

  getMemoryGrowth(): number {
    if (this.snapshots.length < 2) return 0;
    const initial = this.getInitialMemory();
    const final = this.getFinalMemory();
    return final.heapUsed - initial.heapUsed;
  }

  getGCCount(): number {
    return this.gcCount - this.initialGCCount;
  }

  calculateLeakRate(iterations: number): number {
    const growth = this.getMemoryGrowth();
    return iterations > 0 ? growth / iterations : 0;
  }

  async analyzeMemoryLeak(
    testName: string,
    testFn: () => Promise<void> | void,
    iterations: number = 100,
    warmupIterations: number = 10
  ): Promise<MemoryLeakReport> {
    // Warm up
    for (let i = 0; i < warmupIterations; i++) {
      await testFn();
    }

    // Force GC before monitoring
    if (global.gc) {
      global.gc();
    }

    const startTime = performance.now();
    this.startMonitoring(50); // More frequent monitoring for leak detection

    const initialMemory = this.takeSnapshot();

    // Run test iterations
    for (let i = 0; i < iterations; i++) {
      await testFn();

      // Force GC every 20 iterations
      if (i % 20 === 0 && global.gc) {
        global.gc();
      }
    }

    // Force final GC
    if (global.gc) {
      global.gc();
    }

    const finalMemory = this.takeSnapshot();
    const endTime = performance.now();

    this.stopMonitoring();

    const peakMemory = this.getPeakMemory();
    const memoryGrowth = this.getMemoryGrowth();
    const leakRate = this.calculateLeakRate(iterations);
    const duration = endTime - startTime;
    const gcCount = this.getGCCount();

    // Determine leak severity
    const LEAK_THRESHOLDS = {
      minor: 1024 * 1024, // 1MB
      moderate: 5 * 1024 * 1024, // 5MB
      severe: 10 * 1024 * 1024, // 10MB
    };

    let hasLeak = false;
    let leakSeverity: 'none' | 'minor' | 'moderate' | 'severe' = 'none';

    if (memoryGrowth > LEAK_THRESHOLDS.severe) {
      hasLeak = true;
      leakSeverity = 'severe';
    } else if (memoryGrowth > LEAK_THRESHOLDS.moderate) {
      hasLeak = true;
      leakSeverity = 'moderate';
    } else if (memoryGrowth > LEAK_THRESHOLDS.minor) {
      hasLeak = true;
      leakSeverity = 'minor';
    }

    // Calculate GC efficiency
    const gcEfficiency = gcCount > 0 ? iterations / gcCount : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      memoryGrowth,
      leakRate,
      gcEfficiency
    );

    return {
      testName,
      initialMemory,
      finalMemory,
      peakMemory,
      memoryGrowth,
      leakRate,
      iterations,
      duration,
      hasLeak,
      leakSeverity,
      gcEfficiency,
      recommendations,
    };
  }

  private generateRecommendations(
    memoryGrowth: number,
    leakRate: number,
    gcEfficiency: number
  ): string[] {
    const recommendations: string[] = [];

    if (memoryGrowth > 10 * 1024 * 1024) {
      // 10MB
      recommendations.push(
        'Severe memory leak detected - investigate object retention'
      );
    }

    if (leakRate > 10000) {
      // 10KB per iteration
      recommendations.push(
        'High memory leak rate - check for unclosed resources'
      );
    }

    if (gcEfficiency < 10) {
      recommendations.push(
        'Poor GC efficiency - consider reducing object creation'
      );
    }

    if (memoryGrowth > 1024 * 1024) {
      // 1MB
      recommendations.push('Consider implementing object pooling');
      recommendations.push('Review cache cleanup strategies');
    }

    return recommendations;
  }

  async performMemoryPressureTest(test: MemoryPressureTest): Promise<{
    success: boolean;
    peakMemory: number;
    iterationsCompleted: number;
    errorMessage?: string;
  }> {
    let iterationsCompleted = 0;
    let peakMemory = 0;

    this.startMonitoring(100);

    try {
      for (let i = 0; i < test.maxIterations; i++) {
        await test.operation();
        iterationsCompleted++;

        const currentMemory = process.memoryUsage().heapUsed;
        peakMemory = Math.max(peakMemory, currentMemory);

        if (currentMemory > test.targetMemoryUsage) {
          this.stopMonitoring();
          return {
            success: true,
            peakMemory,
            iterationsCompleted,
          };
        }
      }

      this.stopMonitoring();
      return {
        success: false,
        peakMemory,
        iterationsCompleted,
        errorMessage: `Failed to reach target memory usage ${test.targetMemoryUsage} bytes`,
      };
    } catch (error) {
      this.stopMonitoring();
      return {
        success: false,
        peakMemory,
        iterationsCompleted,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
  }

  printMemoryReport(report: MemoryLeakReport): void {
    console.log(`\n🔍 Memory Leak Analysis: ${report.testName}`);
    console.log(`   Duration: ${report.duration.toFixed(2)}ms`);
    console.log(`   Iterations: ${report.iterations}`);
    console.log(
      `   Initial Memory: ${this.formatBytes(report.initialMemory.heapUsed)}`
    );
    console.log(
      `   Final Memory: ${this.formatBytes(report.finalMemory.heapUsed)}`
    );
    console.log(
      `   Peak Memory: ${this.formatBytes(report.peakMemory.heapUsed)}`
    );
    console.log(`   Memory Growth: ${this.formatBytes(report.memoryGrowth)}`);
    console.log(`   Leak Rate: ${this.formatBytes(report.leakRate)}/iteration`);
    console.log(`   GC Count: ${this.getGCCount()}`);
    console.log(
      `   GC Efficiency: ${report.gcEfficiency.toFixed(2)} iterations/gc`
    );
    console.log(`   Leak Severity: ${report.leakSeverity}`);
    console.log(`   Has Leak: ${report.hasLeak ? '❌' : '✅'}`);

    if (report.recommendations.length > 0) {
      console.log(`   Recommendations:`);
      report.recommendations.forEach(rec => {
        console.log(`     - ${rec}`);
      });
    }
  }

  reset(): void {
    this.snapshots = [];
    this.gcCallbacks = [];
    this.gcCount = 0;
    this.initialGCCount = 0;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
  }
}

describe('Memory Usage Monitoring and Leak Detection', () => {
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    memoryMonitor = new MemoryMonitor();
    clearPersonalityCache();

    // Force GC
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    memoryMonitor.reset();
    clearPersonalityCache();
  });

  describe('MBTI Calculation Memory Tests', () => {
    it('should not leak memory during repeated calculations', async () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
      }));

      const report = await memoryMonitor.analyzeMemoryLeak(
        'MBTI calculation memory leak test',
        async () => {
          const answers = testData[Math.floor(Math.random() * testData.length)];
          calculatePersonalityScores(answers);
        },
        500,
        50
      );

      memoryMonitor.printMemoryReport(report);

      expect(report.hasLeak).toBe(false);
      expect(report.leakSeverity).toBe('none');
      expect(report.memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
      expect(report.leakRate).toBeLessThan(10000); // Less than 10KB per iteration
    });

    it('should handle cache cleanup without memory leaks', async () => {
      const testData = Array.from({ length: 1000 }, (_, i) => ({
        [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
      }));

      const report = await memoryMonitor.analyzeMemoryLeak(
        'Cache cleanup memory test',
        async () => {
          // Fill cache
          for (let i = 0; i < 10; i++) {
            const answers =
              testData[Math.floor(Math.random() * testData.length)];
            calculatePersonalityScores(answers);
          }

          // Clear cache
          clearPersonalityCache();
        },
        100,
        10
      );

      memoryMonitor.printMemoryReport(report);

      expect(report.hasLeak).toBe(false);
      expect(report.memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });

  describe('MBTI Questions Manager Memory Tests', () => {
    it('should not leak memory during question fetching', async () => {
      const manager = getMBTIManager();

      const report = await memoryMonitor.analyzeMemoryLeak(
        'MBTI questions manager memory test',
        async () => {
          await manager.getMBTIQuestions();
          await manager.getQuestionsForPage(1);
          await manager.getTotalPages();
        },
        200,
        20
      );

      memoryMonitor.printMemoryReport(report);

      expect(report.hasLeak).toBe(false);
      expect(report.leakSeverity).toBe('none');
      expect(report.memoryGrowth).toBeLessThan(3 * 1024 * 1024); // Less than 3MB
    });

    it('should handle cache invalidation without memory leaks', async () => {
      const manager = getMBTIManager();

      const report = await memoryMonitor.analyzeMemoryLeak(
        'Cache invalidation memory test',
        async () => {
          // Populate cache
          await manager.getMBTIQuestions();
          await manager.getQuestionsForPage(1);

          // Invalidate cache
          await manager.invalidateCache();

          // Repopulate cache
          await manager.getMBTIQuestions();
        },
        100,
        10
      );

      memoryMonitor.printMemoryReport(report);

      expect(report.hasLeak).toBe(false);
      expect(report.memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
    });
  });

  describe('Memory Pressure Tests', () => {
    it('should handle memory pressure during large batch processing', async () => {
      const testData = Array.from({ length: 10000 }, (_, i) => ({
        [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
      }));

      const pressureTest: MemoryPressureTest = {
        name: 'Large batch processing',
        targetMemoryUsage: 100 * 1024 * 1024, // 100MB
        maxIterations: 10000,
        operation: async () => {
          // Process a batch of calculations
          for (let i = 0; i < 100; i++) {
            const answers =
              testData[Math.floor(Math.random() * testData.length)];
            calculatePersonalityScores(answers);
          }
        },
      };

      const result =
        await memoryMonitor.performMemoryPressureTest(pressureTest);

      console.log(`Memory pressure test results:`);
      console.log(`  Success: ${result.success}`);
      console.log(
        `  Peak Memory: ${memoryMonitor.formatBytes(result.peakMemory)}`
      );
      console.log(`  Iterations Completed: ${result.iterationsCompleted}`);

      if (result.errorMessage) {
        console.log(`  Error: ${result.errorMessage}`);
      }

      expect(result.iterationsCompleted).toBeGreaterThan(0);
      expect(result.peakMemory).toBeGreaterThan(0);
    });

    it('should gracefully handle out-of-memory conditions', async () => {
      const largeObjects: any[] = [];

      const pressureTest: MemoryPressureTest = {
        name: 'Out-of-memory simulation',
        targetMemoryUsage: 500 * 1024 * 1024, // 500MB
        maxIterations: 1000,
        operation: () => {
          // Create large objects to consume memory
          const size = 1024 * 1024; // 1MB
          const buffer = new ArrayBuffer(size);
          largeObjects.push(buffer);

          // Occasionally release some objects
          if (largeObjects.length > 100 && Math.random() > 0.9) {
            largeObjects.splice(0, 10);
          }
        },
      };

      const result =
        await memoryMonitor.performMemoryPressureTest(pressureTest);

      console.log(`Out-of-memory test results:`);
      console.log(`  Success: ${result.success}`);
      console.log(
        `  Peak Memory: ${memoryMonitor.formatBytes(result.peakMemory)}`
      );
      console.log(`  Iterations Completed: ${result.iterationsCompleted}`);

      expect(result.iterationsCompleted).toBeGreaterThan(0);

      // Clean up
      largeObjects.length = 0;
    });
  });

  describe('Garbage Collection Efficiency', () => {
    it('should trigger GC efficiently during heavy operations', async () => {
      const heavyObjects: any[] = [];

      const report = await memoryMonitor.analyzeMemoryLeak(
        'GC efficiency test',
        async () => {
          // Create objects that should be garbage collected
          for (let i = 0; i < 100; i++) {
            const obj = {
              data: new Array(1000).fill(Math.random()),
              timestamp: Date.now(),
            };
            heavyObjects.push(obj);
          }

          // Release half of the objects
          heavyObjects.splice(0, heavyObjects.length / 2);
        },
        100,
        10
      );

      memoryMonitor.printMemoryReport(report);

      expect(report.gcEfficiency).toBeGreaterThan(0);
      expect(report.gcEfficiency).toBeLessThan(1000); // Should trigger GC reasonably often

      // Clean up
      heavyObjects.length = 0;
    });
  });

  describe('Memory Monitoring Accuracy', () => {
    it('should accurately track memory usage patterns', async () => {
      memoryMonitor.startMonitoring(50);

      // Simulate memory usage pattern
      const objects: any[] = [];

      // Phase 1: Increase memory usage
      for (let i = 0; i < 100; i++) {
        objects.push(new Array(1000).fill(i));
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      // Phase 2: Maintain memory usage
      await new Promise(resolve => setTimeout(resolve, 200));

      // Phase 3: Decrease memory usage
      objects.splice(0, 50);

      await new Promise(resolve => setTimeout(resolve, 200));

      memoryMonitor.stopMonitoring();

      const snapshots = memoryMonitor.getSnapshots();
      const initialMemory = memoryMonitor.getInitialMemory();
      const peakMemory = memoryMonitor.getPeakMemory();
      const finalMemory = memoryMonitor.getFinalMemory();

      console.log(`Memory monitoring accuracy test:`);
      console.log(`  Snapshots taken: ${snapshots.length}`);
      console.log(
        `  Initial memory: ${memoryMonitor.formatBytes(initialMemory.heapUsed)}`
      );
      console.log(
        `  Peak memory: ${memoryMonitor.formatBytes(peakMemory.heapUsed)}`
      );
      console.log(
        `  Final memory: ${memoryMonitor.formatBytes(finalMemory.heapUsed)}`
      );

      expect(snapshots.length).toBeGreaterThan(10);
      expect(peakMemory.heapUsed).toBeGreaterThan(initialMemory.heapUsed);
      expect(finalMemory.heapUsed).toBeLessThan(peakMemory.heapUsed);

      // Clean up
      objects.length = 0;
    });
  });
});
