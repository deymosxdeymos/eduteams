import { z } from 'zod';

// User input schema - only requires fields the user provides
export const courseCreateInputSchema = z.object({
  namaMataKuliah: z.string().min(1, 'Nama mata kuliah is required'),
  kelas: z.string().min(1, 'Kelas is required'),
  periode: z.enum(['ganjil', 'genap', 'pendek'], {
    message: 'Periode must be either ganjil, genap, or pendek',
  }),
});

// Full schema for database validation (includes auto-detected period fields)
export const courseCreateSchema = z
  .object({
    namaMataKuliah: z.string().min(1, 'Nama mata kuliah is required'),
    kelas: z.string().min(1, 'Kelas is required'),
    tahunAwalPeriode: z
      .number()
      .int()
      .min(2000, 'Start year must be at least 2000')
      .max(2100, 'Start year must be at most 2100'),
    tahunAkhirPeriode: z
      .number()
      .int()
      .min(2000, 'End year must be at least 2000')
      .max(2100, 'End year must be at most 2100'),
    periode: z.enum(['ganjil', 'genap', 'pendek'], {
      message: 'Periode must be either ganjil, genap, or pendek',
    }),
  })
  .refine(data => data.tahunAkhirPeriode >= data.tahunAwalPeriode, {
    message: 'End year must be greater than or equal to start year',
    path: ['tahunAkhirPeriode'],
  });

export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseCreateUserInput = z.infer<typeof courseCreateInputSchema>;
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
type _CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
