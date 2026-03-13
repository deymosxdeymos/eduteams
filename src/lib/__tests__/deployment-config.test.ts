import { afterEach, describe, expect, it } from "bun:test";
import { assertDeploymentConfiguration, isVercelDeployment } from "../deployment-config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("deployment config", () => {
  it("treats Vercel environment markers as a Vercel deployment", () => {
    process.env.VERCEL = "1";
    expect(isVercelDeployment()).toBe(true);
  });

  it("rejects non-demo Vercel deployments", () => {
    process.env.VERCEL = "1";
    delete process.env.DEMO_MODE;

    expect(() => assertDeploymentConfiguration()).toThrow(
      "Vercel deployments must run with DEMO_MODE=1",
    );
  });

  it("rejects Google OAuth secrets in demo mode", () => {
    process.env.DEMO_MODE = "1";
    process.env.BETTER_AUTH_SECRET = "secret";
    process.env.GOOGLE_CLIENT_ID = "demo-client";

    expect(() => assertDeploymentConfiguration()).toThrow(
      "Demo mode must not configure GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.",
    );
  });

  it("rejects demo mode without a Better Auth secret", () => {
    process.env.DEMO_MODE = "1";
    delete process.env.BETTER_AUTH_SECRET;

    expect(() => assertDeploymentConfiguration()).toThrow(
      "Demo mode requires BETTER_AUTH_SECRET to be configured.",
    );
  });

  it("allows self-hosted production mode with Google OAuth secrets", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    process.env.DEMO_MODE = "0";
    process.env.GOOGLE_CLIENT_ID = "prod-client";
    process.env.GOOGLE_CLIENT_SECRET = "prod-secret";

    expect(() => assertDeploymentConfiguration()).not.toThrow();
  });
});
