import { z } from 'zod';

export const AssignmentStatusSchema = z.enum([
  'BELUM_ISI', // no submissions yet
  'MENUNGGU', // waiting for grouping or review
  'BERHASIL_PEMBAGIAN_GRUP', // grouping done
]);

export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const AssignmentCreateSchema = z.object({
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  description: z.string().optional(),
  // Optional arrays from modal; currently not used in card rendering
  skills: z.array(z.string().min(1)).optional().default([]),
  topics: z.array(z.string().min(1)).optional().default([]),
  // Optional start time; default to now if omitted
  startAt: z.coerce.date().optional(),
});

export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

export const AssignmentResponseSchema = z.object({
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
  skills: z.array(z.string().min(1)).optional(),
  topics: z.array(z.string().min(1)).optional(),
});

export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;

export const AssignmentSubmissionCreateSchema = z.object({
  // empty body for now; URL carries the assignmentId
});

export type AssignmentSubmissionCreate = z.infer<
  typeof AssignmentSubmissionCreateSchema
>;

export type AssignmentClient = AssignmentResponse & {
  submittedByMe?: boolean;
};
