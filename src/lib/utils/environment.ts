export function isTruthyEnv(value: string | undefined) {
  return value === "1" || value === "true";
}

export function isVercelDeployment() {
  return isTruthyEnv(process.env.VERCEL) || typeof process.env.VERCEL_ENV === "string";
}

export function isManagedVercelProductionDeployment() {
  if (process.env.NODE_ENV !== "production" || !isVercelDeployment()) {
    return false;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  return vercelEnv ? vercelEnv === "production" : true;
}
