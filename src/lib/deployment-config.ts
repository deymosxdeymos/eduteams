function isTruthyEnv(value: string | undefined) {
  return value === "1" || value === "true";
}

export function isVercelDeployment() {
  return isTruthyEnv(process.env.VERCEL) || typeof process.env.VERCEL_ENV === "string";
}

export function assertDeploymentConfiguration() {
  const demoMode = process.env.DEMO_MODE === "1";
  const vercelDeployment = isVercelDeployment();
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.trim();
  const hasGoogleOauthSecrets = Boolean(
    process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_SECRET,
  );

  if (vercelDeployment && !demoMode) {
    throw new Error(
      "Vercel deployments must run with DEMO_MODE=1. Self-host production separately.",
    );
  }

  if (demoMode && hasGoogleOauthSecrets) {
    throw new Error("Demo mode must not configure GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  if (demoMode && !betterAuthSecret) {
    throw new Error("Demo mode requires BETTER_AUTH_SECRET to be configured.");
  }
}
