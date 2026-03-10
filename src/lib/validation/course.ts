import { z } from "zod";

/**
 * Build a localized user-input schema.
 * When no messages are supplied the keys fall back to English defaults
 * so the server-side `courseCreateSchema` (below) keeps working.
 */
export function buildCourseCreateInputSchema(
  msgs: {
    courseNameRequired?: string;
    classRequired?: string;
    periodInvalid?: string;
  } = {},
) {
  return z.object({
    namaMataKuliah: z.string().min(1, msgs.courseNameRequired ?? "Course name is required"),
    kelas: z.string().min(1, msgs.classRequired ?? "Class is required"),
    periode: z.enum(["ganjil", "genap", "pendek"], {
      message: msgs.periodInvalid ?? "Period must be either odd, even, or short",
    }),
  });
}

// Non-localized convenience alias (server-side / tests)
export const courseCreateInputSchema = buildCourseCreateInputSchema();

// Full schema for database validation (includes auto-detected period fields)
export const courseCreateSchema = z
  .object({
    namaMataKuliah: z.string().min(1, "Course name is required"),
    kelas: z.string().min(1, "Class is required"),
    tahunAwalPeriode: z
      .number()
      .int()
      .min(2000, "Start year must be at least 2000")
      .max(2100, "Start year must be at most 2100"),
    tahunAkhirPeriode: z
      .number()
      .int()
      .min(2000, "End year must be at least 2000")
      .max(2100, "End year must be at most 2100"),
    periode: z.enum(["ganjil", "genap", "pendek"], {
      message: "Periode must be either ganjil, genap, or pendek",
    }),
  })
  .refine((data) => data.tahunAkhirPeriode >= data.tahunAwalPeriode, {
    message: "End year must be greater than or equal to start year",
    path: ["tahunAkhirPeriode"],
  });

export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseCreateUserInput = z.infer<typeof courseCreateInputSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
type _CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
