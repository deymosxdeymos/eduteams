export function isInstitutionalEmail(email?: string | null) {
  if (process.env.NEXT_PUBLIC_DISABLE_INSTITUTIONAL_EMAIL === "1") {
    return true;
  }
  return !!email && email.toLowerCase().endsWith("@if.itera.ac.id");
}
