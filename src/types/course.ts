import type { MBTIType } from '@/generated/prisma/client';

/**
 * Student data with enrollment and personality information
 * Used across course and assignment pages
 */
export interface StudentData {
  id: string;
  name: string;
  nim: string;
  email: string;
  mbtiType?: MBTIType | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
  enrolledAt: Date;
}
