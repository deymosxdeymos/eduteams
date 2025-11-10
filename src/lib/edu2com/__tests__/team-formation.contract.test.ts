import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { callEdu2comTeamFormation } from '@/lib/edu2com/api';
import {
  type Edu2comParameters,
  edu2comParametersSchema,
  edu2comTeamsResponseSchema,
} from '@/lib/edu2com/contract';
import {
  EDU2COM_BASE_SIMILARITIES as BASE_SIMILARITIES,
  EDU2COM_BASE_SKILLS as BASE_SKILLS,
  createBasePayload,
  createPerson,
} from '@/lib/edu2com/fixtures';

const basePayload = () => createBasePayload();

const validPayloads: Array<{
  name: string;
  payload: Edu2comParameters;
  includeInIntegration?: boolean;
}> = [
  {
    name: 'balanced teams 2x2',
    payload: basePayload(),
    includeInIntegration: true,
  },
  {
    name: 'odd number of students distributing 3+2',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.people.push(
        createPerson({
          id: 'student-5',
          gender: 'FEMALE',
          ei: 0.2,
          sn: 0.1,
          tf: 0.4,
          pj: -0.5,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.55 },
            { id: BASE_SKILLS.devops, level: 0.6 },
          ],
        })
      );
      payload.tasks = [
        {
          id: 'task-complex',
          teamSize: 3,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.6, importance: 1 },
            { id: BASE_SKILLS.backend, level: 0.6, importance: 1 },
            { id: BASE_SKILLS.devops, level: 0.4, importance: 1 },
          ],
        },
        {
          id: 'task-support',
          teamSize: 2,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.5, importance: 1 },
            { id: BASE_SKILLS.backend, level: 0.3, importance: 1 },
          ],
        },
      ];
      return payload;
    })(),
    includeInIntegration: true,
  },
  {
    name: 'random initialization enabled',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.initRandom = true;
      return payload;
    })(),
  },
  {
    name: 'increased alpha weighting',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.alpha = 1;
      payload.beta = 0;
      payload.gamma = 0;
      payload.delta = 0;
      return payload;
    })(),
  },
  {
    name: 'preferences and extended skills',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.people = payload.people.map((person, index, array) => {
        const enhancedSkills =
          index < 2
            ? [...person.skills, { id: BASE_SKILLS.devops, level: 0.45 }]
            : person.skills;
        const nextPerson = array[(index + 1) % array.length];
        return {
          ...person,
          skills: enhancedSkills,
          preferences: nextPerson
            ? [
                {
                  personId: nextPerson.id,
                  preference: 0.8,
                },
              ]
            : [],
        };
      });
      payload.tasks = payload.tasks.map(task => {
        const [firstPerson, secondPerson] = payload.people;
        const preferences = [
          ...(firstPerson
            ? [{ personId: firstPerson.id, preference: 0.9 }]
            : []),
          ...(secondPerson
            ? [{ personId: secondPerson.id, preference: 0.6 }]
            : []),
        ];
        return {
          ...task,
          preferences,
          skills: [
            ...task.skills,
            { id: BASE_SKILLS.devops, level: 0.3, importance: 1 },
          ],
        };
      });
      payload.similarities = [
        ...BASE_SIMILARITIES,
        {
          sourceId: BASE_SKILLS.frontend,
          targetId: BASE_SKILLS.devops,
          similarity: 0.4,
        },
      ];
      return payload;
    })(),
  },
  {
    name: 'larger cohort 6 students 3 per team',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.people.push(
        createPerson({
          id: 'student-5',
          gender: 'MALE',
          ei: 0.1,
          sn: -0.5,
          tf: 0.2,
          pj: 0.4,
          skills: [
            { id: BASE_SKILLS.devops, level: 0.7 },
            { id: BASE_SKILLS.backend, level: 0.5 },
          ],
        }),
        createPerson({
          id: 'student-6',
          gender: 'FEMALE',
          ei: -0.4,
          sn: 0.3,
          tf: 0.6,
          pj: -0.3,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.6 },
            { id: BASE_SKILLS.devops, level: 0.5 },
          ],
        })
      );
      payload.tasks = [
        {
          id: 'task-frontline',
          teamSize: 3,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.6, importance: 1 },
            { id: BASE_SKILLS.backend, level: 0.4, importance: 1 },
            { id: BASE_SKILLS.devops, level: 0.3, importance: 1 },
          ],
        },
        {
          id: 'task-backoffice',
          teamSize: 3,
          skills: [
            { id: BASE_SKILLS.backend, level: 0.6, importance: 1 },
            { id: BASE_SKILLS.frontend, level: 0.4, importance: 1 },
            { id: BASE_SKILLS.devops, level: 0.4, importance: 1 },
          ],
        },
      ];
      return payload;
    })(),
    includeInIntegration: true,
  },
];

const invalidPayloads: Array<{
  name: string;
  payload: Partial<Edu2comParameters>;
}> = [
  {
    name: 'less than two people',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.people = [payload.people[0]];
      return payload;
    })(),
  },
  {
    name: 'team size smaller than two',
    payload: (() => {
      const payload = structuredClone(basePayload());
      const [firstTask] = payload.tasks;
      if (firstTask) {
        firstTask.teamSize = 1;
      }
      return payload;
    })(),
  },
  {
    name: 'alpha out of range',
    payload: (() => {
      const payload = structuredClone(basePayload());
      payload.alpha = 1.2;
      return payload;
    })(),
  },
  {
    name: 'person without skills',
    payload: (() => {
      const payload = structuredClone(basePayload());
      if (payload.people[0]) {
        payload.people[0].skills = [];
      }
      return payload;
    })(),
  },
  {
    name: 'tasks missing skills',
    payload: (() => {
      const payload = structuredClone(basePayload());
      const [firstTask] = payload.tasks;
      if (firstTask) {
        firstTask.skills = [];
      }
      return payload;
    })(),
  },
];

describe('Edu2Com payload contract', () => {
  it.each(validPayloads)('accepts valid payload: %s', ({ payload }) => {
    expect(edu2comParametersSchema.safeParse(payload).success).toBe(true);
  });

  it.each(invalidPayloads)('rejects invalid payload: %s', ({ payload }) => {
    expect(edu2comParametersSchema.safeParse(payload).success).toBe(false);
  });
});

const describeIntegration =
  process.env.EDU2COM_INTEGRATION === '1' ? describe : describe.skip;

describeIntegration('Edu2Com live integration', () => {
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    globalThis.fetch = ((...args) => Bun.fetch(...args)) as typeof fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  const successScenarios = validPayloads.filter(
    item => item.includeInIntegration
  );

  for (const scenario of successScenarios) {
    it(
      `returns teams successfully: ${scenario.name}`,
      async () => {
        const start = performance.now();
        const response = await callEdu2comTeamFormation(scenario.payload, {
          timeoutMs: 10_000,
        });
        const elapsedMs = performance.now() - start;

        const parsed = edu2comTeamsResponseSchema.safeParse(response);
        expect(parsed.success).toBe(true);
        expect(elapsedMs).toBeLessThan(7_000);
      },
      { timeout: 15_000 }
    );
  }

  const failureScenarios: Array<{
    name: string;
    payload: Edu2comParameters;
    expectedMessageFragment: RegExp;
  }> = [
    {
      name: 'insufficient headcount for requested team size',
      payload: (() => {
        const payload = structuredClone(basePayload());
        payload.people = payload.people.slice(0, 3);
        payload.tasks = [
          {
            id: 'task-large',
            teamSize: 4,
            skills: [
              { id: BASE_SKILLS.frontend, level: 0.6, importance: 1 },
              { id: BASE_SKILLS.backend, level: 0.6, importance: 1 },
            ],
          },
        ];
        return payload;
      })(),
      expectedMessageFragment: /Not enough people/i,
    },
  ];

  for (const scenario of failureScenarios) {
    it(`surfaces API error: ${scenario.name}`, async () => {
      const run = callEdu2comTeamFormation(scenario.payload, {
        timeoutMs: 10_000,
      });
      await expect(run).rejects.toThrowError(scenario.expectedMessageFragment);
    });
  }

  it('returns fewer teams than requested tasks when seats exceed capacity (observed behaviour)', async () => {
    const payload = (() => {
      const base = structuredClone(basePayload());
      base.tasks = [
        ...base.tasks,
        {
          id: 'task-extra',
          teamSize: 2,
          skills: [
            { id: BASE_SKILLS.frontend, level: 0.5, importance: 1 },
            { id: BASE_SKILLS.backend, level: 0.5, importance: 1 },
          ],
        },
      ];
      return base;
    })();

    const response = await callEdu2comTeamFormation(payload, {
      timeoutMs: 10_000,
    });
    expect(response.teams.length).toBeLessThan(payload.tasks.length);
  });
});
