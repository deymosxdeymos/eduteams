import { performance } from 'perf_hooks';
import { getMBTIManager } from '@/lib/mbti-questions';
import {
  calculatePersonalityScores,
  clearPersonalityCache,
} from '@/lib/personality';
import prisma from '@/lib/prisma';
import { performanceMonitor } from './utils/performance-monitor';

interface PerformanceTestSuite {
  name: string;
  description: string;
  tests: PerformanceTest[];
  setupFn?: () => Promise<void>;
  teardownFn?: () => Promise<void>;
}

interface PerformanceTest {
  name: string;
  description: string;
  category:
    | 'computation'
    | 'memory'
    | 'database'
    | 'cache'
    | 'api'
    | 'concurrent';
  testFn: () => Promise<void>;
  expectations: {
    maxAvgDuration?: number;
    maxP95Duration?: number;
    maxMemoryGrowth?: number;
    minThroughput?: number;
    maxErrorRate?: number;
  };
}

interface ComprehensivePerformanceReport {
  timestamp: Date;
  totalDuration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  overallScore: number;
  categories: {
    [key: string]: {
      tests: number;
      passed: number;
      failed: number;
      avgScore: number;
    };
  };
  recommendations: string[];
  performanceBaseline: {
    computation: number;
    memory: number;
    database: number;
    cache: number;
    concurrent: number;
  };
}

class PerformanceTestRunner {
  private testSuites: PerformanceTestSuite[] = [];
  private report: ComprehensivePerformanceReport;

  constructor() {
    this.report = {
      timestamp: new Date(),
      totalDuration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallScore: 0,
      categories: {},
      recommendations: [],
      performanceBaseline: {
        computation: 0,
        memory: 0,
        database: 0,
        cache: 0,
        concurrent: 0,
      },
    };
  }

  addTestSuite(suite: PerformanceTestSuite): void {
    this.testSuites.push(suite);
  }

  async runAllTests(): Promise<ComprehensivePerformanceReport> {
    console.log('🚀 Starting Comprehensive Performance Test Suite');
    console.log('='.repeat(60));

    const overallStart = performance.now();

    for (const suite of this.testSuites) {
      console.log(`\n📋 Running Test Suite: ${suite.name}`);
      console.log(`   Description: ${suite.description}`);
      console.log('-'.repeat(50));

      if (suite.setupFn) {
        await suite.setupFn();
      }

      try {
        await this.runTestSuite(suite);
      } catch (error) {
        console.error(`❌ Test suite ${suite.name} failed:`, error);
      }

      if (suite.teardownFn) {
        await suite.teardownFn();
      }
    }

    const overallEnd = performance.now();
    this.report.totalDuration = overallEnd - overallStart;

    this.generateReport();
    this.printReport();

    return this.report;
  }

  private async runTestSuite(suite: PerformanceTestSuite): Promise<void> {
    for (const test of suite.tests) {
      console.log(`\n🧪 ${test.name}`);
      console.log(`   Category: ${test.category}`);
      console.log(`   ${test.description}`);

      this.report.totalTests++;

      if (!this.report.categories[test.category]) {
        this.report.categories[test.category] = {
          tests: 0,
          passed: 0,
          failed: 0,
          avgScore: 0,
        };
      }

      this.report.categories[test.category].tests++;

      try {
        const testStart = performance.now();
        await test.testFn();
        const testEnd = performance.now();
        const testDuration = testEnd - testStart;

        console.log(`   ✅ PASSED (${testDuration.toFixed(2)}ms)`);
        this.report.passedTests++;
        this.report.categories[test.category].passed++;
      } catch (error) {
        console.log(
          `   ❌ FAILED: ${error instanceof Error ? error.message : String(error)}`
        );
        this.report.failedTests++;
        this.report.categories[test.category].failed++;
      }
    }
  }

  private generateReport(): void {
    // Calculate overall score
    const passRate = this.report.passedTests / this.report.totalTests;
    this.report.overallScore = Math.round(passRate * 100);

    // Calculate category scores
    for (const [category, stats] of Object.entries(this.report.categories)) {
      const categoryPassRate = stats.passed / stats.tests;
      stats.avgScore = Math.round(categoryPassRate * 100);
    }

    // Generate recommendations
    this.generateRecommendations();
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];

    // Check overall performance
    if (this.report.overallScore < 70) {
      recommendations.push(
        'Overall performance is below acceptable threshold. Consider system optimization.'
      );
    }

    // Check category performance
    for (const [category, stats] of Object.entries(this.report.categories)) {
      if (stats.avgScore < 70) {
        recommendations.push(
          `${category} performance needs improvement. Review ${category}-specific optimizations.`
        );
      }
    }

    // Check specific failure patterns
    if (this.report.categories.memory?.failed > 0) {
      recommendations.push(
        'Memory-related issues detected. Consider memory profiling and optimization.'
      );
    }

    if (this.report.categories.database?.failed > 0) {
      recommendations.push(
        'Database performance issues detected. Review query optimization and indexing.'
      );
    }

    if (this.report.categories.concurrent?.failed > 0) {
      recommendations.push(
        'Concurrency issues detected. Review thread safety and resource contention.'
      );
    }

    this.report.recommendations = recommendations;
  }

  private printReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE PERFORMANCE TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${this.report.totalTests}`);
    console.log(`   Passed: ${this.report.passedTests}`);
    console.log(`   Failed: ${this.report.failedTests}`);
    console.log(`   Success Rate: ${this.report.overallScore}%`);
    console.log(
      `   Total Duration: ${(this.report.totalDuration / 1000).toFixed(2)}s`
    );

    console.log(`\n📈 Category Performance:`);
    for (const [category, stats] of Object.entries(this.report.categories)) {
      const icon =
        stats.avgScore >= 90 ? '🟢' : stats.avgScore >= 70 ? '🟡' : '🔴';
      console.log(
        `   ${icon} ${category.toUpperCase()}: ${stats.avgScore}% (${stats.passed}/${stats.tests})`
      );
    }

    if (this.report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      this.report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log(`\n🏆 Performance Grade: ${this.getPerformanceGrade()}`);
    console.log('='.repeat(80));
  }

  private getPerformanceGrade(): string {
    if (this.report.overallScore >= 95) return 'A+ (Excellent)';
    if (this.report.overallScore >= 90) return 'A (Very Good)';
    if (this.report.overallScore >= 85) return 'B+ (Good)';
    if (this.report.overallScore >= 80) return 'B (Satisfactory)';
    if (this.report.overallScore >= 70) return 'C+ (Acceptable)';
    if (this.report.overallScore >= 60) return 'C (Needs Improvement)';
    return 'D (Poor - Requires Attention)';
  }
}

// Main performance test runner
async function runComprehensivePerformanceTests(): Promise<void> {
  const runner = new PerformanceTestRunner();

  // MBTI Calculation Performance Tests
  runner.addTestSuite({
    name: 'MBTI Calculation Performance',
    description:
      'Tests for MBTI personality calculation performance under various loads',
    tests: [
      {
        name: 'Small Dataset Performance',
        description: 'Test calculation performance with 100 records',
        category: 'computation',
        testFn: async () => {
          const testData = Array.from({ length: 100 }, (_, i) => ({
            [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
          }));

          const result = await performanceMonitor.measureSync(
            'Small dataset calculations',
            () => {
              const answers =
                testData[Math.floor(Math.random() * testData.length)];
              calculatePersonalityScores(answers);
            },
            100
          );

          if (result.avgDuration > 10)
            throw new Error('Average duration too high');
          if (result.errors > 0) throw new Error('Calculation errors detected');
        },
        expectations: {
          maxAvgDuration: 10,
          maxP95Duration: 50,
          maxMemoryGrowth: 1024 * 1024,
          minThroughput: 100,
        },
      },
      {
        name: 'Large Dataset Performance',
        description: 'Test calculation performance with 10,000 records',
        category: 'computation',
        testFn: async () => {
          const testData = Array.from({ length: 10000 }, (_, i) => ({
            [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
          }));

          const result = await performanceMonitor.measureSync(
            'Large dataset calculations',
            () => {
              const answers =
                testData[Math.floor(Math.random() * testData.length)];
              calculatePersonalityScores(answers);
            },
            10000
          );

          if (result.avgDuration > 100)
            throw new Error('Average duration too high');
          if (result.errors > 0) throw new Error('Calculation errors detected');
        },
        expectations: {
          maxAvgDuration: 100,
          maxP95Duration: 500,
          maxMemoryGrowth: 10 * 1024 * 1024,
          minThroughput: 10,
        },
      },
    ],
    setupFn: async () => {
      clearPersonalityCache();
      if (global.gc) global.gc();
    },
    teardownFn: async () => {
      clearPersonalityCache();
    },
  });

  // Memory Performance Tests
  runner.addTestSuite({
    name: 'Memory Performance',
    description: 'Tests for memory usage and leak detection',
    tests: [
      {
        name: 'Memory Leak Detection',
        description: 'Detect memory leaks in MBTI calculations',
        category: 'memory',
        testFn: async () => {
          const testData = Array.from({ length: 1000 }, (_, i) => ({
            [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
          }));

          const memoryTest = await performanceMonitor.detectMemoryLeaks(
            'Memory leak test',
            async () => {
              const answers =
                testData[Math.floor(Math.random() * testData.length)];
              calculatePersonalityScores(answers);
            },
            200
          );

          if (memoryTest.hasLeak) throw new Error('Memory leak detected');
          if (memoryTest.memoryGrowth > 5 * 1024 * 1024)
            throw new Error('Excessive memory growth');
        },
        expectations: {
          maxMemoryGrowth: 5 * 1024 * 1024,
        },
      },
    ],
    setupFn: async () => {
      clearPersonalityCache();
      if (global.gc) global.gc();
    },
  });

  // Cache Performance Tests
  runner.addTestSuite({
    name: 'Cache Performance',
    description: 'Tests for caching effectiveness and performance',
    tests: [
      {
        name: 'Cache Effectiveness',
        description: 'Test cache hit/miss ratios and performance improvement',
        category: 'cache',
        testFn: async () => {
          const testData = Array.from({ length: 100 }, (_, i) => ({
            [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
          }));

          // First run - populate cache
          const firstRun = await performanceMonitor.measureSync(
            'Cache population',
            () => {
              for (const answers of testData) {
                calculatePersonalityScores(answers);
              }
            },
            1
          );

          // Second run - use cache
          const secondRun = await performanceMonitor.measureSync(
            'Cache utilization',
            () => {
              for (const answers of testData) {
                calculatePersonalityScores(answers);
              }
            },
            1
          );

          const improvement =
            (firstRun.avgDuration - secondRun.avgDuration) /
            firstRun.avgDuration;
          if (improvement < 0.3)
            throw new Error('Cache improvement insufficient');
        },
        expectations: {
          maxAvgDuration: 100,
        },
      },
    ],
    setupFn: async () => {
      clearPersonalityCache();
    },
  });

  // Concurrent Performance Tests
  runner.addTestSuite({
    name: 'Concurrent Performance',
    description: 'Tests for concurrent user simulation and load handling',
    tests: [
      {
        name: 'Concurrent User Simulation',
        description: 'Simulate 50 concurrent users performing calculations',
        category: 'concurrent',
        testFn: async () => {
          const testData = Array.from({ length: 1000 }, (_, i) => ({
            [((i % 24) + 1).toString()]: Math.floor(Math.random() * 5) + 1,
          }));

          const result = await performanceMonitor.loadTest(
            'Concurrent user test',
            async () => {
              const answers =
                testData[Math.floor(Math.random() * testData.length)];
              calculatePersonalityScores(answers);
            },
            {
              concurrency: 50,
              duration: 10000, // 10 seconds
              maxRequests: 1000,
            }
          );

          if (result.errorRate > 0.05) throw new Error('Error rate too high');
          if (result.avgResponseTime > 100)
            throw new Error('Response time too high');
        },
        expectations: {
          maxErrorRate: 0.05,
          maxAvgDuration: 100,
          minThroughput: 50,
        },
      },
    ],
    setupFn: async () => {
      clearPersonalityCache();
    },
  });

  // Questions Manager Performance Tests
  runner.addTestSuite({
    name: 'Questions Manager Performance',
    description: 'Tests for MBTI questions management performance',
    tests: [
      {
        name: 'Questions Fetching Performance',
        description: 'Test questions fetching and caching performance',
        category: 'api',
        testFn: async () => {
          const manager = getMBTIManager();

          const result = await performanceMonitor.measureAsync(
            'Questions fetching',
            async () => {
              await manager.getMBTIQuestions();
              await manager.getQuestionsForPage(1);
              await manager.getTotalPages();
            },
            50
          );

          if (result.avgDuration > 200)
            throw new Error('Questions fetching too slow');
          if (result.errors > 0) throw new Error('Questions fetching errors');
        },
        expectations: {
          maxAvgDuration: 200,
          maxP95Duration: 500,
          minThroughput: 5,
        },
      },
    ],
  });

  // Run all tests
  const report = await runner.runAllTests();

  // Save report to file
  const fs = require('fs');
  const reportPath = './performance-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(report.overallScore >= 70 ? 0 : 1);
}

// Run performance tests if this file is executed directly
if (require.main === module) {
  runComprehensivePerformanceTests().catch(error => {
    console.error('Performance test runner failed:', error);
    process.exit(1);
  });
}

export { runComprehensivePerformanceTests, PerformanceTestRunner };
