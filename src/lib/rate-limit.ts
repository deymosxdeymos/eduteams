import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Global singleton to avoid re-instantiation in serverless
let redis: Redis | null = null;
let limiter: Ratelimit | null = null;

// Only initialize Redis if environment variables are available
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  try {
    redis = Redis.fromEnv();
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(60, '1 m'), // 60 requests per minute
      analytics: true,
      prefix: 'eduteams:rl',
    });
  } catch (error) {
    console.warn('Failed to initialize Redis rate limiter:', error);
    redis = null;
    limiter = null;
  }
} else {
  console.warn('Redis environment variables not set, rate limiting disabled');
}

export type LimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
};

export async function limit(
  request: Request,
  key?: string
): Promise<LimitResult> {
  // If Redis is not available, skip rate limiting
  if (!limiter) {
    return {
      success: true,
      remaining: 60, // Return a high number to indicate no limit
      reset: Date.now() + 60000, // 1 minute from now
    };
  }

  const ip =
    key ||
    // Forwarded headers commonly set by hosting providers / proxies
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  const { success, remaining, reset, pending } = await limiter.limit(ip);

  let retryAfter: number | undefined;
  if (!success) {
    const ms = (await pending) as unknown as number | null | undefined;
    const msNumber = typeof ms === 'number' ? ms : Number(ms ?? 0);
    retryAfter = Math.ceil(msNumber / 1000);
  }

  return { success, remaining, reset, retryAfter };
}

import { NextResponse } from 'next/server';

export function tooManyRequests(body?: unknown, headers: HeadersInit = {}) {
  return NextResponse.json(
    {
      success: false,
      error: 'Too Many Requests',
      ...(body as object),
    },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
        ...headers,
      },
    }
  );
}
