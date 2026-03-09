import { isIP } from 'node:net';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

const CLIENT_IP_HEADER_NAME_PATTERN = /^[a-z0-9-]+$/;
const EXPIRED_BUCKET_PRUNE_INTERVAL_MS = 60_000;
const FORWARDED_CHAIN_HEADER_NAMES = new Set(['x-forwarded-for']);
const TRUSTED_PROXY_HOPS_PATTERN = /^(0|[1-9][0-9]{0,2})$/;

let lastExpiredBucketPruneAt = 0;

function getConfiguredTrustedClientIpHeaders() {
  const rawHeaders = process.env.TRUSTED_CLIENT_IP_HEADERS;
  if (!rawHeaders) {
    return [];
  }

  return rawHeaders
    .split(',')
    .map(headerName => headerName.trim().toLowerCase())
    .filter(headerName => CLIENT_IP_HEADER_NAME_PATTERN.test(headerName));
}

function getTrustedProxyHops() {
  const rawValue = process.env.TRUSTED_PROXY_HOPS?.trim();
  if (!rawValue || !TRUSTED_PROXY_HOPS_PATTERN.test(rawValue)) {
    return 0;
  }

  return Number(rawValue);
}

function normalizeIpEntry(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const normalizedValue =
    trimmedValue.startsWith('"') && trimmedValue.endsWith('"')
      ? trimmedValue.slice(1, -1).trim()
      : trimmedValue;

  if (!normalizedValue) {
    return null;
  }

  if (isIP(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('[')) {
    const closingBracketIndex = normalizedValue.indexOf(']');
    if (closingBracketIndex === -1) {
      return null;
    }

    const bracketedIp = normalizedValue.slice(1, closingBracketIndex);
    return isIP(bracketedIp) ? bracketedIp : null;
  }

  const lastColonIndex = normalizedValue.lastIndexOf(':');
  if (
    lastColonIndex === -1 ||
    normalizedValue.indexOf(':') !== lastColonIndex
  ) {
    return null;
  }

  const ipWithoutPort = normalizedValue.slice(0, lastColonIndex);
  return isIP(ipWithoutPort) ? ipWithoutPort : null;
}

function parseIpChain(value: string) {
  const entries = value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return null;
  }

  const ipEntries: string[] = [];

  for (const entry of entries) {
    const ipEntry = normalizeIpEntry(entry);
    if (!ipEntry) {
      return null;
    }

    ipEntries.push(ipEntry);
  }

  return ipEntries;
}

function getClientIpFromHeader(
  request: Pick<NextRequest, 'headers'>,
  headerName: string
) {
  const value = request.headers.get(headerName);
  if (!value) {
    return null;
  }

  if (FORWARDED_CHAIN_HEADER_NAMES.has(headerName)) {
    const ipEntries = parseIpChain(value);
    if (!ipEntries) {
      return null;
    }

    const trustedProxyHops = getTrustedProxyHops();
    if (ipEntries.length <= trustedProxyHops) {
      return null;
    }

    if (trustedProxyHops === 0) {
      return ipEntries[0] ?? null;
    }

    return ipEntries[ipEntries.length - trustedProxyHops - 1] ?? null;
  }

  if (value.includes(',')) {
    return null;
  }

  return normalizeIpEntry(value);
}

export function getTrustedClientIpHeaders(): string[] {
  const trustedHeaders: string[] = [];

  if (process.env.VERCEL === '1' || process.env.VERCEL === 'true') {
    trustedHeaders.push('x-vercel-forwarded-for');
  }

  if (
    process.env.CF_PAGES === '1' ||
    process.env.CF_PAGES === 'true' ||
    Boolean(process.env.CLOUDFLARE_ACCOUNT_ID)
  ) {
    trustedHeaders.push('cf-connecting-ip');
  }

  if (Boolean(process.env.FLY_APP_NAME)) {
    trustedHeaders.push('fly-client-ip');
  }

  for (const headerName of getConfiguredTrustedClientIpHeaders()) {
    if (!trustedHeaders.includes(headerName)) {
      trustedHeaders.push(headerName);
    }
  }

  return trustedHeaders;
}

export function getClientIdentifier(request: Pick<NextRequest, 'headers'>) {
  for (const headerName of getTrustedClientIpHeaders()) {
    const clientIp = getClientIpFromHeader(request, headerName);
    if (clientIp) {
      return clientIp;
    }
  }

  return null;
}

async function pruneExpiredRateLimitBuckets(nowDate: Date) {
  const now = nowDate.getTime();

  if (now - lastExpiredBucketPruneAt < EXPIRED_BUCKET_PRUNE_INTERVAL_MS) {
    return;
  }

  lastExpiredBucketPruneAt = now;

  try {
    await prisma.$executeRaw`
      DELETE FROM "rate_limit_buckets"
      WHERE "expires_at" <= ${nowDate}
    `;
  } catch (error) {
    lastExpiredBucketPruneAt = 0;
    throw error;
  }
}

export async function checkRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const nowDate = new Date(now);
  const windowStartMs = Math.floor(now / options.windowMs) * options.windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + options.windowMs);
  const saturatedCount = options.limit + 1;

  const [bucket] = await prisma.$queryRaw<
    Array<{ count: number | bigint; expiresAt: Date }>
  >`
    INSERT INTO "rate_limit_buckets" (
      "key",
      "window_start",
      "count",
      "expires_at",
      "created_at",
      "updated_at"
    )
    VALUES (${options.key}, ${windowStart}, 1, ${expiresAt}, NOW(), NOW())
    ON CONFLICT ("key", "window_start")
    DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."count" < ${saturatedCount}
        THEN "rate_limit_buckets"."count" + 1
        ELSE "rate_limit_buckets"."count"
      END,
      "expires_at" = EXCLUDED."expires_at",
      "updated_at" = NOW()
    RETURNING "count", "expires_at" AS "expiresAt"
  `;

  if (!bucket) {
    throw new Error('Failed to persist rate limit bucket');
  }

  const currentCount = Number(bucket.count);
  if (!Number.isFinite(currentCount)) {
    throw new Error('Invalid rate limit bucket count');
  }

  if (currentCount === 1) {
    await pruneExpiredRateLimitBuckets(nowDate);
  }

  if (currentCount > options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.expiresAt.getTime() - now) / 1000)
      ),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - currentCount),
    retryAfterSeconds: 0,
  };
}
