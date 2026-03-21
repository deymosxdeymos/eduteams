import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { createErrorResponse } from "@/lib/api-utils";

interface MutationRateLimitOptions {
  keyPrefix: string;
  userId: string;
  windowMs: number;
  perIp: number;
  perUser: number;
  clientIdentifier?: string | null;
}

type MutationRateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      scope: "ip" | "user";
      retryAfterSeconds: number;
    };

export async function checkMutationRateLimit(
  request: Pick<NextRequest, "headers">,
  options: MutationRateLimitOptions,
): Promise<MutationRateLimitResult> {
  const clientIdentifier = options.clientIdentifier ?? getClientIdentifier(request);

  if (clientIdentifier) {
    const ipRateLimit = await checkRateLimit({
      key: `${options.keyPrefix}:ip:${clientIdentifier}`,
      limit: options.perIp,
      windowMs: options.windowMs,
    });

    if (!ipRateLimit.allowed) {
      return {
        allowed: false,
        scope: "ip",
        retryAfterSeconds: ipRateLimit.retryAfterSeconds,
      };
    }
  }

  const userRateLimit = await checkRateLimit({
    key: `${options.keyPrefix}:user:${options.userId}`,
    limit: options.perUser,
    windowMs: options.windowMs,
  });

  if (!userRateLimit.allowed) {
    return {
      allowed: false,
      scope: "user",
      retryAfterSeconds: userRateLimit.retryAfterSeconds,
    };
  }

  return { allowed: true };
}

/**
 * Build a 429 response for a denied rate-limit result.
 * Keeps the branching logic in one place instead of duplicating it across routes.
 */
export function createRateLimitResponse(
  rateLimit: Extract<MutationRateLimitResult, { allowed: false }>,
  messages: { ip: string; user: string },
) {
  return createErrorResponse(rateLimit.scope === "ip" ? messages.ip : messages.user, 429);
}
