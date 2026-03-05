const DEV_ALLOWED_ORIGINS_ENV_NAME = 'DEV_ALLOWED_ORIGINS';

function getConfiguredDevOrigins() {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }

  const rawOrigins = process.env[DEV_ALLOWED_ORIGINS_ENV_NAME]?.trim();
  if (!rawOrigins) {
    return [];
  }

  return rawOrigins
    .split(/[\n,]/)
    .map(origin => origin.trim())
    .filter(Boolean);
}

export function getAllowedDevOrigins() {
  return getConfiguredDevOrigins();
}

export function getAllowedDevOriginHosts() {
  return getConfiguredDevOrigins().flatMap(origin => {
    try {
      return [new URL(origin).hostname];
    } catch {
      return [];
    }
  });
}
