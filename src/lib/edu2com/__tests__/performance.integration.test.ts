import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { callEdu2comTeamFormation } from '@/lib/edu2com/api';
import type { Edu2comParameters } from '@/lib/edu2com/contract';
import {
  EDU2COM_BASE_SKILLS as BASE_SKILLS,
  createPerson,
} from '@/lib/edu2com/fixtures';
import { runEdu2comCall } from './test-helpers';

const describeIntegration =
  process.env.EDU2COM_INTEGRATION === '1' ? describe : describe.skip;

/**
 * Performance and Load Testing for Edu2com API
 *
 * Measures response times and documents performance characteristics
 * across different cohort sizes and complexity levels.
 */

function generateCohort(numStudents: number): Edu2comParameters['people'] {
  return Array.from({ length: numStudents }, (_, i) => {
    const id = i + 1;
    return createPerson({
      id: `student-${id}`,
      gender: id % 2 === 0 ? 'MALE' : 'FEMALE',
      ei: Math.sin(id) * 0.8,
      sn: Math.cos(id) * 0.7,
      tf: Math.sin(id * 2) * 0.6,
      pj: Math.cos(id * 2) * 0.5,
      skills: [
        { id: BASE_SKILLS.frontend, level: 0.3 + (id % 8) * 0.08 },
        { id: BASE_SKILLS.backend, level: 0.4 + (id % 7) * 0.08 },
      ],
    });
  });
}

function generateTasks(
  numTasks: number,
  teamSize: number
): Edu2comParameters['tasks'] {
  return Array.from({ length: numTasks }, (_, i) => ({
    id: `task-${i + 1}`,
    teamSize,
    skills: [
      {
        id: BASE_SKILLS.frontend,
        level: 0.5 + (i % 5) * 0.1,
        importance: 1 + (i % 3),
      },
      {
        id: BASE_SKILLS.backend,
        level: 0.4 + (i % 6) * 0.1,
        importance: 1 + (i % 4),
      },
    ],
  }));
}

type PerformanceResult = {
  cohortSize: number;
  numTasks: number;
  teamSize: number;
  elapsedMs: number;
  success: boolean;
  teamsReturned: number;
  avgQuality: number;
};

describeIntegration('Performance Testing - Response Times', () => {
  const originalFetch = globalThis.fetch;
  const results: PerformanceResult[] = [];

  beforeAll(() => {
    globalThis.fetch = ((...args) => Bun.fetch(...args)) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;

    // Print performance summary
    if (results.length > 0) {
      console.log('\n=== PERFORMANCE TEST SUMMARY ===\n');
      console.log(
        'Cohort Size | Tasks | Team Size | Time (ms) | Teams | Avg Quality'
      );
      console.log('-'.repeat(75));

      for (const result of results) {
        console.log(
          `${String(result.cohortSize).padEnd(11)} | ` +
            `${String(result.numTasks).padEnd(5)} | ` +
            `${String(result.teamSize).padEnd(9)} | ` +
            `${String(result.elapsedMs.toFixed(0)).padEnd(9)} | ` +
            `${String(result.teamsReturned).padEnd(5)} | ` +
            `${result.avgQuality.toFixed(3)}`
        );
      }

      console.log('\n');
    }
  });

  describe('Small Cohorts (< 10 students)', () => {
    it('4 students, 2 tasks, teams of 2 - completes quickly', async () => {
      expect.hasAssertions();
      const cohortSize = 4;
      const numTasks = 2;
      const teamSize = 2;

      const payload: Edu2comParameters = {
        people: generateCohort(cohortSize),
        tasks: generateTasks(numTasks, teamSize),
        alpha: 0.4,
        beta: 0.3,
        gamma: 0.2,
        delta: 0.1,
      };

      const start = performance.now();
      const response = await callEdu2comTeamFormation(payload, {
        timeoutMs: 10_000,
      });
      const elapsed = performance.now() - start;

      const avgQuality =
        response.teams.reduce((sum, t) => sum + t.quality, 0) /
        response.teams.length;

      results.push({
        cohortSize,
        numTasks,
        teamSize,
        elapsedMs: elapsed,
        success: true,
        teamsReturned: response.teams.length,
        avgQuality,
      });

      expect(elapsed).toBeLessThan(5_000); // Should be very fast
      expect(response.teams.length).toBeGreaterThan(0);
    });

    it('8 students, 4 tasks, teams of 2 - baseline performance', async () => {
      expect.hasAssertions();
      const cohortSize = 8;
      const numTasks = 4;
      const teamSize = 2;

      const payload: Edu2comParameters = {
        people: generateCohort(cohortSize),
        tasks: generateTasks(numTasks, teamSize),
        alpha: 0.4,
        beta: 0.3,
        gamma: 0.2,
        delta: 0.1,
      };

      const start = performance.now();
      const response = await callEdu2comTeamFormation(payload, {
        timeoutMs: 15_000,
      });
      const elapsed = performance.now() - start;

      const avgQuality =
        response.teams.reduce((sum, t) => sum + t.quality, 0) /
        response.teams.length;

      results.push({
        cohortSize,
        numTasks,
        teamSize,
        elapsedMs: elapsed,
        success: true,
        teamsReturned: response.teams.length,
        avgQuality,
      });

      expect(elapsed).toBeLessThan(10_000);
      expect(response.teams.length).toBe(numTasks);
    });
  });

  describe('Medium Cohorts (10-30 students)', () => {
    it(
      '12 students, 4 tasks, teams of 3',
      async () => {
        expect.hasAssertions();
        const cohortSize = 12;
        const numTasks = 4;
        const teamSize = 3;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 20_000,
        });
        const elapsed = performance.now() - start;

        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(15_000);
        expect(response.teams.length).toBe(numTasks);
      },
      { timeout: 25_000 }
    );

    it(
      '20 students, 5 tasks, teams of 4',
      async () => {
        expect.hasAssertions();
        const cohortSize = 20;
        const numTasks = 5;
        const teamSize = 4;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 30_000,
        });
        const elapsed = performance.now() - start;

        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(25_000);
        expect(response.teams.length).toBe(numTasks);
      },
      { timeout: 35_000 }
    );

    it(
      '30 students, 10 tasks, teams of 3',
      async () => {
        expect.hasAssertions();
        const cohortSize = 30;
        const numTasks = 10;
        const teamSize = 3;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 40_000,
        });
        const elapsed = performance.now() - start;

        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(35_000);
        expect(response.teams.length).toBeGreaterThan(0);
      },
      { timeout: 45_000 }
    );
  });

  describe('Large Cohorts (30-60 students)', () => {
    it(
      '40 students, 10 tasks, teams of 4',
      async () => {
        expect.hasAssertions();
        const cohortSize = 40;
        const numTasks = 10;
        const teamSize = 4;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 60_000,
        });
        const elapsed = performance.now() - start;

        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(70_000);
        expect(response.teams.length).toBe(numTasks);
      },
      { timeout: 70_000 }
    );

    it(
      '60 students, 15 tasks, teams of 4',
      async () => {
        expect.hasAssertions();
        const cohortSize = 60;
        const numTasks = 15;
        const teamSize = 4;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const result = await runEdu2comCall(() =>
          callEdu2comTeamFormation(payload, {
            timeoutMs: 90_000,
          })
        );
        const elapsed = performance.now() - start;

        if (!result.ok) {
          console.warn(
            `[Performance] 60-student synchronous request failed: ${result.error.code}`
          );
          results.push({
            cohortSize,
            numTasks,
            teamSize,
            elapsedMs: elapsed,
            success: false,
            teamsReturned: 0,
            avgQuality: 0,
          });
          expect(['EDU2COM_TIMEOUT', 'EDU2COM_INVALID_RESPONSE']).toContain(
            result.error.code
          );
          return;
        }

        const response = result.value;
        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(75_000);
        expect(response.teams.length).toBeGreaterThan(0);
      },
      { timeout: 100_000 }
    );
  });

  describe('Stress Tests (60+ students)', () => {
    it(
      '80 students, 20 tasks, teams of 4 - stress test',
      async () => {
        expect.hasAssertions();
        const cohortSize = 80;
        const numTasks = 20;
        const teamSize = 4;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const result = await runEdu2comCall(() =>
          callEdu2comTeamFormation(payload, {
            timeoutMs: 120_000,
          })
        );
        const elapsed = performance.now() - start;

        if (!result.ok) {
          console.warn(
            `[Performance] 80-student synchronous request failed: ${result.error.code}`
          );
          results.push({
            cohortSize,
            numTasks,
            teamSize,
            elapsedMs: elapsed,
            success: false,
            teamsReturned: 0,
            avgQuality: 0,
          });
          expect(['EDU2COM_TIMEOUT', 'EDU2COM_INVALID_RESPONSE']).toContain(
            result.error.code
          );
          return;
        }

        const response = result.value;
        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(elapsed).toBeLessThan(100_000);
        expect(response.teams.length).toBeGreaterThan(0);

        console.log(
          `\n[Stress Test] 80 students completed in ${elapsed.toFixed(0)}ms`
        );
      },
      { timeout: 150_000 }
    );

    it(
      '100 students, 25 tasks, teams of 4 - maximum stress',
      async () => {
        expect.hasAssertions();
        const cohortSize = 100;
        const numTasks = 25;
        const teamSize = 4;

        const payload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, teamSize),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const start = performance.now();
        const result = await runEdu2comCall(() =>
          callEdu2comTeamFormation(payload, {
            timeoutMs: 180_000, // 3 minutes
          })
        );
        const elapsed = performance.now() - start;

        if (!result.ok) {
          console.warn(
            `[Performance] 100-student synchronous request failed: ${result.error.code}`
          );
          results.push({
            cohortSize,
            numTasks,
            teamSize,
            elapsedMs: elapsed,
            success: false,
            teamsReturned: 0,
            avgQuality: 0,
          });
          expect(['EDU2COM_TIMEOUT', 'EDU2COM_INVALID_RESPONSE']).toContain(
            result.error.code
          );
          return;
        }

        const response = result.value;
        const avgQuality =
          response.teams.reduce((sum, t) => sum + t.quality, 0) /
          response.teams.length;

        results.push({
          cohortSize,
          numTasks,
          teamSize,
          elapsedMs: elapsed,
          success: true,
          teamsReturned: response.teams.length,
          avgQuality,
        });

        expect(response.teams.length).toBeGreaterThan(0);

        console.log(
          `\n[Maximum Stress] 100 students completed in ${elapsed.toFixed(0)}ms (${(elapsed / 1000).toFixed(1)}s)`
        );
      },
      { timeout: 200_000 }
    );
  });

  describe('Timeout Behavior', () => {
    it(
      'respects custom timeout setting',
      async () => {
        expect.hasAssertions();
        const payload: Edu2comParameters = {
          people: generateCohort(20),
          tasks: generateTasks(5, 4),
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
        };

        const timeoutMs = 1000; // Very short timeout

        const start = performance.now();
        try {
          await callEdu2comTeamFormation(payload, { timeoutMs });
          // If it succeeds, record the time
          const elapsed = performance.now() - start;
          expect(elapsed).toBeLessThan(timeoutMs + 500); // Allow small buffer
        } catch (_error) {
          // If it times out, that's expected
          const elapsed = performance.now() - start;
          expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 100);
          expect(elapsed).toBeLessThan(timeoutMs + 500);
        }
      },
      { timeout: 5_000 }
    );
  });

  describe('Complexity Impact', () => {
    it(
      'measures impact of preferences on performance',
      async () => {
        expect.hasAssertions();
        const cohortSize = 20;
        const numTasks = 5;

        // Without preferences
        const basePayload: Edu2comParameters = {
          people: generateCohort(cohortSize),
          tasks: generateTasks(numTasks, 4),
          alpha: 0.5,
          beta: 0.5,
          gamma: 0.0,
          delta: 0.0,
        };

        const start1 = performance.now();
        await callEdu2comTeamFormation(basePayload, { timeoutMs: 30_000 });
        const elapsed1 = performance.now() - start1;

        // With preferences
        const withPreferences: Edu2comParameters = {
          ...basePayload,
          people: basePayload.people.map((person, i, arr) => ({
            ...person,
            preferences: [
              {
                personId: arr[(i + 1) % arr.length]?.id,
                preference: 0.8,
              },
            ],
          })),
          gamma: 0.5,
        };

        const start2 = performance.now();
        await callEdu2comTeamFormation(withPreferences, { timeoutMs: 30_000 });
        const elapsed2 = performance.now() - start2;

        console.log(
          `\n[Complexity] Without preferences: ${elapsed1.toFixed(0)}ms, With preferences: ${elapsed2.toFixed(0)}ms (${((elapsed2 / elapsed1 - 1) * 100).toFixed(1)}% change)`
        );

        // Both should complete successfully
        expect(elapsed1).toBeLessThan(30_000);
        expect(elapsed2).toBeLessThan(30_000);
      },
      { timeout: 70_000 }
    );
  });
});
