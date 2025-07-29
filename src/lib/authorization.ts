import type { ExtendedUser, UserRole } from '@/lib/types';

export function canAccessDashboard(user: ExtendedUser): boolean {
  return user.isOnboarded && !!user.role;
}

export function canAccessOnboarding(user: ExtendedUser): boolean {
  return !user.isOnboarded;
}

export function canAccessRole(
  user: ExtendedUser,
  requiredRole: UserRole
): boolean {
  return user.role === requiredRole;
}

export function canAccessMahasiswaFeatures(user: ExtendedUser): boolean {
  return user.role === 'mahasiswa' && user.isOnboarded;
}

export function canAccessDosenFeatures(user: ExtendedUser): boolean {
  return user.role === 'dosen' && user.isOnboarded;
}

export function canAccessAdminFeatures(user: ExtendedUser): boolean {
  return user.role === 'admin';
}

export function canModifyUser(
  currentUser: ExtendedUser,
  targetUserId: string
): boolean {
  return currentUser.id === targetUserId || currentUser.role === 'admin';
}

export function canViewUserProfile(
  currentUser: ExtendedUser,
  targetUserId: string
): boolean {
  return (
    currentUser.id === targetUserId ||
    currentUser.role === 'admin' ||
    currentUser.role === 'dosen'
  );
}

export function isCompleteProfile(user: ExtendedUser): boolean {
  return !!(user.name && user.email && user.role && user.isOnboarded);
}

export function needsOnboarding(user: ExtendedUser): boolean {
  return !user.isOnboarded;
}

export function needsRoleSelection(user: ExtendedUser): boolean {
  return !user.role;
}

export function needsDataDiri(user: ExtendedUser): boolean {
  return (
    !user.nimNpm && !!user.role && ['mahasiswa', 'dosen'].includes(user.role)
  );
}

export function needsKepribadianTest(user: ExtendedUser): boolean {
  return user.role === 'mahasiswa' && !user.isOnboarded;
}

export function getNextOnboardingStep(user: ExtendedUser): string | null {
  if (!user.role) {
    return '/onboarding/role';
  }

  if (!user.nimNpm && ['mahasiswa', 'dosen'].includes(user.role)) {
    return `/onboarding/data-diri/${user.role}`;
  }

  if (user.role === 'mahasiswa' && !user.isOnboarded) {
    return '/onboarding/kepribadian';
  }

  if (!user.isOnboarded) {
    return '/dashboard';
  }

  return null;
}

export function getRedirectPath(user: ExtendedUser): string {
  const nextStep = getNextOnboardingStep(user);
  if (nextStep) {
    return nextStep;
  }

  return '/dashboard';
}

export const permissions = {
  canAccessDashboard,
  canAccessOnboarding,
  canAccessRole,
  canAccessMahasiswaFeatures,
  canAccessDosenFeatures,
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
