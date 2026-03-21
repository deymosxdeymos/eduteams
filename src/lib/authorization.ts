import { isInstitutionalEmail } from "@/lib/email";
import type { ExtendedUser, UserRole } from "@/lib/types";

export function canAccessDashboard(user: ExtendedUser): boolean {
  return user.isOnboarded && !!user.role;
}

export function canAccessOnboarding(user: ExtendedUser): boolean {
  return !user.isOnboarded;
}

export function canAccessRole(user: ExtendedUser, requiredRole: UserRole): boolean {
  return user.role === requiredRole;
}

export function canAccessMahasiswaFeatures(user: ExtendedUser): boolean {
  return user.role === "STUDENT" && user.isOnboarded;
}

export function canAccessDosenFeatures(user: ExtendedUser): boolean {
  return user.role === "TEACHER" && user.isOnboarded;
}

export function canStartTeacherOnboarding(user: Pick<ExtendedUser, "role" | "email">): boolean {
  return user.role === "TEACHER" || isInstitutionalEmail(user.email);
}

export function canAccessAdminFeatures(user: ExtendedUser): boolean {
  return user.role === "ADMIN";
}

export function canModifyUser(currentUser: ExtendedUser, targetUserId: string): boolean {
  return currentUser.id === targetUserId || currentUser.role === "ADMIN";
}

export function canViewUserProfile(currentUser: ExtendedUser, targetUserId: string): boolean {
  return (
    currentUser.id === targetUserId ||
    currentUser.role === "ADMIN" ||
    currentUser.role === "TEACHER"
  );
}

export function isCompleteProfile(user: ExtendedUser): boolean {
  return !!(user.name && user.email && user.role && user.isOnboarded);
}

/** @deprecated Use `canAccessOnboarding` instead — same logic. */
export const needsOnboarding = canAccessOnboarding;

export function needsRoleSelection(user: ExtendedUser): boolean {
  return !user.role;
}

export function needsDataDiri(user: ExtendedUser): boolean {
  if (user.role === "STUDENT") {
    return !user.nim;
  }
  if (user.role === "TEACHER") {
    return !user.name || !user.gender;
  }
  return false;
}

export function needsKepribadianTest(user: ExtendedUser): boolean {
  return user.role === "STUDENT" && !user.isOnboarded;
}

export function getNextOnboardingStep(user: ExtendedUser): string | null {
  if (!user.role) {
    return "/onboarding/resume";
  }

  const roleSlug = user.role === "TEACHER" ? "dosen" : "mahasiswa";

  if (needsDataDiri(user)) {
    return `/onboarding/data-diri/${roleSlug}`;
  }

  if (user.role === "STUDENT" && !user.isOnboarded) {
    return "/onboarding/kepribadian";
  }

  if (!user.isOnboarded) {
    return "/onboarding/resume";
  }

  return null;
}

export function getRedirectPath(user: ExtendedUser): string {
  const nextStep = getNextOnboardingStep(user);
  if (nextStep) {
    return nextStep;
  }

  return "/dashboard";
}

export const permissions = {
  canAccessDashboard,
  canAccessOnboarding,
  canAccessRole,
  canAccessMahasiswaFeatures,
  canAccessDosenFeatures,
  canStartTeacherOnboarding,
  canAccessAdminFeatures,
  canModifyUser,
  canViewUserProfile,
  isCompleteProfile,
  needsOnboarding,
  needsRoleSelection,
  needsDataDiri,
  needsKepribadianTest,
  getNextOnboardingStep,
  getRedirectPath,
} as const;
