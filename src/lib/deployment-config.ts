import { assertTeamFormationConfiguration } from "@/lib/team-formation/config";
import { isVercelDeployment } from "@/lib/utils/environment";

export { isVercelDeployment };

function assertRequiredEnvironmentVariables(names: string[], message?: string) {
  const missingVariables = names.filter((name) => !process.env[name]?.trim());

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}${message ? `. ${message}` : ""}`,
    );
  }
}

export function assertDeploymentConfiguration() {
  assertRequiredEnvironmentVariables(["BETTER_AUTH_SECRET"]);
  assertTeamFormationConfiguration();
}

export function assertGoogleOAuthConfiguration() {
  assertRequiredEnvironmentVariables(
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
    "Google OAuth is required for authentication.",
  );
}

export function assertAuthConfiguration() {
  assertDeploymentConfiguration();
  assertRequiredEnvironmentVariables(["BETTER_AUTH_URL"]);
  assertGoogleOAuthConfiguration();
}
