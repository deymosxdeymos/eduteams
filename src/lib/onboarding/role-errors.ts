export const INSTITUTIONAL_EMAIL_REQUIRED_ERROR = "institutional-email-required";

export function getInstitutionalEmailRequiredRolePath() {
  return `/onboarding/role?error=${INSTITUTIONAL_EMAIL_REQUIRED_ERROR}`;
}
