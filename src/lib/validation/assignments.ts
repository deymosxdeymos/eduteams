import { z } from 'zod';

const AssignmentStatusSchema = z.enum([
  'BELUM_ISI', // no submissions yet
  'MENUNGGU', // waiting for grouping or review
  'BERHASIL_PEMBAGIAN_GRUP', // grouping done
]);

type _AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

const SkillOrTopicItemSchema = z.union([
  z.string().min(1),
  z.object({ name: z.string().min(1) }),
]);

export const AssignmentCreateSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  // Accept arrays of strings or objects with name field
  skills: z.array(SkillOrTopicItemSchema).optional().default([]),
  topics: z.array(SkillOrTopicItemSchema).optional().default([]),
  // Optional start time; default to now if omitted
  startAt: z.coerce.date().optional(),
});

type _AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

const AssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  startAt: z.date(),
  createdAt: z.date(),
  status: AssignmentStatusSchema,
  skills: z.array(z.string()),
  topics: z.array(z.string()),
  submissionsCount: z.number().int().nonnegative(),
});

export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;

export const AssignmentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startAt: z.coerce.date().optional(),
  status: AssignmentStatusSchema.optional(),
  skills: z.array(SkillOrTopicItemSchema).optional(),
  topics: z.array(SkillOrTopicItemSchema).optional(),
  confirmDestructiveChanges: z.boolean().optional().default(false),
});

type _AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;

const AssignmentSubmissionCreateSchema = z.object({
  // empty body for now; URL carries the assignmentId
});

type _AssignmentSubmissionCreate = z.infer<
  typeof AssignmentSubmissionCreateSchema
>;

export type AssignmentClient = AssignmentResponse & {
  submittedByMe?: boolean;
  needsUpdate?: boolean;
};
