import { isDemoModeEnabled } from "@/lib/demo/config";
import type { TeamFormationProviderName } from "./types";

const VALID_PROVIDERS = new Set<TeamFormationProviderName>(["local", "edu2com"]);

function getExplicitProviderOverride(): TeamFormationProviderName | null {
  const raw = process.env.TEAM_FORMATION_PROVIDER?.trim().toLowerCase();
  if (!raw) return null;

  if (VALID_PROVIDERS.has(raw as TeamFormationProviderName)) {
    return raw as TeamFormationProviderName;
  }

  throw new Error('TEAM_FORMATION_PROVIDER must be either "local" or "edu2com".');
}

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  );
}

export function resolveTeamFormationProvider(): TeamFormationProviderName {
  const explicitProvider = getExplicitProviderOverride();
  if (explicitProvider) {
    return explicitProvider;
  }

  if (isDemoModeEnabled()) {
    return "local";
  }

  if (process.env.NODE_ENV === "development") {
    return "local";
  }

  return "edu2com";
}

export function getRequiredEdu2comWebhookSecret(): string {
  const secret = process.env.EDU2COM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("EDU2COM_WEBHOOK_SECRET is required when TEAM_FORMATION_PROVIDER=edu2com.");
  }
  return secret;
}

export function getRequiredEdu2comWebhookBaseUrl(): string {
  const rawValue = process.env.EDU2COM_WEBHOOK_BASE_URL?.trim();
  if (!rawValue) {
    throw new Error("EDU2COM_WEBHOOK_BASE_URL is required when TEAM_FORMATION_PROVIDER=edu2com.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error("EDU2COM_WEBHOOK_BASE_URL must be an absolute URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("EDU2COM_WEBHOOK_BASE_URL must use http:// or https://.");
  }

  if (process.env.NODE_ENV !== "test" && parsed.protocol !== "https:") {
    throw new Error("EDU2COM_WEBHOOK_BASE_URL must use https:// outside of tests.");
  }

  if (isLoopbackHostname(parsed.hostname)) {
    throw new Error("EDU2COM_WEBHOOK_BASE_URL must be a public, non-loopback URL.");
  }

  return parsed.origin;
}

export function assertEdu2comProviderConfiguration(): void {
  getRequiredEdu2comWebhookSecret();
  getRequiredEdu2comWebhookBaseUrl();
}
