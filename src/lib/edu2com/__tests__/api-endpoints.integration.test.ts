import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { z } from 'zod';

import {
  EDU2COM_BASE_SKILLS as BASE_SKILLS,
  createBasePayload,
} from '@/lib/edu2com/fixtures';

const EDU2COM_BASE_URL = 'https://ardid.iiia.csic.es/eduteams/edu2com';

describe.skipIf(process.env.EDU2COM_INTEGRATION !== '1')(
  'Edu2com API Endpoints - Integration Tests',
  () => {
    let originalFetch: typeof globalThis.fetch;

    beforeAll(() => {
      originalFetch = globalThis.fetch;
      globalThis.fetch = Bun.fetch as typeof globalThis.fetch;
    });

    afterAll(() => {
      if (originalFetch) {
        globalThis.fetch = originalFetch;
      }
    });

    describe('GET /v1/help', () => {
      it('returns API information with name and version', async () => {
        expect.hasAssertions();
        const res = await fetch(`${EDU2COM_BASE_URL}/v1/help`);

        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toContain('application/json');

        const data = await res.json();

        // Validate against OpenAPI schema
        const infoSchema = z.object({
          name: z.string(),
          version: z.string(),
        });

        const parsed = infoSchema.safeParse(data);
        expect(parsed.success).toBe(true);

        if (parsed.success) {
          expect(parsed.data.name).toBe('Edu2com');
          expect(parsed.data.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
        }
      });

      it('responds quickly (< 2 seconds)', async () => {
        expect.hasAssertions();
        const start = performance.now();
        const res = await fetch(`${EDU2COM_BASE_URL}/v1/help`);
        const elapsed = performance.now() - start;

        expect(res.ok).toBe(true);
        expect(elapsed).toBeLessThan(2000);
      });
    });

    describe('POST /v1/teamFormation - Synchronous Endpoint', () => {
      it('accepts valid team formation request and returns teams', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamFormation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty('teams');
        expect(Array.isArray(data.teams)).toBe(true);
        expect(data.teams.length).toBeGreaterThan(0);

        // Validate each team
        for (const team of data.teams) {
          expect(team).toHaveProperty('taskId');
          expect(team).toHaveProperty('quality');
          expect(team).toHaveProperty('people');

          expect(typeof team.taskId).toBe('string');
          expect(typeof team.quality).toBe('number');
          expect(team.quality).toBeGreaterThanOrEqual(0);
          expect(team.quality).toBeLessThanOrEqual(1);

          expect(Array.isArray(team.people)).toBe(true);
          expect(team.people.length).toBeGreaterThan(0);

          // Validate each person in team
          for (const person of team.people) {
            expect(person).toHaveProperty('id');
            expect(person).toHaveProperty('skillIds');
            expect(typeof person.id).toBe('string');
            expect(Array.isArray(person.skillIds)).toBe(true);
          }
        }
      });

      it('returns 422 for invalid payload (less than 2 people)', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();
        const firstPerson = payload.people[0];
        if (firstPerson) {
          payload.people = [firstPerson];
        }

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamFormation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('returns 400 for insufficient headcount', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();
        payload.people = payload.people.slice(0, 3); // Only 3 people
        payload.tasks = [
          {
            id: 'task-large',
            teamSize: 4, // Need 4 but only have 3
            skills: [{ id: BASE_SKILLS.frontend, level: 0.6, importance: 1 }],
          },
        ];

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamFormation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(400);
      });

      it('returns 422 for invalid alpha parameter (out of range)', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();
        payload.alpha = 1.5; // Invalid: > 1.0

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamFormation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('handles missing Content-Type header gracefully', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamFormation`, {
          method: 'POST',
          body: JSON.stringify(payload),
          // No Content-Type header
        });

        // Should either work or return a clear error
        expect([200, 400, 422, 415]).toContain(res.status);
      });
    });

    describe('POST /v1/backgroundTeamFormation - Asynchronous Endpoint', () => {
      it('returns 202 for valid background request with webhook URL', async () => {
        expect.hasAssertions();
        const payload = {
          ...createBasePayload(),
          replyPostUrl: 'https://example.com/webhook',
        };

        const res = await fetch(
          `${EDU2COM_BASE_URL}/v1/backgroundTeamFormation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        expect(res.status).toBe(202); // Accepted
      });

      it('returns 422 for missing replyPostUrl', async () => {
        expect.hasAssertions();
        const payload = createBasePayload();
        // Missing replyPostUrl

        const res = await fetch(
          `${EDU2COM_BASE_URL}/v1/backgroundTeamFormation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('returns 422 for invalid replyPostUrl (not a URL)', async () => {
        expect.hasAssertions();
        const payload = {
          ...createBasePayload(),
          replyPostUrl: 'not-a-valid-url',
        };

        const res = await fetch(
          `${EDU2COM_BASE_URL}/v1/backgroundTeamFormation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('responds quickly for background requests (< 5 seconds)', async () => {
        expect.hasAssertions();
        const payload = {
          ...createBasePayload(),
          replyPostUrl: 'https://example.com/webhook',
        };

        const start = performance.now();
        const res = await fetch(
          `${EDU2COM_BASE_URL}/v1/backgroundTeamFormation`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const elapsed = performance.now() - start;

        expect(res.status).toBe(202);
        expect(elapsed).toBeLessThan(5000);
      });
    });

    describe('POST /v1/teamQuality - Quality Calculation Endpoint', () => {
      it('calculates quality for a valid team', async () => {
        expect.hasAssertions();
        const payload = {
          alpha: 0.4,
          beta: 0.3,
          gamma: 0.2,
          delta: 0.1,
          taskSkills: [
            { id: BASE_SKILLS.frontend, level: 0.7, importance: 1 },
            { id: BASE_SKILLS.backend, level: 0.5, importance: 1 },
          ],
          team: [
            {
              id: 'student-1',
              gender: 'FEMALE',
              personality: { ei: 0.3, sn: -0.2, tf: 0.5, pj: 0.7 },
              skills: [
                { id: BASE_SKILLS.frontend, level: 0.8 },
                { id: BASE_SKILLS.backend, level: 0.4 },
              ],
              taskPreference: 0.8,
            },
            {
              id: 'student-2',
              gender: 'MALE',
              personality: { ei: -0.1, sn: 0.6, tf: -0.2, pj: 0.4 },
              skills: [
                { id: BASE_SKILLS.frontend, level: 0.6 },
                { id: BASE_SKILLS.backend, level: 0.7 },
              ],
              taskPreference: 0.6,
            },
          ],
        };

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamQuality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty('quality');
        expect(typeof data.quality).toBe('number');
        expect(data.quality).toBeGreaterThanOrEqual(0);
        expect(data.quality).toBeLessThanOrEqual(1);
      });

      it('returns 422 for team with less than 2 members', async () => {
        expect.hasAssertions();
        const payload = {
          taskSkills: [{ id: BASE_SKILLS.frontend, level: 0.7, importance: 1 }],
          team: [
            {
              id: 'student-1',
              personality: { ei: 0.3, sn: -0.2, tf: 0.5, pj: 0.7 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.8 }],
            },
          ], // Only 1 member
        };

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamQuality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('returns 422 for missing task skills', async () => {
        expect.hasAssertions();
        const payload = {
          taskSkills: [], // Empty skills
          team: [
            {
              id: 'student-1',
              personality: { ei: 0.3, sn: -0.2, tf: 0.5, pj: 0.7 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.8 }],
            },
            {
              id: 'student-2',
              personality: { ei: -0.1, sn: 0.6, tf: -0.2, pj: 0.4 },
              skills: [{ id: BASE_SKILLS.backend, level: 0.7 }],
            },
          ],
        };

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamQuality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(422);
      });

      it('accepts quality calculation without optional parameters', async () => {
        expect.hasAssertions();
        const payload = {
          // No alpha, beta, gamma, delta
          taskSkills: [{ id: BASE_SKILLS.frontend, level: 0.7, importance: 1 }],
          team: [
            {
              id: 'student-1',
              personality: { ei: 0.3, sn: -0.2, tf: 0.5, pj: 0.7 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.8 }],
            },
            {
              id: 'student-2',
              personality: { ei: -0.1, sn: 0.6, tf: -0.2, pj: 0.4 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.6 }],
            },
          ],
        };

        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamQuality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty('quality');
      });

      it('quality calculation responds in reasonable time (< 3 seconds)', async () => {
        expect.hasAssertions();
        const payload = {
          taskSkills: [{ id: BASE_SKILLS.frontend, level: 0.7, importance: 1 }],
          team: [
            {
              id: 'student-1',
              personality: { ei: 0.3, sn: -0.2, tf: 0.5, pj: 0.7 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.8 }],
            },
            {
              id: 'student-2',
              personality: { ei: -0.1, sn: 0.6, tf: -0.2, pj: 0.4 },
              skills: [{ id: BASE_SKILLS.frontend, level: 0.6 }],
            },
          ],
        };

        const start = performance.now();
        const res = await fetch(`${EDU2COM_BASE_URL}/v1/teamQuality`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const elapsed = performance.now() - start;

        expect(res.ok).toBe(true);
        expect(elapsed).toBeLessThan(3000);
      });
    });
  }
);
