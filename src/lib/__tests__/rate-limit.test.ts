import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

const actualPrisma = await import('@/lib/prisma');

type RateLimitModule = typeof import('../rate-limit');

type DeleteManyArgs = {
  where: {
    expiresAt: { lte: Date };
  };
};

type RateLimitBucket = {
  count: number;
  expiresAt: Date;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const getBucketKey = (key: string, windowStart: Date) =>
  JSON.stringify([key, windowStart.toISOString()]);

const deleteManyMock = mock(async ({ where }: DeleteManyArgs) => {
  let count = 0;

  for (const [bucketKey, bucket] of rateLimitBuckets.entries()) {
    if (bucket.expiresAt <= where.expiresAt.lte) {
      rateLimitBuckets.delete(bucketKey);
      count += 1;
    }
  }

  return { count };
});
const queryRawMock = mock(async (...args: unknown[]) => {
  const key = args[1] as string;
  const windowStart = args[2] as Date;
  const expiresAt = args[3] as Date;
  const saturatedCount = args[4] as number;
  const bucketKey = getBucketKey(key, windowStart);
  const existing = rateLimitBuckets.get(bucketKey);
  const count = Math.min((existing?.count ?? 0) + 1, saturatedCount);

  rateLimitBuckets.set(bucketKey, { count, expiresAt });

  return [{ count, expiresAt }];
});

function applyModuleMocks() {
  mock.module('@/lib/prisma', () => ({
    default: {
      rateLimitBucket: {
        deleteMany: deleteManyMock,
      },
      $queryRaw: queryRawMock,
    },
  }));
}

function restoreModuleMocks() {
  mock.module('@/lib/prisma', () => ({ default: actualPrisma.default }));
}

function createRequest(headers: HeadersInit) {
  return {
    headers: new Headers(headers),
  };
}

const ORIGINAL_ENV = {
  VERCEL: process.env.VERCEL,
  CF_PAGES: process.env.CF_PAGES,
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  FLY_APP_NAME: process.env.FLY_APP_NAME,
  TRUSTED_CLIENT_IP_HEADERS: process.env.TRUSTED_CLIENT_IP_HEADERS,
  TRUSTED_PROXY_HOPS: process.env.TRUSTED_PROXY_HOPS,
};
const originalDateNow = Date.now;

function resetTrustedProxyEnv() {
  process.env.VERCEL = ORIGINAL_ENV.VERCEL;
  process.env.CF_PAGES = ORIGINAL_ENV.CF_PAGES;
  process.env.CLOUDFLARE_ACCOUNT_ID = ORIGINAL_ENV.CLOUDFLARE_ACCOUNT_ID;
  process.env.FLY_APP_NAME = ORIGINAL_ENV.FLY_APP_NAME;
  process.env.TRUSTED_CLIENT_IP_HEADERS = ORIGINAL_ENV.TRUSTED_CLIENT_IP_HEADERS;
  process.env.TRUSTED_PROXY_HOPS = ORIGINAL_ENV.TRUSTED_PROXY_HOPS;
}

describe('rate-limit', () => {
  let rateLimitModule: RateLimitModule;

  beforeEach(async () => {
    applyModuleMocks();
    rateLimitModule = await import('../rate-limit');
    rateLimitBuckets.clear();
    deleteManyMock.mockClear();
    queryRawMock.mockClear();

    delete process.env.VERCEL;
    delete process.env.CF_PAGES;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.FLY_APP_NAME;
    delete process.env.TRUSTED_CLIENT_IP_HEADERS;
    delete process.env.TRUSTED_PROXY_HOPS;
    Date.now = originalDateNow;
  });

  afterEach(() => {
    mock.restore();
    restoreModuleMocks();
    Date.now = originalDateNow;
    resetTrustedProxyEnv();
  });

  describe('getClientIdentifier', () => {
    it('uses trusted platform headers when running behind vercel', () => {
      process.env.VERCEL = '1';

      const request = createRequest({
        'x-vercel-forwarded-for': '198.51.100.9',
        'x-forwarded-for': '203.0.113.10, 198.51.100.7',
      });

      expect(rateLimitModule.getTrustedClientIpHeaders()).toEqual([
        'x-vercel-forwarded-for',
      ]);
      expect(rateLimitModule.getClientIdentifier(request)).toBe('198.51.100.9');
    });

    it('uses the cloudflare header when cloudflare is the trusted proxy', () => {
      process.env.CF_PAGES = '1';

      const request = createRequest({
        'cf-connecting-ip': '203.0.113.25',
        'x-forwarded-for': '198.51.100.11',
      });

      expect(rateLimitModule.getClientIdentifier(request)).toBe('203.0.113.25');
    });

    it('uses the left-most x-forwarded-for entry by default for self-hosted deployments', () => {
      process.env.TRUSTED_CLIENT_IP_HEADERS = 'x-forwarded-for, x-real-ip';

      const request = createRequest({
        'x-forwarded-for': '203.0.113.10, 198.51.100.7, 192.0.2.3',
        'x-real-ip': '198.51.100.7',
      });

      expect(rateLimitModule.getTrustedClientIpHeaders()).toEqual([
        'x-forwarded-for',
        'x-real-ip',
      ]);
      expect(rateLimitModule.getClientIdentifier(request)).toBe('203.0.113.10');
    });

    it('skips trusted proxy hops already present in x-forwarded-for chains', () => {
      process.env.TRUSTED_CLIENT_IP_HEADERS = 'x-forwarded-for';
      process.env.TRUSTED_PROXY_HOPS = '2';

      const request = createRequest({
        'x-forwarded-for': '203.0.113.10, 198.51.100.7, 192.0.2.3',
      });

      expect(rateLimitModule.getClientIdentifier(request)).toBe('203.0.113.10');
    });

    it('ignores invalid configured trusted proxy header names', () => {
      process.env.TRUSTED_CLIENT_IP_HEADERS = 'x-forwarded-for, x bad header, X-Real-IP';

      expect(rateLimitModule.getTrustedClientIpHeaders()).toEqual([
        'x-forwarded-for',
        'x-real-ip',
      ]);
    });

    it('ignores malformed trusted proxy header values', () => {
      process.env.TRUSTED_CLIENT_IP_HEADERS = 'x-forwarded-for';

      const request = createRequest({
        'x-forwarded-for': 'not-an-ip, 198.51.100.7',
      });

      expect(rateLimitModule.getClientIdentifier(request)).toBeNull();
    });

    it('returns null when no trusted proxy is configured', () => {
      const request = createRequest({
        'x-real-ip': '198.51.100.8',
        'x-forwarded-for': '203.0.113.10, 198.51.100.7, 192.0.2.3',
      });

      expect(rateLimitModule.getTrustedClientIpHeaders()).toEqual([]);
      expect(rateLimitModule.getClientIdentifier(request)).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('tracks counts in the shared backing store and blocks once the limit is exceeded', async () => {
      Date.now = () => 1_700_000_000_000;

      const first = await rateLimitModule.checkRateLimit({
        key: 'demo-login:ip:198.51.100.9',
        limit: 2,
        windowMs: 60_000,
      });
      const second = await rateLimitModule.checkRateLimit({
        key: 'demo-login:ip:198.51.100.9',
        limit: 2,
        windowMs: 60_000,
      });
      const third = await rateLimitModule.checkRateLimit({
        key: 'demo-login:ip:198.51.100.9',
        limit: 2,
        windowMs: 60_000,
      });

      expect(first).toEqual({
        allowed: true,
        remaining: 1,
        retryAfterSeconds: 0,
      });
      expect(second).toEqual({
        allowed: true,
        remaining: 0,
        retryAfterSeconds: 0,
      });
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
      expect(third.retryAfterSeconds).toBeGreaterThan(0);
      expect(queryRawMock).toHaveBeenCalledTimes(3);
      expect(deleteManyMock).toHaveBeenCalledTimes(1);
    });

    it('starts a fresh bucket after the rate-limit window rolls over', async () => {
      let now = 1_700_000_200_000;
      Date.now = () => now;

      await rateLimitModule.checkRateLimit({
        key: 'demo-switch:visitor:visitor1234',
        limit: 1,
        windowMs: 60_000,
      });
      now += 60_000;

      const nextWindow = await rateLimitModule.checkRateLimit({
        key: 'demo-switch:visitor:visitor1234',
        limit: 1,
        windowMs: 60_000,
      });

      expect(nextWindow).toEqual({
        allowed: true,
        remaining: 0,
        retryAfterSeconds: 0,
      });
      expect(deleteManyMock).toHaveBeenCalledTimes(2);
    });

    it('globally prunes expired buckets even when the expired key does not recur', async () => {
      Date.now = () => 1_700_000_400_000;

      const expiredSameKey = getBucketKey(
        'demo-login:ip:198.51.100.9',
        new Date(1_700_000_000_000)
      );
      const expiredDifferentKey = getBucketKey(
        'demo-login:ip:198.51.100.10',
        new Date(1_700_000_000_000)
      );
      rateLimitBuckets.set(expiredSameKey, {
        count: 3,
        expiresAt: new Date(1_700_000_060_000),
      });
      rateLimitBuckets.set(expiredDifferentKey, {
        count: 2,
        expiresAt: new Date(1_700_000_060_000),
      });

      await rateLimitModule.checkRateLimit({
        key: 'demo-login:ip:198.51.100.9',
        limit: 2,
        windowMs: 60_000,
      });

      expect(deleteManyMock).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lte: new Date(1_700_000_400_000),
          },
        },
      });
      expect(rateLimitBuckets.has(expiredSameKey)).toBe(false);
      expect(rateLimitBuckets.has(expiredDifferentKey)).toBe(false);
    });
  });
});
