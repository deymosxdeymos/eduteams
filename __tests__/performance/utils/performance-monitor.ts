import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  duration: number;
  memoryBefore: NodeJS.MemoryUsage;
  memoryAfter: NodeJS.MemoryUsage;
  memoryDelta: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpuBefore: NodeJS.CpuUsage;
  cpuAfter: NodeJS.CpuUsage;
  cpuDelta: {
    user: number;
    system: number;
  };
  gcCount: number;
  timestamp: number;
}

export interface BenchmarkResult {
  name: string;
  metrics: PerformanceMetrics;
  iterations: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  throughput: number;
  memoryLeakDetected: boolean;
  errors: number;
}

export interface LoadTestResult {
  name: string;
  concurrency: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  throughput: number;
  errorRate: number;
  memoryUsage: {
    peak: number;
    average: number;
    final: number;
  };
  errors: Array<{
    message: string;
    count: number;
    stack?: string;
  }>;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  avgLookupTime: number;
  memoryUsage: number;
  evictions: number;
}

export interface DatabaseMetrics {
  queryCount: number;
  totalQueryTime: number;
  avgQueryTime: number;
  slowQueries: number;
  connectionPoolUsage: number;
  lockWaitTime: number;
}

export class PerformanceMonitor {
  private gcCount = 0;
  private isGCTracking = false;

  constructor() {
    this.startGCTracking();
  }

  private startGCTracking(): void {
    if (this.isGCTracking) return;

    this.isGCTracking = true;
    if (global.gc) {
      const originalGC = global.gc;
      global.gc = (...args: any[]) => {
        this.gcCount++;
        return originalGC.apply(global, args);
      };
    }
  }

  async measureSync<T>(
    name: string,
    fn: () => T,
    iterations: number = 1
  ): Promise<BenchmarkResult> {
    const durations: number[] = [];
    const memorySnapshots: NodeJS.MemoryUsage[] = [];
    let errors = 0;
    let memoryLeakDetected = false;

    // Warm up
    try {
      fn();
    } catch {
      // Ignore warmup errors
    }

    // Force GC before measurement
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage();
    const initialGCCount = this.gcCount;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        fn();
      } catch (error) {
        errors++;
        console.error(`Error in iteration ${i}:`, error);
      }

      const end = performance.now();
      const memoryAfter = process.memoryUsage();

      durations.push(end - start);
      memorySnapshots.push(memoryAfter);
    }
    const finalMemory = process.memoryUsage();
    const finalGCCount = this.gcCount;

    // Check for memory leaks
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    memoryLeakDetected = memoryGrowth > 10 * 1024 * 1024; // 10MB threshold

    durations.sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / iterations;

    return {
      name,
      metrics: {
        duration: totalDuration,
        memoryBefore: initialMemory,
        memoryAfter: finalMemory,
        memoryDelta: {
          rss: finalMemory.rss - initialMemory.rss,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external,
        },
        cpuBefore: process.cpuUsage(),
        cpuAfter: process.cpuUsage(),
        cpuDelta: {
          user: 0,
          system: 0,
        },
        gcCount: finalGCCount - initialGCCount,
        timestamp: Date.now(),
      },
      iterations,
      avgDuration,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      throughput: iterations / (totalDuration / 1000),
      memoryLeakDetected,
      errors,
    };
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    iterations: number = 1
  ): Promise<BenchmarkResult> {
    const durations: number[] = [];
    const memorySnapshots: NodeJS.MemoryUsage[] = [];
    let errors = 0;
    let memoryLeakDetected = false;

    // Warm up
    try {
      await fn();
    } catch {
      // Ignore warmup errors
    }

    // Force GC before measurement
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage();
    const initialGCCount = this.gcCount;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      try {
        await fn();
      } catch (error) {
        errors++;
        console.error(`Error in iteration ${i}:`, error);
      }

      const end = performance.now();
      const memoryAfter = process.memoryUsage();

      durations.push(end - start);
      memorySnapshots.push(memoryAfter);
    }
    const finalMemory = process.memoryUsage();
    const finalGCCount = this.gcCount;

    // Check for memory leaks
    const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    memoryLeakDetected = memoryGrowth > 10 * 1024 * 1024; // 10MB threshold

    durations.sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / iterations;

    return {
      name,
      metrics: {
        duration: totalDuration,
        memoryBefore: initialMemory,
        memoryAfter: finalMemory,
        memoryDelta: {
          rss: finalMemory.rss - initialMemory.rss,
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external,
        },
        cpuBefore: process.cpuUsage(),
        cpuAfter: process.cpuUsage(),
        cpuDelta: {
          user: 0,
          system: 0,
        },
        gcCount: finalGCCount - initialGCCount,
        timestamp: Date.now(),
      },
      iterations,
      avgDuration,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p90: durations[Math.floor(durations.length * 0.9)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      throughput: iterations / (totalDuration / 1000),
      memoryLeakDetected,
      errors,
    };
  }

  async loadTest<T>(
    name: string,
    fn: () => Promise<T>,
    options: {
      concurrency: number;
      duration: number;
      maxRequests?: number;
    }
  ): Promise<LoadTestResult> {
    const { concurrency, duration, maxRequests = Infinity } = options;
    const results: Array<{
      duration: number;
      success: boolean;
      error?: Error;
    }> = [];
    const errors: Map<string, { count: number; stack?: string }> = new Map();
    const memorySnapshots: number[] = [];

    let totalRequests = 0;
    let running = true;

    const startTime = performance.now();
    const endTime = startTime + duration;

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      memorySnapshots.push(process.memoryUsage().heapUsed);
    }, 100);

    const workers = Array.from({ length: concurrency }, async () => {
      while (
        running &&
        totalRequests < maxRequests &&
        performance.now() < endTime
      ) {
        const requestStart = performance.now();
        totalRequests++;

        try {
          await fn();
          const requestEnd = performance.now();
          results.push({
            duration: requestEnd - requestStart,
            success: true,
          });
        } catch (error) {
          const requestEnd = performance.now();
          const errorKey =
            error instanceof Error ? error.message : String(error);
          const existing = errors.get(errorKey) || { count: 0 };
          errors.set(errorKey, {
            count: existing.count + 1,
            stack: error instanceof Error ? error.stack : undefined,
          });

          results.push({
            duration: requestEnd - requestStart,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }
    });

    await Promise.all(workers);
    running = false;
    clearInterval(memoryInterval);

    const actualDuration = performance.now() - startTime;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.filter(r => !r.success).length;
    const durations = results.map(r => r.duration).sort((a, b) => a - b);

    const peakMemory = Math.max(...memorySnapshots);
    const avgMemory =
      memorySnapshots.reduce((sum, val) => sum + val, 0) /
      memorySnapshots.length;
    const finalMemory = process.memoryUsage().heapUsed;

    return {
      name,
      concurrency,
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDuration: actualDuration,
      avgResponseTime:
        durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minResponseTime: durations[0] || 0,
      maxResponseTime: durations[durations.length - 1] || 0,
      p50: durations[Math.floor(durations.length * 0.5)] || 0,
      p90: durations[Math.floor(durations.length * 0.9)] || 0,
      p95: durations[Math.floor(durations.length * 0.95)] || 0,
      p99: durations[Math.floor(durations.length * 0.99)] || 0,
      throughput: totalRequests / (actualDuration / 1000),
      errorRate: failedRequests / totalRequests,
      memoryUsage: {
        peak: peakMemory,
        average: avgMemory,
        final: finalMemory,
      },
      errors: Array.from(errors.entries()).map(
        ([message, { count, stack }]) => ({
          message,
          count,
          stack,
        })
      ),
    };
  }

  async detectMemoryLeaks<T>(
    _testName: string,
    fn: () => Promise<T>,
    iterations: number = 100
  ): Promise<{
    hasLeak: boolean;
    memoryGrowth: number;
    finalMemory: number;
    initialMemory: number;
    gcCount: number;
  }> {
    // Force GC and get baseline
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage().heapUsed;
    const initialGCCount = this.gcCount;

    // Run test multiple times
    for (let i = 0; i < iterations; i++) {
      try {
        await fn();
      } catch (error) {
        console.error(`Memory leak test error in iteration ${i}:`, error);
      }

      // Force GC every 10 iterations
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }

    // Final GC and measurement
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const finalGCCount = this.gcCount;
    const memoryGrowth = finalMemory - initialMemory;

    // Consider it a leak if memory grew by more than 5MB
    const hasLeak = memoryGrowth > 5 * 1024 * 1024;

    return {
      hasLeak,
      memoryGrowth,
      finalMemory,
      initialMemory,
      gcCount: finalGCCount - initialGCCount,
    };
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  }

  printBenchmarkResult(result: BenchmarkResult): void {
    console.log(`\n📊 Benchmark: ${result.name}`);
    console.log(`   Iterations: ${result.iterations}`);
    console.log(`   Average: ${this.formatDuration(result.avgDuration)}`);
    console.log(`   Min: ${this.formatDuration(result.minDuration)}`);
    console.log(`   Max: ${this.formatDuration(result.maxDuration)}`);
    console.log(`   P50: ${this.formatDuration(result.p50)}`);
    console.log(`   P90: ${this.formatDuration(result.p90)}`);
    console.log(`   P95: ${this.formatDuration(result.p95)}`);
    console.log(`   P99: ${this.formatDuration(result.p99)}`);
    console.log(`   Throughput: ${result.throughput.toFixed(2)} ops/sec`);
    console.log(
      `   Memory Delta: ${this.formatBytes(result.metrics.memoryDelta.heapUsed)}`
    );
    console.log(`   GC Count: ${result.metrics.gcCount}`);
    console.log(`   Errors: ${result.errors}`);

    if (result.memoryLeakDetected) {
      console.log(`   ⚠️  Memory leak detected!`);
    }
  }

  printLoadTestResult(result: LoadTestResult): void {
    console.log(`\n🚀 Load Test: ${result.name}`);
    console.log(`   Concurrency: ${result.concurrency}`);
    console.log(`   Total Requests: ${result.totalRequests}`);
    console.log(`   Successful: ${result.successfulRequests}`);
    console.log(`   Failed: ${result.failedRequests}`);
    console.log(`   Duration: ${this.formatDuration(result.totalDuration)}`);
    console.log(
      `   Avg Response: ${this.formatDuration(result.avgResponseTime)}`
    );
    console.log(
      `   Min Response: ${this.formatDuration(result.minResponseTime)}`
    );
    console.log(
      `   Max Response: ${this.formatDuration(result.maxResponseTime)}`
    );
    console.log(`   P50: ${this.formatDuration(result.p50)}`);
    console.log(`   P90: ${this.formatDuration(result.p90)}`);
    console.log(`   P95: ${this.formatDuration(result.p95)}`);
    console.log(`   P99: ${this.formatDuration(result.p99)}`);
    console.log(`   Throughput: ${result.throughput.toFixed(2)} req/sec`);
    console.log(`   Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
    console.log(`   Peak Memory: ${this.formatBytes(result.memoryUsage.peak)}`);
    console.log(
      `   Avg Memory: ${this.formatBytes(result.memoryUsage.average)}`
    );
    console.log(
      `   Final Memory: ${this.formatBytes(result.memoryUsage.final)}`
    );

    if (result.errors.length > 0) {
      console.log(`   ❌ Errors:`);
      result.errors.forEach(({ message, count }) => {
        console.log(`      ${message}: ${count}`);
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
