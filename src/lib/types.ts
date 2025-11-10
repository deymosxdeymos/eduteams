import type {
  MBTIType,
  ClassCatalog as PrismaClassCatalog,
  Course as PrismaCourse,
  CourseCatalog as PrismaCourseCatalog,
  CourseEnrollment as PrismaCourseEnrollment,
  User as PrismaUser,
} from '@/generated/prisma';

export type UserRole = 'dosen' | 'mahasiswa' | 'admin';

export interface ExtendedUser extends PrismaUser {
  role: UserRole | null;
  nim: string | null;
  isOnboarded: boolean;
  onboardingStep: string | null;
  mbtiType: MBTIType | null;
  ei: number | null;
  sn: number | null;
  tf: number | null;
  pj: number | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Course = PrismaCourse;
export type CourseCatalog = PrismaCourseCatalog;
export type ClassCatalog = PrismaClassCatalog;
type _CourseEnrollment = PrismaCourseEnrollment;

interface _CourseWithDosen extends Course {
  dosen: Pick<ExtendedUser, 'id' | 'name' | 'email'>;
}

interface _CourseWithEnrollments extends Course {
  dosen: Pick<ExtendedUser, 'id' | 'name' | 'email'>;
  enrollments: _CourseEnrollment[];
}

// Error classes moved to lib/utils/errors.ts
export {
  AuthError,
  AuthorizationError,
  HttpError,
  ValidationError,
} from './utils/errors';
