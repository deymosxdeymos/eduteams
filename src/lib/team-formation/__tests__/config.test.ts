import { afterEach, describe, expect, it } from "bun:test";
import {
  assertEdu2comProviderConfiguration,
  assertTeamFormationConfiguration,
  getRequiredEdu2comWebhookBaseUrl,
  resolveTeamFormationProvider,
} from "../config";

const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = process.env.TEAM_FORMATION_PROVIDER;
const originalVercel = process.env.VERCEL;
const originalVercelEnv = process.env.VERCEL_ENV;
const originalWebhookSecret = process.env.EDU2COM_WEBHOOK_SECRET;
const originalWebhookBaseUrl = process.env.EDU2COM_WEBHOOK_BASE_URL;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalProvider === undefined) delete process.env.TEAM_FORMATION_PROVIDER;
  else process.env.TEAM_FORMATION_PROVIDER = originalProvider;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
  if (originalWebhookSecret === undefined) delete process.env.EDU2COM_WEBHOOK_SECRET;
  else process.env.EDU2COM_WEBHOOK_SECRET = originalWebhookSecret;
  if (originalWebhookBaseUrl === undefined) delete process.env.EDU2COM_WEBHOOK_BASE_URL;
  else process.env.EDU2COM_WEBHOOK_BASE_URL = originalWebhookBaseUrl;
});

describe("team formation config", () => {
  it("defaults development to local", () => {
    process.env.NODE_ENV = "development";
    delete process.env.TEAM_FORMATION_PROVIDER;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    expect(resolveTeamFormationProvider()).toBe("local");
  });

  it("defaults self-hosted production to local", () => {
    process.env.NODE_ENV = "production";
    delete process.env.TEAM_FORMATION_PROVIDER;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    expect(resolveTeamFormationProvider()).toBe("local");
  });

  it("defaults Vercel preview deployments to local", () => {
    process.env.NODE_ENV = "production";
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";

    expect(resolveTeamFormationProvider()).toBe("local");
  });

  it("defaults managed Vercel production to edu2com", () => {
    process.env.NODE_ENV = "production";
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";

    expect(resolveTeamFormationProvider()).toBe("edu2com");
  });

  it("prefers explicit provider overrides", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    process.env.TEAM_FORMATION_PROVIDER = "local";

    expect(resolveTeamFormationProvider()).toBe("local");
  });

  it("fails edu2com validation without a webhook secret", () => {
    process.env.NODE_ENV = "production";
    process.env.EDU2COM_WEBHOOK_BASE_URL = "https://example.com";
    delete process.env.EDU2COM_WEBHOOK_SECRET;

    expect(() => assertEdu2comProviderConfiguration()).toThrow("EDU2COM_WEBHOOK_SECRET");
  });

  it("fails edu2com validation without a public base URL", () => {
    process.env.NODE_ENV = "production";
    process.env.EDU2COM_WEBHOOK_SECRET = "secret";
    process.env.EDU2COM_WEBHOOK_BASE_URL = "http://localhost:3000";

    expect(() => getRequiredEdu2comWebhookBaseUrl()).toThrow("https://");
  });

  it("fails fast at startup for managed edu2com deployments missing webhook config", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";
    delete process.env.TEAM_FORMATION_PROVIDER;
    process.env.EDU2COM_WEBHOOK_SECRET = "secret";
    delete process.env.EDU2COM_WEBHOOK_BASE_URL;

    expect(() => assertTeamFormationConfiguration()).toThrow(
      "EDU2COM_WEBHOOK_BASE_URL is required when TEAM_FORMATION_PROVIDER=edu2com.",
    );
  });
});
