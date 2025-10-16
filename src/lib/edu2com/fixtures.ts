import type { Edu2comParameters } from './contract';

type PersonConfig = {
  id: string;
  gender?: 'MALE' | 'FEMALE';
  ei: number;
  sn: number;
  tf: number;
  pj: number;
  skills: Array<{ id: string; level: number }>;
  preferences?: Array<{ personId: string; preference: number }>;
};

export const EDU2COM_BASE_SKILLS = {
  frontend: 'skill-frontend',
  backend: 'skill-backend',
  devops: 'skill-devops',
} as const;

export const EDU2COM_BASE_SIMILARITIES: NonNullable<
  Edu2comParameters['similarities']
> = [
  {
    sourceId: EDU2COM_BASE_SKILLS.frontend,
    targetId: EDU2COM_BASE_SKILLS.backend,
    similarity: 0.5,
  },
  {
    sourceId: EDU2COM_BASE_SKILLS.backend,
    targetId: EDU2COM_BASE_SKILLS.frontend,
    similarity: 0.5,
  },
  {
    sourceId: EDU2COM_BASE_SKILLS.devops,
    targetId: EDU2COM_BASE_SKILLS.backend,
    similarity: 0.6,
  },
];

export function createPerson(config: PersonConfig) {
  return {
    id: config.id,
    gender: config.gender,
    personality: {
      ei: config.ei,
      sn: config.sn,
      tf: config.tf,
      pj: config.pj,
    },
    skills: config.skills,
    preferences: config.preferences,
  };
}

export function createBasePayload(): Edu2comParameters {
  return {
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.2,
    delta: 0.1,
    initRandom: false,
    people: [
      createPerson({
        id: 'student-1',
        gender: 'FEMALE',
        ei: 0.3,
        sn: -0.2,
        tf: 0.5,
        pj: 0.7,
        skills: [
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.8 },
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.4 },
        ],
      }),
      createPerson({
        id: 'student-2',
        gender: 'MALE',
        ei: -0.1,
        sn: 0.6,
        tf: -0.2,
        pj: 0.4,
        skills: [
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.6 },
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.5 },
        ],
      }),
      createPerson({
        id: 'student-3',
        gender: 'FEMALE',
        ei: 0.5,
        sn: -0.4,
        tf: 0.3,
        pj: -0.2,
        skills: [
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.4 },
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.7 },
        ],
      }),
      createPerson({
        id: 'student-4',
        gender: 'MALE',
        ei: -0.3,
        sn: 0.2,
        tf: 0.6,
        pj: 0.1,
        skills: [
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.5 },
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.3 },
        ],
      }),
    ],
    tasks: [
      {
        id: 'task-frontend',
        teamSize: 2,
        skills: [
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.7, importance: 1 },
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.4, importance: 1 },
        ],
      },
      {
        id: 'task-backend',
        teamSize: 2,
        skills: [
          { id: EDU2COM_BASE_SKILLS.backend, level: 0.7, importance: 1 },
          { id: EDU2COM_BASE_SKILLS.frontend, level: 0.4, importance: 1 },
        ],
      },
    ],
    similarities: EDU2COM_BASE_SIMILARITIES.map(item => ({ ...item })),
  };
}
