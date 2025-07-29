import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  type ApiResponse,
  AuthError,
  AuthorizationError,
  type ExtendedUser,
  HttpError,
  type UserRole,
  ValidationError,
} from '@/lib/types';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.status }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Internal server error',
    },
    { status: 500 }
  );
}

export function createApiResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    { status }
  );
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: { user: ExtendedUser }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        throw new AuthError('Authentication required');
      }

      return await handler(request, { user: session.user as ExtendedUser });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

type RoleHandler = (
  request: NextRequest,
  context: { user: ExtendedUser }
) => Promise<NextResponse>;

export function withRole(
  allowedRoles: UserRole | UserRole[],
  handler: RoleHandler
) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return withAuth(async (request, context) => {
    if (!context.user.role || !roles.includes(context.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    return await handler(request, context);
  });
}

export function withOnboarded(handler: RoleHandler) {
  return withAuth(async (request, context) => {
    if (!context.user.isOnboarded) {
      throw new AuthorizationError('User must complete onboarding first');
    }

    return await handler(request, context);
  });
}

export function withValidation<T>(
  schema: (data: unknown) => T,
  handler: (
    request: NextRequest,
    context: { user?: ExtendedUser; validatedData: T }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { user: ExtendedUser }
  ): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validatedData = schema(body);

      return await handler(request, { ...context, validatedData });
    } catch (error) {
      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }
      throw new ValidationError('Invalid request data');
    }
  };
}

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return null;
    }

    // Fetch fresh user data from database to ensure we have latest onboardingStep
    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        nimNpm: true,
        isOnboarded: true,
        hasSeenWelcomeSplash: true,
        onboardingStep: true,
        onboardingData: true,
      },
    });

    return freshUser as ExtendedUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function requireAuth(): ExtendedUser {
  throw new AuthError(
    'This function must be called within an authenticated context'
  );
}

export function requireRole(
  allowedRoles: UserRole | UserRole[],
  user: ExtendedUser
): void {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user.role || !roles.includes(user.role)) {
    throw new AuthorizationError('Insufficient permissions');
  }
}

export function requireOnboarded(user: ExtendedUser): void {
  if (!user.isOnboarded) {
    throw new AuthorizationError('User must complete onboarding first');
  }
}
