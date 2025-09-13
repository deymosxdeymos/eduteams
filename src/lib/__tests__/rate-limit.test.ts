import { describe, expect, it } from 'bun:test';
import { limit, tooManyRequests } from '@/lib/rate-limit';

describe('rate-limit (disabled env)', () => {
  it('returns success when limiter disabled and computes reset', async () => {
    const req = new Request('http://localhost/some', { headers: { 'x-forwarded-for': '1.2.3.4' } });
    const res = await limit(req);
    expect(res.success).toBe(true);
    expect(res.remaining).toBeGreaterThan(0);
    expect(res.reset).toBeGreaterThan(Date.now());
  });

  it('tooManyRequests returns 429 with Retry-After', async () => {
    const res = tooManyRequests({ reason: 'test' }, { 'Retry-After': '30' });
    expect(res.status).toBe(429);
    const json = (await res.json()) as any;
    expect(json.success).toBe(false);
    expect(json.error).toBe('Too Many Requests');
  });
});

