import { z } from 'zod';

const genderSchema = z.enum(['FEMALE', 'MALE']).optional();

const personalitySchema = z.object({
  ei: z.number().min(-1).max(1),
  sn: z.number().min(-1).max(1),
  tf: z.number().min(-1).max(1),
  pj: z.number().min(-1).max(1),
});

const personSkillSchema = z.object({
  id: z.string().min(1),
  level: z.number().min(0).max(1),
});

const personPreferenceSchema = z.object({
  personId: z.string().min(1),
  preference: z.number().min(0).max(1),
});

const edu2comPersonSchema = z.object({
  id: z.string().min(1),
  gender: genderSchema,
  personality: personalitySchema,
  skills: z.array(personSkillSchema).min(1),
  preferences: z.array(personPreferenceSchema).optional(),
});

const taskSkillSchema = z.object({
  id: z.string().min(1),
  level: z.number().min(0).max(1),
  importance: z.number().min(1),
});

const taskPreferenceSchema = z.object({
  personId: z.string().min(1),
  preference: z.number().min(0).max(1),
});

const edu2comTaskSchema = z.object({
  id: z.string().min(1),
  teamSize: z.number().int().min(2),
  skills: z.array(taskSkillSchema).min(1),
  preferences: z.array(taskPreferenceSchema).optional(),
});

const similaritySchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  similarity: z.number().min(0).max(1),
});

export const edu2comParametersSchema = z.object({
  people: z.array(edu2comPersonSchema).min(2),
  tasks: z.array(edu2comTaskSchema).min(1),
  initRandom: z.boolean().optional(),
  alpha: z.number().min(0).max(1).optional(),
  beta: z.number().min(0).max(1).optional(),
  gamma: z.number().min(0).max(1).optional(),
  delta: z.number().min(0).max(1).optional(),
  similarities: z.array(similaritySchema).optional(),
});

export type Edu2comParameters = z.infer<typeof edu2comParametersSchema>;

const edu2comTeamMemberSchema = z.object({
  id: z.string().min(1),
  skillIds: z.array(z.string().min(1)),
});

const edu2comTeamSchema = z.object({
  taskId: z.string().min(1),
  quality: z.number().min(0).max(1),
  people: z.array(edu2comTeamMemberSchema).min(1),
});

export const edu2comTeamsResponseSchema = z.object({
  teams: z.array(edu2comTeamSchema).min(1),
});

export type Edu2comTeamsResponse = z.infer<typeof edu2comTeamsResponseSchema>;
