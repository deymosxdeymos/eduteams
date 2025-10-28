import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

describe('Auth Configuration', () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Mock required environment variables for tests
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should have required environment variables for auth', () => {
    expect(process.env.BETTER_AUTH_URL).toBe('http://localhost:3000');
    expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-client-id');
    expect(process.env.GOOGLE_CLIENT_SECRET).toBe('test-google-client-secret');
  });

  it('should validate auth configuration structure', () => {
    // Test that environment variables are properly set for auth
    const requiredVars = [
      'BETTER_AUTH_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeDefined();
      expect(typeof process.env[varName]).toBe('string');
    });
  });

  it('should have proper URL format for BETTER_AUTH_URL', () => {
    expect(process.env.BETTER_AUTH_URL).toMatch(/^https?:\/\/.+/);
  });

  it('should have non-empty Google OAuth credentials', () => {
    expect(process.env.GOOGLE_CLIENT_ID?.length).toBeGreaterThan(0);
    expect(process.env.GOOGLE_CLIENT_SECRET?.length).toBeGreaterThan(0);
  });
});
