import { User as PrismaUser, Course as PrismaCourse } from '@/generated/prisma';

export type UserRole = 'dosen' | 'mahasiswa' | 'admin';

export interface ExtendedUser extends PrismaUser {
  role: UserRole | null;
  nimNpm: string | null;
  isOnboarded: boolean;
  onboardingStep: string | null;
}

export interface AuthSession {
  user: ExtendedUser;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    userId: string;
  };
}

export interface OnboardingData {
  role: UserRole;
  name: string;
  nimNpm: string;
}

export interface KepribadianData {
  extroversion: number;
  agreeableness: number;
  conscientiousness: number;
  neuroticism: number;
  openness: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PersonalityApiResponse {
  scores: {
    ei: number;
    sn: number;
    tf: number;
    pj: number;
  };
  mbtiType: string;
  timestamp: string;
}

export interface QuestionApiResponse {
  questions: Array<{
    id: string;
    text: string;
    dimension: string;
    order: number;
    reversed?: boolean;
  }>;
  totalPages: number;
  currentPage: number;
}

export type Course = PrismaCourse;

export interface CourseWithDosen extends Course {
  dosen: Pick<ExtendedUser, 'id' | 'name' | 'email'>;
}

// Error classes moved to lib/utils/errors.ts
export {
  HttpError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from './utils/errors';
