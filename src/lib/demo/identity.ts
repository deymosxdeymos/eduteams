import type { DemoRole } from "@/lib/demo/config";
import { isDemoModeEnabled } from "@/lib/demo/config";

export const DEMO_EMAIL_DOMAIN = "eduteams.local";

const DEMO_EMAIL_PATTERN = new RegExp(
  `^demo\\.(teacher|student)\\.([a-z0-9_-]{8,64})@${DEMO_EMAIL_DOMAIN.replace(".", "\\.")}$`,
  "i",
);

export function parseDemoRoleFromEmail(email: string): DemoRole | null {
  const match = DEMO_EMAIL_PATTERN.exec(email.trim());
  const role = match?.[1]?.toUpperCase();

  if (role === "TEACHER" || role === "STUDENT") {
    return role;
  }

  return null;
}

export function parseDemoVisitorIdFromEmail(email: string) {
  const match = DEMO_EMAIL_PATTERN.exec(email.trim());

  return match?.[2] ?? null;
}

export function isDemoAccountEmail(email: string) {
  return parseDemoVisitorIdFromEmail(email) !== null;
}

export function isActiveDemoAccountEmail(email: string) {
  return isDemoModeEnabled() && isDemoAccountEmail(email);
}
