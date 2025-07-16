import { User as PrismaUser } from '@/generated/prisma';

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

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class AuthError extends HttpError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends HttpError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation failed') {
    super(400, message, 'VALIDATION_ERROR');
  }
}
