// Note: Avoid calling next/headers outside request context.
// Import lazily inside functions or provide safe fallbacks.
import "server-only";
import { type NextRequest, NextResponse } from "next/server";
import { cache } from "react";
import { auth } from "@/lib/auth";
import {
  hasDemoSandboxAuthenticatedSession,
  isDemoSandboxUser,
  isDemoModeEnabled,
  parseDemoSandboxCookieValue,
} from "@/lib/demo/sandbox";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma";
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
} from "@/lib/types";

interface AuthApiRequestContext {
  headers: Headers;
  cookies: unknown;
}

interface WithAuthOptions {
  allowDemoSandbox?: boolean;
}

export function handleApiError(error: unknown): NextResponse {
  logger.error("API Error:", error);

  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.status },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Internal server error",
    },
    { status: 500 },
  );
}

export function createApiResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status },
  );
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  code?: string,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    { status },
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
    context: TContext & { user: ExtendedUser },
  ) => Promise<NextResponse>,
  options?: WithAuthOptions,
) {
  return async (request: NextRequest, nextContext: TContext): Promise<NextResponse> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return handleApiError(new AuthError());
      }

      const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
      if (isUnsafeMethod && isDemoSandboxUser(user) && !options?.allowDemoSandbox) {
        return createErrorResponse("Demo sandbox sessions can only use demo-enabled actions.", 403);
      }

      const baseCtx = (nextContext ?? ({} as TContext)) as TContext;
      return await handler(request, { ...baseCtx, user });
    } catch (error) {
      if (error instanceof HttpError) return handleApiError(error);
      return handleApiError(new HttpError(500, "Internal server error"));
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
    context: TContext & { user: ExtendedUser },
  ) => Promise<NextResponse>,
  options?: WithAuthOptions,
) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return withAuth<TParams, TContext>(async (request, context) => {
    if (!context.user.role || !roles.includes(context.user.role)) {
      throw new AuthorizationError("Insufficient permissions");
    }
    return await handler(request, context as unknown as TContext & { user: ExtendedUser });
  }, options);
}

export function withOnboarded<
  TParams = unknown,
  TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
>(
  handler: (
    request: NextRequest,
    context: TContext & { user: ExtendedUser },
  ) => Promise<NextResponse>,
) {
  return withAuth<TParams, TContext>(async (request, context) => {
    if (!context.user.isOnboarded) {
      throw new AuthorizationError("User must complete onboarding first");
    }

    return await handler(request, context as TContext & { user: ExtendedUser });
  });
}

export function withValidation<T>(
  schema: ((data: unknown) => T) | ((data: unknown, request: NextRequest) => T),
  handler: (
    request: NextRequest,
    context: { user?: ExtendedUser; validatedData: T },
  ) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context?: { user: ExtendedUser }): Promise<NextResponse> => {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid request data");
    }

    let validatedData: T;

    try {
      validatedData = schema(body, request);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new ValidationError(error.message);
      }

      throw new ValidationError("Invalid request data");
    }

    return handler(request, { ...context, validatedData });
  };
}

async function getRequestContext(): Promise<AuthApiRequestContext | null> {
  try {
    const { cookies, headers } = await import("next/headers");
    const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);

    return {
      headers: requestHeaders,
      cookies: cookieStore,
    };
  } catch {
    return null;
  }
}

async function loadCurrentUser(
  requestContext: AuthApiRequestContext | null,
): Promise<ExtendedUser | null> {
  try {
    let demoSession: Awaited<ReturnType<typeof parseDemoSandboxCookieValue>> = null;
    if (isDemoModeEnabled() && requestContext?.cookies) {
      const cookieStore = requestContext.cookies as {
        get?: (name: string) => { value?: string } | undefined;
      };
      const demoCookie = cookieStore.get?.("eduteams-demo-sandbox")?.value;
      demoSession = await parseDemoSandboxCookieValue(demoCookie);
    }

    const loadDemoSandboxUser = async () => {
      if (!hasDemoSandboxAuthenticatedSession(demoSession)) {
        return null;
      }

      const demoUser = await prisma.user.findUnique({
        where: { id: demoSession.userId },
        select: extendedUserSelect,
      });

      if (!demoUser || demoUser.email !== demoSession.email || !isDemoSandboxUser(demoUser)) {
        return null;
      }

      return mapToExtendedUser(demoUser);
    };

    const session = await auth.api
      .getSession((requestContext ?? {}) as AuthApiRequestContext)
      .catch(() => null);

    if (!session?.user) {
      return loadDemoSandboxUser();
    }

    const freshUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: extendedUserSelect,
    });

    if (!freshUser) {
      return null;
    }

    return mapToExtendedUser(freshUser);
  } catch (error) {
    logger.error("Error getting current user:", error);
    return null;
  }
}

const getCurrentUserCached = cache(async () => {
  const requestContext = await getRequestContext();
  return loadCurrentUser(requestContext);
});

export async function getCurrentUser(): Promise<ExtendedUser | null> {
  const requestContext = await getRequestContext();

  if (!requestContext) {
    return loadCurrentUser(null);
  }

  return getCurrentUserCached();
}

export function requireAuth(): ExtendedUser {
  throw new AuthError("This function must be called within an authenticated context");
}

export function requireRole(allowedRoles: UserRole | UserRole[], user: ExtendedUser): void {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!user.role || !roles.includes(user.role)) {
    throw new AuthorizationError("Insufficient permissions");
  }
}

export function requireOnboarded(user: ExtendedUser): void {
  if (!user.isOnboarded) {
    throw new AuthorizationError("User must complete onboarding first");
  }
}
