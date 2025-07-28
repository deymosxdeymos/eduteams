import { z } from 'zod';

export const courseCreateSchema = z.object({
  namaMataKuliah: z.string().min(1, 'Nama mata kuliah is required'),
  kelas: z.enum(['RA', 'RB', 'RC', 'RD', 'RE'], {
    message: 'Kelas must be one of: RA, RB, RC, RD, RE',
  }),
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
  periode: z.enum(['ganjil', 'genap'], {
    message: 'Periode must be either ganjil or genap',
  }),
}).refine((data) => data.tahunAkhirPeriode >= data.tahunAwalPeriode, {
  message: 'End year must be greater than or equal to start year',
  path: ['tahunAkhirPeriode'],
});

export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
