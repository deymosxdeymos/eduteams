import type {
  MBTIType,
  Prisma,
  ClassCatalog as PrismaClassCatalog,
  Course as PrismaCourse,
  CourseCatalog as PrismaCourseCatalog,
  CourseEnrollment as PrismaCourseEnrollment,
  User as PrismaUser,
} from '@/generated/prisma/client';

export type UserRole = 'dosen' | 'mahasiswa' | 'admin';

type PrismaUserBase = Omit<PrismaUser, 'role'>;

export interface ExtendedUser extends PrismaUserBase {
  role: UserRole | null;
  nim: string | null;
  isOnboarded: boolean;
  onboardingStep: string | null;
  mbtiType: MBTIType | null;
  ei: number | null;
  sn: number | null;
  tf: number | null;
  pj: number | null;
  personalityData: Prisma.JsonValue | null;
}

export const personalityProfileSelect = {
  mbtiType: true,
  ei: true,
  sn: true,
  tf: true,
  pj: true,
  personalityData: true,
} as const;

export const extendedUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  role: true,
  nim: true,
  gender: true,
  isOnboarded: true,
  hasSeenWelcomeSplash: true,
  onboardingStep: true,
  onboardingData: true,
  personalityProfile: {
    select: personalityProfileSelect,
  },
} satisfies Prisma.UserSelect;

export type ExtendedUserResult = Prisma.UserGetPayload<{
  select: typeof extendedUserSelect;
}>;

export function mapToExtendedUser(user: ExtendedUserResult): ExtendedUser {
  const { personalityProfile, ...baseUser } = user;

  return {
    ...baseUser,
    role: (baseUser.role as UserRole | null) ?? null,
    mbtiType: personalityProfile?.mbtiType ?? null,
    ei: personalityProfile?.ei ?? null,
    sn: personalityProfile?.sn ?? null,
    tf: personalityProfile?.tf ?? null,
    pj: personalityProfile?.pj ?? null,
    personalityData: personalityProfile?.personalityData ?? null,
  };
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
