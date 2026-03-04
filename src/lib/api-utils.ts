// Note: Avoid calling next/headers in test context.
// Import lazily inside functions or provide safe fallbacks.
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { cache } from 'react';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
  type ApiResponse,
  AuthError,
  AuthorizationError,
  type ExtendedUser,
  extendedUserSelect,
  HttpError,
  mapToExtendedUser,
  type UserRole,
  ValidationError,
} from '@/lib/types';

interface AuthApiRequestContext {
  headers: Awaited<ReturnType<typeof headers>>;
  cookies: Awaited<ReturnType<typeof cookies>>;
}

export function handleApiError(error: unknown): NextResponse {
  logger.error('API Error:', error);

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

// DefaultRouteContext aligns with Next's ParamCheck expectations
// Use Promise<any> to satisfy Next's generated types
export type DefaultRouteContext<TParams = unknown> = {
  // Next.js generated .next/types expects params to be Promise<any>
  // We keep it as Promise<TParams> to satisfy that constraint at compile-time.
  params: Promise<TParams>;
};

export function withAuth<
  TParams = unknown,
  TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
>(
  handler: (
    request: NextRequest,
    context: TContext & { user: ExtendedUser }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    nextContext: TContext
  ): Promise<NextResponse> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return handleApiError(new AuthError());
      }
      const baseCtx = (nextContext ?? ({} as TContext)) as TContext;
      return await handler(request, { ...baseCtx, user });
    } catch (error) {
      if (error instanceof HttpError) return handleApiError(error);
      return handleApiError(new HttpError(500, 'Internal server error'));
    }
  };
}

export function withRole<
  TParams = unknown,
  TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
>(
  allowedRoles: UserRole | UserRole[],
  handler: (
    request: NextRequest,
    context: TContext & { user: ExtendedUser }
  ) => Promise<NextResponse>
) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return withAuth<TContext>(async (request, context) => {
    if (!context.user.role || !roles.includes(context.user.role)) {
      throw new AuthorizationError('Insufficient permissions');
    }
    return await handler(
      request,
      context as unknown as TContext & { user: ExtendedUser }
    );
  });
}

export function withOnboarded<
  TContext extends DefaultRouteContext = DefaultRouteContext,
>(
  handler: (
    request: NextRequest,
    context: TContext & { user: ExtendedUser }
  ) => Promise<NextResponse>
) {
  return withAuth<TContext>(async (request, context) => {
    if (!context.user.isOnboarded) {
      throw new AuthorizationError('User must complete onboarding first');
    }

    return await handler(request, context as TContext & { user: ExtendedUser });
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

const getCurrentUserCached = cache(async (): Promise<ExtendedUser | null> => {
  try {
    let session: Awaited<ReturnType<typeof auth.api.getSession>>;

    // In test environments, headers() and cookies() throw "wrong context" errors
    // So we need to handle this case gracefully
    if (process.env.NODE_ENV === 'test') {
      // In tests, auth.api.getSession should be mocked directly
      session = await auth.api.getSession({} as AuthApiRequestContext);
    } else {
      // Prefer reading from cookies() in server actions to ensure session is detected
      const cookieStore = await cookies();

      session = await auth.api.getSession({
        headers: await headers(),
        cookies: cookieStore,
      } as AuthApiRequestContext);
    }

    if (!session?.user) {
      return null;
    }

    // Fetch fresh user data from database to ensure we have latest onboardingStep
    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: extendedUserSelect,
    });
    if (!freshUser) {
      return null;
    }

    return mapToExtendedUser(freshUser);
  } catch (error) {
    logger.error('Error getting current user:', error);
    return null;
  }
});

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  return getCurrentUserCached();
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
