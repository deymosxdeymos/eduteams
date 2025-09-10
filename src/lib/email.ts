export function isInstitutionalEmail(email?: string | null) {
  return !!email && email.toLowerCase().endsWith('@if.itera.ac.id');
}
