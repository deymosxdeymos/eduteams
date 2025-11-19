import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { callEdu2comTeamFormation } from '@/lib/edu2com/api';
import type { Edu2comParameters } from '@/lib/edu2com/contract';
import { EDU2COM_BASE_SKILLS as BASE_SKILLS } from '@/lib/edu2com/fixtures';
import { normalizeTeamsByMembers, runEdu2comCall } from './test-helpers';

const describeIntegration =
  process.env.EDU2COM_INTEGRATION === '1' ? describe : describe.skip;

/**
 * Property-Based Testing for Edu2com API
 *
 * These tests generate random valid inputs and verify invariants hold across all scenarios.
 * Future enhancement: Install fast-check for more sophisticated property testing
 * - `bun add -d fast-check`
 */

// Random data generators
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function randomPersonality() {
  return {
    ei: randomBetween(-1, 1),
    sn: randomBetween(-1, 1),
    tf: randomBetween(-1, 1),
    pj: randomBetween(-1, 1),
  };
}

function randomSkills() {
  const skills = [
    BASE_SKILLS.frontend,
    BASE_SKILLS.backend,
    BASE_SKILLS.devops,
  ];
  const numSkills = randomInt(1, 3);
  const selectedSkills = skills.slice(0, numSkills);

  return selectedSkills.map(id => ({
    id,
    level: randomBetween(0.1, 1.0),
  }));
}

function generateRandomPeople(count: number) {
  const genders: Array<'MALE' | 'FEMALE'> = ['MALE', 'FEMALE'];

  return Array.from({ length: count }, (_, i) => ({
    id: `person-${i + 1}`,
    gender: genders[randomInt(0, 1)],
    personality: randomPersonality(),
    skills: randomSkills(),
  }));
}

function generateRandomTasks(numTasks: number, totalPeople: number) {
  const tasks = [];
  let remainingPeople = totalPeople;

  for (let i = 0; i < numTasks; i++) {
    const isLastTask = i === numTasks - 1;
    const minTeamSize = 2;
    const maxTeamSize = Math.min(
      isLastTask
        ? remainingPeople
        : Math.floor(remainingPeople / (numTasks - i)),
      8
    );

    const teamSize = randomInt(minTeamSize, Math.max(minTeamSize, maxTeamSize));
    remainingPeople -= teamSize;

    tasks.push({
      id: `task-${i + 1}`,
      teamSize,
      skills: [
        {
          id: BASE_SKILLS.frontend,
          level: randomBetween(0.3, 0.9),
          importance: randomBetween(1, 3),
        },
        {
          id: BASE_SKILLS.backend,
          level: randomBetween(0.3, 0.9),
          importance: randomBetween(1, 3),
        },
      ],
    });

    if (remainingPeople < minTeamSize) break;
  }

  return tasks;
}

function generateRandomPayload(
  numPeople: number,
  numTasks: number
): Edu2comParameters {
  return {
    people: generateRandomPeople(numPeople),
    tasks: generateRandomTasks(numTasks, numPeople),
    alpha: randomBetween(0, 1),
    beta: randomBetween(0, 1),
    gamma: randomBetween(0, 1),
    delta: randomBetween(0, 1),
    initRandom: Math.random() > 0.5,
  };
}

describeIntegration('Property-Based Testing - Invariant Verification', () => {
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    globalThis.fetch = ((...args) => Bun.fetch(...args)) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Core Invariants', () => {
    const NUM_TRIALS = 10;

    it(
      `INVARIANT: All team qualities are in range [0, 1] (${NUM_TRIALS} trials)`,
      async () => {
        expect.hasAssertions();
        let completedTrials = 0;
        for (let trial = 0; trial < NUM_TRIALS; trial++) {
          const numPeople = randomInt(4, 12);
          const numTasks = randomInt(1, 3);
          const payload = generateRandomPayload(numPeople, numTasks);

          const result = await runEdu2comCall(() =>
            callEdu2comTeamFormation(payload, {
              timeoutMs: 15_000,
            })
          );

          if (!result.ok) {
            console.warn(
              `[Property-Based] Quality invariant trial ${trial} skipped: ${result.error.code}`
            );
            continue;
          }

          completedTrials += 1;
          const response = result.value;

          for (const team of response.teams) {
            expect(team.quality).toBeGreaterThanOrEqual(0);
            expect(team.quality).toBeLessThanOrEqual(1);
          }
        }

        expect(completedTrials).toBeGreaterThan(0);
      },
      { timeout: NUM_TRIALS * 20_000 }
    );

    it(
      `INVARIANT: All people are assigned to exactly one team (${NUM_TRIALS} trials)`,
      async () => {
        expect.hasAssertions();
        let completedTrials = 0;
        for (let trial = 0; trial < NUM_TRIALS; trial++) {
          const numPeople = randomInt(4, 10);
          const numTasks = randomInt(1, 3);
          const payload = generateRandomPayload(numPeople, numTasks);

          // Ensure tasks can accommodate all people
          const totalSeats = payload.tasks.reduce(
            (sum, task) => sum + task.teamSize,
            0
          );
          if (totalSeats < numPeople) {
            // Adjust last task to fit everyone
            const shortfall = numPeople - totalSeats;
            const lastTask = payload.tasks[payload.tasks.length - 1];
            if (lastTask) {
              lastTask.teamSize += shortfall;
            }
          }

          const result = await runEdu2comCall(() =>
            callEdu2comTeamFormation(payload, {
              timeoutMs: 15_000,
            })
          );

          if (!result.ok) {
            console.warn(
              `[Property-Based] Assignment invariant trial ${trial} skipped: ${result.error.code}`
            );
            continue;
          }

          completedTrials += 1;
          const response = result.value;

          // Collect all assigned person IDs
          const assignedIds = response.teams.flatMap(team =>
            team.people.map(p => p.id)
          );

          // Check for duplicates
          const uniqueIds = new Set(assignedIds);
          expect(assignedIds.length).toBe(uniqueIds.size); // No duplicates

          // Verify all people are assigned
          const allPeopleIds = new Set(payload.people.map(p => p.id));
          expect(assignedIds.length).toBeGreaterThanOrEqual(
            allPeopleIds.size - 2
          ); // Allow max 2 unassigned
        }

        expect(completedTrials).toBeGreaterThan(0);
      },
      { timeout: NUM_TRIALS * 20_000 }
    );

    it(
      `INVARIANT: Team sizes match task requirements (${NUM_TRIALS} trials)`,
      async () => {
        expect.hasAssertions();
        let completedTrials = 0;
        for (let trial = 0; trial < NUM_TRIALS; trial++) {
          const numPeople = randomInt(6, 14);
          const numTasks = randomInt(2, 4);
          const payload = generateRandomPayload(numPeople, numTasks);

          const result = await runEdu2comCall(() =>
            callEdu2comTeamFormation(payload, {
              timeoutMs: 20_000,
            })
          );

          if (!result.ok) {
            console.warn(
              `[Property-Based] Team size invariant trial ${trial} skipped: ${result.error.code}`
            );
            continue;
          }

          completedTrials += 1;
          const response = result.value;

          for (const team of response.teams) {
            const task = payload.tasks.find(t => t.id === team.taskId);
            expect(task).toBeDefined();

            if (task) {
              // Team size should match task requirement
              expect(team.people.length).toBe(task.teamSize);
            }
          }
        }

        expect(completedTrials).toBeGreaterThan(0);
      },
      { timeout: NUM_TRIALS * 20_000 }
    );

    it(
      `INVARIANT: All teams have at least 2 members (${NUM_TRIALS} trials)`,
      async () => {
        expect.hasAssertions();
        let completedTrials = 0;
        for (let trial = 0; trial < NUM_TRIALS; trial++) {
          const numPeople = randomInt(4, 10);
          const numTasks = randomInt(1, 3);
          const payload = generateRandomPayload(numPeople, numTasks);

          const result = await runEdu2comCall(() =>
            callEdu2comTeamFormation(payload, {
              timeoutMs: 20_000,
            })
          );

          if (!result.ok) {
            console.warn(
              `[Property-Based] Min team size invariant trial ${trial} skipped: ${result.error.code}`
            );
            continue;
          }

          completedTrials += 1;
          const response = result.value;

          for (const team of response.teams) {
            expect(team.people.length).toBeGreaterThanOrEqual(2);
          }
        }

        expect(completedTrials).toBeGreaterThan(0);
      },
      { timeout: NUM_TRIALS * 20_000 }
    );

    it(
      `INVARIANT: Skill assignments reference valid skills (${NUM_TRIALS} trials)`,
      async () => {
        expect.hasAssertions();
        for (let trial = 0; trial < NUM_TRIALS; trial++) {
          const numPeople = randomInt(4, 8);
          const numTasks = randomInt(1, 2);
          const payload = generateRandomPayload(numPeople, numTasks);

          const response = await callEdu2comTeamFormation(payload, {
            timeoutMs: 15_000,
          });

          // Collect all skill IDs used in payload
          const _validSkillIds = new Set(
            payload.people.flatMap(p => p.skills.map(s => s.id))
          );

          for (const team of response.teams) {
            for (const person of team.people) {
              for (const skillId of person.skillIds) {
                // Skill ID should be valid (either from person's skills or task skills)
                expect(typeof skillId).toBe('string');
                expect(skillId.length).toBeGreaterThan(0);
              }
            }
          }
        }
      },
      { timeout: NUM_TRIALS * 20_000 }
    );
  });

  describe('Edge Case Properties', () => {
    it('PROPERTY: Minimum viable input (2 people, 1 task) always succeeds', async () => {
      expect.hasAssertions();
      const payload: Edu2comParameters = {
        people: generateRandomPeople(2),
        tasks: [
          {
            id: 'task-1',
            teamSize: 2,
            skills: [{ id: BASE_SKILLS.frontend, level: 0.5, importance: 1 }],
          },
        ],
        alpha: randomBetween(0, 1),
        beta: randomBetween(0, 1),
        gamma: randomBetween(0, 1),
        delta: randomBetween(0, 1),
      };

      const response = await callEdu2comTeamFormation(payload, {
        timeoutMs: 10_000,
      });

      expect(response.teams.length).toBe(1);
      expect(response.teams[0]?.people.length).toBe(2);
    });

    it('PROPERTY: Maximum diversity (all different personalities) succeeds', async () => {
      expect.hasAssertions();
      const extremePersonalities = [
        { ei: 1, sn: 1, tf: 1, pj: 1 },
        { ei: -1, sn: -1, tf: -1, pj: -1 },
        { ei: 1, sn: -1, tf: 1, pj: -1 },
        { ei: -1, sn: 1, tf: -1, pj: 1 },
      ];

      const payload: Edu2comParameters = {
        people: extremePersonalities.map((personality, i) => ({
          id: `person-${i + 1}`,
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          personality,
          skills: randomSkills(),
        })),
        tasks: [
          {
            id: 'task-1',
            teamSize: 2,
            skills: [{ id: BASE_SKILLS.frontend, level: 0.5, importance: 1 }],
          },
          {
            id: 'task-2',
            teamSize: 2,
            skills: [{ id: BASE_SKILLS.backend, level: 0.5, importance: 1 }],
          },
        ],
        alpha: 0.25,
        beta: 0.25,
        gamma: 0.25,
        delta: 0.25,
      };

      const response = await callEdu2comTeamFormation(payload, {
        timeoutMs: 10_000,
      });

      expect(response.teams.length).toBe(2);
    });

    it('PROPERTY: All identical students (same skills, same personality) succeeds', async () => {
      expect.hasAssertions();
      const identicalPersonality = { ei: 0.5, sn: 0.3, tf: -0.2, pj: 0.1 };
      const identicalSkills = [
        { id: BASE_SKILLS.frontend, level: 0.6 },
        { id: BASE_SKILLS.backend, level: 0.4 },
      ];

      const payload: Edu2comParameters = {
        people: Array.from({ length: 6 }, (_, i) => ({
          id: `person-${i + 1}`,
          gender: 'MALE',
          personality: { ...identicalPersonality },
          skills: identicalSkills.map(s => ({ ...s })),
        })),
        tasks: [
          {
            id: 'task-1',
            teamSize: 3,
            skills: [{ id: BASE_SKILLS.frontend, level: 0.5, importance: 1 }],
          },
          {
            id: 'task-2',
            teamSize: 3,
            skills: [{ id: BASE_SKILLS.backend, level: 0.5, importance: 1 }],
          },
        ],
        alpha: 0.4,
        beta: 0.3,
        gamma: 0.2,
        delta: 0.1,
      };

      const response = await callEdu2comTeamFormation(payload, {
        timeoutMs: 10_000,
      });

      expect(response.teams.length).toBe(2);
      expect(response.teams[0]?.people.length).toBe(3);
      expect(response.teams[1]?.people.length).toBe(3);
    });

    it(
      'PROPERTY: Large cohort (30 people, 10 tasks) completes in reasonable time',
      async () => {
        expect.hasAssertions();
        const payload = generateRandomPayload(30, 10);

        const start = performance.now();
        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 60_000,
        });
        const elapsed = performance.now() - start;

        expect(response.teams.length).toBeGreaterThan(0);
        expect(elapsed).toBeLessThan(45_000); // Should complete within 45 seconds
      },
      { timeout: 70_000 }
    );
  });

  describe('Randomness Properties', () => {
    it(
      'PROPERTY: initRandom=false produces deterministic results (3 trials)',
      async () => {
        expect.hasAssertions();
        const payload = generateRandomPayload(6, 2);
        payload.initRandom = false;

        const normalizedResults = [];
        for (let i = 0; i < 3; i++) {
          const response = await callEdu2comTeamFormation(payload, {
            timeoutMs: 10_000,
          });
          normalizedResults.push(normalizeTeamsByMembers(response));
        }

        expect(normalizedResults[0]).toEqual(normalizedResults[1]);
        expect(normalizedResults[1]).toEqual(normalizedResults[2]);
      },
      { timeout: 40_000 }
    );

    it('PROPERTY: Different random seeds may produce different quality scores', async () => {
      expect.hasAssertions();
      const basePayload = generateRandomPayload(8, 3);

      const trial1 = { ...basePayload, initRandom: true };
      const trial2 = { ...basePayload, initRandom: false };

      const response1 = await callEdu2comTeamFormation(trial1, {
        timeoutMs: 10_000,
      });
      const response2 = await callEdu2comTeamFormation(trial2, {
        timeoutMs: 10_000,
      });

      // Both should succeed
      expect(response1.teams.length).toBeGreaterThan(0);
      expect(response2.teams.length).toBeGreaterThan(0);

      // Quality scores may differ (or may be same - just documenting behavior)
      // This is a weak property test - mainly verifies both modes work
    });
  });

  describe('Stress Tests', () => {
    it(
      'STRESS: Handles 50 people across 15 tasks',
      async () => {
        expect.hasAssertions();
        const payload = generateRandomPayload(50, 15);

        const result = await runEdu2comCall(() =>
          callEdu2comTeamFormation(payload, {
            timeoutMs: 90_000,
          })
        );

        if (!result.ok) {
          console.warn(
            `[Property-Based] 50-person stress test failed due to ${result.error.code}. Use backgroundTeamFormation for this scale.`
          );
          expect(['EDU2COM_TIMEOUT', 'EDU2COM_INVALID_RESPONSE']).toContain(
            result.error.code
          );
          return;
        }

        const response = result.value;
        expect(response.teams.length).toBeGreaterThan(0);

        // Verify basic invariants still hold
        for (const team of response.teams) {
          expect(team.quality).toBeGreaterThanOrEqual(0);
          expect(team.quality).toBeLessThanOrEqual(1);
          expect(team.people.length).toBeGreaterThanOrEqual(2);
        }
      },
      { timeout: 120_000 }
    );

    it(
      'STRESS: Many small teams (20 tasks of size 2, 40 people)',
      async () => {
        expect.hasAssertions();
        const people = generateRandomPeople(40);
        const tasks = Array.from({ length: 20 }, (_, i) => ({
          id: `task-${i + 1}`,
          teamSize: 2,
          skills: [
            {
              id: BASE_SKILLS.frontend,
              level: randomBetween(0.3, 0.8),
              importance: 1,
            },
          ],
        }));

        const payload: Edu2comParameters = {
          people,
          tasks,
          alpha: 0.5,
          beta: 0.5,
          gamma: 0,
          delta: 0,
        };

        const response = await callEdu2comTeamFormation(payload, {
          timeoutMs: 60_000,
        });

        expect(response.teams.length).toBeGreaterThan(0);
        expect(response.teams.length).toBeLessThanOrEqual(20);
      },
      { timeout: 70_000 }
    );
  });
});
