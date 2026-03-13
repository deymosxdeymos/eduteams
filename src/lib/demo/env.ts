export function getDemoRequiredSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.DEMO_MODE === "1") {
    throw new Error("DEMO_MODE requires BETTER_AUTH_SECRET to be configured.");
  }

  return "eduteams-demo-mode-secret";
}
