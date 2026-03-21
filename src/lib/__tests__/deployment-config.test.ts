import { afterEach, describe, expect, it } from "bun:test";
import {
  assertAuthConfiguration,
  assertDeploymentConfiguration,
  assertGoogleOAuthConfiguration,
  isVercelDeployment,
} from "../deployment-config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("deployment config", () => {
  it("treats Vercel environment markers as a Vercel deployment", () => {
    process.env.VERCEL = "1";
    expect(isVercelDeployment()).toBe(true);
  });

  it("fails fast when the shared deployment secret is missing", () => {
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.TEAM_FORMATION_PROVIDER;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    expect(() => assertDeploymentConfiguration()).toThrow(
      "Missing required environment variables: BETTER_AUTH_SECRET",
    );
  });

  it("allows shared startup without Google OAuth variables on self-hosted deployments", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.TEAM_FORMATION_PROVIDER;
    delete process.env.EDU2COM_WEBHOOK_SECRET;
    delete process.env.EDU2COM_WEBHOOK_BASE_URL;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(() => assertDeploymentConfiguration()).not.toThrow();
  });

  it("fails fast when BETTER_AUTH_URL is missing on the auth path", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    delete process.env.BETTER_AUTH_URL;
    process.env.GOOGLE_CLIENT_ID = "prod-client";
    process.env.GOOGLE_CLIENT_SECRET = "prod-secret";

    expect(() => assertAuthConfiguration()).toThrow(
      "Missing required environment variables: BETTER_AUTH_URL",
    );
  });

  it("allows preview startup without edu2com webhook config", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    delete process.env.EDU2COM_WEBHOOK_SECRET;
    delete process.env.EDU2COM_WEBHOOK_BASE_URL;

    expect(() => assertDeploymentConfiguration()).not.toThrow();
  });

  it("fails fast on managed production startup when edu2com webhook config is missing", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.EDU2COM_WEBHOOK_SECRET = "test-webhook-secret";
    delete process.env.EDU2COM_WEBHOOK_BASE_URL;

    expect(() => assertDeploymentConfiguration()).toThrow(
      "EDU2COM_WEBHOOK_BASE_URL is required when TEAM_FORMATION_PROVIDER=edu2com.",
    );
  });

  it("fails fast when Google OAuth variables are missing on the auth path", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    expect(() => assertGoogleOAuthConfiguration()).toThrow(
      "Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Google OAuth is required for authentication.",
    );
    expect(() => assertAuthConfiguration()).toThrow(
      "Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET. Google OAuth is required for authentication.",
    );
  });

  it("allows auth startup when all auth variables are configured", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.BETTER_AUTH_SECRET = "test-secret";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.GOOGLE_CLIENT_ID = "prod-client";
    process.env.GOOGLE_CLIENT_SECRET = "prod-secret";

    expect(() => assertAuthConfiguration()).not.toThrow();
  });
});
