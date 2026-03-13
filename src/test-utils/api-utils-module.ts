import { NextResponse, type NextRequest } from "next/server";
import {
  AuthError,
  AuthorizationError,
  extendedUserSelect,
  HttpError,
  mapToExtendedUser,
  type ExtendedUser,
  type UserRole,
  ValidationError,
} from "@/lib/types";

type DefaultRouteContext<TParams = unknown> = {
  params: Promise<TParams>;
};

type ApiUtilsOverrides = Partial<{
  getCurrentUser: () => Promise<ExtendedUser | null>;
  withRole: <
    TParams = unknown,
    TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
  >(
    allowedRoles: UserRole | UserRole[],
    handler: (
      request: NextRequest,
      context: TContext & { user: ExtendedUser },
    ) => Promise<NextResponse>,
  ) => (request: NextRequest, context: TContext) => Promise<NextResponse>;
}>;

export function createApiUtilsModule(overrides: ApiUtilsOverrides = {}) {
  const handleApiError = (error: unknown): NextResponse => {
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
  };

  const createApiResponse = <T>(data: T, message?: string, status: number = 200) => {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status },
    );
  };

  const createErrorResponse = (error: string, status: number = 400, code?: string) => {
    return NextResponse.json(
      {
        success: false,
        error,
        code,
      },
      { status },
    );
  };

  const getCurrentUser = overrides.getCurrentUser
    ? overrides.getCurrentUser
    : async (): Promise<ExtendedUser | null> => {
        try {
          const [{ auth }, prismaModule] = await Promise.all([
            import("@/lib/auth"),
            import("@/lib/prisma"),
          ]);
          const session = await auth.api.getSession({
            headers: new Headers(),
          });
          if (!session?.user) {
            return null;
          }

          const freshUser = await prismaModule.default.user.findUnique({
            where: { id: session.user.id },
            select: extendedUserSelect,
          });

          return freshUser ? mapToExtendedUser(freshUser) : null;
        } catch {
          return null;
        }
      };

  const withAuth = <
    TParams = unknown,
    TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
  >(
    handler: (
      request: NextRequest,
      context: TContext & { user: ExtendedUser },
    ) => Promise<NextResponse>,
  ) => {
    return async (request: NextRequest, nextContext: TContext): Promise<NextResponse> => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          return handleApiError(new AuthError());
        }

        return await handler(request, {
          ...(nextContext ?? ({} as TContext)),
          user,
        });
      } catch (error) {
        if (error instanceof HttpError) {
          return handleApiError(error);
        }

        return handleApiError(new HttpError(500, "Internal server error"));
      }
    };
  };

  const defaultWithRole = <
    TParams = unknown,
    TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
  >(
    allowedRoles: UserRole | UserRole[],
    handler: (
      request: NextRequest,
      context: TContext & { user: ExtendedUser },
    ) => Promise<NextResponse>,
  ) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return withAuth<TParams, TContext>(async (request, context) => {
      if (!context.user.role || !roles.includes(context.user.role)) {
        throw new AuthorizationError("Insufficient permissions");
      }

      return handler(request, context);
    });
  };

  const withRole = overrides.withRole ?? defaultWithRole;

  const withOnboarded = <
    TParams = unknown,
    TContext extends DefaultRouteContext<TParams> = DefaultRouteContext<TParams>,
  >(
    handler: (
      request: NextRequest,
      context: TContext & { user: ExtendedUser },
    ) => Promise<NextResponse>,
  ) => {
    return withAuth<TParams, TContext>(async (request, context) => {
      if (!context.user.isOnboarded) {
        throw new AuthorizationError("User must complete onboarding first");
      }

      return handler(request, context);
    });
  };

  const withValidation = <T>(
    schema: (data: unknown) => T,
    handler: (
      request: NextRequest,
      context: { user?: ExtendedUser; validatedData: T },
    ) => Promise<NextResponse>,
  ) => {
    return async (
      request: NextRequest,
      context?: { user: ExtendedUser },
    ): Promise<NextResponse> => {
      let body: unknown;

      try {
        body = await request.json();
      } catch {
        throw new ValidationError("Invalid request data");
      }

      let validatedData: T;

      try {
        validatedData = schema(body);
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
  };

  const requireAuth = (): ExtendedUser => {
    throw new AuthError("This function must be called within an authenticated context");
  };

  const requireRole = (allowedRoles: UserRole | UserRole[], user: ExtendedUser) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!user.role || !roles.includes(user.role)) {
      throw new AuthorizationError("Insufficient permissions");
    }
  };

  const requireOnboarded = (user: ExtendedUser) => {
    if (!user.isOnboarded) {
      throw new AuthorizationError("User must complete onboarding first");
    }
  };

  return {
    handleApiError,
    createApiResponse,
    createErrorResponse,
    withAuth,
    withRole,
    withOnboarded,
    withValidation,
    getCurrentUser,
    requireAuth,
    requireRole,
    requireOnboarded,
  };
}
