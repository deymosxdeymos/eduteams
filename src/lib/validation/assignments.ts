import { z } from "zod";
import { normalizeAssignmentNames } from "@/lib/assignment-description";

const AssignmentStatusSchema = z.enum([
  "BELUM_ISI", // no submissions yet
  "MENUNGGU", // waiting for grouping or review
  "BERHASIL_PEMBAGIAN_GRUP", // grouping done
]);

type _AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

const SkillOrTopicItemSchema = z.union([z.string().min(1), z.object({ name: z.string().min(1) })]);

type SkillOrTopicItem = z.infer<typeof SkillOrTopicItemSchema>;

/** Normalize a mixed array of string | { name } items into trimmed, non-empty strings. */
export function normalizeTagList(items: SkillOrTopicItem[] | undefined): string[] {
  return normalizeAssignmentNames(
    (items || []).map((item) => (typeof item === "string" ? item : item.name)),
  );
}

export const AssignmentCreateSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi"),
  description: z.string().optional(),
  // Accept arrays of strings or objects with name field
  skills: z.array(SkillOrTopicItemSchema).optional().default([]),
  topics: z.array(SkillOrTopicItemSchema).optional().default([]),
  // Optional start time; default to now if omitted
  startAt: z.coerce.date().optional(),
});

type _AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

const _AssignmentResponseSchema = z.object({
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

export type AssignmentResponse = z.infer<typeof _AssignmentResponseSchema>;

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

const _AssignmentSubmissionCreateSchema = z.object({
  // empty body for now; URL carries the assignmentId
});

type _AssignmentSubmissionCreate = z.infer<typeof _AssignmentSubmissionCreateSchema>;

export type AssignmentClient = AssignmentResponse & {
  submittedByMe?: boolean;
  needsUpdate?: boolean;
};
